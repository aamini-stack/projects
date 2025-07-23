export function scores(population: number[]): number[] {
  const sum = (arr: number[]) => arr.reduce((x, y) => x + y);
  const n = population.length;
  const mean = sum(population) / n;
  const variance = sum(population.map((x) => (x - mean) ** 2)) / n;
  const sigma = Math.sqrt(variance);
  const zScores = population.map((x) => (x - mean) / sigma);

  if (sigma === 0) {
    // If standard deviation is 0, all values are the same.
    // Each value is at the 50th percentile.
    return population.map(() => 0.5);
  }

  return zScores.map(percentile).map((x) => Number(x.toFixed(2)));
}

/**
 * https://stackoverflow.com/a/16197404/6310030
 */
function percentile(z: number): number {
  // If z is greater than 6.5, the number of significant digits will
  // be outside of a reasonable range.
  if (z < -6.5) return 0.0;
  if (z > 6.5) return 1.0;

  let factK = 1;
  let sum = 0;
  let term = 1;
  let k = 0;
  const loopStop = Math.exp(-23);
  while (Math.abs(term) > loopStop) {
    term =
      (((0.3989422804 * Math.pow(-1, k) * Math.pow(z, k)) /
        (2 * k + 1) /
        Math.pow(2, k)) *
        Math.pow(z, k + 1)) /
      factK;
    sum += term;
    k++;
    factK *= k;
  }
  sum += 0.5;

  return sum;
}
