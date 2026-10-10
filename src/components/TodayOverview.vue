<template>
  <div class="section-head mt-0">
    <h2>{{ $t("table.title") }}</h2>
    <button
      type="button"
      class="btn btn-link p-0 info-btn lh-1"
      :class="{ open: showHelp }"
      :aria-expanded="showHelp"
      aria-controls="overview-help"
      :title="$t('table.explanation.title')"
      :aria-label="$t('table.explanation.title')"
      @click="showHelp = !showHelp"
    >
      <i class="bi bi-info-circle"></i>
    </button>
    <div class="btn-group btn-group-sm ms-auto" role="group">
      <button
        v-for="m in ['number', 'quantile']"
        :key="m"
        type="button"
        class="btn"
        :class="mode === m ? 'btn-secondary' : 'btn-outline-secondary'"
        @click="mode = m"
      >
        {{ $t(m === "number" ? "table.modeNumber" : "table.modeQuantile") }}
      </button>
    </div>
  </div>
  <div class="overview mb-4">
    <div class="overview-legend">
      <span class="swatch predicted"></span>{{ $t("table.predicted") }}
      <span class="swatch counted ms-3"></span>{{ $t("table.counted") }}
      <span class="swatch band ms-3"></span>{{ $t("table.distribution") }}
    </div>
    <ul v-if="showHelp" id="overview-help" class="overview-help">
      <li v-for="k in HELP" :key="k">{{ $t(`table.explanation.${k}`) }}</li>
    </ul>
    <div v-for="row in enrichedspecies" :key="row.species" class="overview-row">
      <a :href="`#${row.species}`" class="species-link">
        <img
          :src="`/defileViz/species_icon/${row.species.toLowerCase().replace(/\s+/g, '_')}.svg`"
          :alt="row.species + ' icon'"
          @error="$event.target.style.display = 'none'"
        />
        {{ t(`species.${row.species}`, row.species) }}
      </a>
      <div v-if="row.bar" class="range-bar">
        <div class="band outer" :style="span(row.bar.outer)"></div>
        <div class="band inner" :style="span(row.bar.inner)"></div>
        <div
          class="median"
          :style="{ left: row.bar.median + '%' }"
          tabindex="0"
          :data-tip="`${t('table.historical')}: ${fmt(row.totalMedian)}`"
        ></div>
        <div
          v-if="row.bar.counted != null"
          class="marker counted"
          :style="{ left: row.bar.counted + '%' }"
          tabindex="0"
          :data-tip="`${t('table.counted')}: ${describe(row.trektellenCount, row.trektellenQuantile)}`"
        ></div>
        <div
          v-if="row.bar.predicted != null"
          class="marker predicted"
          :style="{ left: row.bar.predicted + '%' }"
          tabindex="0"
          :data-tip="`${t('table.predicted')}: ${describe(row.totalPredicted, row.totalQuantile)}`"
        ></div>
      </div>
      <span v-else class="text-muted">-</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { rangeBar } from "../utils/rangeBar.js";

const { t } = useI18n();

const props = defineProps({
  species: { type: Array, required: true },
});
const showHelp = ref(false);
const mode = ref("number"); // "number" (log axis) or "quantile"

const HELP = ["predicted", "counted", "distribution", "mode", "values"];

const enrichedspecies = computed(() =>
  props.species.map((r) => {
    const forecast = r.forecast;
    // Determine hourly counts array
    const hourly = Array.isArray(forecast)
      ? forecast
      : Array.isArray(forecast?.predHourlyCount)
        ? forecast.predHourlyCount
        : [];
    // Totals / derived values
    // null (shown as "-") when there is no forecast for the day, not a misleading 0
    const totalPredicted =
      forecast && forecast.predTotal !== undefined
        ? forecast.predTotal
        : hourly.length
          ? hourly.reduce((s, v) => s + (v || 0), 0)
          : null;
    // Historical median is birds/h: scale by the day's non-night hours
    const totalMedian =
      r.historical?.median != null ? r.historical.median * r.historical.window.nHours : undefined;
    const totalQuantile =
      forecast && forecast.predTotalQuantile !== undefined ? forecast.predTotalQuantile : undefined;
    const trektellenCount = r.trektellen?.count ?? null;
    const trektellenQuantile = trektellenCount != null ? r.trektellen.totalQuantile : null;
    // historical is birds/h: scale by the day's non-night hours to get daily totals
    const nHours = r.historical?.window?.nHours;
    const bar =
      r.historical?.quantiles && nHours
        ? rangeBar({
            mode: mode.value,
            quantiles: r.historical.quantiles.map((q) => q * nHours),
            levels: QUANTILE_LEVELS,
            predicted: forecast ? totalPredicted : null,
            predictedQuantile: totalQuantile,
            counted: trektellenCount,
            countedQuantile: trektellenQuantile,
          })
        : null;
    return {
      ...r,
      totalPredicted,
      totalMedian,
      totalQuantile,
      trektellenCount,
      trektellenQuantile,
      bar,
    };
  }),
);

