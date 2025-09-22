// Statistical utilities for forecasts and distributions
import { jStat } from "jstat";

/**
 * Estimate the cumulative probability (quantile rank) of a count given
 * available reference quantiles (q25, q50, q75) under a lognormal model.
 *
 * Inputs are daily totals (or consistent units). If only one quantile is
 * available (> 0), we approximate an almost-deterministic lognormal using it.
 *
 * @param {number} count - Observed or predicted count (>= 0)
 * @param {number} q25 - 25th percentile reference (can be 0/undefined)
 * @param {number} q50 - 50th percentile reference (median)
 * @param {number} q75 - 75th percentile reference
 * @returns {number} CDF value in [0,1]
 */
export function predictQuantile(count, q25, q50, q75) {
  if (!Number.isFinite(count) || count <= 0) return 0;

  const qs = [q25, q50, q75];
  const ps = [0.25, 0.5, 0.75];
  const valid = qs
    .map((q, i) => (Number.isFinite(q) && q > 0 ? { logq: Math.log(q), p: ps[i] } : null))
    .filter(Boolean);

  if (valid.length === 0) return 0;

  if (valid.length === 1) {
    // Only one valid quantile available -> assume near-deterministic lognormal
    const mu = valid[0].logq;
    const sigma = 1e-6; // tiny variance
    return jStat.lognormal.cdf(count, mu, sigma);
  }

  // Fit lognormal by linear regression on available quantiles in probit space
  const zs = valid.map((v) => jStat.normal.inv(v.p, 0, 1));
  const logs = valid.map((v) => v.logq);
  const meanZ = jStat.mean(zs);
  const meanY = jStat.mean(logs);
  const covZY = jStat.sum(zs.map((z, i) => (z - meanZ) * (logs[i] - meanY)));
  const varZ = jStat.sum(zs.map((z) => (z - meanZ) ** 2)) || 1e-12; // guard divide-by-zero
  const sigma = covZY / varZ;
  const mu = meanY - sigma * meanZ;
  return jStat.lognormal.cdf(count, mu, sigma);
}
