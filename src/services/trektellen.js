/**
 * Fetch Trektellen raw data for a site and date, returning the full API response.
 * Authentication is handled internally via env vars.
 *
 * @param {string} dateStr - Date in YYYY-MM-DD
 * @param {string|number} siteId - Trektellen site ID (default 2422)
 * @returns {Promise<Object>} The full API response data
 */
export async function fetchTrektellenData(dateStr, siteId = 2422) {
  if (!dateStr) throw new Error("dateStr is required");

  const yyyymmdd = dateStr.replace(/-/g, "");
  const url = `https://defile.raphaelnussbaumer.com/trektellen/${siteId}/${yyyymmdd}`;

  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`Trektellen HTTP ${response.status}: ${text?.slice(0, 200)}`);
  }

  const data = await response.json();
  const firstKey = Object.keys(data)[0];
  if (!firstKey) return [];

  const rows = Array.isArray(data[firstKey]?.data) ? data[firstKey].data : [];
  const bySpecies = {};
  for (const e of rows) {
    if (!e) continue;
    const sid = String(e.speciesid);
    const left = Number.parseInt(e.left, 10) || 0;
    const obs = { left, timestamp: e.timestamp };
    (bySpecies[sid] ||= []).push(obs);
  }
  return bySpecies;
}
