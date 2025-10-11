/**
 * Tournament processing logic
 * Ported from Python implementation
 */

import { Glicko2 } from './glicko2';

const glicko2 = new Glicko2(undefined, undefined, undefined, 0.5);

/**
 * Parse round result string
 * @param {string} result - e.g., "W12", "L5", "D8", "-H-", "-B-", "-U-"
 * @returns {[string, number]} - [resultType, opponentNumber]
 */
export function parseRoundResult(result) {
  if (result === '-H-' || result === '-U-' || result === '-B-') {
    return ['X', -1]; // Bye, unpaired, or half-point bye
  }
  const resultType = result[0];
  const opponentNumber = parseInt(result.substring(1), 10);
  return [resultType, opponentNumber];
}

/**
 * Update ratings for two players based on game result
 * @param {Rating} p1 - Player 1's rating
 * @param {Rating} p2 - Player 2's rating
 * @param {string} result - 'W', 'L', or 'D'
 * @returns {[Rating, Rating]} - Updated ratings for both players
 */
export function updateRatings(p1, p2, result) {
  if (result === 'W') {
    return glicko2.rate1vs1(p1, p2);
  } else if (result === 'L') {
    const [p2Updated, p1Updated] = glicko2.rate1vs1(p2, p1);
    return [p1Updated, p2Updated];
  } else if (result === 'D') {
    return glicko2.rate1vs1(p1, p2, true);
  } else {
    console.error(`Invalid game result '${result}'. Skipping game.`);
    return [p1, p2];
  }
}

/**
 * Process a single round of tournament
 * @param {Array} playerResults - Array of player result objects
 * @param {Object} playerStats - Map of player ID to {name, rating}
 * @param {Object} playerLookup - Map of player number to player ID
 * @param {Object} playerRoundDiffs - Map tracking rating changes per round
 * @param {string} roundColumn - Column name for this round
 */
export function processRound(playerResults, playerStats, playerLookup, playerRoundDiffs, roundColumn) {
  const seenPlayers = new Set();

  for (const player of playerResults) {
    const result = player[roundColumn];
    const p1Id = player.ID;

    if (seenPlayers.has(p1Id)) {
      continue;
    }
    seenPlayers.add(p1Id);

    const [resultType, opponentNumber] = parseRoundResult(result);

    if (resultType !== 'X') {
      // Get player 1 data
      const p1Data = playerStats[p1Id];
      if (!p1Data) {
        throw new Error(`Player ${p1Id} not found in player stats`);
      }
      const [p1Name, p1Rating] = p1Data;

      // Get player 2 data
      const p2Id = playerLookup[opponentNumber];
      seenPlayers.add(p2Id);
      
      const p2Data = playerStats[p2Id];
      if (!p2Data) {
        throw new Error(`Player ${p2Id} not found in player stats`);
      }
      const [p2Name, p2Rating] = p2Data;

      // Update ratings
      const [p1RatingUpdated, p2RatingUpdated] = updateRatings(p1Rating, p2Rating, resultType);
      
      const p1RoundDiff = p1RatingUpdated.mu - p1Rating.mu;
      const p2RoundDiff = p2RatingUpdated.mu - p2Rating.mu;

      playerRoundDiffs[p1Id][roundColumn] = p1RoundDiff;
      playerRoundDiffs[p2Id][roundColumn] = p2RoundDiff;

      playerStats[p1Id] = [p1Name, p1RatingUpdated];
      playerStats[p2Id] = [p2Name, p2RatingUpdated];
    }
  }
}

/**
 * Parse TSV tournament results
 * @param {string} tsvText - Raw TSV text
 * @returns {[Array, Array]} - [playerResults, roundColumns]
 */
export function parseTournamentResults(tsvText) {
  const lines = tsvText.trim().split('\n');
  if (lines.length === 0) {
    throw new Error('Empty tournament file');
  }

  // Parse header
  const headers = lines[0].split('\t').map(h => h.trim()).filter(Boolean);
  
  // Find round columns
  let roundColumns = headers.filter(h => 
    h.startsWith('Rnd') || h.startsWith('RD') || h.startsWith('Round ')
  );
  
  // Remove "RD" if it exists (that's rating deviation, not a round)
  roundColumns = roundColumns.filter(col => col !== 'RD');
  
  // Sort round columns by number
  roundColumns.sort((a, b) => {
    const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
    const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
    return numA - numB;
  });

  // Parse data rows
  const results = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = line.split('\t').map(v => v.trim());
    const row = {};
    
    headers.forEach((header, idx) => {
      row[header] = values[idx] || '';
    });

    // Convert Rating to number
    row.Rating = parseInt(row.Rating, 10);
    row.Number = i; // Player number for pairing lookup
    
    results.push(row);
  }

  return [results, roundColumns];
}

