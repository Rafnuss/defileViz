<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../../utils/usePlot";
import { COLORS, alpha } from "../../theme.js";
import { doyLabel } from "../../services/explore";

const { t, locale } = useI18n();

const props = defineProps({
  // season.chances: {years, doy: [...], days: [...], at_least_1: [...], at_least_10: [...], ...}
  chances: { type: Object, required: true },
  // key_numbers.passage {q10, q90}, or null when not shown
  passage: { type: Object, default: null },
});

const THRESHOLDS = [1, 10, 100, 1000];
// One hue, light to dark as the threshold rises: a ladder, not four rival series
const LADDER = COLORS.blues;
const TICKS = [196, 213, 227, 244, 258, 274, 288, 305, 319, 335];

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const c = props.chances;
  const traces = THRESHOLDS.map((n, i) => [n, i])
    .filter(([n]) => c[`at_least_${n}`])
    .map(([n, i]) => ({
      x: c.doy,
      y: c[`at_least_${n}`],
      mode: "lines",
      line: { color: LADDER[i], width: 1.75, shape: "spline", smoothing: 0.6 },
      name: t("explore.when.atLeast", { n: n.toLocaleString(locale.value) }),
      text: c.doy.map((d) => doyLabel(d, locale.value)),
      hovertemplate: `%{text}: %{y:.0%}<extra>${t("explore.when.atLeast", { n })}</extra>`,
    }));
  const shapes = [];
  const annotations = [];
  if (props.passage) {
    shapes.push({
      type: "rect",
      xref: "x",
      yref: "paper",
      x0: props.passage.q10,
      x1: props.passage.q90,
      y0: 0,
      y1: 1,
      fillcolor: alpha(COLORS.faint, 0.08),
      line: { width: 0 },
      layer: "below",
    });
    annotations.push({
      x: (props.passage.q10 + props.passage.q90) / 2,
      y: 1.0,
      yanchor: "bottom",
      xref: "x",
      yref: "paper",
      text: t("explore.when.mainPassage"),
      showarrow: false,
      font: { size: 11, color: COLORS.muted },
    });
  }
  const ticks = TICKS.filter((d) => d >= c.doy[0] - 7 && d <= c.doy.at(-1) + 7);
  plotReact(
    plotDiv.value,
    traces,
    {
      xaxis: {
        fixedrange: true,
        tickvals: ticks,
        ticktext: ticks.map((d) => doyLabel(d, locale.value)),
      },
      yaxis: { fixedrange: true, range: [0, 1.02], tickformat: ".0%" },
      shapes,
      annotations,
      margin: { t: 26, l: 44, r: 10, b: 36 },
      legend: { orientation: "h", x: 0, y: -0.15 },
      hovermode: "x unified",
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.chances, props.passage, locale.value], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 280px;
}
</style>
