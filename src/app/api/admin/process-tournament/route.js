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
    const text = await file.text();

    // Parse to get player IDs from tournament
    const lines = text.trim().split('\n');
    const headers = lines[0].split('\t').map(h => h.trim()).filter(Boolean);
    const idIndex = headers.indexOf('ID');

    const playerIds = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const values = line.split('\t');
      if (values[idIndex]) {
        playerIds.push(values[idIndex].trim());
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
      WHERE p.id = ANY(${playerIds})
    `;

    // Build playerStats map for tournament processor
    const playerStats = {};
    for (const player of playerRatings) {
      const ratingObj = tournamentType === 'rapid'
        ? new Rating(player.rapid_rating, player.rapid_rd, player.rapid_sigma)
        : new Rating(player.blitz_rating, player.blitz_rd, player.blitz_sigma);
      
      playerStats[player.id] = [player.name, ratingObj];
    }

    // Check for missing players
    const existingIds = new Set(playerRatings.map(p => p.id));
    const missingPlayers = playerIds.filter(id => !existingIds.has(id));

    if (missingPlayers.length > 0) {
      return NextResponse.json({
        error: `Players not found in database: ${missingPlayers.join(', ')}`
      }, { status: 400 });
    }

    // Process tournament
    const result = processTournament(playerStats, text);

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
        roundChanges
      });
    }

    // Sort by rating change (biggest changes first)
    changes.sort((a, b) => Math.abs(b.ratingChange) - Math.abs(a.ratingChange));

    return NextResponse.json({
      success: true,
      tournamentType,
      changes,
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