const QUANTILE_LEVELS = [1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99];

function ordinal(n) {
  const k = Math.round(n);
  const mod = k % 100;
  if (mod >= 11 && mod <= 13) return `${k}th`;
  return `${k}${{ 1: "st", 2: "nd", 3: "rd" }[k % 10] ?? "th"}`;
}

// Whole birds, but one decimal below one so a small forecast does not read as 0
const fmt = (total) => (total == null ? "-" : total >= 1 ? Math.round(total) : total.toFixed(1));

/** Tooltip text: the daily total and where it falls among past years. */
function describe(total, quantile) {
  return quantile != null
    ? `${fmt(total)} (${ordinal(quantile)} ${t("table.percentile")})`
    : fmt(total);
}

const span = ([from, to]) => ({ left: `${from}%`, width: `${to - from}%` });
</script>

<style>
.overview {
  background: var(--dv-surface);
  border: 1px solid var(--dv-line);
  border-radius: var(--dv-radius);
  padding: 0.5rem 1rem 0.75rem;
}

.overview-legend {
  font-size: 0.8rem;
  color: var(--dv-muted);
  padding: 0.25rem 0 0.5rem;
  border-bottom: 1px solid var(--dv-line);
}

.info-btn {
  color: var(--dv-faint);
  font-size: 1rem;
}

.info-btn:hover,
.info-btn.open {
  color: var(--dv-accent);
}

.overview-help {
  margin: 0;
  padding: 0.5rem 0 0.5rem 1.1rem;
  font-size: 0.8rem;
  color: var(--dv-muted);
  border-bottom: 1px solid var(--dv-line);
}

.overview-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
  border-bottom: 1px solid var(--dv-grid);
}

.species-link {
  flex: 0 0 190px;
  display: flex;
  align-items: center;
  color: var(--dv-ink);
  text-decoration: none;
  font-size: 0.9rem;
  transition: color 0.2s ease;
}

.species-link img {
  height: 26px;
  width: 26px;
  margin-right: 8px;
  flex-shrink: 0;
}

.species-link:hover {
  color: var(--dv-accent);
}

.range-bar {
  position: relative;
  flex: 1 1 auto;
  height: 26px;
}

.range-bar .band {
  position: absolute;
  top: 9px;
  height: 8px;
  border-radius: 4px;
}

.range-bar .band.outer {
  background: var(--dv-history-outer);
}

.range-bar .band.inner {
  background: var(--dv-history-inner);
}

.range-bar .median {
  position: absolute;
  top: 5px;
  width: 6px; /* wide hover target around the 2px tick */
  height: 16px;
  background: linear-gradient(var(--dv-median), var(--dv-median)) center / 2px 100% no-repeat;
  transform: translateX(-3px);
}

.range-bar .marker {
  position: absolute;
  top: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid var(--dv-surface);
  box-shadow: 0 0 0 1px rgba(36, 33, 29, 0.15);
  box-sizing: border-box;
  transform: translateX(-50%);
}

.range-bar [data-tip]:hover,
.range-bar [data-tip]:focus {
  z-index: 2;
  outline: none;
}

/* The value and its percentile, shown on hover, keyboard focus or tap */
.range-bar [data-tip]::after {
  content: attr(data-tip);
  display: none;
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  padding: 0.25rem 0.5rem;
  border-radius: 0.3rem;
  background: var(--dv-ink);
  color: var(--dv-surface);
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
  pointer-events: none;
}

.range-bar [data-tip]:hover::after,
.range-bar [data-tip]:focus::after {
  display: block;
}

.marker.counted {
  background: var(--dv-counted);
}

.marker.predicted {
  background: var(--dv-predicted);
}

@media (max-width: 575.98px) {
  .species-link {
    flex-basis: 130px;
    font-size: 0.9rem;
  }
}
</style>
