/**
 * Glicko-2 rating system implementation
 * Ported from Python implementation
 */

// Constants
export const WIN = 1.0;
export const DRAW = 0.5;
export const LOSS = 0.0;

const MU = 1500;
const PHI = 350;
const SIGMA = 0.06;
const TAU = 0.5;
const EPSILON = 0.000001;

export class Rating {
  constructor(mu = MU, phi = PHI, sigma = SIGMA) {
    this.mu = mu;
    this.phi = phi;
    this.sigma = sigma;
  }

  toString() {
    return `Rating(mu=${this.mu.toFixed(3)}, phi=${this.phi.toFixed(3)}, sigma=${this.sigma.toFixed(3)})`;
  }
}

export class Glicko2 {
  constructor(mu = MU, phi = PHI, sigma = SIGMA, tau = TAU, epsilon = EPSILON) {
    this.mu = mu;
    this.phi = phi;
    this.sigma = sigma;
    this.tau = tau;
    this.epsilon = epsilon;
  }

  createRating(mu = null, phi = null, sigma = null) {
    return new Rating(
      mu ?? this.mu,
      phi ?? this.phi,
      sigma ?? this.sigma
    );
  }

  scaleDown(rating, ratio = 173.7178) {
    const mu = (rating.mu - this.mu) / ratio;
    const phi = rating.phi / ratio;
    return this.createRating(mu, phi, rating.sigma);
  }

  scaleUp(rating, ratio = 173.7178) {
    const mu = rating.mu * ratio + this.mu;
    const phi = rating.phi * ratio;
    return this.createRating(mu, phi, rating.sigma);
  }

  reduceImpact(rating) {
    return 1.0 / Math.sqrt(1 + (3 * rating.phi ** 2) / (Math.PI ** 2));
  }

  expectScore(rating, otherRating, impact) {
    return 1.0 / (1 + Math.exp(-impact * (rating.mu - otherRating.mu)));
  }

  determineSigma(rating, difference, variance) {
    const phi = rating.phi;
    const differenceSquared = difference ** 2;
    const alpha = Math.log(rating.sigma ** 2);

    const f = (x) => {
      const tmp = phi ** 2 + variance + Math.exp(x);
      const a = (Math.exp(x) * (differenceSquared - tmp)) / (2 * tmp ** 2);
      const b = (x - alpha) / (this.tau ** 2);
      return a - b;
    };

    let a = alpha;
    let b;
    if (differenceSquared > phi ** 2 + variance) {
      b = Math.log(differenceSquared - phi ** 2 - variance);
    } else {
      let k = 1;
      while (f(alpha - k * Math.sqrt(this.tau ** 2)) < 0) {
        k += 1;
      }
      b = alpha - k * Math.sqrt(this.tau ** 2);
    }

    let fA = f(a);
    let fB = f(b);

    while (Math.abs(b - a) > this.epsilon) {
      const c = a + ((a - b) * fA) / (fB - fA);
      const fC = f(c);
      
      if (fC * fB < 0) {
        a = b;
        fA = fB;
      } else {
        fA /= 2;
      }
      
      b = c;
      fB = fC;
    }

    return Math.exp(a / 2);
  }

  rate(rating, series) {
    // Step 2: Convert to Glicko-2 scale
    rating = this.scaleDown(rating);
    
    // If no games played, just update phi
    if (!series || series.length === 0) {
      const phiStar = Math.sqrt(rating.phi ** 2 + rating.sigma ** 2);
      return this.scaleUp(this.createRating(rating.mu, phiStar, rating.sigma));
    }

    // Step 3 & 4: Calculate variance and difference
    let varianceInv = 0;
    let difference = 0;

    for (const [actualScore, otherRating] of series) {
      const scaledOther = this.scaleDown(otherRating);
      const impact = this.reduceImpact(scaledOther);
      const expectedScore = this.expectScore(rating, scaledOther, impact);
      
      varianceInv += impact ** 2 * expectedScore * (1 - expectedScore);
      difference += impact * (actualScore - expectedScore);
    }

    difference /= varianceInv;
    const variance = 1.0 / varianceInv;

    // Step 5: Determine new sigma
    const sigma = this.determineSigma(rating, difference, variance);

    // Step 6: Update phi*
    const phiStar = Math.sqrt(rating.phi ** 2 + sigma ** 2);

    // Step 7: Update rating and RD
    const phi = 1.0 / Math.sqrt(1 / phiStar ** 2 + 1 / variance);
    const mu = rating.mu + phi ** 2 * (difference / variance);

    // Step 8: Convert back to original scale
    return this.scaleUp(this.createRating(mu, phi, sigma));
  }

  rate1vs1(rating1, rating2, drawn = false) {
    return [
      this.rate(rating1, [[drawn ? DRAW : WIN, rating2]]),
      this.rate(rating2, [[drawn ? DRAW : LOSS, rating1]])
    ];
  }

  quality1vs1(rating1, rating2) {
    const expectedScore1 = this.expectScore(rating1, rating2, this.reduceImpact(rating1));
    const expectedScore2 = this.expectScore(rating2, rating1, this.reduceImpact(rating2));
    const expectedScore = (expectedScore1 + expectedScore2) / 2;
    return 2 * (0.5 - Math.abs(0.5 - expectedScore));
  }
}

