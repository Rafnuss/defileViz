# defileViz

Vue 3 + Vite site showing the Défilé de l'Ecluse raptor migration forecasts, deployed to GitHub
Pages on push to main. Forecast NetCDF files and the Trektellen proxy are served by nginx on
defile.raphaelnussbaumer.com (config: /etc/nginx/sites-enabled/github-actions.conf on gce-rafnuss).

After editing, run: `npm run format && npm run lint && npm test && npm run build` (CI runs the same).

- `src/utils/daylight.js` and `src/utils/stats.js` mirror defile-migration-forecast (Python):
  keep them in sync and keep `suncalc` pinned to 1.9.0.
- `src/species_doy_statistics.json` is synced verbatim from defile-migration-forecast; don't edit
  or reformat it (it is rounded at build time in `vite.config.js`).
- Colours come from the logo: `src/theme.js` (charts, via `plotReact` in `src/utils/usePlot.js`)
  and `src/styles/theme.css` (page) hold the same palette; keep them in sync and don't hardcode
  colours. Slate-blue is always the model, rust what was counted, warm grey bands past years.
- Dates are "YYYY-MM-DD" days in Europe/Paris; NetCDF hours are UTC.
- The Explore page (`#explore`, `src/components/explore/`) reads `public/data/explore/`, not in
  git: `npm run explore:fetch` downloads it from the defile-explore release named in
  `scripts/fetch-explore.mjs` (as deploy.yml does), `npm run explore:local` copies a local build
  of `../defile-explore/data/explore` to try it first (`python scripts/build_explore.py` there
  documents each file). Don't edit it here; rebuild there, publish there, and deploy.
