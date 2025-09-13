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
          {{ Math.round(today.totalPredicted) }} predicted
        </span>
      </span>
    </div>

    <p>
      Today's prediction corresponds to the {{ Math.round(today.totalQuantile * 100) }}th
      percentile, which represents a {{ Math.round(today.totalFold * 10) / 10 }}-fold change
      relative to the median value of {{ Math.round(today.totalMedian) }}.
    </p>
    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed } from "vue";
import Plotly from "plotly.js-dist-min";
import { Tooltip } from "bootstrap";

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
  Plotly.purge(plotDiv.value);
  const allTraces = [];
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
  const defaultLineTrace = {
    x: [6, 21],
    type: "scatter",
    mode: "lines",
  };
  const medianTrace = {
    ...defaultLineTrace,
    y: [today.median, today.median],
    line: { color: "red", width: 2, dash: "dash" },
    name: `Historical Median (${today.median?.toFixed(1)})`,
    hovertemplate: "Historical Median: %{y:.0f}<extra></extra>",
  };
  const q25Trace = {
    ...defaultLineTrace,
    y: [today.q25, today.q25],
    line: { color: "orange", width: 1, dash: "dot" },
    name: `Q25 (${today.q25?.toFixed(1)})`,
    hovertemplate: "Q25: %{y:.0f}<extra></extra>",
  };
  const q75Trace = {
    ...defaultLineTrace,
    y: [today.q75, today.q75],
    line: { color: "orange", width: 1, dash: "dot" },
    name: `Q75 (${today.q75?.toFixed(1)})`,
    hovertemplate: "Q75: %{y:.0f}<extra></extra>",
  };
  const layout = {
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
  };
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
  } catch (error) {
    console.error("Error creating plot:", error);
  }
}

const predSignificance = computed(() => {
  const absDiff = Math.abs(props.today?.totalPredicted - props.today?.totalMedian);
  let color = "black";
  let explanation = "Black: Predicted is less than 50% of historical.";
  if (absDiff < 5) {
    color = "black";
    explanation = "Difference with historical is less than 5 birds.";
  } else {
    const ratio = props.today?.totalQuantile || 0;
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
  () => props.today,
  () => {
    createPlot();
    nextTick(() => {
      const el = plotDiv.value?.parentElement?.querySelector('[data-bs-toggle="tooltip"]');
      if (el) {
        new Tooltip(el);
      }
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
