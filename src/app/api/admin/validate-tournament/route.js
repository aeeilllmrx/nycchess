import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { validateTournamentFile } from '@/lib/tournamentProcessor';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tournamentType = formData.get('tournamentType'); // 'rapid' or 'blitz'

    if (!file) {
      return NextResponse.json({
        valid: false,
        errors: ['No file provided']
      }, { status: 400 });
    }

    if (!tournamentType || !['rapid', 'blitz'].includes(tournamentType)) {
      return NextResponse.json({
        valid: false,
        errors: ['Invalid tournament type. Must be "rapid" or "blitz"']
      }, { status: 400 });
    }

    // Read file content
    const text = await file.text();

    // Validate file format
    const validation = validateTournamentFile(text);

    if (!validation.valid) {
      return NextResponse.json(validation, { status: 400 });
    }

    // Check that all player IDs exist in database
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

    // Query database for existing players
    const { rows: existingPlayers } = await sql`
      SELECT id FROM players WHERE id = ANY(${playerIds})
    `;

    const existingIds = new Set(existingPlayers.map(p => p.id));
    const newPlayers = playerIds.filter(id => !existingIds.has(id));

    if (newPlayers.length > 0) {
      validation.warnings.push(
        `${newPlayers.length} player(s) not found in database: ${newPlayers.slice(0, 5).join(', ')}${newPlayers.length > 5 ? '...' : ''}`
      );
    }

    return NextResponse.json({
      ...validation,
      newPlayers,
      tournamentType
    });

  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json({
      valid: false,
      errors: [error.message]
    }, { status: 500 });
  }
}

