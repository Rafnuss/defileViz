<template>
  <div ref="plotDiv" class="plot-container" :style="{ minHeight: `${height}px` }"></div>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../../utils/usePlot";
import { COLORS, alpha } from "../../theme.js";

const { t, locale } = useI18n();

const props = defineProps({
  // weather.effects with class "show" or "caveat" (defile-explore `weather.weather_block`): each
  // term's effect on the day's expected passage for its contrast, with its 95% interval, and
  // `counted`, the counted days on the contrast's side against the opposite side (partial residual)
  effects: { type: Array, required: true },
});

const RANGE = [0.2, 5]; // multipliers at the axis ends (log scale); beyond, clipped to the edge
const TICKS = [0.25, 0.5, 1, 2, 4];
const plotDiv = ref(null);
const visible = usePlot(plotDiv);
const height = computed(() => 70 + 44 * props.effects.length);

const num = (x) => x.toLocaleString(locale.value, { maximumSignificantDigits: 2 });
const clip = (x) => Math.min(Math.max(x, RANGE[0] * 1.02), RANGE[1] / 1.02);

function createPlot() {
  if (!visible.value || !plotDiv.value) return;
  const rows = [...props.effects].reverse(); // the first effect on top
  const y = rows.map((e) => t(`explore.weather.terms.${e.term}`));
  const model = {
    x: rows.map((e) => clip(e.effect)),
    y,
    mode: "markers",
    type: "scatter",
    name: t("explore.weather.model"),
    marker: {
      size: 10,
      color: rows.map((e) => (e.class === "caveat" ? COLORS.gold : COLORS.predicted)),
    },
    error_x: {
      type: "data",
      symmetric: false,
      array: rows.map((e) => clip(e.hi) - clip(e.effect)),
      arrayminus: rows.map((e) => clip(e.effect) - clip(e.lo)),
      color: alpha(COLORS.predicted, 0.6),
      thickness: 2,
      width: 0,
    },
    text: rows.map(
      (e) =>
        `${t(`explore.weather.contrasts.${e.term}`)}: ×${num(e.effect)} (${num(e.lo)}–${num(e.hi)})` +
        (e.class === "caveat" ? `<br>${t("explore.weather.caveat")}` : ""),
    ),
    hovertemplate: "%{text}<extra></extra>",
  };
  const withCount = rows.filter((e) => e.counted);
  const counted = {
    x: withCount.map((e) => clip(e.counted.relative)),
    y: withCount.map((e) => t(`explore.weather.terms.${e.term}`)),
    mode: "markers",
    type: "scatter",
    name: t("explore.weather.counted"),
    marker: { size: 9, symbol: "diamond", color: alpha(COLORS.counted, 0.85) },
    text: withCount.map((e) =>
      t("explore.weather.countedHover", {
        bin: t(`explore.weather.bins.${e.counted.bin}`),
        ref: t(`explore.weather.bins.${e.counted.reference}`).toLowerCase(),
        x: num(e.counted.relative),
        n: e.counted.days.toLocaleString(locale.value),
        m: e.counted.reference_days.toLocaleString(locale.value),
      }),
    ),
    hovertemplate: "%{text}<extra></extra>",
  };
  plotReact(
    plotDiv.value,
    [model, counted],
    {
      xaxis: {
        type: "log",
        range: RANGE.map(Math.log10),
        tickvals: TICKS,
        ticktext: TICKS.map((v) => `×${num(v)}`),
        fixedrange: true,
        zeroline: false,
      },
      yaxis: { fixedrange: true, automargin: true },
      shapes: [
        {
          type: "line",
          x0: 1,
          x1: 1,
          yref: "paper",
          y0: 0,
          y1: 1,
          line: { color: COLORS.faint, width: 1, dash: "dot" },
        },
      ],
      margin: { t: 10, l: 10, r: 10, b: 40 },
      legend: { orientation: "h", x: 0, y: -0.2 },
      height: height.value,
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.effects, locale.value], createPlot);
</script>

<style scoped>
.plot-container {
  width: 100%;
}
</style>
