import { sql } from '@vercel/postgres';
import Papa from 'papaparse';

async function migrateData() {
  const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSHfkpjzf6lxKgpKCUa-f7CfvjHTiko34qrLe2WKeOGn46CaxeLMWea8fVSyMYV3iNDV3RMjC2HyRlT/pub?gid=985029476&single=true&range=A:Z&output=tsv";
  
  console.log('Fetching data from Google Sheets...');
  const response = await fetch(SHEET_URL);
  const text = await response.text();

  const result = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    delimiter: '\t',
  });

  console.log(`Found ${result.data.length} players`);

  // Track which players we've already processed (to avoid duplicates from R/B pairs)
  const processedPlayers = new Set();

  for (const player of result.data) {
    try {
      // Strip R or B prefix to get numeric ID
      const numericId = player.ID.replace(/^[RB]/, '');
      
      // Skip if we've already processed this player
      if (processedPlayers.has(numericId)) {
        continue;
      }
      processedPlayers.add(numericId);

      // Each row contains all data for both rapid and blitz
      const rapidRating = parseInt(player.Rating_1) || 1500;
      const rapidRd = parseInt(player.RD) || 350;
      const rapidSigma = parseFloat(player.RV) || 0.06;
      
      const blitzRating = parseInt(player.Rating_2) || 1500;
      const blitzRd = parseInt(player.RD_1) || 350;
      const blitzSigma = parseFloat(player.RV_1) || 0.06;

      const name = player.Name;
      const team = player.Team;

      // Insert player with numeric ID
      await sql`
        INSERT INTO players (id, name, team)
        VALUES (${numericId}, ${name}, ${team})
        ON CONFLICT (id) DO UPDATE 
        SET name = ${name}, team = ${team}, updated_at = NOW()
      `;

      // Insert/update ratings
      await sql`
        INSERT INTO ratings (player_id, rapid_rating, rapid_rd, rapid_sigma, blitz_rating, blitz_rd, blitz_sigma)
        VALUES (
          ${numericId},
          ${rapidRating},
          ${rapidRd},
          ${rapidSigma},
          ${blitzRating},
          ${blitzRd},
          ${blitzSigma}
        )
        ON CONFLICT (player_id) DO UPDATE
        SET rapid_rating = ${rapidRating},
            rapid_rd = ${rapidRd},
            rapid_sigma = ${rapidSigma},
            blitz_rating = ${blitzRating},
            blitz_rd = ${blitzRd},
            blitz_sigma = ${blitzSigma},
            updated_at = NOW()
      `;

      console.log(`✓ Migrated ${name} (ID: ${numericId})`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${player.Name}:`, error.message);
    }
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);