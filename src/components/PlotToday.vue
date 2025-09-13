<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="text-muted mb-0">Today...</h6>
      {{ totalPredictedCount }} predicted
    </div>
    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue";
import Plotly from "plotly.js-dist-min";

const props = defineProps({
  today: { type: Object, required: true },
});

const plotDiv = ref(null);

async function createPlot() {
  const today = props.today;

  if (!plotDiv.value || !today) {
    return;
  }

  await nextTick();

  // Clear existing plot
  Plotly.purge(plotDiv.value);

  const allTraces = [];

  // Add forecast trace only if available
  if (today.forecast?.predHourlyCount) {
    const predCount = today.forecast.predHourlyCount;
    const nHours = predCount.length;

    const forecastTrace = {
      x: Array.from({ length: nHours }, (_, i) => i + 0.5),
      y: predCount,
      type: "bar",
      text: predCount.map((v) => v.toFixed(1)),
      textposition: "auto",
      customdata: Array.from({ length: nHours }, (_, i) => `${i}h-${i + 1}h`),
      hovertemplate: "%{customdata}<br>Count: %{y:.0f}<extra></extra>",
      width: 1,
      name: "Forecast",
    };
    allTraces.push(forecastTrace);
  }

  // Default values for horizontal lines
  const defaultLineTrace = {
    x: [6, 21],
    type: "scatter",
    mode: "lines",
  };

  const medianTrace = {
    ...defaultLineTrace,
    y: [today.median, today.median],
    line: { color: "red", width: 2, dash: "dash" },
    name: `Historical Median (${today.median.toFixed(1)})`,
    hovertemplate: "Historical Median: %{y:.0f}<extra></extra>",
  };

  const q25Trace = {
    ...defaultLineTrace,
    y: [today.q25, today.q25],
    line: { color: "orange", width: 1, dash: "dot" },
    name: `Q25 (${today.q25.toFixed(1)})`,
    hovertemplate: "Q25: %{y:.0f}<extra></extra>",
  };

  const q75Trace = {
    ...defaultLineTrace,
    y: [today.q75, today.q75],
    line: { color: "orange", width: 1, dash: "dot" },
    name: `Q75 (${today.q75.toFixed(1)})`,
    hovertemplate: "Q75: %{y:.0f}<extra></extra>",
  };

  const layout = {
    //title: { text: dateStr, font: { size: 16 } },
    xaxis: {
      title: "Hour",
      tickvals: [0, 3, 6, 9, 12, 15, 18, 21],
      ticktext: ["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"],
      range: [6, 21],
      fixedrange: true,
    },
    yaxis: {
      title: "Forecasted individual counts (#)",
      fixedrange: true,
      rangemode: "tozero",
    },
    margin: { t: 0, l: 20, r: 0, b: 20 },
    showlegend: false,
    dragmode: false,
    autosize: true,
    //height: 320,
  };

  // Add historical traces
  allTraces.push(medianTrace, q25Trace, q75Trace);

  try {
    await Plotly.newPlot(plotDiv.value, allTraces, layout, {
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

// Computed property to calculate total predicted count for the day
const totalPredictedCount = computed(() => {
  if (!props.today?.forecast?.predHourlyCount) {
    return 0;
  }
  const total = props.today.forecast.predHourlyCount.reduce((sum, count) => sum + count, 0);
  console.log(total);
  return Math.round(total);
});

onMounted(createPlot);
watch(() => props.today, createPlot, { deep: true });
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
