<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h6 class="text-muted mb-0">Today...</h6>
      <div class="d-flex gap-2">
        <span v-if="props.forecast">
          <span
            :style="{ color: predSignificance.color }"
            data-bs-toggle="tooltip"
            data-bs-html="true"
            :data-bs-title="predSignificance.explanation"
          >
            {{
              props.forecast.predTotal >= 1
                ? Math.round(props.forecast.predTotal)
                : props.forecast.predTotal.toFixed(1)
            }}
            predicted
          </span>
        </span>
        /
        <span
          v-if="props.trektellen && props.trektellen.count > 0"
          :style="{ color: observedSignificance.color }"
          data-bs-toggle="tooltip"
          data-bs-html="true"
          :data-bs-title="observedSignificance.explanation"
        >
          {{ props.trektellen.count }} observed
        </span>
      </div>
    </div>

    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, computed, inject } from "vue";
import Plotly from "plotly.js-dist-min";
import { Tooltip } from "bootstrap";
import { createHistoricalLineTrace } from "../utils/stats";

const props = defineProps({
  historical: { type: Object, required: true },
  forecast: { type: Object, required: false },
  trektellen: { type: Object, required: false },
});

const ID_MEDIAN = inject("ID_MEDIAN");
const ID_LOWER = inject("ID_LOWER");
const ID_UPPER = inject("ID_UPPER");

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

  // Grey band between lower and upper
  const lower =
    historical?.quantiles != null
      ? ratio.map((r) => (r == null ? 1 : r) * historical.quantiles[ID_LOWER])
      : null;
  const upper =
    historical?.quantiles != null
      ? ratio.map((r) => (r == null ? 1 : r) * historical.quantiles[ID_UPPER])
      : null;
  if (historical?.quantiles != null && ID_LOWER != null && ID_UPPER != null) {
    // Create smooth lower and upper bounds
    const lowerTrace = createHistoricalLineTrace(
      xHours,
      ratio,
      historical.quantiles[ID_LOWER],
      "transparent",
      "solid",
      "",
      true
    );
    const upperTrace = createHistoricalLineTrace(
      xHours,
      ratio,
      historical.quantiles[ID_UPPER],
      "transparent",
      "solid",
      "",
      true
    );

    if (lowerTrace && upperTrace) {
      // Lower bound (invisible) to anchor the fill
      allTraces.push({
        ...lowerTrace,
        line: { ...lowerTrace.line, width: 0 },
        hoverinfo: "skip",
        showlegend: false,
        name: undefined,
        hovertemplate: undefined,
      });

      // Upper bound with fill to previous
      allTraces.push({
        ...upperTrace,
        line: { ...upperTrace.line, width: 0 },
        fill: "tonexty",
        fillcolor: "rgba(128,128,128,0.25)",
        hoverinfo: "skip",
        name: "lower–upper",
        showlegend: false,
        hovertemplate: undefined,
      });
    }
  }

  // Median as a smooth black line
  const medianTrace = createHistoricalLineTrace(
    xHours,
    ratio,
    historical.median,
    "black",
    "solid",
    "Median",
    true
  );
  if (medianTrace) allTraces.push(medianTrace);

  // 2. FORECAST BARS (when available - middle layer)
  if (predCount) {
    const forecastTrace = {
      x: Array.from({ length: predCount.length }, (_, i) => i + 0.5),
      y: predCount,
      type: "bar",
      text: predCount.map((v) => v.toFixed(1)),
      textposition: "auto",
      customdata: Array.from({ length: predCount.length }, (_, i) => `${i}h-${i + 1}h`),
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

function getSignificance(quantile) {
  let color = "black";
  let explanation = "";

  const percentile = Math.round(quantile);

  if (quantile >= 0.9) {
    color = "red";
    explanation = `Exceptionally high compared to historical years (${percentile}<sup>th</sup> percentile).`;
  } else if (quantile >= 0.8) {
    color = "orange";
    explanation = `Notably high compared to historical years (${percentile}<sup>th</sup> percentile).`;
  } else if (quantile >= 0.5) {
    color = "green";
    explanation = `Above average compared to historical years (${percentile}<sup>th</sup> percentile).`;
  } else {
    color = "black";
    explanation = `Below average compared to historical years (${percentile}<sup>th</sup> percentile).`;
  }

  return { color, explanation };
}

const predSignificance = computed(() => {
  return getSignificance(props.forecast?.predTotalQuantile);
});

const observedSignificance = computed(() => {
  return getSignificance(props.trektellen?.totalQuantile);
});

function initializeTooltips() {
  nextTick(() => {
    // Initialize all tooltips in the component
    const tooltipElements = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipElements.forEach((el) => {
      // Dispose existing tooltip if any
      const existingTooltip = Tooltip.getInstance(el);
      if (existingTooltip) {
        existingTooltip.dispose();
      }
      // Create new tooltip
      new Tooltip(el);
    });
  });
}

onMounted(() => {
  createPlot();
  initializeTooltips();
});

watch(
  () => [props.historical, props.forecast, props.trektellen],
  () => {
    // Create plot when we have historical data (with or without forecast)
    if (props.historical) {
      createPlot();
      initializeTooltips();
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
