<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../utils/usePlot";
import { doyLabel } from "../../services/explore";

const { t, locale } = useI18n();

const props = defineProps({
  // trend.passage: [{year, lo, mid, hi}] (day of year)
  passage: { type: Array, required: true },
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const p = props.passage;
  const year = p.map((r) => r.year);
  const lo = Math.floor(Math.min(...p.map((r) => r.lo)) / 7) * 7;
  const hi = Math.ceil(Math.max(...p.map((r) => r.hi)) / 7) * 7;
  const ticks = [];
  for (let d = lo; d <= hi; d += 7) ticks.push(d);
  const traces = [
    {
      x: [...year, ...year.slice().reverse()],
      y: [...p.map((r) => r.hi), ...p.map((r) => r.lo).reverse()],
      fill: "toself",
      fillcolor: "rgba(214, 39, 40, 0.15)",
      line: { color: "transparent" },
      name: t("explore.passageBand"),
      hoverinfo: "skip",
    },
    {
      x: year,
      y: p.map((r) => r.mid),
      mode: "lines+markers",
      marker: { size: 4 },
      line: { color: "rgb(214, 39, 40)", width: 2 },
      name: t("explore.passageTitle"),
      text: p.map((r) => doyLabel(r.mid, locale.value)),
      hovertemplate: "%{x}: %{text}<extra></extra>",
    },
  ];
  const layout = {
    xaxis: { title: t("explore.year"), fixedrange: true },
    yaxis: {
      fixedrange: true,
      tickvals: ticks,
      ticktext: ticks.map((d) => doyLabel(d, locale.value)),
    },
    margin: { t: 10, l: 60, r: 10, b: 40 },
    showlegend: false,
    dragmode: false,
    autosize: true,
  };
  Plotly.react(plotDiv.value, traces, layout, { displayModeBar: false, responsive: true });
}

watch(() => [visible.value, props.passage, locale.value], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 300px;
}
</style>
