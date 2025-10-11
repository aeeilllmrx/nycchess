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

  for (const player of result.data) {
    try {
      // Insert player
      await sql`
        INSERT INTO players (id, name, team)
        VALUES (${player.ID}, ${player.Name}, ${player.Team})
        ON CONFLICT (id) DO UPDATE 
        SET name = ${player.Name}, team = ${player.Team}, updated_at = NOW()
      `;

      // Insert/update ratings
      await sql`
        INSERT INTO ratings (player_id, rapid_rating, rapid_rd, rapid_sigma, blitz_rating, blitz_rd, blitz_sigma)
        VALUES (
          ${player.ID},
          ${parseInt(player.Rating_1) || 1500},
          ${parseInt(player.RD_1) || 350},
          ${parseFloat(player.RV_1) || 0.06},
          ${parseInt(player.Rating_3) || 1500},
          ${parseInt(player.RD_3) || 350},
          ${parseFloat(player.RV_3) || 0.06}
        )
        ON CONFLICT (player_id) DO UPDATE
        SET rapid_rating = ${parseInt(player.Rating_1) || 1500},
            rapid_rd = ${parseInt(player.RD_1) || 350},
            rapid_sigma = ${parseFloat(player.RV_1) || 0.06},
            blitz_rating = ${parseInt(player.Rating_3) || 1500},
            blitz_rd = ${parseInt(player.RD_3) || 350},
            blitz_sigma = ${parseFloat(player.RV_3) || 0.06},
            updated_at = NOW()
      `;

      console.log(`✓ Migrated ${player.Name}`);
    } catch (error) {
      console.error(`✗ Failed to migrate ${player.Name}:`, error.message);
    }
  }

  console.log('Migration complete!');
}

migrateData().catch(console.error);