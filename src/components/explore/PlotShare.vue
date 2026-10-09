<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../utils/usePlot";

const { t, locale } = useI18n();

const props = defineProps({
  // the age or sex block: {years, share, lo, hi, n, counted, overall: {share, lo, hi, n}}
  block: { type: Object, required: true },
  color: { type: String, default: "#1f77b4" },
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const b = props.block;
  const o = b.overall;
  const nMax = Math.max(...b.n);
  const x0 = Math.min(...b.years) - 0.5;
  const x1 = Math.max(...b.years) + 0.5;
  Plotly.react(
    plotDiv.value,
    [
      {
        x: [x0, x1, x1, x0],
        y: [o.lo, o.lo, o.hi, o.hi],
        mode: "lines",
        fill: "toself",
        fillcolor: "rgba(108, 117, 125, 0.15)",
        line: { width: 0 },
        hoverinfo: "skip",
        showlegend: false,
      },
      {
        x: [x0, x1],
        y: [o.share, o.share],
        mode: "lines",
        line: { color: "rgba(108, 117, 125, 0.9)", width: 1.5, dash: "dash" },
        hoverinfo: "skip",
        showlegend: false,
      },
      {
        x: b.years,
        y: b.share,
        mode: "markers",
        marker: { color: props.color, size: b.n.map((n) => 6 + 14 * Math.sqrt(n / nMax)) },
        error_y: {
          type: "data",
          symmetric: false,
          array: b.hi.map((h, i) => h - b.share[i]),
          arrayminus: b.lo.map((l, i) => b.share[i] - l),
          width: 0,
          color: props.color,
        },
        customdata: b.n.map((n) =>
          t("explore.who.of", { n: Math.round(n).toLocaleString(locale.value) }),
        ),
        hovertemplate: "%{x}: %{y:.0%} %{customdata}<extra></extra>",
        showlegend: false,
      },
    ],
    {
      xaxis: { fixedrange: true, tickformat: "d" },
      yaxis: { fixedrange: true, range: [0, 1], tickformat: ".0%" },
      margin: { t: 10, l: 44, r: 10, b: 30 },
      showlegend: false,
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.block, locale.value], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 240px;
}
</style>
