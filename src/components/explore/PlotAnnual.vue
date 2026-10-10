<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../../utils/usePlot";
import { COLORS, alpha } from "../../theme.js";

const { t } = useI18n();

const props = defineProps({
  // trend.annual: [{year, observed, total, q2.5, q10, q90, q97.5, smooth, smooth_q2.5, ...}],
  // or only [{year, observed}] for a taxon without a trend
  annual: { type: Array, required: true },
  // reliability classes of the estimated totals and of the smooth trend (show, caveat, hide)
  totals: { type: String, default: "show" },
  smooth: { type: String, default: "show" },
  // years mostly estimated (reliability.estimated_years), ringed
  estimated: { type: Array, default: () => [] },
  // the year selected: its bar in colour
  selected: { type: Number, default: null },
});
const emit = defineEmits(["select"]);

const C_COUNTED = alpha(COLORS.counted, 0.35);
const C_SELECTED = alpha(COLORS.counted, 0.8);
const C_TOTAL = COLORS.predicted;
const C_TREND = COLORS.predicted;
const C_CAVEAT = COLORS.ochre;

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const a = props.annual;
  const year = a.map((r) => r.year);
  const col = (k) => a.map((r) => r[k]);
  const birds = t("explore.birds");
  const traces = [
    {
      x: year,
      y: col("observed"),
      type: "bar",
      marker: {
        color: year.map((y) => (y === props.selected ? C_SELECTED : C_COUNTED)),
      },
      name: t("explore.many.counted"),
      hovertemplate: `%{x}: %{y:,.0f} ${birds}<extra>${t("explore.many.counted")}</extra>`,
    },
  ];
  if (props.smooth !== "hide" && a[0].smooth != null) {
    traces.push(
      {
        x: [...year, ...year.slice().reverse()],
        y: [...col("smooth_q97.5"), ...col("smooth_q2.5").reverse()],
        fill: "toself",
        fillcolor: alpha(C_TREND, 0.15),
        line: { color: "transparent" },
        name: t("explore.many.trendBand"),
        hoverinfo: "skip",
      },
      {
        x: year,
        y: col("smooth"),
        mode: "lines",
        line: { color: C_TREND, width: 2.5, dash: props.smooth === "caveat" ? "dash" : "solid" },
        name: t("explore.many.trend"),
        hovertemplate: `%{x}: %{y:,.0f} ${birds}<extra>${t("explore.many.trend")}</extra>`,
      },
    );
  }
  if (props.totals !== "hide" && a[0].total != null) {
    const err = (lo, hi) => ({
      type: "data",
      symmetric: false,
      array: a.map((r) => r[hi] - r.total),
      arrayminus: a.map((r) => r.total - r[lo]),
    });
    const color = props.totals === "caveat" ? C_CAVEAT : C_TOTAL;
    traces.push(
      {
        x: year,
        y: col("total"),
        mode: "markers",
        marker: { color, size: 6 },
        error_y: { ...err("q2.5", "q97.5"), color, thickness: 1, width: 0 },
        name: `${t("explore.many.total")}, ${t("explore.many.interval95")}`,
        customdata: a.map((r) => [r["q2.5"], r["q97.5"], r.observed_share * 100]),
        hovertemplate:
          `%{x}: %{y:,.0f} ${birds} (%{customdata[0]:,.0f}–%{customdata[1]:,.0f})` +
          `<br>%{customdata[2]:.0f}% ${t("explore.many.shareCounted")}<extra></extra>`,
      },
      {
        x: year,
        y: col("total"),
        mode: "markers",
        marker: { color, size: 6 },
        error_y: { ...err("q10", "q90"), color, thickness: 3.5, width: 0 },
        name: t("explore.many.interval80"),
        hoverinfo: "skip",
        showlegend: false,
      },
    );
    const est = a.filter((r) => props.estimated.includes(r.year));
    if (est.length)
      traces.push({
        x: est.map((r) => r.year),
        y: est.map((r) => r.total),
        mode: "markers",
        marker: { size: 14, color: "transparent", line: { color: C_CAVEAT, width: 1.5 } },
        name: t("explore.many.estimated"),
        hoverinfo: "skip",
      });
  }
  plotReact(
    plotDiv.value,
    traces,
    {
      barmode: "overlay",
      xaxis: { fixedrange: true },
      yaxis: {
        title: t("explore.birds"),
        fixedrange: true,
        rangemode: "tozero",
      },
      margin: { t: 10, l: 60, r: 10, b: 30 },
      legend: { orientation: "h", x: 0, y: -0.12 },
      hovermode: "closest",
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
  if (!plotDiv.value.selectsYear) {
    // A click on a year (its bar or its estimate) selects it
    plotDiv.value.on("plotly_click", (e) => {
      const x = e.points?.[0]?.x;
      if (x != null) emit("select", Math.round(x));
    });
    plotDiv.value.selectsYear = true;
  }
}

watch(
  () => [visible.value, props.annual, props.totals, props.smooth, props.estimated, props.selected],
  createPlot,
);
</script>

<style scoped>
.plot-container {
  min-height: 380px;
}
.plot-container :deep(.nsewdrag) {
  cursor: pointer !important;
}
</style>
