import { predictQuantile } from "../utils/stats";
import { dayWindow, dayOfYear, addDays } from "../utils/daylight";
import { fetchNetCDF } from "./netcdf";
import { fetchTrektellenData } from "./trektellen";

export const WEATHER_VARIABLES = [
  "temperature_2m",
  "dewpoint_temperature_2m",
  "total_precipitation",
  "surface_pressure",
  "u_component_of_wind_10m",
  "v_component_of_wind_10m",
  "u_component_of_wind_100m",
  "v_component_of_wind_100m",
  "instantaneous_10m_wind_gust",
  "high_cloud_cover",
  "low_cloud_cover",
  "medium_cloud_cover",
  "total_cloud_cover",
  "surface_solar_radiation_downwards",
  "sun_altitude",
  "sun_azimuth",
];

const MAX_DAYS = 14;

/** Historical statistics of one species for the MAX_DAYS days starting at `dateStr`. */
function buildSpecies(sds, dateStr) {
  const doy = dayOfYear(dateStr);
  const sp = {
    species: sds.species,
    trektellen_species_id: sds.trektellen_species_id,
    quantile_levels: sds.quantile_levels,
    collapsed: false,
    date: [],
    historical: [],
    forecast: [],
    trektellen: {},
  };
  const idMedian = sp.quantile_levels.indexOf(50);

  for (let i = 0; i < MAX_DAYS; i++) {
    const d2 = new Date(addDays(dateStr, i));
    sp.date.push(d2);

    // Historical stats only cover the season: outside it every field is null
    const idx = sds.doy.indexOf(doy + i);
    const at = (arr) => (idx >= 0 ? (arr?.[idx] ?? null) : null);
    sp.historical.push({
      quantiles: at(sds.quantiles),
      min: at(sds.min),
      max: at(sds.max),
      mean: at(sds.mean),
      ratio: at(sds.ratio),
      median: at(sds.quantiles)?.[idMedian] ?? null,
      // Non-night UTC hours of that day, same rule as the forecast model's night mask
      window: dayWindow(d2),
    });
  }
  return sp;
}

/** Historical quantiles are birds/h: scale by that day's non-night hours to get a daily total. */
const dailyQuantiles = (h) => h?.quantiles?.map((q) => q * h.window.nHours);

/**
 * Loads forecasts, weather and Trektellen counts for one day. The three sources are independent
 * and fetched in parallel; a failing weather or Trektellen fetch just leaves that part empty.
 *
 * @param {string} dateStr - "YYYY-MM-DD" day (Europe/Paris)
 * @param {object[]} speciesStats - entries of species_doy_statistics.json
 * @returns {Promise<{list: object[], weather: object|null, noForecast: boolean}>}
 */
export async function loadSpeciesData(dateStr, speciesStats) {
  const list = speciesStats.map((sds) => buildSpecies(sds, dateStr));

  const forecastsPromise = Promise.allSettled(
    list.map(async (sp) => {
      const varsData = await fetchNetCDF(dateStr, sp.species, ["pred_log_hourly_count"]);
      // Apply transform locally: pred_log_hourly_count is exp(x) - 1
      const forecastData = (varsData.pred_log_hourly_count || []).map((row) =>
        row.map((x) => Math.exp(x) - 1),
      );
      if (!forecastData.length || !forecastData[0]?.length) throw new Error("No forecast data");

      sp.forecast = forecastData.map((arr, idx) => {
        const predTotal = (arr || []).reduce((x, y) => x + (y ?? 0), 0);
        const predTotalQuantile = predictQuantile(
          predTotal,
          dailyQuantiles(sp.historical[idx]),
          sp.quantile_levels,
        );
        return { predHourlyCount: arr, predTotal, predTotalQuantile };
      });
    }),
  );

  const weatherPromise = fetchNetCDF(dateStr, "Osprey", WEATHER_VARIABLES).catch((e) => {
    console.error("Error fetching weather data:", e);
    return null;
  });

  const trektellenPromise = fetchTrektellenData(dateStr).catch((e) => {
    console.error("Error fetching Trektellen data:", e);
    return null;
  });

  const [forecasts, weather, bySpecies] = await Promise.all([
    forecastsPromise,
    weatherPromise,
    trektellenPromise,
  ]);

  const failed = forecasts.filter((r) => r.status === "rejected");
  failed.forEach((r) => console.error("Failed to fetch forecast:", r.reason));

  if (bySpecies && Object.keys(bySpecies).length > 0) {
    for (const sp of list) {
      const observations = bySpecies[String(sp.trektellen_species_id)] || [];
      const count = observations.reduce((sum, o) => sum + (o?.left ?? 0), 0);
      sp.trektellen = {
        observations,
        count,
        totalQuantile: predictQuantile(count, dailyQuantiles(sp.historical[0]), sp.quantile_levels),
      };
    }
  }

  return { list, weather, noForecast: failed.length === forecasts.length };
}
