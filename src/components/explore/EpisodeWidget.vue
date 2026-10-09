<template>
  <figure class="figure w-100 widget">
    <div class="d-flex justify-content-between align-items-center small mb-2 gap-2">
      <label class="form-label mb-0" for="episode-year"
        >One season, with and without episodes</label
      >
      <select id="episode-year" v-model.number="year" class="form-select form-select-sm w-auto">
        <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
      </select>
    </div>
    <div ref="plotDiv" class="plot"></div>
    <figcaption class="figure-caption">
      <strong>Figure 2.</strong> {{ name }} in {{ year }}. Top: the birds counted each day, divided
      by the day's coverage (points; days less than {{ MIN_COVERAGE * 100 }}% counted are left out),
      the season expected without episodes (dashed: trend, year level, season and change of timing)
      and with them (orange). Bottom: the episodes alone, <Tex e="\exp(\Ep_y(t))" />, the factor by
      which they multiply the expected birds. Over all {{ years.length }} years, the leftover of one
      day predicts the next: without the episodes, the correlation between the residuals of
      consecutive days is <strong>{{ fmt(acf.without) }}</strong
      >; with them it falls to <strong>{{ fmt(acf.with) }}</strong
      >. This is what <Tex e="\Ep" /> is for: a good day tends to be followed by another.
    </figcaption>
  </figure>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../utils/usePlot";
import { doyLabel } from "../../services/explore";
import Tex from "./Tex.vue";

const props = defineProps({
  name: { type: String, required: true },
  // trend.episodes: {doy: [...], base: {year: [...]}, episode: {year: [...]}}
  episodes: { type: Object, required: true },
  theta: { type: Number, required: true },
  // the species' days, columnar: {date: [...], count: [...], c: [...]}
  days: { type: Object, required: true },
});

// As defile-explore src/defile_explore/trend.py MIN_COVERAGE: days counted less are not fitted
const MIN_COVERAGE = 0.1;
const C_EPISODE = "#e66c00";
const C_BASE = "rgba(33, 37, 41, 0.6)";
const C_POINT = "rgba(33, 37, 41, 0.45)";
const DATE_TICKS = [213, 244, 274, 305];
const FACTOR_TICKS = [0.25, 0.5, 1, 2, 4];

const years = computed(() => Object.keys(props.episodes.base).map(Number));
const year = ref(years.value.at(-1));
watch(years, (ys) => !ys.includes(year.value) && (year.value = ys.at(-1)));

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
 * pairs of consecutive counted days of the same year: with mu from eq. (2) with or without E.
 */
const acf = computed(() => {
  const th = props.theta;
  const pairs = { with: [], without: [] };
  for (const [y, m] of Object.entries(counted.value)) {
    const base = props.episodes.base[y];
    const ep = props.episodes.episode[y];
    const d0 = props.episodes.doy[0];
    const resid = (t, withE) => {
      const { n, c } = m.get(t);
      const mu = c * base[t - d0] * (withE ? Math.exp(ep[t - d0]) : 1);
      return (n - mu) / Math.sqrt(mu + (mu * mu) / th);
    };
    for (const t of m.keys())
      if (m.has(t + 1))
        for (const k of ["with", "without"])
          pairs[k].push([resid(t, k === "with"), resid(t + 1, k === "with")]);
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
  return { with: corr(pairs.with), without: corr(pairs.without) };
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function draw() {
  if (!visible.value || !plotDiv.value) return;
  const y = String(year.value);
  const { doy } = props.episodes;
  const base = props.episodes.base[y];
  const factor = props.episodes.episode[y].map(Math.exp);
  const pts = [...(counted.value[y] ?? new Map()).entries()];
  const xaxis = {
    fixedrange: true,
    range: [doy[0] - 1, doy.at(-1) + 1],
    tickvals: DATE_TICKS,
    ticktext: DATE_TICKS.map((d) => doyLabel(d, "en")),
  };
  Plotly.react(
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
        name: "without episodes",
        hoverinfo: "skip",
      },
      {
        x: doy,
        y: base.map((b, i) => b * factor[i]),
        mode: "lines",
        line: { color: C_EPISODE, width: 2 },
        name: "with episodes",
        hovertemplate: "%{y:,.0f} expected<extra></extra>",
      },
      {
        x: doy,
        y: factor,
        mode: "lines",
        line: { color: C_EPISODE, width: 1.5 },
        xaxis: "x2",
        yaxis: "y2",
        showlegend: false,
        hovertemplate: "×%{y:.2f}<extra></extra>",
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
        domain: [0.36, 1],
        fixedrange: true,
        rangemode: "tozero",
        title: { text: "birds per full day" },
      },
      xaxis2: { ...xaxis, anchor: "y2" },
      yaxis2: {
        domain: [0, 0.28],
        type: "log",
        fixedrange: true,
        tickvals: FACTOR_TICKS,
        ticktext: FACTOR_TICKS.map((v) => `×${v}`),
        title: { text: "episodes" },
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
          line: { color: "rgba(0,0,0,0.35)", width: 1, dash: "dot" },
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
  min-height: 340px;
}
</style>