/**
 * Process entire tournament
 * @param {Object} playerStats - Map of player ID to {name, rating}
 * @param {string} tsvText - Raw TSV tournament data
 * @returns {Object} - { updatedStats, roundDiffs, roundColumns }
 */
export function processTournament(playerStats, tsvText) {
  const [playerResults, roundColumns] = parseTournamentResults(tsvText);

  // Create lookup from player number to player ID
  const playerLookup = {};
  for (const player of playerResults) {
    playerLookup[player.Number] = player.ID;
  }

  // Track initial ratings
  const initialRatings = {};
  for (const player of playerResults) {
    initialRatings[player.ID] = player.Rating;
  }

  // Track rating changes per round
  const playerRoundDiffs = {};
  for (const player of playerResults) {
    playerRoundDiffs[player.ID] = {};
    for (const roundCol of roundColumns) {
      playerRoundDiffs[player.ID][roundCol] = 0;
    }
  }

  // Process each round
  for (const roundColumn of roundColumns) {
    console.log('Processing round:', roundColumn);
    processRound(playerResults, playerStats, playerLookup, playerRoundDiffs, roundColumn);
  }

  return {
    updatedStats: playerStats,
    roundDiffs: playerRoundDiffs,
    initialRatings,
    roundColumns
  };
}

/**
 * Validate tournament file format
 * @param {string} tsvText - Raw TSV text
 * @returns {Object} - { valid, errors, warnings, summary }
 */
export function validateTournamentFile(tsvText) {
  const errors = [];
  const warnings = [];

  try {
    const lines = tsvText.trim().split('\n');
    if (lines.length === 0) {
      errors.push('File is empty');
      return { valid: false, errors, warnings, summary: {} };
    }

    // Parse header
    const headers = lines[0].split('\t').map(h => h.trim()).filter(Boolean);

    // Check required columns
    const requiredColumns = ['ID', 'Name', 'Rating'];
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    if (missingColumns.length > 0) {
      errors.push(`Missing required columns: ${missingColumns.join(', ')}`);
    }

    // Find round columns
    let roundColumns = headers.filter(h => 
      h.startsWith('Rnd') || h.startsWith('Round ')
    );

    if (roundColumns.length === 0) {
      errors.push('No round columns found (expected Rnd1, Rnd2, etc.)');
    }

    // Parse data rows
    const players = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const values = line.split('\t').map(v => v.trim());
      const player = {};
      
      headers.forEach((header, idx) => {
        player[header] = values[idx] || '';
      });

      player.Number = i;
      players.push(player);
    }

    // Validate player data
    for (const player of players) {
      if (!player.ID) {
        errors.push(`Player on line ${player.Number + 1} missing ID`);
      }
      if (!player.Name) {
        warnings.push(`Player ${player.ID} missing name`);
      }
      if (!player.Rating || isNaN(parseInt(player.Rating, 10))) {
        errors.push(`Player ${player.ID} has invalid rating`);
      }
    }

    // Validate game pairings
    for (const round of roundColumns) {
      for (const player of players) {
        const result = player[round];
        if (!result || result === '-H-' || result === '-B-' || result === '-U-') {
          continue;
        }

        const resultType = result[0];
        const opponentNum = parseInt(result.substring(1), 10);

        if (!['W', 'L', 'D'].includes(resultType)) {
          errors.push(`Invalid result '${result}' for player ${player.ID} in ${round}`);
        }

        if (opponentNum < 1 || opponentNum > players.length) {
          errors.push(`Invalid opponent number ${opponentNum} for player ${player.ID} in ${round}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      summary: {
        playerCount: players.length,
        roundCount: roundColumns.length
      }
    };
  } catch (error) {
    errors.push(`Parse error: ${error.message}`);
    return { valid: false, errors, warnings, summary: {} };
  }
}

