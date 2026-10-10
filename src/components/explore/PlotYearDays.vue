<template>
  <div>
    <div ref="plotDiv" class="plot-container"></div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../../utils/usePlot";
import { COLORS, alpha } from "../../theme.js";

const { t, locale } = useI18n();

const props = defineProps({
  // trend.days, columnar: {date, c, count, total, q10, q90}, every day of the model window
  days: { type: Object, required: true },
  year: { type: Number, required: true },
  // reliability class of the filled days (trend.days.total): show, caveat or hide
  totals: { type: String, default: "show" },
});

// As PlotAnnual: counted in rust, estimated in slate-blue (ochre under a caveat)
const C_COUNTED = alpha(COLORS.counted, 0.35);
const C_TOTAL = COLORS.predicted;
const C_CAVEAT = COLORS.ochre;
const PALE = 0.4; // a day nobody counted
// A day counted at all: some coverage, or birds counted below the model's minimum coverage
const isCounted = (d) => d.c > 0 || d.count > 0;

const rows = computed(() => {
  const { date, c, count, total, q10, q90 } = props.days;
  const y = String(props.year);
  const out = [];
  date.forEach((d, i) => {
    if (d.startsWith(y))
      out.push({ date: d, c: c[i], count: count[i], total: total[i], q10: q10[i], q90: q90[i] });
  });
  return out;
});

const plotDiv = ref(null);
const visible = usePlot(plotDiv);

function draw() {
  if (!visible.value || !plotDiv.value) return;
  const r = rows.value;
  const birds = t("explore.birds");
  const day = (iso) =>
    new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale.value, {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    });
  const counted = r.filter(isCounted);
  const traces = [
    {
      x: counted.map((d) => d.date),
      y: counted.map((d) => d.count),
      type: "bar",
      marker: { color: C_COUNTED },
      name: t("explore.many.counted"),
      customdata: counted.map((d) => [day(d.date), Math.round(d.c * 100)]),
      hovertemplate:
        `%{customdata[0]}: %{y:,.0f} ${birds}, %{customdata[1]}% ` +
        `${t("explore.many.dayCovered")}<extra>${t("explore.many.counted")}</extra>`,
    },
  ];
  if (props.totals !== "hide") {
    const color = props.totals === "caveat" ? C_CAVEAT : C_TOTAL;
    // days counted, and days nobody counted (estimated from the model alone), paler
    const part = (on, name, alpha) => {
      const d = r.filter((row) => isCounted(row) === on);
      return {
        x: d.map((row) => row.date),
        y: d.map((row) => row.total),
        mode: "markers",
        marker: { color, size: 5, opacity: alpha },
        error_y: {
          type: "data",
          symmetric: false,
          // the mean lies above q90 on days where a flock is rare but large: no bar above it
          array: d.map((row) => Math.max(row.q90 - row.total, 0)),
          arrayminus: d.map((row) => Math.max(row.total - row.q10, 0)),
          color,
          thickness: 1.5,
          width: 0,
        },
        opacity: alpha,
        name,
        customdata: d.map((row) => [day(row.date), row.q10, row.q90]),
        hovertemplate:
          `%{customdata[0]}: %{y:,.0f} ${birds} (%{customdata[1]:,.0f}–%{customdata[2]:,.0f})` +
          `<extra>${name}</extra>`,
      };
    };
    traces.push(
      part(true, `${t("explore.many.dayTotal")}, ${t("explore.many.interval80")}`, 1),
      part(false, t("explore.timing.estimated"), PALE),
    );
  }
  plotReact(
    plotDiv.value,
    traces,
    {
      barmode: "overlay",
      xaxis: { type: "date", fixedrange: true, tickformat: "%d %b" },
      yaxis: { title: t("explore.many.perDay"), fixedrange: true, rangemode: "tozero" },
      margin: { t: 10, l: 60, r: 10, b: 30 },
      legend: { orientation: "h", x: 0, y: -0.15 },
      hovermode: "closest",
      dragmode: false,
      autosize: true,
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, rows.value, props.totals, locale.value], draw);
</script>

<style scoped>
.plot-container {
  min-height: 260px;
}
</style>
