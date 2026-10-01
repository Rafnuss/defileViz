import SunCalc from "suncalc";

/**
 * Sun-based day window at Défilé, matching the forecast model's night definition.
 *
 * Mirrors `night_mask_by_doy_hour` in defile-migration-forecast (`src/data/weather.py`): the UTC
 * hour [h, h+1) is night when the sun stays below -6° (civil twilight) for the whole hour, i.e.
 * both at h:00 and at h+1:00. The model predicts exactly 0 in those hours. Like the Python
 * version, the sun is evaluated on reference year 2001 at the same day of year, and with the
 * same algorithm (the Python `suncalc` package is a port of this one), so both sides agree on
 * every hour. Keep suncalc pinned to 1.9.0: suncalc 2 adds refraction and Terrestrial Time,
 * which flips 28 of the 8784 day-hours near -6° away from the model's mask.
 */

// `LOCATIONS["Defile"]` in defile-migration-forecast's `src/data/weather.py`.
export const DEFILE_LAT = 46.117215;
export const DEFILE_LON = 5.914877;

export const NIGHT_SUN_ALTITUDE_DEG = -6;
const REFERENCE_YEAR = 2001;

/** Day of year (1-366) of a Date or "YYYY-MM-DD" string, taken in UTC. */
export function dayOfYear(date) {
  const d = new Date(date);
  return Math.floor((d - Date.UTC(d.getUTCFullYear(), 0, 1)) / 86400000) + 1;
}

const maskCache = new Map();

/** 24 booleans for a day of year: true where UTC hour h is night. */
export function nightMaskByDoy(doy) {
  if (maskCache.has(doy)) return maskCache.get(doy);
  const start = Date.UTC(REFERENCE_YEAR, 0, 1) + (doy - 1) * 86400000;
  const below = Array.from({ length: 25 }, (_, h) => {
    const { altitude } = SunCalc.getPosition(new Date(start + h * 3600000), DEFILE_LAT, DEFILE_LON);
    return (altitude * 180) / Math.PI < NIGHT_SUN_ALTITUDE_DEG;
  });
  const mask = below.slice(0, 24).map((b, h) => b && below[h + 1]);
  maskCache.set(doy, mask);
  return mask;
}

/**
 * Non-night UTC hours of a day: `first`/`last` hour (inclusive) and their count `nHours`.
 * Night is a single block around midnight UTC at this latitude, so the hours are contiguous.
 *
 * @param {Date|string|number} date - a Date, "YYYY-MM-DD" string, or a day of year
 */
export function dayWindow(date) {
  const doy = typeof date === "number" ? date : dayOfYear(date);
  const mask = nightMaskByDoy(doy);
  const first = mask.indexOf(false);
  const last = mask.lastIndexOf(false);
  return { first, last, nHours: mask.filter((m) => !m).length };
}

export const LOCAL_TIME_ZONE = "Europe/Paris";

/** Hours Europe/Paris is ahead of UTC on that date (2 in summer time, 1 in winter time). */
export function localUtcOffset(date) {
  const d = new Date(date);
  const noon = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12));
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: LOCAL_TIME_ZONE,
    timeZoneName: "shortOffset",
  })
    .formatToParts(noon)
    .find((p) => p.type === "timeZoneName").value; // e.g. "GMT+2"
  return Number(name.replace("GMT", "") || 0);
}
