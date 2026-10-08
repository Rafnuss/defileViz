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
  // trend.season: {doy: [...], "<first year>": [...], "<last year>": [...]}
  season: { type: Object, required: true },
});

const COLORS = ["rgba(120, 120, 120, 0.9)", "rgb(31, 119, 180)"];
const MONTH_STARTS = [182, 213, 244, 274, 305]; // 1 Jul .. 1 Nov (non-leap)

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const { doy, ...curves } = props.season;
  const years = Object.keys(curves).sort();
  const traces = years.map((y, i) => ({
    x: doy,
    y: curves[y],
    mode: "lines",
    line: { color: COLORS[i % COLORS.length], width: 2, dash: i === 0 ? "dot" : "solid" },
    name: y,
    text: doy.map((d) => doyLabel(d, locale.value)),
    hovertemplate: `${y}, %{text}: %{y:,.0f} ${t("explore.birdsPerDay")}<extra></extra>`,
  }));
  const layout = {
    xaxis: {
      fixedrange: true,
      tickvals: MONTH_STARTS,
      ticktext: MONTH_STARTS.map((d) => doyLabel(d, locale.value)),
    },
    yaxis: { title: t("explore.birdsPerDay"), fixedrange: true, rangemode: "tozero" },
    margin: { t: 10, l: 60, r: 10, b: 40 },
    legend: { orientation: "h", x: 0, y: 1.1 },
    dragmode: false,
    autosize: true,
  };
  Plotly.react(plotDiv.value, traces, layout, { displayModeBar: false, responsive: true });
}

watch(() => [visible.value, props.season, locale.value], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 300px;
}
</style>
