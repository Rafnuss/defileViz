/**
 * Interpolate quantile level from a value using log-linear interpolation suitable for log-normal distributions.
 *
 * This function takes arrays of quantile values and their corresponding percentile levels,
 * and returns the interpolated percentile for a given value using log-space interpolation
 * which is appropriate for log-normal distributions.
 *
 * @param {number} value - The value to find the quantile level for
 * @param {Array<number>} quantileValues - Array of quantile values (e.g., [0, 0.026, 0.389, 1.269, ...])
 * @param {Array<number>} quantileLevels - Array of corresponding percentile levels (e.g., [1, 5, 10, 20, ...])
 * @returns {number} Interpolated percentile level (0-100)
 */
export function predictQuantile(value, quantileValues, quantileLevels) {
  if (!Number.isFinite(value) || value < 0) return 0;
  if (!Array.isArray(quantileValues) || !Array.isArray(quantileLevels)) return 0;
  if (quantileValues.length !== quantileLevels.length || quantileValues.length === 0) return 0;

  // Handle edge cases
  if (value <= quantileValues[0]) return quantileLevels[0];
  if (value >= quantileValues[quantileValues.length - 1])
    return quantileLevels[quantileLevels.length - 1];

  // Find the two quantile values that bracket our target value
  let lowerIndex = 0;
  let upperIndex = quantileValues.length - 1;

  for (let i = 0; i < quantileValues.length - 1; i++) {
    if (value >= quantileValues[i] && value <= quantileValues[i + 1]) {
      lowerIndex = i;
      upperIndex = i + 1;
      break;
    }
  }

  const lowerValue = quantileValues[lowerIndex];
  const upperValue = quantileValues[upperIndex];
  const lowerLevel = quantileLevels[lowerIndex];
  const upperLevel = quantileLevels[upperIndex];

  // Handle case where values are identical (shouldn't happen but defensive)
  if (lowerValue === upperValue) return lowerLevel;

  // For log-normal distributions, interpolate in log space for values > 0
  // For small values near 0, use linear interpolation to avoid log(0) issues
  let interpolatedLevel;

  if (lowerValue > 0 && upperValue > 0 && value > 0) {
    // Log-linear interpolation (better for log-normal distributions)
    const logLower = Math.log(lowerValue);
    const logUpper = Math.log(upperValue);
    const logValue = Math.log(value);

    // Interpolate in log space
    const t = (logValue - logLower) / (logUpper - logLower);
    interpolatedLevel = lowerLevel + t * (upperLevel - lowerLevel);
  } else {
    // Linear interpolation for edge cases near zero
    const t = (value - lowerValue) / (upperValue - lowerValue);
    interpolatedLevel = lowerLevel + t * (upperLevel - lowerLevel);
  }

  // Ensure result stays within bounds
  return Math.max(0, Math.min(100, interpolatedLevel));
}

/**
 * Creates a smooth historical line trace for Plotly using hourly ratios and base values.
 *
 * @param {Array<number>} xHours - Array of hour values for x-axis
 * @param {Array<number>} ratio - Array of hourly ratio multipliers
 * @param {number} baseValue - Base value to multiply ratios by
 * @param {string} color - Line color
 * @param {string} dash - Line dash style ('solid', 'dash', 'dot', etc.)
 * @param {string} label - Label for the line
 * @param {boolean} smooth - Whether to apply smoothing (default: true)
 * @returns {Object|null} Plotly trace object or null if invalid data
 */
export function createHistoricalLineTrace(
  xHours,
  ratio,
  baseValue,
  color,
  dash = "solid",
  label = "",
  smooth = true
) {
  if (
    baseValue == null ||
    Number.isNaN(baseValue) ||
    !Array.isArray(ratio) ||
    !Array.isArray(xHours)
  ) {
    return null;
  }

  const y = ratio.map((r) => (r == null ? 1 : r) * baseValue);

  const lineConfig = {
    color,
    width: 2,
    dash,
  };

  // Add smoothing for better visual appearance
  if (smooth) {
    lineConfig.shape = "spline";
    lineConfig.smoothing = 1.3;
  }

  return {
    x: xHours,
    y,
    type: "scatter",
    mode: "lines",
    line: lineConfig,
    name: `${label} (${Number(baseValue).toFixed(1)})`,
    hovertemplate: `${label}: %{y:.1f}<extra></extra>`,
  };
}
