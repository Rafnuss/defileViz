<template>
  <div ref="plotDiv" class="plot-container"></div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../utils/usePlot";
import { clock } from "../../services/explore";

const { t } = useI18n();

const props = defineProps({
  // daytime.hours: 24 shares, by solar hour, as counted over the main passage
  hours: { type: Array, required: true },
  // daytime.expected: the same shares as the time-of-day profile predicts them, on the same days
  // and minutes counted
  expected: { type: Array, default: null },
  // hours from solar to clock time on the day shown (services/explore solarShift)
  shift: { type: Number, required: true },
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const s = props.shift;
  const solar = props.hours.map((_, h) => h);
  // Hours with a share, and one either side: the axis spans the day's passage
  const on = solar.filter((h) => props.hours[h] > 0.002);
  const range = [Math.floor(on[0] + s) - 1, Math.ceil(on.at(-1) + 1 + s) + 1];
  const ticks = [];
  for (let h = Math.ceil(range[0] / 2) * 2; h <= range[1]; h += 2) ticks.push(h);
  const traces = [
    {
      x: solar.map((h) => h + 0.5 + s),
      y: props.hours,
      type: "bar",
      width: 0.9,
      marker: { color: "rgba(31, 119, 180, 0.55)" },
      name: t("explore.when.counted"),
      text: solar.map((h) => `${clock(h + s, 10)}–${clock(h + 1 + s, 10)}`),
      textposition: "none",
      hovertemplate: "%{text}: %{y:.0%}<extra></extra>",
    },
  ];
  const e = props.expected;
  if (e) {
    traces.push({
      x: solar.map((h) => h + 0.5 + s),
      y: e,
      mode: "lines+markers",
      line: { color: "#212529", width: 2, shape: "spline" },
      marker: { size: 4 },
      name: t("explore.when.predicted"),
      text: solar.map((h) => `${clock(h + s, 10)}–${clock(h + 1 + s, 10)}`),
      hovertemplate: "%{text}: %{y:.0%}<extra></extra>",
    });
  }
  Plotly.react(
    plotDiv.value,
    traces,
    {
      xaxis: {
        fixedrange: true,
        range,
        tickvals: ticks,
        ticktext: ticks.map((h) => clock(h)),
      },
      yaxis: { fixedrange: true, tickformat: ".0%", rangemode: "tozero" },
      margin: { t: 22, l: 44, r: 10, b: 36 },
      legend: { orientation: "h", x: 0, y: -0.15 },
      bargap: 0,
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.hours, props.expected, props.shift], createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 280px;
}
</style>
