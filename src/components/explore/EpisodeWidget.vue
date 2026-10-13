<template>
  <figure class="figure w-100 widget">
    <div class="d-flex justify-content-between align-items-center small mb-2 gap-2">
      <label class="form-label mb-0" for="episode-year">One season, day by day</label>
      <select id="episode-year" v-model.number="year" class="form-select form-select-sm w-auto">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div ref="plotDiv" class="plot"></div>
    <figcaption class="figure-caption">
      <strong>Figure 2.</strong> {{ name }} in {{ year }}. Top: the birds counted each day divided
      by the day's coverage (points; days less than {{ MIN_COVERAGE * 100 }}% counted are left out),
      against the smooth season (dashed: trend, year level, season and change of timing), the same
      with the day's weather (teal) and with the episodes too (orange, the full model). Bottom: what
      each multiplies the smooth season by. Over all {{ years.length }} years, how far one day's
      count is from the model still predicts the next day's: the correlation is
      <strong>{{ fmt(acf.base) }}</strong> with the smooth season alone,
      <strong>{{ fmt(acf.weather) }}</strong> with the weather and
      <strong>{{ fmt(acf.full) }}</strong> with the episodes too.
    </figcaption>
  </figure>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { usePlot, plotReact } from "../../utils/usePlot";
import { COLORS, alpha } from "../../theme.js";
import { doyLabel } from "../../services/explore";

const props = defineProps({
  name: { type: String, required: true },
  // trend.episodes: {doy, base: {year: [...]}, weather: {year: [...]}, episode: {year: [...]}},
  // weather and episode as log multipliers of base (defile-explore `trend.episode_curves`)
  episodes: { type: Object, required: true },
  theta: { type: Number, required: true },
  // the species' days, columnar: {date: [...], count: [...], c: [...]}
  days: { type: Object, required: true },
});

// As defile-explore src/defile_explore/trend.py MIN_COVERAGE: days counted less are not fitted
const MIN_COVERAGE = 0.1;
const C_EPISODE = COLORS.ochre;
const C_WEATHER = COLORS.teal;
const C_BASE = alpha(COLORS.ink, 0.6);
const C_POINT = alpha(COLORS.ink, 0.45);
const DATE_TICKS = [213, 244, 274, 305];
const FACTOR_TICKS = [0.25, 0.5, 1, 2, 4];

const years = computed(() => Object.keys(props.episodes.base).map(Number));
const year = ref(years.value.at(-1));
watch(years, (ys) => !ys.includes(year.value) && (year.value = ys.at(-1)));

// a year's log multipliers (an export from before the weather has none: zeros)
const logs = (y) => {
  const ep = props.episodes.episode[y];
  return { wx: props.episodes.weather?.[y] ?? ep.map(() => 0), ep };
};
const fmt = (r) => (Number.isFinite(r) ? r.toFixed(2) : "–");

// Day of year, leap years included as in the export (pandas' dayofyear)
const doyOf = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return (Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000 + 1;
};

// The counted days the model fits: {year: Map(doy -> {n, c})}
const counted = computed(() => {
  const { date, count, c } = props.days;
  const [d0, d1] = [props.episodes.doy[0], props.episodes.doy.at(-1)];
  const out = {};
  date.forEach((s, i) => {
    const y = +s.slice(0, 4);
    const t = doyOf(s);
    if (!(y in props.episodes.base) || t < d0 || t > d1 || !(c[i] >= MIN_COVERAGE)) return;
    (out[y] ??= new Map()).set(t, { n: count[i], c: c[i] });
  });
  return out;
});

/**
 * Lag-1 correlation of the Pearson residuals, (N - mu) / sd with the negative binomial's sd, over
 * pairs of consecutive counted days of the same year, with mu from eq. (3): the smooth season
 * alone (`base`), with the weather (`weather`), and with the episodes too (`full`).
 */
