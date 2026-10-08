// The Explore export (defile-migration-forecast `scripts/build_explore.py`), served from
// public/data/explore/. Files are fetched once and cached for the session.
const BASE = `${import.meta.env.BASE_URL}data/explore/`;
const cache = new Map();

async function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(BASE + path).then((r) => {
        if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
        return r.json();
      }),
    );
  }
  return cache.get(path);
}

/** All taxa (`taxa.json`). */
export const fetchTaxa = () => getJSON("taxa.json");

/** One taxon's file (`species/<taxon_id>.json`): days, hourly, annual, profile, reports, trend. */
export const fetchSpecies = (taxonId) => getJSON(`species/${taxonId}.json`);

/** Day of year (1-366) -> "12 Sep" in the given locale, in a non-leap year. */
export function doyLabel(doy, locale) {
  const d = new Date(Date.UTC(2001, 0, 1) + (Math.round(doy) - 1) * 86400000);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The taxon's name in the locale: French from the eBird taxonomy, English otherwise. */
export const taxonName = (taxon, locale) =>
  (locale === "fr" && taxon.french_name) || taxon.english_name;
