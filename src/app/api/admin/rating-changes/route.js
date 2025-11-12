import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const tournamentType = searchParams.get('tournamentType'); // 'rapid', 'blitz', or 'both'

    // Build query with optional filters
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
        MAX(t.tournament_date) as last_tournament,
        ARRAY_AGG(
          json_build_object(
            'tournament_name', t.name,
            'tournament_date', t.tournament_date,
            'old_rating', rh.old_rating,
            'new_rating', rh.new_rating,
            'change', rh.new_rating - rh.old_rating
          ) ORDER BY t.tournament_date
        ) as tournament_history
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

    if (tournamentType && tournamentType !== 'both') {
      conditions.push(`rh.tournament_type = $${paramCount}`);
      params.push(tournamentType);
      paramCount++;
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += `
      GROUP BY rh.player_id, p.name, rh.tournament_type
      ORDER BY rh.tournament_type, ABS(SUM(rh.new_rating - rh.old_rating)) DESC
    `;

    const { rows } = await sql.query(query, params);

    // Organize results by player and tournament type
    const playerMap = new Map();

    for (const row of rows) {
      if (!playerMap.has(row.player_id)) {
        playerMap.set(row.player_id, {
          playerId: row.player_id,
          playerName: row.name,
          rapid: null,
          blitz: null
        });
      }

      const player = playerMap.get(row.player_id);
      const typeData = {
        totalChange: Math.round(parseFloat(row.total_change)),
        tournamentCount: parseInt(row.tournament_count),
        startingRating: Math.round(parseFloat(row.starting_rating)),
        endingRating: Math.round(parseFloat(row.ending_rating)),
        firstTournament: row.first_tournament,
        lastTournament: row.last_tournament,
        tournamentHistory: row.tournament_history.map(t => ({
          ...t,
          old_rating: Math.round(t.old_rating),
          new_rating: Math.round(t.new_rating),
          change: Math.round(t.change)
        }))
      };

      if (row.tournament_type === 'rapid') {
        player.rapid = typeData;
      } else if (row.tournament_type === 'blitz') {
        player.blitz = typeData;
      }
    }

    const players = Array.from(playerMap.values());

    // Calculate summary statistics
    const rapidPlayers = players.filter(p => p.rapid);
    const blitzPlayers = players.filter(p => p.blitz);

    const summary = {
      totalPlayers: players.length,
      rapidCount: rapidPlayers.length,
      blitzCount: blitzPlayers.length,
      rapidTournaments: rapidPlayers.reduce((sum, p) => sum + p.rapid.tournamentCount, 0),
      blitzTournaments: blitzPlayers.reduce((sum, p) => sum + p.blitz.tournamentCount, 0),
      avgRapidChange: rapidPlayers.length > 0 
        ? Math.round(rapidPlayers.reduce((sum, p) => sum + Math.abs(p.rapid.totalChange), 0) / rapidPlayers.length)
        : 0,
      avgBlitzChange: blitzPlayers.length > 0
        ? Math.round(blitzPlayers.reduce((sum, p) => sum + Math.abs(p.blitz.totalChange), 0) / blitzPlayers.length)
        : 0,
      dateRange: {
        start: startDate || 'all time',
        end: endDate || 'present'
      }
    };

    return NextResponse.json({
      success: true,
      players,
      summary
    });

  } catch (error) {
    console.error('Rating changes error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

