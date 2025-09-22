<template>
  <div>
    <h6 class="text-muted mb-2">Next days...</h6>
    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, nextTick } from "vue";
import Plotly from "plotly.js-dist-min";

const props = defineProps({
  historical: { type: Array, required: true },
  forecast: { type: Array, required: true },
  date: { type: Array, required: true },
});

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

    // Grey band Q25–Q75 if available
    if (hist?.q25 != null && hist?.q75 != null) {
      const y25 = ratio.map((r) => (r == null ? 1 : r) * Number(hist.q25));
      const y75 = ratio.map((r) => (r == null ? 1 : r) * Number(hist.q75));
      traces.push({
        x: xDay,
        y: y25,
        type: "scatter",
        mode: "lines",
        line: { width: 0 },
        hoverinfo: "skip",
        showlegend: false,
      });
      traces.push({
        x: xDay,
        y: y75,
        type: "scatter",
        mode: "lines",
        line: { width: 0 },
        fill: "tonexty",
        fillcolor: "rgba(128,128,128,0.25)",
        hoverinfo: "skip",
        name: d === 0 ? "Q25–Q75" : undefined,
        showlegend: false,
      });
    }

    // Median line if available
    if (hist?.median != null) {
      const yMed = ratio.map((r) => (r == null ? 1 : r) * Number(hist.median));
      traces.push({
        x: xDay,
        y: yMed,
        type: "scatter",
        mode: "lines",
        line: { color: "black", width: 2 },
        name: d === 0 ? `Median (${Number(hist.median).toFixed(1)})` : undefined,
        hovertemplate: "Median: %{y:.1f}<extra></extra>",
        showlegend: false,
      });
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
