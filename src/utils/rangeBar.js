// Geometry of the table's range bar: where a daily total sits on a species' own axis.

/** Position (0-100) of a daily total on a log(1 + x) axis ending at `max`. */
export function logPosition(value, max) {
  if (!(max > 0) || !Number.isFinite(value)) return 0;
  const v = Math.min(Math.max(value, 0), max);
  return (100 * Math.log1p(v)) / Math.log1p(max);
}

/**
 * Bar layout for one species, in percent of the bar width.
 *
 * @param {Object} p
 * @param {"number"|"quantile"} p.mode - number: log axis in birds; quantile: linear 0-100 axis
 * @param {number[]|null} p.quantiles - historical daily-total quantiles
 * @param {number[]} p.levels - their percentile levels
 * @param {number|null} p.predicted - predicted daily total
 * @param {number|null} p.predictedQuantile
 * @param {number|null} p.counted - counted daily total so far
 * @param {number|null} p.countedQuantile
 * @returns {{outer: number[], inner: number[], median: number, predicted: number|null, counted: number|null}|null}
 */
export function rangeBar({
  mode,
  quantiles,
  levels,
  predicted,
  predictedQuantile,
  counted,
  countedQuantile,
}) {
  if (!Array.isArray(quantiles) || quantiles.length !== levels.length) return null;
  const at = (level) => quantiles[levels.indexOf(level)];

  if (mode === "quantile") {
    return {
      outer: [5, 95],
      inner: [20, 80],
      median: 50,
      predicted: predictedQuantile ?? null,
      counted: countedQuantile ?? null,
    };
  }
  const max = Math.max(at(99), predicted ?? 0, counted ?? 0);
  const pos = (v) => logPosition(v, max);
  return {
    outer: [pos(at(5)), pos(at(95))],
    inner: [pos(at(20)), pos(at(80))],
    median: pos(at(50)),
    predicted: predicted != null ? pos(predicted) : null,
    counted: counted != null ? pos(counted) : null,
  };
}
