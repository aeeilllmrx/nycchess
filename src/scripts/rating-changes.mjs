import { sql } from '@vercel/postgres';

/**
 * Calculate rating changes for all players between two dates
 * Usage: node src/scripts/rating-changes.mjs [startDate] [endDate]
 * Example: node src/scripts/rating-changes.mjs 2024-01-01 2024-12-31
 * 
 * If no dates provided, calculates all-time changes
 * If only start date provided, calculates from that date to present
 */

async function calculateRatingChanges(startDate, endDate) {
  try {
    console.log('Calculating rating changes...');
    console.log(`Date range: ${startDate || 'beginning'} to ${endDate || 'present'}\n`);

    // Build query with optional date filters
    let query = `
      SELECT 
        rh.player_id,
        p.name,
        rh.tournament_type,
        SUM(rh.new_rating - rh.old_rating) as total_change,
        COUNT(*) as tournament_count,
        MIN(rh.old_rating) as starting_rating,
        MAX(rh.new_rating) as ending_rating,
        MIN(t.tournament_date) as first_tournament,
        MAX(t.tournament_date) as last_tournament
      FROM rating_history rh
      JOIN tournaments t ON rh.tournament_id = t.id
      JOIN players p ON rh.player_id = p.id
    `;

    const conditions = [];
    const params = [];
    let paramCount = 1;

    if (startDate) {
      conditions.push(`t.tournament_date >= $${paramCount}`);
      params.push(startDate);
      paramCount++;
    }

    if (endDate) {
      conditions.push(`t.tournament_date <= $${paramCount}`);
      params.push(endDate);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY rh.player_id, p.name, rh.tournament_type
      ORDER BY rh.tournament_type, total_change DESC
    `;

    const { rows } = await sql.query(query, params);

    // Organize results by player and tournament type
    const playerStats = new Map();

    for (const row of rows) {
      if (!playerStats.has(row.player_id)) {
        playerStats.set(row.player_id, {
          id: row.player_id,
          name: row.name,
          rapid: null,
          blitz: null
        });
      }

      const stats = playerStats.get(row.player_id);
      const typeData = {
        totalChange: Math.round(row.total_change),
        tournamentCount: parseInt(row.tournament_count),
        startingRating: Math.round(row.starting_rating),
        endingRating: Math.round(row.ending_rating),
        firstTournament: row.first_tournament,
        lastTournament: row.last_tournament
      };

      if (row.tournament_type === 'rapid') {
        stats.rapid = typeData;
      } else if (row.tournament_type === 'blitz') {
        stats.blitz = typeData;
      }
    }

    // Display results
    console.log('═══════════════════════════════════════════════════════════════════════════════════');
    console.log('                           RATING CHANGES SUMMARY');
    console.log('═══════════════════════════════════════════════════════════════════════════════════\n');

    // Separate into rapid and blitz
    const playersWithRapid = [];
    const playersWithBlitz = [];

    for (const [playerId, stats] of playerStats) {
      if (stats.rapid) playersWithRapid.push({ playerId, ...stats });
      if (stats.blitz) playersWithBlitz.push({ playerId, ...stats });
    }

    // Sort by absolute rating change
    playersWithRapid.sort((a, b) => Math.abs(b.rapid.totalChange) - Math.abs(a.rapid.totalChange));
    playersWithBlitz.sort((a, b) => Math.abs(b.blitz.totalChange) - Math.abs(a.blitz.totalChange));

    // Display Rapid results
    if (playersWithRapid.length > 0) {
      console.log('🚀 RAPID RATINGS');
      console.log('─'.repeat(85));
      console.log('Player ID  Name                          Change    Tournaments   Start → End');
      console.log('─'.repeat(85));

      for (const player of playersWithRapid) {
        const r = player.rapid;
        const changeStr = r.totalChange >= 0 ? `+${r.totalChange}` : `${r.totalChange}`;
        const changeDisplay = changeStr.padStart(7);
        
        console.log(
          `${player.id.padEnd(10)} ` +
          `${player.name.substring(0, 28).padEnd(29)} ` +
          `${changeDisplay}    ` +
          `${r.tournamentCount.toString().padStart(2)}            ` +
          `${r.startingRating} → ${r.endingRating}`
        );
      }

      const totalRapidTournaments = playersWithRapid.reduce((sum, p) => sum + p.rapid.tournamentCount, 0);
      const avgRapidChange = playersWithRapid.reduce((sum, p) => sum + Math.abs(p.rapid.totalChange), 0) / playersWithRapid.length;
      
      console.log('─'.repeat(85));
      console.log(`Total: ${playersWithRapid.length} players, ${totalRapidTournaments} tournament entries, avg change: ±${Math.round(avgRapidChange)}`);
      console.log('');
    }

    // Display Blitz results
    if (playersWithBlitz.length > 0) {
      console.log('⚡ BLITZ RATINGS');
      console.log('─'.repeat(85));
      console.log('Player ID  Name                          Change    Tournaments   Start → End');
      console.log('─'.repeat(85));

      for (const player of playersWithBlitz) {
        const b = player.blitz;
        const changeStr = b.totalChange >= 0 ? `+${b.totalChange}` : `${b.totalChange}`;
        const changeDisplay = changeStr.padStart(7);
        
        console.log(
          `${player.id.padEnd(10)} ` +
          `${player.name.substring(0, 28).padEnd(29)} ` +
          `${changeDisplay}    ` +
          `${b.tournamentCount.toString().padStart(2)}            ` +
          `${b.startingRating} → ${b.endingRating}`
        );
      }

      const totalBlitzTournaments = playersWithBlitz.reduce((sum, p) => sum + p.blitz.tournamentCount, 0);
      const avgBlitzChange = playersWithBlitz.reduce((sum, p) => sum + Math.abs(p.blitz.totalChange), 0) / playersWithBlitz.length;
      
      console.log('─'.repeat(85));
      console.log(`Total: ${playersWithBlitz.length} players, ${totalBlitzTournaments} tournament entries, avg change: ±${Math.round(avgBlitzChange)}`);
      console.log('');
    }

    if (playersWithRapid.length === 0 && playersWithBlitz.length === 0) {
      console.log('No rating changes found for the specified date range.');
    }

    console.log('═══════════════════════════════════════════════════════════════════════════════════');

    // Export detailed data as JSON
    const exportData = Array.from(playerStats.values());
    console.log(`\n📊 Full data available in ${exportData.length} player records`);
    
    // Optionally save to file
    // import { writeFile } from 'fs/promises';
    // await writeFile('rating-changes.json', JSON.stringify(exportData, null, 2));
    // console.log('Detailed data exported to rating-changes.json');

  } catch (error) {
    console.error('Error calculating rating changes:', error);
    throw error;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const startDate = args[0] || null;  // Format: YYYY-MM-DD
const endDate = args[1] || null;    // Format: YYYY-MM-DD

// Validate date formats if provided
if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
  console.error('Invalid start date format. Use YYYY-MM-DD');
  process.exit(1);
}

if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
  console.error('Invalid end date format. Use YYYY-MM-DD');
  process.exit(1);
}

calculateRatingChanges(startDate, endDate)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

