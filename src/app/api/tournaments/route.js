import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Fetch all tournaments with their club info, ordered by date descending
    const { rows: tournaments } = await sql`
      SELECT 
        id,
        name,
        tournament_date,
        tournament_type,
        club,
        processed_by
      FROM tournaments
      ORDER BY tournament_date DESC
    `;

    // Group tournaments by club
    const clubsData = {};
    
    for (const tournament of tournaments) {
      const clubName = tournament.club || 'Other';
      
      if (!clubsData[clubName]) {
        clubsData[clubName] = {
          name: clubName,
          tournaments: []
        };
      }
      
      clubsData[clubName].tournaments.push({
        id: tournament.id,
        name: tournament.name,
        date: tournament.tournament_date,
        type: tournament.tournament_type,
        processedBy: tournament.processed_by
      });
    }

    // Convert to array format expected by the UI
    const clubsArray = Object.values(clubsData);

    return NextResponse.json(clubsArray);

  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

