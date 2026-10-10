<template>
  <div class="d-flex align-items-center mb-3 flex-wrap gap-2">
    <h2 class="mb-0 me-1">{{ $t("table.title") }}</h2>
    <button
      ref="infoBtn"
      type="button"
      class="btn btn-link p-0 text-info fs-4 lh-1"
      tabindex="0"
      data-bs-toggle="popover"
      data-bs-trigger="focus"
      data-bs-html="true"
      :data-bs-content="popoverContent"
      :title="$t('table.explanation.title')"
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
    <div class="overview-legend text-muted small mb-1">
      <span class="legend-dot counted"></span>
      <img src="/trektellen_logo.png" alt="" class="legend-icon" />{{ $t("table.counted") }}
      <span class="legend-dot predicted ms-3"></span>
      <img src="/predicted_logo.svg" alt="" class="legend-icon" />{{ $t("table.predicted") }}
      <span class="ms-3">{{ $t("table.distribution") }}</span>
    </div>
    <div v-for="row in enrichedspecies" :key="row.species" class="overview-row">
      <a :href="`#${row.species}`" class="species-link text-decoration-none text-dark">
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
          :title="`${t('table.historical')}: ${fmt(row.totalMedian)}`"
        ></div>
        <div
          v-if="row.bar.counted != null"
          class="marker counted"
          :style="{ left: row.bar.counted + '%' }"
          :title="`${t('table.counted')}: ${describe(row.trektellenCount, row.trektellenQuantile)}`"
        ></div>
        <div
          v-if="row.bar.predicted != null"
          class="marker predicted"
          :style="{ left: row.bar.predicted + '%' }"
          :title="`${t('table.predicted')}: ${describe(row.totalPredicted, row.totalQuantile)}`"
        ></div>
      </div>
      <span v-else class="text-muted">-</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Popover } from "bootstrap";
import { rangeBar } from "../utils/rangeBar.js";

const { t } = useI18n();

const props = defineProps({
  species: { type: Array, required: true },
});
const infoBtn = ref(null);
const mode = ref("number"); // "number" (log axis) or "quantile"

const popoverContent = computed(
  () =>
    `<b>${t("table.species")}</b>: ${t("table.explanation.species")}<br>
   <b>${t("table.observed")}</b>: ${t("table.explanation.observed")}<br>
   <b>${t("table.predicted")}</b>: ${t("table.explanation.predicted")}<br>
   <b>${t("table.distribution")}</b>: ${t("table.explanation.distribution")}`,
);

onMounted(() => {
  if (infoBtn.value) {
    new Popover(infoBtn.value);
  }
});
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

const fmt = (total) => (total != null ? Math.round(total) : "-");

/** Tooltip text: the daily total and where it falls among past years. */
function describe(total, quantile) {
  return quantile != null
    ? `${fmt(total)} (${ordinal(quantile)} ${t("table.percentile")})`
    : fmt(total);
}

const span = ([from, to]) => ({ left: `${from}%`, width: `${to - from}%` });
</script>

<style>
.popover {
  min-width: 320px;
  max-width: 400px;
}

.overview-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 2px 0;
  border-bottom: 1px solid var(--bs-gray-200);
}

.species-link {
  flex: 0 0 190px;
  display: flex;
  align-items: center;
  transition: color 0.2s ease;
}

.species-link img {
  height: 26px;
  width: 26px;
  margin-right: 8px;
  flex-shrink: 0;
}

.species-link:hover {
  color: var(--bs-primary) !important;
  text-decoration: underline !important;
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
  background: var(--bs-gray-300);
}

.range-bar .band.inner {
  background: var(--bs-gray-500);
}

.range-bar .median {
  position: absolute;
  top: 5px;
  width: 6px; /* wide hover target around the 2px tick */
  height: 16px;
  background: linear-gradient(var(--bs-gray-800), var(--bs-gray-800)) center / 2px 100% no-repeat;
  transform: translateX(-3px);
}

.range-bar .marker {
  position: absolute;
  top: 4px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-sizing: border-box;
  transform: translateX(-50%);
  cursor: help;
}

.marker.counted,
.legend-dot.counted {
  background: #d9480f;
}

.marker.predicted,
.legend-dot.predicted {
  background: var(--bs-primary);
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  margin-right: 4px;
}

.legend-icon {
  height: 18px;
  margin-right: 4px;
}

@media (max-width: 575.98px) {
  .species-link {
    flex-basis: 130px;
    font-size: 0.9rem;
  }
}
</style>
