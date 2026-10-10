<template>
  <div ref="rootEl">
    <div class="d-flex justify-content-between align-items-center mb-2">
      <h4 class="plot-label">{{ $t("plots.today") }}</h4>
      <div class="d-flex gap-2 small tnum">
        <span v-if="props.forecast">
          <span
            :style="{ color: predSignificance.color }"
            data-bs-toggle="tooltip"
            :data-bs-title="predSignificance.explanation"
          >
            {{
              props.forecast.predTotal >= 1
                ? Math.round(props.forecast.predTotal)
                : props.forecast.predTotal.toFixed(1)
            }}
            {{ $t("table.predicted").toLowerCase() }}
          </span>
        </span>
        <span v-if="props.forecast && props.trektellen?.count > 0" class="text-muted">/</span>
        <span
          v-if="props.trektellen && props.trektellen.count > 0"
          :style="{ color: observedSignificance.color }"
          data-bs-toggle="tooltip"
          :data-bs-title="observedSignificance.explanation"
        >
          {{ props.trektellen.count }} {{ $t("table.counted").toLowerCase() }}
        </span>
      </div>
    </div>

    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, nextTick, computed, inject } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../utils/usePlot";
import { COLORS, alpha } from "../theme.js";
import { Tooltip } from "bootstrap";
import { createHistoricalLineTrace, ratioInWindow } from "../utils/stats";
import { localUtcOffset } from "../utils/daylight";

const { t } = useI18n();

const props = defineProps({
  historical: { type: Object, required: true },
  forecast: { type: Object, required: false },
  trektellen: { type: Object, required: false },
  date: { type: [String, Date], required: true },
});

const ID_LOWER = inject("ID_LOWER");
const ID_UPPER = inject("ID_UPPER");

const plotDiv = ref(null);
const rootEl = ref(null);
const visible = usePlot(plotDiv);

async function createPlot() {
  const historical = props.historical;
  const forecast = props.forecast;
  const trektellen = props.trektellen;

  // Only require plotDiv and historical data
  if (!plotDiv.value || !visible.value || !historical) return;

  await nextTick();
  const allTraces = [];

  // x is the UTC hour (as in the forecast NetCDF); ticks and hover labels show local time.
  // The window is the day's non-night hours, where the forecast model can predict birds.
  const window = historical.window;
  const offset = localUtcOffset(props.date);
  const localHour = (utcHour) => (((utcHour + offset) % 24) + 24) % 24;
  const hourLabel = (utcHour) => `${localHour(utcHour)}h-${localHour(utcHour + 1)}h`;

  // Historical hourly profile, drawn over non-night hours only
  const { hours: ratioHours, ratio } = ratioInWindow(historical?.ratio, window);
  const xHours = ratioHours.map((h) => h + 0.5);
  const predCount = forecast?.predHourlyCount;

  // 1. HISTORICAL DATA FIRST (always available - base layer)

  // Grey band between lower and upper
  if (historical?.quantiles != null && ID_LOWER != null && ID_UPPER != null) {
    // Create smooth lower and upper bounds
    const lowerTrace = createHistoricalLineTrace(
      xHours,
      ratio,
      historical.quantiles[ID_LOWER],
      "transparent",
      "solid",
      "",
      true,
    );
    const upperTrace = createHistoricalLineTrace(
      xHours,
      ratio,
      historical.quantiles[ID_UPPER],
      "transparent",
      "solid",
      "",
      true,
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
        fillcolor: alpha(COLORS.historyInner, 0.45),
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
    COLORS.median,
    "solid",
    t("plots.median"),
    true,
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
      textfont: { size: 10 },
      customdata: Array.from({ length: predCount.length }, (_, i) => hourLabel(i)),
      hovertemplate: `%{customdata}<br>${t("plots.forecast")}: %{y:.0f}<extra></extra>`,
      width: 1,
      name: t("plots.forecast"),
      marker: { color: alpha(COLORS.predicted, 0.8) },
    };
    allTraces.push(forecastTrace);
  }

  // 3. TREKTELLEN OBSERVATIONS (when available - top layer)
  if (trektellen?.observations) {
    const observations = trektellen.observations;

    // Group observations by UTC hour and sum counts. Trektellen timestamps are local time.
    const hourlyTotals = {};
    observations.forEach((obs) => {
      const timeStr = obs.timestamp; // "17:47:00", Europe/Paris
      const [localHours] = timeStr.split(":").map(Number);
      const hours = localHours - offset;
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
          color: COLORS.counted,
          size: 11,
          symbol: "circle",
          line: { color: COLORS.surface, width: 1.5 },
        },
        name: t("plots.trektellenObservations"),
        customdata: trektellenData.map((d) => hourLabel(d.hour)),
        hovertemplate: `%{customdata}<br>${t("table.counted")}: %{y} ${t(
          "plots.birds",
        )}<extra></extra>`,
      };
      allTraces.push(trektellenTrace);
    }
  }

  // Ticks on even local hours across the non-night window
  const tickvals = [];
  for (let h = window.first; h <= window.last + 1; h++) {
    if (localHour(h) % 2 === 0) tickvals.push(h);
  }

  const layout = {
    xaxis: {
      title: t("plots.hour"),
      tickvals,
      ticktext: tickvals.map((h) => `${localHour(h)}h`),
      // First to last non-night hour, plus half an hour either side
      range: [window.first - 0.5, window.last + 1.5],
      fixedrange: true,
    },
    yaxis: {
      title: forecast ? t("plots.forecastedCounts") : t("plots.historicalCounts"),
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
    await plotReact(plotDiv.value, allTraces, layout, {
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
  let color;
  let explanation;

  const percentile = Math.round(quantile);

  if (quantile >= 90) {
    color = COLORS.red;
    explanation = t("significance.exceptional", { p: percentile });
  } else if (quantile >= 80) {
    color = COLORS.ochre;
    explanation = t("significance.notable", { p: percentile });
  } else if (quantile >= 50) {
    color = COLORS.sage;
    explanation = t("significance.above", { p: percentile });
  } else {
    color = COLORS.ink;
    explanation = t("significance.below", { p: percentile });
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
    // Only this component's tooltips: each species card has its own instance
    if (!rootEl.value) return;
    const tooltipElements = rootEl.value.querySelectorAll('[data-bs-toggle="tooltip"]');
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

onMounted(initializeTooltips);
onBeforeUnmount(() => {
  rootEl.value
    ?.querySelectorAll('[data-bs-toggle="tooltip"]')
    .forEach((el) => Tooltip.getInstance(el)?.dispose());
});

// Each load creates new prop objects, so a shallow watch is enough
watch(visible, createPlot);
watch(
  () => [props.historical, props.forecast, props.trektellen],
  () => {
    createPlot();
    initializeTooltips();
  },
);
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
