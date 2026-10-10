import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

/**
 * species_doy_statistics.json is synced verbatim from defile-migration-forecast with 17-digit
 * floats. Round non-integers to 4 significant digits when bundling (~890 kB -> ~300 kB, 90 kB gzipped).
 */
function roundSpeciesStats() {
  const round = (x) =>
    typeof x === "number" && !Number.isInteger(x)
      ? Number(x.toPrecision(4))
      : Array.isArray(x)
        ? x.map(round)
        : x && typeof x === "object"
          ? Object.fromEntries(Object.entries(x).map(([k, v]) => [k, round(v)]))
          : x;
  return {
    name: "round-species-stats",
    enforce: "pre",
    transform(code, id) {
      if (!id.endsWith("species_doy_statistics.json")) return null;
      // Vite's JSON plugin then emits it as JSON.parse("...") (json.stringify: "auto")
      return { code: JSON.stringify(round(JSON.parse(code))), map: null };
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [roundSpeciesStats(), vue()],
  base: "/defileViz/",
  server: {
    // The Trektellen proxy only accepts requests from the production origin (nginx whitelist),
    // so in dev, forward /trektellen through Vite and present that origin.
    proxy: {
      "/trektellen": {
        target: "https://defile.raphaelnussbaumer.com",
        changeOrigin: true,
        headers: { Origin: "https://raphaelnussbaumer.com" },
      },
    },
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    chunkSizeWarningLimit: 1200, // the Plotly chunk (~1.1 MB) is the known large one
    rolldownOptions: {
      output: {
        // Plotly is ~1 MB and rarely changes: its own chunk stays cached across deploys
        codeSplitting: {
          groups: [{ name: "plotly", test: /node_modules[\\/]plotly/, priority: 20 }],
        },
      },
    },
  },
});
