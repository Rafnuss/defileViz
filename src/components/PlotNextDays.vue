<template>
  <div>
    <h6 class="text-muted mb-2">Next days...</h6>
    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick, inject } from "vue";
import Plotly from "plotly.js-dist-min";
import { createHistoricalLineTrace } from "../utils/stats";

const props = defineProps({
  historical: { type: Array, required: true },
  forecast: { type: Array, required: true },
  date: { type: Array, required: true },
});

const ID_MEDIAN = inject("ID_MEDIAN");
const ID_LOWER = inject("ID_LOWER");
const ID_UPPER = inject("ID_UPPER");

const plotDiv = ref(null);

async function createPlot() {
  const historical = props.historical;
  const forecast = props.forecast;
  const date = props.date;

  if (!plotDiv.value || !historical || !forecast || !date) return;

  const nDays = date.length;

  // Infer hours per day from the first day that has predHourlyCount
  const hoursPerDay =
    forecast.find((d) => Array.isArray(d?.predHourlyCount) && d.predHourlyCount.length)
      ?.predHourlyCount.length || 1;

  await nextTick();
  Plotly.purge(plotDiv.value);

  const traces = [];

  // Forecast bars (flatten all days sequentially)
  if (forecast.length) {
    const y = [];
    const x = [];
    const custom = [];

    for (let d = 0; d < nDays; d++) {
      const dayArr = forecast[d]?.predHourlyCount || [];

      const dayStart = d * hoursPerDay;
      for (let h = 1; h < dayArr.length; h++) {
        // Place each bar at the center of its hour bucket within the day
        x.push(dayStart + h + 0.5);
        y.push(dayArr[h]);
        const dateObj = date[d] ? new Date(date[d]) : null;
        const dateLabel = dateObj
          ? dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })
          : `Day ${d + 1}`;
        custom.push(`${dateLabel}, hour ${h}`);
      }
    }

    traces.push({
      x,
      y,
      type: "bar",
      name: "Forecast",
      customdata: custom,
      hovertemplate: "%{customdata}<br>Count: %{y:.0f}<extra></extra>",
      marker: { color: "#4e79a7" },
    });
  }

  // Historical per-day grey band (Q25–Q75) and black median line, modulated by per-hour ratio
  for (let d = 0; d < nDays; d++) {
    const dayStart = d * hoursPerDay;
    const dayLen = hoursPerDay;
    const xDay = Array.from({ length: dayLen }, (_, h) => dayStart + 6 + h + 0.5);
    const hist = historical?.[d] || {};
    const ratio = Array.isArray(hist?.ratio) ? hist.ratio.slice(0, dayLen) : Array(dayLen).fill(1);

    // Grey band Q25–Q75 if available (using smooth traces)
    if (hist?.quantiles != null) {
      const lowerTrace = createHistoricalLineTrace(
        xDay,
        ratio,
        hist.quantiles[ID_LOWER],
        "transparent",
        "solid",
        "",
        true
      );
      const upperTrace = createHistoricalLineTrace(
        xDay,
        ratio,
        hist.quantiles[ID_UPPER],
        "transparent",
        "solid",
        "",
        true
      );

      if (lowerTrace && upperTrace) {
        traces.push({
          ...lowerTrace,
          line: { ...lowerTrace.line, width: 0 },
          hoverinfo: "skip",
          showlegend: false,
          name: undefined,
          hovertemplate: undefined,
        });
        traces.push({
          ...upperTrace,
          line: { ...upperTrace.line, width: 0 },
          fill: "tonexty",
          fillcolor: "rgba(128,128,128,0.25)",
          hoverinfo: "skip",
          name: d === 0 ? "Q20–Q80" : undefined,
          showlegend: false,
          hovertemplate: undefined,
        });
      }
    }

    // Median line if available (using smooth trace)
    if (hist?.median != null) {
      const medianTrace = createHistoricalLineTrace(
        xDay,
        ratio,
        hist.median,
        "black",
        "solid",
        "Median",
        true
      );

      if (medianTrace) {
        traces.push({
          ...medianTrace,
          name: d === 0 ? `Median (${Number(hist.median).toFixed(1)})` : undefined,
          showlegend: false,
        });
      }
    }
  }

  // X-axis tick labels: one per day centered
  const tickvals = Array.from({ length: nDays }, (_, d) => d * hoursPerDay + hoursPerDay / 2);
  const ticktext = Array.from({ length: nDays }, (_, d) => {
    const dateObj = date[d] ? new Date(date[d]) : null;
    return dateObj
      ? dateObj.toLocaleDateString(undefined, { month: "short", day: "numeric" })
      : `D${d + 1}`;
  });

  const layout = {
    xaxis: {
      title: "Future Days (hourly sequence)",
      tickvals,
      ticktext,
      fixedrange: true,
      showgrid: true,
    },
    yaxis: {
      title: "Hourly forecast count",
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
  } catch (e) {
    console.error("Error creating next-days plot:", e);
  }
}

onMounted(createPlot);
watch(
  () => [props.historical, props.forecast, props.date],
  () => createPlot(),
  { deep: true }
);
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
