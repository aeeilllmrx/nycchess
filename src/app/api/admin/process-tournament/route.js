import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { processTournament } from '@/lib/tournamentProcessor';
import { Rating } from '@/lib/glicko2';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tournamentType = formData.get('tournamentType'); // 'rapid' or 'blitz'

    if (!file) {
      return NextResponse.json({
        error: 'No file provided'
      }, { status: 400 });
    }

    if (!tournamentType || !['rapid', 'blitz'].includes(tournamentType)) {
      return NextResponse.json({
        error: 'Invalid tournament type'
      }, { status: 400 });
    }

    // Read file content
    let text = await file.text();

    // Parse to get player IDs and names from tournament
    let lines = text.trim().split('\n');
    const headers = lines[0].split('\t').map(h => h.trim()).filter(Boolean);
    const idIndex = headers.indexOf('ID');
    const nameIndex = headers.indexOf('Name');

    if (idIndex === -1 || nameIndex === -1) {
      return NextResponse.json({
        error: 'TSV must have ID and Name columns'
      }, { status: 400 });
    }

    // Helper function to normalize player IDs (strip R/B prefix)
    const normalizeId = (id) => {
      if (!id || id.toUpperCase() === 'AUTO') return id;
      return id.replace(/^[RB]/i, '');
    };

    // First pass: collect player IDs and detect AUTO entries
    const playerData = [];
    const autoPlayers = [];
    const idNormalizations = new Map(); // Maps line index to normalized ID
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = line.split('\t');
      const rawId = values[idIndex]?.trim();
      const name = values[nameIndex]?.trim();
      
      if (rawId && name) {
        if (rawId.toUpperCase() === 'AUTO') {
          autoPlayers.push({ lineIndex: i, name });
        } else {
          const normalizedId = normalizeId(rawId);
          if (normalizedId !== rawId) {
            idNormalizations.set(i, normalizedId);
          }
          playerData.push({ id: normalizedId, name, lineIndex: i });
        }
      }
    }

    // Normalize IDs in the text (strip R/B prefixes)
    if (idNormalizations.size > 0) {
      const normalizedLines = lines.map((line, index) => {
        if (idNormalizations.has(index)) {
          const values = line.split('\t');
          values[idIndex] = idNormalizations.get(index);
          return values.join('\t');
        }
        return line;
      });
      text = normalizedLines.join('\n');
      lines = text.trim().split('\n');
    }

    // Handle AUTO player creation
    const newPlayersCreated = [];
    const idReplacements = new Map(); // Maps line index to new ID
    
    if (autoPlayers.length > 0) {
      // Find the highest existing numeric ID
      const { rows: allPlayers } = await sql`
        SELECT id FROM players WHERE id ~ '^[0-9]+$'
      `;
      
      let maxId = 0;
      for (const player of allPlayers) {
        const num = parseInt(player.id, 10);
        if (!isNaN(num)) {
          maxId = Math.max(maxId, num);
        }
      }

      let nextId = maxId + 1;

      for (const autoPlayer of autoPlayers) {
        const assignedId = String(nextId);
        nextId++;
        
        // Insert player
        await sql`
          INSERT INTO players (id, name)
          VALUES (${assignedId}, ${autoPlayer.name})
          ON CONFLICT (id) DO NOTHING
        `;
        
        // Insert ratings with default Glicko2 values
        await sql`
          INSERT INTO ratings (
            player_id, 
            rapid_rating, rapid_rd, rapid_sigma,
            blitz_rating, blitz_rd, blitz_sigma
          )
          VALUES (
            ${assignedId},
            1500, 350, 0.06,
            1500, 350, 0.06
          )
          ON CONFLICT (player_id) DO NOTHING
        `;
        
        // Store the replacement and track for response
        idReplacements.set(autoPlayer.lineIndex, assignedId);
        newPlayersCreated.push({
          name: autoPlayer.name,
          assignedId: assignedId
        });
      }

      // Replace AUTO with assigned IDs in the text
      const updatedLines = lines.map((line, index) => {
        if (idReplacements.has(index)) {
          const values = line.split('\t');
          values[idIndex] = idReplacements.get(index);
          return values.join('\t');
        }
        return line;
      });
      
      text = updatedLines.join('\n');
    }

    // Re-parse the updated text to get all player IDs (including newly assigned ones)
    const updatedLines = text.trim().split('\n');
    const finalPlayerIds = [];
    
    for (let i = 1; i < updatedLines.length; i++) {
      const line = updatedLines[i].trim();
      if (!line) continue;
      
      const values = line.split('\t');
      const id = values[idIndex]?.trim();
      
      if (id) {
        finalPlayerIds.push(id);
      }
    }

    // Get current ratings from database
    const { rows: playerRatings } = await sql`
      SELECT 
        p.id,
        p.name,
        r.rapid_rating,
        r.rapid_rd,
        r.rapid_sigma,
        r.blitz_rating,
        r.blitz_rd,
        r.blitz_sigma
      FROM players p
      JOIN ratings r ON p.id = r.player_id
      WHERE p.id = ANY(${finalPlayerIds})
    `;

    // Build playerStats map for tournament processor
    const playerStats = {};
    for (const player of playerRatings) {
      const ratingObj = tournamentType === 'rapid'
        ? new Rating(player.rapid_rating, player.rapid_rd, player.rapid_sigma)
        : new Rating(player.blitz_rating, player.blitz_rd, player.blitz_sigma);
      
      playerStats[player.id] = [player.name, ratingObj];
    }

    // Check for missing players (should not happen now with auto-creation)
    const existingIds = new Set(playerRatings.map(p => p.id));
    const missingPlayers = finalPlayerIds.filter(id => !existingIds.has(id));

    if (missingPlayers.length > 0) {
      return NextResponse.json({
        error: `Players not found in database: ${missingPlayers.join(', ')}`
      }, { status: 400 });
    }

    // Process tournament with updated text
    const result = processTournament(playerStats, text);

    // Track which players are new
    const newPlayerIds = new Set(newPlayersCreated.map(p => p.assignedId));

    // Format results for preview
    const changes = [];
    for (const [playerId, [playerName, newRating]] of Object.entries(result.updatedStats)) {
      const oldRating = tournamentType === 'rapid'
        ? playerRatings.find(p => p.id === playerId).rapid_rating
        : playerRatings.find(p => p.id === playerId).blitz_rating;

      const roundChanges = {};
      for (const [round, diff] of Object.entries(result.roundDiffs[playerId])) {
        roundChanges[round] = Math.round(diff);
      }

      changes.push({
        playerId,
        playerName,
        oldRating: Math.round(oldRating),
        newRating: Math.round(newRating.mu),
        newRd: Math.round(newRating.phi),
        newSigma: newRating.sigma,
        ratingChange: Math.round(newRating.mu - oldRating),
        roundChanges,
        isNewPlayer: newPlayerIds.has(playerId)
      });
    }

    // Sort by rating change (biggest changes first)
    changes.sort((a, b) => Math.abs(b.ratingChange) - Math.abs(a.ratingChange));

    return NextResponse.json({
      success: true,
      tournamentType,
      changes,
      newPlayersCreated,
      summary: {
        totalPlayers: changes.length,
        roundsPlayed: result.roundColumns.length,
        averageChange: Math.round(
          changes.reduce((sum, c) => sum + Math.abs(c.ratingChange), 0) / changes.length
        )
      }
    });

  } catch (error) {
    console.error('Processing error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

