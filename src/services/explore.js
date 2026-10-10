// The Explore export (defile-explore `scripts/build_explore.py`), served from
// public/data/explore/ (npm run explore:fetch or explore:local, not in git). Files are fetched
// once and cached for the session.
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

/** One taxon's file (`species/<taxon_id>.json`): days, hourly, annual, profile, trend and the blocks derived from them. */
export const fetchSpecies = (taxonId) => getJSON(`species/${taxonId}.json`);

/** Day of year (1-366) -> "12 Sep" in the given locale, in a non-leap year. */
export function doyLabel(doy, locale) {
  const d = new Date(Date.UTC(2001, 0, 1) + (Math.round(doy) - 1) * 86400000);
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", timeZone: "UTC" });
}

/** The taxon's name in the locale: French from the eBird taxonomy, English otherwise. */
export const taxonName = (taxon, locale) =>
  (locale === "fr" && taxon.french_name) || taxon.english_name;

// External pages of the taxon (defile-explore `settings.LINK_TEMPLATES`), with an icon each
export const LINKS = {
  ebird: { label: "eBird", icon: "bi-binoculars" },
  ebird_status: { label: "eBird abundance map", icon: "bi-map" },
  birds_of_the_world: { label: "Birds of the World", icon: "bi-book" },
  ebba2: { label: "European atlas (EBBA2)", icon: "bi-grid-3x3" },
  trektellen: { label: "Trektellen", icon: "bi-graph-up" },
  vogelwarte: { label: "Vogelwarte", icon: "bi-house" },
  migration_atlas: { label: "Migration Atlas", icon: "bi-arrow-left-right" },
};

/** A group taxon ("harrier sp.", "Red/Black Kite"): read as the sum of everything in `members`. */
export const isGroup = (taxon) => taxon.taxon_rank === "spuh" || taxon.taxon_rank === "slash";

/** The taxon's links (taxa.json `links`): a group's Trektellen graph is of one of its ids only. */
export function linksOf(taxon) {
  const { trektellen, ...rest } = taxon.links ?? {};
  return isGroup(taxon) || !trektellen ? rest : { ...rest, trektellen };
}

// --- solar time -------------------------------------------------------------------------------
// The export gives hours of the day in local apparent solar time (hour 12 starts at the sun's
// transit over the Défilé, defile-explore `export.solar_shift`). The page shows clock time: the
// solar hour plus the day's shift, as there.

const SITE_LON = 5.914877; // defile-explore release.SITE

/** Offset of Europe/Paris from UTC (hours) at local noon on a date. */
function zoneOffset(date) {
  const noon = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 11));
  const name = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Paris",
    timeZoneName: "shortOffset",
  })
    .formatToParts(noon)
    .find((p) => p.type === "timeZoneName").value; // "GMT+2"
  return Number(name.replace("GMT", "") || 0);
}

/**
 * Hours from solar time to clock time at the Défilé on a date (clock = solar + shift): the zone's
 * offset, less the longitude's and the equation of time (NOAA's series), as defile-explore
 * `export.solar_shift`.
 */
export function solarShift(date) {
  const start = Date.UTC(date.getUTCFullYear(), 0, 1);
  const g = ((2 * Math.PI) / 365) * Math.floor((date - start) / 86400000);
  const eot =
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g));
  return zoneOffset(date) - SITE_LON / 15 - eot / 60;
}

/** A day of year as a UTC date in the given year. */
export const doyDate = (doy, year) =>
  new Date(Date.UTC(year, 0, 1) + (Math.round(doy) - 1) * 86400000);

/** Clock time "10:30" of a fractional hour, rounded to `step` minutes. */
export function clock(h, step = 1) {
  const m = Math.round((h * 60) / step) * step;
  return `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

// --- reliability --------------------------------------------------------------------------------
// defile-explore classes each claim of the trend (`reliability`: show, caveat or hide) and gives
// each drawn field its class in `reliability.elements`. The page only looks fields up here.

/** The class of a drawn field ("show" when the taxon has no reliability block). */
export const fate = (data, element) => data?.reliability?.elements?.[element] ?? "show";

/** The reason codes behind a field's class, worst first. */
export function reasonsOf(data, element, claimOf = ELEMENT_CLAIMS) {
  const claim = data?.reliability?.[claimOf[element]];
  if (!claim) return [];
  const rank = { hide: 0, caveat: 1, show: 2 };
  return [...claim.reasons].sort((a, b) => rank[a.level] - rank[b.level]).map((r) => r.code);
}

// defile-explore reliability.ELEMENTS: the claim each field rests on
export const ELEMENT_CLAIMS = {
  "trend.annual.total": "totals",
  "trend.days.total": "totals",
  "key_numbers.typical_season": "totals",
  "trend.annual.smooth": "trend",
  "key_numbers.trend": "trend",
  "trend.passage": "season",
  "trend.passage_q": "season",
  "key_numbers.passage": "season",
  "season.share": "totals",
  "season.passage": "totals",
  "season.chances": "totals",
};

/** Effort per year (`effort.json` `annual`): days and hours counted, all species. */
export const fetchEffort = () => getJSON("effort.json").then((e) => e.annual);
