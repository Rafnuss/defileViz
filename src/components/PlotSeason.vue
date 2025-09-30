<template>
  <div>
    <h6 class="text-muted mb-2">{{ $t("plots.season") }}</h6>
    <div v-if="season?.doy">
      <div ref="plotDiv" class="plot-container"></div>
    </div>
    <div v-else>
      <p>{{ $t("plots.noForecastData") }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, inject } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-dist-min";

const { t } = useI18n();

const props = defineProps({
  season: { type: Object, required: true },
  date: { type: [String, Date], required: false },
  totalPredicted: { type: Number, required: false },
  totalObserved: { type: Number, required: false },
  speciesName: { type: String, required: false },
});

const ID_MEDIAN = inject("ID_MEDIAN");
const ID_LOWER = inject("ID_LOWER");
const ID_UPPER = inject("ID_UPPER");
const N_HOURS = inject("N_HOURS");

const plotDiv = ref(null);

async function createPlot() {
  const season = props.season;
  const date = props.date;

  if (!season?.doy || !plotDiv.value) {
    return;
  }

  await nextTick();

  // Extract data from season object
  const doy = season.doy;

  // Convert per-hour values to per-day totals by multiplying by N_HOURS
  const mean = season.mean.map((m) => m * N_HOURS);
  const lower = season.quantiles.map((q) => q[ID_LOWER] * N_HOURS);
  const upper = season.quantiles.map((q) => q[ID_UPPER] * N_HOURS);
  const median = season.quantiles.map((q) => q[ID_MEDIAN] * N_HOURS);
  const totalObs = season.count_observations
    ? season.count_observations.reduce((sum, count) => sum + count, 0)
    : 0;

  // Get today's DOY for vertical line
  const today = new Date(date);
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const todayDoy = Math.floor((today - startOfYear) / (1000 * 60 * 60 * 24));

  // Create month tick positions and labels (July to December)
  const monthTicks = [];
  const monthLabels = [];
  const months = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  for (let month = 7; month <= 12; month++) {
    const date = new Date(new Date().getFullYear(), month - 1, 1);
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((date - startOfYear) / (1000 * 60 * 60 * 24));
    monthTicks.push(dayOfYear);
    monthLabels.push(months[month - 7]);
  }

  // Create traces
  const traces = [];

  // Quantile fill
  traces.push({
    x: [...doy, ...doy.slice().reverse()],
    y: [...upper, ...lower.slice().reverse()],
    fill: "toself",
    fillcolor: "rgba(128, 128, 128, 0.3)",
    line: { color: "transparent" },
    name: t("plots.quantileRange"),
    hoverinfo: "skip",
    showlegend: true,
  });

  // Median line
  traces.push({
    x: doy,
    y: median,
    type: "scatter",
    mode: "lines",
    line: { color: "black", width: 2 },
    name: t("plots.median"),
    hovertemplate: `${t("plots.date")}: %{x}<br>${t("plots.median")}: %{y:.2f}<extra></extra>`,
  });

  // Today's vertical line
  const yRange = [...lower, ...upper];

  // Include predicted and observed values in range calculation
  if (props.totalPredicted != null) {
    yRange.push(props.totalPredicted);
  }
  if (props.totalObserved != null && props.totalObserved > 0) {
    yRange.push(props.totalObserved);
  }

  const minY = Math.min(...yRange);
  const maxY = Math.max(...yRange);

  traces.push({
    x: [todayDoy, todayDoy],
    y: [minY, maxY],
    type: "scatter",
    mode: "lines",
    line: { color: "red", width: 2, dash: "dot" },
    name: t("plots.today"),
    hovertemplate: t("plots.today") + "<extra></extra>",
  });

  // Add predicted total as blue dot
  if (props.totalPredicted != null && props.totalPredicted > 0) {
    traces.push({
      x: [todayDoy],
      y: [props.totalPredicted],
      type: "scatter",
      mode: "markers",
      marker: {
        color: "rgba(31, 119, 180, 0.8)", // Blue color matching forecast bars
        size: 12,
        symbol: "circle",
        line: { color: "rgba(31, 119, 180, 1)", width: 2 },
      },
      name: t("plots.predictedTotal"),
      hovertemplate: `${t("plots.predictedTotal")}: %{y:.1f}<extra></extra>`,
      showlegend: true,
    });
  }

  // Add observed total as red dot
  if (props.totalObserved != null && props.totalObserved > 0) {
    traces.push({
      x: [todayDoy],
      y: [props.totalObserved],
      type: "scatter",
      mode: "markers",
      marker: {
        color: "rgba(220, 53, 69, 0.8)", // Red color matching trektellen observations
        size: 12,
        symbol: "circle",
        line: { color: "rgba(220, 53, 69, 1)", width: 2 },
      },
      name: t("plots.observedTotal"),
      hovertemplate: `${t("plots.observedTotal")}: %{y:.1f}<extra></extra>`,
      showlegend: true,
    });
  }

  const layout = {
    title: props.speciesName
      ? `${t(`species.${props.speciesName}`, props.speciesName)} (n=${totalObs})`
      : `${t("plots.species")} (n=${totalObs})`,
    xaxis: {
      title: t("plots.date"),
      fixedrange: true,
      tickvals: monthTicks,
      ticktext: monthLabels,
    },
    yaxis: {
      title: t("plots.dailyCount"),
      fixedrange: true,
      range: [Math.max(0, minY * 0.9), maxY * 1.1], // Add some padding and ensure minimum of 0
    },
    margin: { t: 0, l: 40, r: 0, b: 20 },
    showlegend: true,
    legend: {
      x: 0.5,
      y: 1,
      xanchor: "center",
      yanchor: "top",
      bgcolor: "rgba(255, 255, 255, 0.8)",
      bordercolor: "rgba(0, 0, 0, 0.2)",
      borderwidth: 1,
      orientation: "h",
    },
    dragmode: false,
    autosize: true,
  };

  try {
    await Plotly.newPlot(plotDiv.value, traces, layout, {
      displayModeBar: false,
      scrollZoom: false,
      doubleClick: false,
      showTips: false,
      staticPlot: false,
      responsive: true,
    });
  } catch (error) {
    console.error("Error creating plot:", error);
  }
}

onMounted(createPlot);
watch(() => props.season, createPlot, { deep: true });
watch(() => props.totalPredicted, createPlot);
watch(() => props.totalObserved, createPlot);
watch(() => props.date, createPlot);
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
