import { describe, it, expect, vi } from "vitest";

vi.mock("../src/services/netcdf", () => ({ fetchNetCDF: vi.fn() }));
vi.mock("../src/services/trektellen", () => ({ fetchTrektellenData: vi.fn() }));

import { fetchNetCDF } from "../src/services/netcdf";
import { fetchTrektellenData } from "../src/services/trektellen";
import { loadSpeciesData } from "../src/services/forecast";
import { parseHash } from "../src/composables/useHashRoute";

const stats = [
  {
    species: "Osprey",
    trektellen_species_id: 7,
    quantile_levels: [10, 50, 90],
    doy: [],
  },
];

describe("loadSpeciesData", () => {
  it("flags noForecast when every forecast fails, still returns the species", async () => {
    fetchNetCDF.mockRejectedValue(new Error("404"));
    fetchTrektellenData.mockResolvedValue({});
    vi.spyOn(console, "error").mockImplementation(() => {});
    const r = await loadSpeciesData("2026-10-10", stats);
    expect(r.noForecast).toBe(true);
    expect(r.weather).toBeNull();
    expect(r.list).toHaveLength(1);
    expect(r.list[0].historical).toHaveLength(14);
    expect(r.list[0].historical[0].median).toBeNull();
  });

  it("transforms the forecast with exp(x)-1 and sums Trektellen counts", async () => {
    fetchNetCDF.mockResolvedValue({ pred_log_hourly_count: [[Math.log(3), Math.log(2)]] });
    fetchTrektellenData.mockResolvedValue({ 7: [{ left: 2 }, { left: 3 }] });
    const r = await loadSpeciesData("2026-10-10", stats);
    expect(r.noForecast).toBe(false);
    expect(r.list[0].forecast[0].predTotal).toBeCloseTo(3);
    expect(r.list[0].trektellen.count).toBe(5);
  });
});

describe("parseHash", () => {
  it("routes #explore and #explore/<taxon> to the Explore page", () => {
    expect(parseHash("#explore")).toEqual({ page: "explore", taxon: null });
    expect(parseHash("#explore/redkit1")).toEqual({ page: "explore", taxon: "redkit1" });
  });
  it("treats everything else as the forecast page", () => {
    expect(parseHash("")).toEqual({ page: "forecast", taxon: null });
    expect(parseHash("#Osprey")).toEqual({ page: "forecast", taxon: null });
  });
});
