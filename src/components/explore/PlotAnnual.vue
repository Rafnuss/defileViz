<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../utils/usePlot";

const { t } = useI18n();

const props = defineProps({
  // trend.annual: [{year, observed, total, q2.5, q10, q90, q97.5, smooth, smooth_q2.5, ...}]
  annual: { type: Array, required: true },
  log: { type: Boolean, default: false },
});

const C_COUNTED = "rgba(150, 150, 150, 0.55)";
const C_TOTAL = "rgb(33, 37, 41)";
const C_TREND = "rgb(31, 119, 180)";

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const a = props.annual;
  const year = a.map((r) => r.year);
  const col = (k) => a.map((r) => r[k]);
  const total = col("total");
  const err = (lo, hi) => ({
    type: "data",
    symmetric: false,
    array: a.map((r) => r[hi] - r.total),
    arrayminus: a.map((r) => r.total - r[lo]),
  });
  const birds = t("explore.birds");
  const traces = [
    {
      x: year,
      y: col("observed"),
      type: "bar",
      marker: { color: C_COUNTED },
      name: t("explore.annualCounted"),
      hovertemplate: `%{x}: %{y:,.0f} ${birds}<extra>${t("explore.annualCounted")}</extra>`,
    },
    {
      x: [...year, ...year.slice().reverse()],
      y: [...col("smooth_q97.5"), ...col("smooth_q2.5").reverse()],
      fill: "toself",
      fillcolor: "rgba(31, 119, 180, 0.15)",
      line: { color: "transparent" },
      name: t("explore.trendBand"),
      hoverinfo: "skip",
    },
    {
      x: year,
      y: col("smooth"),
      mode: "lines",
      line: { color: C_TREND, width: 2.5 },
      name: t("explore.trend"),
      hovertemplate: `%{x}: %{y:,.0f} ${birds}<extra>${t("explore.trend")}</extra>`,
    },
    {
      x: year,
      y: total,
      mode: "markers",
      marker: { color: C_TOTAL, size: 6 },
      error_y: { ...err("q2.5", "q97.5"), color: C_TOTAL, thickness: 1, width: 0 },
      name: `${t("explore.annualTotal")}, ${t("explore.interval95")}`,
      customdata: a.map((r) => [r["q2.5"], r["q97.5"], r.observed_share * 100]),
      hovertemplate:
        `%{x}: %{y:,.0f} ${birds} (%{customdata[0]:,.0f}–%{customdata[1]:,.0f})` +
        `<br>%{customdata[2]:.0f}% ${t("explore.shareCounted")}<extra></extra>`,
    },
    {
      x: year,
      y: total,
      mode: "markers",
      marker: { color: C_TOTAL, size: 6 },
      error_y: { ...err("q10", "q90"), color: C_TOTAL, thickness: 3.5, width: 0 },
      name: t("explore.interval80"),
      hoverinfo: "skip",
      showlegend: false,
    },
  ];
  const layout = {
    barmode: "overlay",
    xaxis: { title: t("explore.year"), fixedrange: true },
    yaxis: {
      title: t("explore.birds"),
      type: props.log ? "log" : "linear",
      fixedrange: true,
      rangemode: "tozero",
    },
    margin: { t: 10, l: 60, r: 10, b: 40 },
    legend: { orientation: "h", x: 0, y: -0.2 },
    hovermode: "closest",
    dragmode: false,
    autosize: true,
  };
  Plotly.react(plotDiv.value, traces, layout, { displayModeBar: false, responsive: true });
}

watch(() => [visible.value, props.annual, props.log], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 380px;
}
</style>
