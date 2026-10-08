# defileViz

Vue 3 + Vite site showing the Défilé de l'Ecluse raptor migration forecasts, deployed to GitHub
Pages on push to main. Forecast NetCDF files and the Trektellen proxy are served by nginx on
defile.raphaelnussbaumer.com (config: /etc/nginx/sites-enabled/github-actions.conf on gce-rafnuss).

After editing, run: `npm run format && npm run lint && npm test && npm run build` (CI runs the same).

- `src/utils/daylight.js` and `src/utils/stats.js` mirror defile-migration-forecast (Python):
  keep them in sync and keep `suncalc` pinned to 1.9.0.
- `src/species_doy_statistics.json` is synced verbatim from defile-migration-forecast; don't edit
  or reformat it (it is rounded at build time in `vite.config.js`).
- Dates are "YYYY-MM-DD" days in Europe/Paris; NetCDF hours are UTC.
- The Explore page (`#explore`, `src/components/explore/`) reads `public/data/explore/`, copied
  verbatim from defile-migration-forecast's `data/explore/` (`python scripts/build_explore.py`
  there documents each file). Don't edit it here; rebuild there and copy.
