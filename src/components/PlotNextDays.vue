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
  nextdays: { type: Object, required: true },
});

const plotDiv = ref(null);

async function createPlot() {
  const nextdays = props.nextdays;

  if (!plotDiv.value || !nextdays) {
    return;
  }

  await nextTick();

  // Clear existing plot
  Plotly.purge(plotDiv.value);

  const allTraces = [];

  const hoursPerDay = 24;
  const nDays = nextdays.median.length;

  // Add forecast trace only if available
  if (nextdays.forecast?.length > 0) {
    const predCount = nextdays.forecast.map((f) => f.predHourlyCount).flat();
    const date = nextdays.forecast.map((f) => f.date).flat();

    const nHours = predCount.length;

    // Create x-axis values for multiple days (starting from hour 0 of next day)
    const xValues = Array.from({ length: nHours }, (_, i) => i + 0.5);

    // Create custom data for hover with actual date and hour information
    const customData = [];
    for (let day = 0; day < nDays; day++) {
      const dateStr = new Date(nextdays.forecast[day].date).toLocaleDateString();
      for (let hour = 0; hour < hoursPerDay; hour++) {
        const hourLabel = `${hour}h-${hour + 1}h`;
        customData.push(`${dateStr}, ${hourLabel}`);
      }
    }

    const forecastTrace = {
      x: xValues,
      y: predCount,
      type: "bar",
      customdata: customData,
      hovertemplate: "%{customdata}<br>Count: %{y:.0f}<extra></extra>",
      width: 1,
      name: "Forecast",
    };
    allTraces.push(forecastTrace);
  }

  // Default values for horizontal lines
  const defaultLineTrace = {
    type: "scatter",
    mode: "lines",
  };

  // Add median line for each day

  for (let day = 0; day < nDays; day++) {
    const dayStart = day * hoursPerDay;
    const dayEnd = (day + 1) * hoursPerDay;

    allTraces.push({
      ...defaultLineTrace,
      x: [dayStart, dayEnd],
      y: [nextdays.median[day], nextdays.median[day]],
      line: { color: "red", width: 2, dash: "dash" },
      name: `Median (${nextdays.median[day].toFixed(1)})`,
      hovertemplate: "Historical Median: %{y:.0f}<extra></extra>",
      showlegend: day === 0, // Only show in legend once
    });

    allTraces.push({
      ...defaultLineTrace,
      x: [dayStart, dayEnd],
      y: [nextdays.q25[day], nextdays.q25[day]],
      line: { color: "orange", width: 1, dash: "dot" },
      name: `Q25 (${nextdays.q25[day].toFixed(1)})`,
      hovertemplate: "Q25: %{y:.0f}<extra></extra>",
    });

    allTraces.push({
      ...defaultLineTrace,
      x: [dayStart, dayEnd],
      y: [nextdays.q75[day], nextdays.q75[day]],

      line: { color: "orange", width: 1, dash: "dot" },
      name: `Q75 (${nextdays.q75[day].toFixed(1)})`,
      hovertemplate: "Q75: %{y:.0f}<extra></extra>",
      showlegend: day === 0,
    });
  }

  const layout = {
    xaxis: {
      title: "Time (Days and Hours)",
      tickvals: Array.from({ length: nDays }, (_, day) => day * hoursPerDay + hoursPerDay / 2),
      ticktext: Array.from({ length: nDays }, (_, day) => {
        const baseDate = new Date(nextdays.date);
        baseDate.setDate(baseDate.getDate() + day + 1);
        return baseDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });
      }),
      //range: [0, nHours],
      fixedrange: true,
      showgrid: true,
    },
    yaxis: {
      title: "Forecasted individual counts (#)",
      fixedrange: true,
    },
    margin: { t: 0, l: 20, r: 0, b: 20 },
    showlegend: false,
    dragmode: false,
    autosize: true,
    //height: 320,
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
    //console.log("Plot created successfully");
  } catch (error) {
    console.error("Error creating plot:", error);
  }
}

onMounted(createPlot);
watch(() => props.nextdays, createPlot, { deep: true });
</script>

<style scoped>
.plot-container {
  min-height: 320px;
}
</style>
