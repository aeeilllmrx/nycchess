import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, getApps, cert } from 'firebase-admin/app';

// Initialize Firebase Admin (only once)
if (getApps().length === 0) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(request) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decodedToken;
    
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const adminEmail = decodedToken.email;

    // Parse request body
    const body = await request.json();
    const { tournamentName, tournamentDate, tournamentType, changes } = body;

    if (!tournamentName || !tournamentDate || !tournamentType || !changes) {
      return NextResponse.json({
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Start transaction
    const client = await sql.connect();

    try {
      await client.query('BEGIN');

      // Create tournament record
      const { rows: tournamentRows } = await client.query(`
        INSERT INTO tournaments (name, tournament_date, tournament_type, processed_by)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `, [tournamentName, tournamentDate, tournamentType, adminEmail]);

      const tournamentId = tournamentRows[0].id;

      // Create any new players (from AUTO entries) before updating ratings
      const { rows: existingPlayers } = await client.query(`
        SELECT id FROM players WHERE id = ANY($1::text[])
      `, [changes.map(c => c.playerId)]);
      
      const existingPlayerIds = new Set(existingPlayers.map(p => p.id));
      const newPlayers = changes.filter(c => c.isNewPlayer && !existingPlayerIds.has(c.playerId));
      
      for (const newPlayer of newPlayers) {
        // Create player record
        await client.query(`
          INSERT INTO players (id, name)
          VALUES ($1, $2)
          ON CONFLICT (id) DO NOTHING
        `, [newPlayer.playerId, newPlayer.playerName]);
        
        // Create ratings record with default values
        await client.query(`
          INSERT INTO ratings (
            player_id, 
            rapid_rating, rapid_rd, rapid_sigma,
            blitz_rating, blitz_rd, blitz_sigma
          )
          VALUES ($1, 1500, 350, 0.06, 1500, 350, 0.06)
          ON CONFLICT (player_id) DO NOTHING
        `, [newPlayer.playerId]);
      }

      // Update ratings and record history
      for (const change of changes) {
        const { playerId, newRating, newRd, newSigma, oldRating } = change;

        // Update current rating
        if (tournamentType === 'rapid') {
          await client.query(`
            UPDATE ratings
            SET rapid_rating = $1, rapid_rd = $2, rapid_sigma = $3, updated_at = NOW()
            WHERE player_id = $4
          `, [newRating, newRd, newSigma, playerId]);
        } else {
          await client.query(`
            UPDATE ratings
            SET blitz_rating = $1, blitz_rd = $2, blitz_sigma = $3, updated_at = NOW()
            WHERE player_id = $4
          `, [newRating, newRd, newSigma, playerId]);
        }

        // Get old RD and sigma for history (simplified - using current values)
        const { rows: oldRatingRows } = await client.query(`
          SELECT 
            ${tournamentType === 'rapid' ? 'rapid_rd, rapid_sigma' : 'blitz_rd, blitz_sigma'}
          FROM ratings
          WHERE player_id = $1
        `, [playerId]);

        const oldRd = tournamentType === 'rapid' 
          ? oldRatingRows[0]?.rapid_rd || 350
          : oldRatingRows[0]?.blitz_rd || 350;
        const oldSigma = tournamentType === 'rapid'
          ? oldRatingRows[0]?.rapid_sigma || 0.06
          : oldRatingRows[0]?.blitz_sigma || 0.06;

        // Record in history
        await client.query(`
          INSERT INTO rating_history 
          (player_id, tournament_id, tournament_type, old_rating, old_rd, old_sigma, new_rating, new_rd, new_sigma)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `, [playerId, tournamentId, tournamentType, oldRating, oldRd, oldSigma, newRating, newRd, newSigma]);
      }

      // Log admin action
      await client.query(`
        INSERT INTO admin_actions (admin_email, action_type, tournament_id, details)
        VALUES ($1, $2, $3, $4)
      `, [
        adminEmail,
        'apply_tournament_ratings',
        tournamentId,
        JSON.stringify({ playerCount: changes.length, tournamentType })
      ]);

      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        tournamentId,
        message: `Successfully updated ${changes.length} player ratings`
      });

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

  } catch (error) {
    console.error('Apply ratings error:', error);
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}

