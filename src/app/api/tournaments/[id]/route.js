import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Fetch tournament details
    const { rows: tournamentRows } = await sql`
      SELECT 
        id,
        name,
        tournament_date,
        tournament_type,
        club
      FROM tournaments
      WHERE id = ${id}
    `;

    if (tournamentRows.length === 0) {
      return NextResponse.json({
        error: 'Tournament not found'
      }, { status: 404 });
    }

    const tournament = tournamentRows[0];

    // Fetch rating changes for this tournament
    const { rows: ratingChanges } = await sql`
      SELECT 
        rh.player_id,
        p.name as player_name,
        rh.old_rating,
        rh.new_rating,
        rh.old_rd,
        rh.new_rd
      FROM rating_history rh
      JOIN players p ON rh.player_id = p.id
      WHERE rh.tournament_id = ${id}
      ORDER BY (rh.new_rating - rh.old_rating) DESC
    `;

    // Format the changes
    const changes = ratingChanges.map(row => ({
      playerId: row.player_id,
      playerName: row.player_name,
      oldRating: Math.round(row.old_rating),
      newRating: Math.round(row.new_rating),
      ratingChange: Math.round(row.new_rating - row.old_rating),
      oldRd: Math.round(row.old_rd),
      newRd: Math.round(row.new_rd)
    }));

    // Calculate summary stats
    const summary = {
      totalPlayers: changes.length,
      averageChange: changes.length > 0 
        ? Math.round(changes.reduce((sum, c) => sum + Math.abs(c.ratingChange), 0) / changes.length)
        : 0,
      topGainer: changes.length > 0 ? changes[0] : null,
      biggestDrop: changes.length > 0 ? changes[changes.length - 1] : null
    };

    return NextResponse.json({
      tournament,
      changes,
      summary
    });

  } catch (error) {
    console.error('Error fetching tournament details:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

