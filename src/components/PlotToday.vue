<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="text-muted mb-0">Today...</h6>
      <span>
        <span
          :style="{ color: predSignificance.color }"
          data-bs-toggle="tooltip"
          :data-bs-title="predSignificance.explanation"
        >
          {{ Math.round(totalPredicted) }} predicted
        </span>
      </span>
    </div>

    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue";
import Plotly from "plotly.js-dist-min";
import { Tooltip } from "bootstrap";

const props = defineProps({
  historical: { type: Object, required: true },
  forecast: { type: Object, required: true },
});

const plotDiv = ref(null);

async function createPlot() {
  const historical = props.historical;
  const forecast = props.forecast;
  if (!plotDiv.value || !historical || !forecast) return;
  await nextTick();
  Plotly.purge(plotDiv.value);
  const allTraces = [];

  const predCount = forecast?.predHourlyCount;
  if (!predCount) return;

  const nHours = predCount.length;
  if (nHours) {
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

  // Helper to build a per-hour historical line using base * ratio[hour]
  const ratio = historical?.ratio;
  const xHours = Array.from({ length: nHours }, (_, i) => i + 6.5);

  function makeHistoryLine(base, color, dash, label) {
    if (base == null || Number.isNaN(base)) return null;
    const y = ratio.map((r) => (r == null ? 1 : r) * base);
    return {
      x: xHours,
      y,
      type: "scatter",
      mode: "lines",
      line: { color, width: 2, dash },
      name: `${label} (${Number(base).toFixed(1)})`,
      hovertemplate: `${label}: %{y:.1f}<extra></extra>`,
    };
  }
  const layout = {
    xaxis: {
      title: "Hour",
      tickvals: [0, 3, 6, 9, 12, 15, 18, 21],
      ticktext: ["0h", "3h", "6h", "9h", "12h", "15h", "18h", "21h"],
      range: [6, 18],
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
    annotations: [],
  };
  // Grey band between Q25 and Q75
  const y25 =
    historical?.q25 != null ? ratio.map((r) => (r == null ? 1 : r) * Number(historical.q25)) : null;
  const y75 =
    historical?.q75 != null ? ratio.map((r) => (r == null ? 1 : r) * Number(historical.q75)) : null;
  if (y25 && y75) {
    // Lower bound (invisible) to anchor the fill
    allTraces.push({
      x: xHours,
      y: y25,
      type: "scatter",
      mode: "lines",
      line: { width: 0 },
      hoverinfo: "skip",
      showlegend: false,
    });
    // Upper bound with fill to previous
    allTraces.push({
      x: xHours,
      y: y75,
      type: "scatter",
      mode: "lines",
      line: { width: 0 },
      fill: "tonexty",
      fillcolor: "rgba(128,128,128,0.25)",
      hoverinfo: "skip",
      name: "Q25–Q75",
      showlegend: false,
    });
  }
  // Median as a black line
  const medianTrace = makeHistoryLine(historical.median, "black", "solid", "Median");
  if (medianTrace) allTraces.push(medianTrace);
  try {
    await Plotly.newPlot(plotDiv.value, allTraces, layout, {
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

const totalPredicted = computed(() => {
  const f = props.forecast;
  if (!f) return 0;
  if (typeof f.predTotal === "number") return f.predTotal;
  const arr = Array.isArray(f?.predHourlyCount) ? f.predHourlyCount : Array.isArray(f) ? f : [];
  return arr.reduce((s, v) => s + (Number(v) || 0), 0);
});

const totalHistoricalMedian = computed(() => props.historical?.median ?? 0);

const predSignificance = computed(() => {
  const diff = totalPredicted.value - (props.historical?.median ?? 0);
  let color = "black";
  let explanation = "Black: Predicted is less than 50% of historical.";
  if (diff < 5) {
    color = "black";
    explanation = "Difference with historical is less than 5 birds.";
  } else {
    const ratio = props.forecast?.predTotalQuantile || 0;
    if (ratio > 0.9) {
      color = "red";
      explanation = "Red: Predicted is more than 90% of historical.";
    } else if (ratio > 0.8) {
      color = "orange";
      explanation = "Orange: Predicted is more than 80% of historical.";
    } else if (ratio >= 0.5) {
      color = "green";
      explanation = "Green: Predicted is more than 50% of historical.";
    }
  }
  return { color, explanation };
});

onMounted(() => {
  createPlot();
  nextTick(() => {
    const el = plotDiv.value?.parentElement?.querySelector('[data-bs-toggle="tooltip"]');
    if (el) {
      new Tooltip(el);
    }
  });
});

watch(
  () => [props.historical, props.forecast],
  () => {
    createPlot();
    nextTick(() => {
      const el = plotDiv.value?.parentElement?.querySelector('[data-bs-toggle="tooltip"]');
      if (el) new Tooltip(el);
    });
  },
  { deep: true }
);
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
