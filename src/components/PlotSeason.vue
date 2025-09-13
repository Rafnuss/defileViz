<template>
  <div>
    <h6 class="text-muted mb-2">This season...</h6>
    <div v-if="season?.doy">
      <div ref="plotDiv" class="plot-container"></div>
    </div>
    <div v-else>
      <p>No forecast data available</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Plotly from "plotly.js-dist-min";

const props = defineProps({
  season: { type: Object, required: true },
});

const plotDiv = ref(null);

async function createPlot() {
  const season = props.season;

  if (!season?.doy || !plotDiv.value) {
    return;
  }

  await nextTick();

  // Extract data from season object
  const doy = season.doy;
  const median = season.median;
  const mean = season.mean;
  const q25 = season.q25;
  const q75 = season.q75;
  const totalObs = season.count_observations
    ? season.count_observations.reduce((sum, count) => sum + count, 0)
    : 0;

  // Get today's DOY for vertical line
  const today = new Date();
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

  // Quantile fill (25-75%)
  traces.push({
    x: [...doy, ...doy.slice().reverse()],
    y: [...q75, ...q25.slice().reverse()],
    fill: "toself",
    fillcolor: "rgba(128, 128, 128, 0.3)",
    line: { color: "transparent" },
    name: "25-75% Quantile",
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
    name: "Median",
    hovertemplate: "DOY: %{x}<br>Median: %{y:.2f}<extra></extra>",
  });

  // Mean line (dashed)
  traces.push({
    x: doy,
    y: mean,
    type: "scatter",
    mode: "lines",
    line: { color: "black", width: 2, dash: "dash" },
    name: "Mean",
    hovertemplate: "DOY: %{x}<br>Mean: %{y:.2f}<extra></extra>",
  });

  // Today's vertical line
  const yRange = [...q25, ...q75, ...median, ...mean];
  const minY = Math.min(...yRange);
  const maxY = Math.max(...yRange);

  traces.push({
    x: [todayDoy, todayDoy],
    y: [minY, maxY],
    type: "scatter",
    mode: "lines",
    line: { color: "red", width: 2, dash: "dot" },
    name: "Today",
    hovertemplate: "Today<extra></extra>",
  });

  const layout = {
    title: `Species (n=${totalObs})`,
    xaxis: {
      title: "Date",
      fixedrange: true,
      tickvals: monthTicks,
      ticktext: monthLabels,
    },
    yaxis: {
      title: "Count Rate",
      fixedrange: true,
    },
    margin: { t: 0, l: 20, r: 0, b: 20 },
    showlegend: false,
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
    //console.log("Plot created successfully");
  } catch (error) {
    console.error("Error creating plot:", error);
  }
}

onMounted(createPlot);
watch(() => props.season, createPlot, { deep: true });
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
