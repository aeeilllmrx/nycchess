import { describe, it, expect } from 'vitest';
import { processTournament } from './tournamentProcessor';
import { Rating } from './glicko2';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Tournament Processor', () => {
  it('should match expected results for sample tournament', () => {
    // Read input file
    const inputPath = join(process.cwd(), 'src/data/sample_input.tsv');
    const inputText = readFileSync(inputPath, 'utf-8');
    
    // Read expected results
    const expectedPath = join(process.cwd(), 'src/data/expected_results.tsv');
    const expectedText = readFileSync(expectedPath, 'utf-8');
    
    // Parse input to build playerStats
    const inputLines = inputText.trim().split('\n');
    const inputHeaders = inputLines[0].split('\t');
    const idIdx = inputHeaders.indexOf('ID');
    const nameIdx = inputHeaders.indexOf('Name');
    const ratingIdx = inputHeaders.indexOf('Rating');
    const rdIdx = inputHeaders.indexOf('RD');
    const rvIdx = inputHeaders.indexOf('RV');
    
    const playerStats = {};
    for (let i = 1; i < inputLines.length; i++) {
      const values = inputLines[i].split('\t');
      const id = values[idIdx].trim();
      const name = values[nameIdx].trim();
      const rating = parseFloat(values[ratingIdx]);
      const rd = parseFloat(values[rdIdx]);
      const sigma = parseFloat(values[rvIdx]);
      
      playerStats[id] = [name, new Rating(rating, rd, sigma)];
    }
    
    // Process tournament
    const result = processTournament(playerStats, inputText);
    
    // Parse expected results
    const expectedLines = expectedText.trim().split('\n');
    const expectedHeaders = expectedLines[0].split('\t');
    const expIdIdx = expectedHeaders.indexOf('ID');
    const expRatingIdx = expectedHeaders.indexOf('Rating');
    const expRdIdx = expectedHeaders.indexOf('RD');
    const expRvIdx = expectedHeaders.indexOf('RV');
    
    // Find round columns in expected results
    const roundColumns = expectedHeaders.filter(h => h.startsWith('Rnd'));
    
    // Verify results for each player
    for (let i = 1; i < expectedLines.length; i++) {
      const values = expectedLines[i].split('\t');
      const playerId = values[expIdIdx].trim();
      const expectedRating = parseFloat(values[expRatingIdx]);
      const expectedRd = parseFloat(values[expRdIdx]);
      const expectedRv = parseFloat(values[expRvIdx]);
      
      // Get actual results
      const [, actualRating] = result.updatedStats[playerId];
      
      // Test final rating (within 1 point tolerance for rounding)
      expect(Math.round(actualRating.mu)).toBe(Math.round(expectedRating));
      
      // Test RD (within 1 point tolerance)
      expect(Math.round(actualRating.phi)).toBe(Math.round(expectedRd));
      
      // Test sigma/volatility (within small tolerance)
      expect(actualRating.sigma).toBeCloseTo(expectedRv, 5);
      
      // Test per-round changes
      for (let j = 0; j < roundColumns.length; j++) {
        const roundCol = roundColumns[j];
        const colIdx = expectedHeaders.indexOf(roundCol);
        const expectedChange = parseFloat(values[colIdx]);
        const actualChange = result.roundDiffs[playerId][roundCol] || 0;
        
        // Allow 1 point tolerance for per-round changes
        expect(Math.round(actualChange)).toBe(Math.round(expectedChange));
      }
    }
  });
  
  it('should calculate correct rating change for player with 577 point drop', () => {
    // Specific test for R538 Diaz, Monica who should drop 577 points
    const inputPath = join(process.cwd(), 'src/data/sample_input.tsv');
    const inputText = readFileSync(inputPath, 'utf-8');
    
    // Parse input
    const inputLines = inputText.trim().split('\n');
    const inputHeaders = inputLines[0].split('\t');
    const idIdx = inputHeaders.indexOf('ID');
    const nameIdx = inputHeaders.indexOf('Name');
    const ratingIdx = inputHeaders.indexOf('Rating');
    const rdIdx = inputHeaders.indexOf('RD');
    const rvIdx = inputHeaders.indexOf('RV');
    
    const playerStats = {};
    let monicaStartRating;
    
    for (let i = 1; i < inputLines.length; i++) {
      const values = inputLines[i].split('\t');
      const id = values[idIdx].trim();
      const name = values[nameIdx].trim();
      const rating = parseFloat(values[ratingIdx]);
      const rd = parseFloat(values[rdIdx]);
      const sigma = parseFloat(values[rvIdx]);
      
      if (id === 'R538') {
        monicaStartRating = rating;
      }
      
      playerStats[id] = [name, new Rating(rating, rd, sigma)];
    }
    
    // Process tournament
    const result = processTournament(playerStats, inputText);
    
    // Check Monica's rating
    const [, monicaFinalRating] = result.updatedStats['R538'];
    const actualDrop = monicaStartRating - monicaFinalRating.mu;
    
    // Should be approximately 577 points (allow 1 point tolerance)
    expect(Math.round(actualDrop)).toBe(577);
    
    // Verify the expected end rating of 923
    expect(Math.round(monicaFinalRating.mu)).toBe(923);
  });
});