const acf = computed(() => {
  const th = props.theta;
  const LEVELS = ["base", "weather", "full"];
  const pairs = { base: [], weather: [], full: [] };
  for (const [y, m] of Object.entries(counted.value)) {
    const base = props.episodes.base[y];
    const { wx, ep } = logs(y);
    const d0 = props.episodes.doy[0];
    const resid = (t, level) => {
      const { n, c } = m.get(t);
      const i = t - d0;
      const log = (level !== "base" ? wx[i] : 0) + (level === "full" ? ep[i] : 0);
      const mu = c * base[i] * Math.exp(log);
      return (n - mu) / Math.sqrt(mu + (mu * mu) / th);
    };
    for (const t of m.keys())
      if (m.has(t + 1)) for (const k of LEVELS) pairs[k].push([resid(t, k), resid(t + 1, k)]);
  }
  const corr = (p) => {
    const n = p.length;
    if (n < 3) return NaN;
    const mx = p.reduce((s, [a]) => s + a, 0) / n;
    const my = p.reduce((s, [, b]) => s + b, 0) / n;
    let sxy = 0,
      sxx = 0,
      syy = 0;
    for (const [a, b] of p) {
      sxy += (a - mx) * (b - my);
      sxx += (a - mx) ** 2;
      syy += (b - my) ** 2;
    }
    return sxy / Math.sqrt(sxx * syy);
  };
  return Object.fromEntries(LEVELS.map((k) => [k, corr(pairs[k])]));
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function draw() {
  if (!visible.value || !plotDiv.value) return;
  const y = String(year.value);
  const { doy } = props.episodes;
  const base = props.episodes.base[y];
  const { wx, ep } = logs(y);
  const fWx = wx.map(Math.exp);
  const fEp = ep.map(Math.exp);
  const pts = [...(counted.value[y] ?? new Map()).entries()];
  const xaxis = {
    fixedrange: true,
    range: [doy[0] - 1, doy.at(-1) + 1],
    tickvals: DATE_TICKS,
    ticktext: DATE_TICKS.map((d) => doyLabel(d, "en")),
  };
  plotReact(
    plotDiv.value,
    [
      {
        x: pts.map(([t]) => t),
        y: pts.map(([, p]) => p.n / p.c),
        mode: "markers",
        marker: { color: C_POINT, size: 5 },
        name: "counted / coverage",
        customdata: pts.map(([t, p]) => [doyLabel(t, "en"), p.n, Math.round(p.c * 100)]),
        hovertemplate:
          "%{customdata[0]}: %{customdata[1]:,} counted, %{customdata[2]}% covered<extra></extra>",
      },
      {
        x: doy,
        y: base,
        mode: "lines",
        line: { color: C_BASE, width: 1.5, dash: "dash" },
        name: "smooth season",
        hoverinfo: "skip",
      },
      {
        x: doy,
        y: base.map((b, i) => b * fWx[i]),
        mode: "lines",
        line: { color: C_WEATHER, width: 1.5 },
        name: "with the weather",
        hovertemplate: "%{y:,.0f} with the weather<extra></extra>",
      },
      {
        x: doy,
        y: base.map((b, i) => b * fWx[i] * fEp[i]),
        mode: "lines",
        line: { color: C_EPISODE, width: 2 },
        name: "and the episodes",
        hovertemplate: "%{y:,.0f} expected<extra></extra>",
      },
      {
        x: doy,
        y: fWx,
        mode: "lines",
        line: { color: C_WEATHER, width: 1.5 },
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
        hovertemplate: "weather ×%{y:.2f}<extra></extra>",
      },
      {
        x: doy,
        y: fEp,
        mode: "lines",
        line: { color: C_EPISODE, width: 1.5 },
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
        hovertemplate: "episodes ×%{y:.2f}<extra></extra>",
      },
    ],
    {
      margin: { t: 24, l: 56, r: 8, b: 32 },
      dragmode: false,
      autosize: true,
      font: { size: 11 },
      legend: { orientation: "h", x: 1, xanchor: "right", y: 1.12 },
      xaxis: { ...xaxis, matches: "x2", showticklabels: false, anchor: "y" },
      yaxis: {
        domain: [0.4, 1],
        fixedrange: true,
        rangemode: "tozero",
        title: { text: "birds per full day" },
      },
      xaxis2: { ...xaxis, anchor: "y2" },
      yaxis2: {
        domain: [0, 0.32],
        type: "log",
        fixedrange: true,
        tickvals: FACTOR_TICKS,
        ticktext: FACTOR_TICKS.map((v) => `×${v}`),
        title: { text: "×" },
      },
      shapes: [
        {
          type: "line",
          xref: "x2 domain",
          x0: 0,
          x1: 1,
          yref: "y2",
          y0: 1,
          y1: 1,
          line: { color: alpha(COLORS.ink, 0.35), width: 1, dash: "dot" },
        },
      ],
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, year.value, props.episodes, counted.value], draw);
</script>

<style scoped>
.widget {
  border: 1px solid var(--bs-border-color);
  border-radius: 0.5rem;
  padding: 0.75rem 1rem;
}
.plot {
  min-height: 380px;
}
</style>
