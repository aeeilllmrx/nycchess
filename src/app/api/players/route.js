import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    const { rows } = await sql`
      SELECT 
        p.id as "ID",
        p.name as "Name",
        p.team as "Team",
        r.rapid_rating as "Rating_1",
        r.rapid_rd as "RD_1",
        r.rapid_sigma as "RV_1",
        r.blitz_rating as "Rating_3",
        r.blitz_rd as "RD_3",
        r.blitz_sigma as "RV_3"
      FROM players p
      JOIN ratings r ON p.id = r.player_id
      ORDER BY r.rapid_rating DESC
    `;
    return NextResponse.json(rows);
  } catch (error) {
    console.error('Database error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

