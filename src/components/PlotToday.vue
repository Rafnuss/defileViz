<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="text-muted mb-0">Today...</h6>
      <div class="d-flex gap-3">
        <span v-if="props.forecast">
          <span
            :style="{ color: predSignificance.color }"
            data-bs-toggle="tooltip"
            :data-bs-title="predSignificance.explanation"
          >
            {{ Math.round(totalPredicted) }} predicted
          </span>
        </span>
        <span
          v-if="props.trektellen && totalObserved > 0"
          :style="{ color: observedSignificance.color }"
          data-bs-toggle="tooltip"
          :data-bs-title="observedSignificance.explanation"
        >
          {{ totalObserved }} observed
        </span>
      </div>
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
  forecast: { type: Object, required: false },
  trektellen: { type: Object, required: false },
});

const plotDiv = ref(null);

async function createPlot() {
  const historical = props.historical;
  const forecast = props.forecast;
  const trektellen = props.trektellen;

  // Only require plotDiv and historical data
  if (!plotDiv.value || !historical) return;

  await nextTick();
  Plotly.purge(plotDiv.value);
  const allTraces = [];

  // Get number of hours from historical ratio data, fallback to forecast length or default 15
  const ratio = historical?.ratio;
  const predCount = forecast?.predHourlyCount;
  const nHours = ratio?.length || predCount?.length || 15;
  const xHours = Array.from({ length: nHours }, (_, i) => i + 6.5);

  // 1. HISTORICAL DATA FIRST (always available - base layer)

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

  // Helper to build a per-hour historical line using base * ratio[hour]
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

  // Median as a black line
  const medianTrace = makeHistoryLine(historical.median, "black", "solid", "Median");
  if (medianTrace) allTraces.push(medianTrace);

  // 2. FORECAST BARS (when available - middle layer)
  if (predCount && nHours) {
    const forecastTrace = {
      x: Array.from({ length: nHours }, (_, i) => i + 0.5),
      y: predCount,
      type: "bar",
      text: predCount.map((v) => v.toFixed(1)),
      textposition: "auto",
      customdata: Array.from({ length: nHours }, (_, i) => `${i}h-${i + 1}h`),
      hovertemplate: "%{customdata}<br>Forecast: %{y:.0f}<extra></extra>",
      width: 1,
      name: "Forecast",
      marker: { color: "rgba(31, 119, 180, 0.7)" }, // Blue color with transparency
    };
    allTraces.push(forecastTrace);
  }

  // 3. TREKTELLEN OBSERVATIONS (when available - top layer)
  if (trektellen?.observations) {
    const observations = trektellen.observations;

    // Group observations by hour and sum counts
    const hourlyTotals = {};
    observations.forEach((obs) => {
      const timeStr = obs.timestamp; // "17:47:00"
      const [hours] = timeStr.split(":").map(Number);
      const count = parseInt(obs.left, 10) || 0;

      if (count > 0) {
        hourlyTotals[hours] = (hourlyTotals[hours] || 0) + count;
      }
    });

    // Convert to array format for plotting
    const trektellenData = Object.entries(hourlyTotals)
      .map(([hour, totalCount]) => ({
        x: parseInt(hour) + 0.5, // Center of the hour (like forecast bars)
        y: totalCount,
        hour: parseInt(hour),
      }))
      .filter((point) => point.y > 0);

    if (trektellenData.length > 0) {
      const trektellenTrace = {
        x: trektellenData.map((d) => d.x),
        y: trektellenData.map((d) => d.y),
        type: "scatter",
        mode: "markers",
        marker: {
          color: "rgba(220, 53, 69, 0.8)", // Bootstrap danger red that complements blue
          size: 12,
          symbol: "circle",
          line: { color: "rgba(220, 53, 69, 1)", width: 2 },
        },
        name: "Trektellen Observations",
        customdata: trektellenData.map((d) => `${d.hour}h-${d.hour + 1}h`),
        hovertemplate: "%{customdata}<br>Observed: %{y} birds<extra></extra>",
      };
      allTraces.push(trektellenTrace);
    }
  }

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
      title: forecast ? "Forecasted individual counts (#)" : "Historical counts (#)",
      fixedrange: true,
      rangemode: "tozero",
    },
    margin: { t: 0, l: 20, r: 0, b: 20 },
    showlegend: false,
    dragmode: false,
    autosize: true,
    annotations: [],
  };
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

const totalObserved = computed(() => {
  if (!props.trektellen?.observations) return 0;
  return props.trektellen.observations.reduce((sum, obs) => {
    return sum + (parseInt(obs.left, 10) || 0);
  }, 0);
});

function getSignificance(value, historicalMedian, type = "predicted", quantile = null) {
  const diff = value - historicalMedian;
  let color = "black";
  let explanation = `Black: ${type} is less than 50% of historical.`;

  if (diff < 5) {
    color = "black";
    explanation = `Difference with historical is less than 5 birds.`;
  } else {
    // For predictions, use quantile if available, otherwise calculate ratio
    const ratio = quantile || (historicalMedian > 0 ? value / historicalMedian : 0);

    if (ratio > 0.9) {
      color = "red";
      explanation = `Red: ${type} is more than 90% of historical.`;
    } else if (ratio > 0.8) {
      color = "orange";
      explanation = `Orange: ${type} is more than 80% of historical.`;
    } else if (ratio >= 0.5) {
      color = "green";
      explanation = `Green: ${type} is more than 50% of historical.`;
    }
  }
  return { color, explanation };
}

const predSignificance = computed(() => {
  return getSignificance(
    totalPredicted.value,
    props.historical?.median ?? 0,
    "Predicted",
    props.forecast?.predTotalQuantile
  );
});

const observedSignificance = computed(() => {
  return getSignificance(totalObserved.value, props.historical?.median ?? 0, "Observed");
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
  () => [props.historical, props.forecast, props.trektellen],
  () => {
    // Create plot when we have historical data (with or without forecast)
    if (props.historical) {
      createPlot();
      nextTick(() => {
        const el = plotDiv.value?.parentElement?.querySelector('[data-bs-toggle="tooltip"]');
        if (el) new Tooltip(el);
      });
    }
  },
  { deep: true }
);
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
