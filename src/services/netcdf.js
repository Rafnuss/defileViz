import { NetCDFReader } from "netcdfjs";

/**
 * Fetch NetCDF forecast variables for a species and date.
 *
 * @param {string} dateStr        YYYY-MM-DD string for the forecast base date (used in filename)
 * @param {string} speciesName    Species name (folder & filename component)
 * @param {string|string[]} variableNames Variable name or list of variable names to extract
 * @returns {Promise<Object<string, any>>} Mapping variable -> 2D array [dateIndex][hourIndex], plus dates/time
 */
export async function fetchNetCDF(dateStr, speciesName, variableNames = ["pred_log_hourly_count"]) {
  const speciesNameUnderscored = speciesName.replace(/ /g, "_");
  const url = `http://defile.raphaelnussbaumer.com/forecasts/${speciesNameUnderscored}/${dateStr.replace(
    /-/g,
    ""
  )}_${speciesNameUnderscored}.nc`;

  try {
    const response = await window.fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status} fetching ${url}`);
    const buffer = await response.arrayBuffer();
    const nc = new NetCDFReader(new Uint8Array(buffer));

    const variables = Array.isArray(variableNames) ? variableNames : [variableNames];
    if (variables.length === 0) return {};

    const nDates = nc.dimensions.find((d) => d.name === "date")?.size ?? 0;
    const nHours = nc.dimensions.find((d) => d.name === "time")?.size ?? 0;
    if (!nDates || !nHours) {
      console.warn(`Missing dimensions in NetCDF for ${speciesName}`);
      return {};
    }

    let dates = [];
    try {
      const dateVar = nc.getDataVariable("date");
      const dateVarMeta = nc.variables.find((v) => v.name === "date");
      const unitsAttr = dateVarMeta?.attributes?.find((a) => a.name === "units");
      if (unitsAttr && Array.isArray(dateVar)) {
        const baseStr = unitsAttr.value.replace("days since ", "").split(" ")[0];
        const baseDate = new Date(baseStr);
        dates = dateVar.map((offset) => {
          const d = new Date(baseDate);
          d.setDate(d.getDate() + Math.round(offset));
          return d;
        });
      }
    } catch (e) {
      console.warn("Failed to parse date variable:", e);
    }

    const time = nc.getDataVariable("time");

    const result = { dates, time };

    for (const variable of variables) {
      let flat;
      try {
        flat = nc.getDataVariable(variable);
      } catch (e) {
        console.warn(`Variable ${variable} missing in NetCDF for ${speciesName}`);
        result[variable] = [];
        continue;
      }

      result[variable] = Array.from({ length: nDates }, (_, k) =>
        flat.slice(k * nHours, (k + 1) * nHours)
      );
    }

    return result;
  } catch (e) {
    console.error(`Error fetching NetCDF for ${speciesName}:`, e);
    return {};
  }
}
