<template>
  <div class="d-flex align-items-center mb-3">
    <h2 class="mb-0 me-2">{{ $t("table.title") }}</h2>
    <button
      ref="infoBtn"
      type="button"
      class="btn btn-link p-0 text-info"
      tabindex="0"
      data-bs-toggle="popover"
      data-bs-trigger="focus"
      data-bs-html="true"
      :data-bs-content="popoverContent"
      :title="$t('table.explanation.title')"
      style="font-size: 1.5rem; line-height: 1"
    >
      <i class="bi bi-info-circle"></i>
    </button>
  </div>
  <div class="table-responsive mb-4">
    <table class="table table-striped table-bordered table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th @click="setSort('species')" style="cursor: pointer">
            {{ $t("table.species") }}
            <span v-if="sortKey === 'species'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th
            class="text-end equal-width-col"
            @click="setSort('trektellenCount')"
            style="cursor: pointer"
          >
            <img
              src="/trektellen_logo.png"
              alt="Défilé de l'Ecluse"
              style="height: 24px; width: auto; display: inline-block; vertical-align: middle"
            />
            {{ $t("table.counted") }}
            <span v-if="sortKey === 'trektellenCount'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th
            class="text-end equal-width-col"
            @click="setSort('totalPredicted')"
            style="cursor: pointer"
          >
            {{ $t("table.predicted") }}
            <span v-if="sortKey === 'totalPredicted'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th
            class="text-end equal-width-col"
            @click="setSort('totalMedian')"
            style="cursor: pointer"
          >
            {{ $t("table.historical") }}
            <span v-if="sortKey === 'totalMedian'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th
            class="text-end equal-width-col"
            @click="setSort('totalQuantile')"
            style="cursor: pointer"
          >
            {{ $t("table.quantile") }}
            <span v-if="sortKey === 'totalQuantile'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedspecies" :key="row?.species">
          <td>
            <a :href="`#${row?.species}`" class="text-decoration-none text-dark">
              <img
                :src="`/defileViz/species_icon/${row.species
                  .toLowerCase()
                  .replace(/\s+/g, '_')}.svg`"
                :alt="row.species + ' icon'"
                style="height: 26px; width: 26px; margin-right: 8px; flex-shrink: 0"
                @error="$event.target.style.display = 'none'"
              />
              {{ t(`species.${row?.species}`, row?.species) }}
            </a>
          </td>
          <td class="text-end">
            {{ row.trektellenCount != null ? row.trektellenCount : "-" }}
          </td>
          <td class="text-end">
            {{ row?.forecast?.predTotal != null ? Math.round(row.forecast.predTotal) : "-" }}
          </td>
          <td class="text-end">
            {{ row?.totalMedian !== null ? Math.round(row?.totalMedian) : "-" }}
          </td>
          <td class="text-end">
            <span v-if="row?.forecast?.predTotalQuantile != null">
              {{ Math.round(row.forecast.predTotalQuantile) }}<sup>th</sup>
            </span>
            <span v-else>-</span>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { Popover } from "bootstrap";

const { t } = useI18n();

const props = defineProps({
  species: { type: Array, required: true },
});
const sortKey = ref("species");
const sortOrder = ref("desc");
const infoBtn = ref(null);

const popoverContent = computed(
  () =>
    `<b>${t("table.species")}</b>: ${t("table.explanation.species")}<br>
   <b>${t("table.observed")}</b>: ${t("table.explanation.observed")}<br>
   <b>${t("table.predicted")}</b>: ${t("table.explanation.predicted")}<br>
   <b>${t("table.quantile")}</b>: ${t("table.explanation.quantile")}<br>
   <b>${t("table.historical")}</b>: ${t("table.explanation.historicalMedian")}`
);

onMounted(() => {
  if (infoBtn.value) {
    new Popover(infoBtn.value);
  }
});
function setSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "desc";
  }
}
const enrichedspecies = computed(() =>
  props.species.map((r) => {
    const forecast = r.forecast;
    // Determine hourly counts array
    const hourly = Array.isArray(forecast)
      ? forecast
      : Array.isArray(forecast?.predHourlyCount)
      ? forecast.predHourlyCount
      : [];
    const hours = hourly.length || 15;
    // Totals / derived values
    const totalPredicted =
      forecast && forecast.predTotal !== undefined
        ? forecast.predTotal
        : hourly.reduce((s, v) => s + (v || 0), 0);
    const totalMedian =
      r.historical?.median !== undefined ? r.historical.median * hours : undefined;
    const totalQuantile =
      forecast && forecast.predTotalQuantile !== undefined ? forecast.predTotalQuantile : undefined;
    const trektellenCount = r.trektellen?.count ?? null; // added
    return {
      ...r,
      totalPredicted,
      totalMedian,
      totalQuantile,
      trektellenCount,
    };
  })
);

// replace usage of props.species with enrichedspecies
const sortedspecies = computed(() => {
  const arr = enrichedspecies.value.slice();
  arr.sort((a, b) => {
    let aVal = a?.[sortKey.value];
    let bVal = b?.[sortKey.value];
    if (aVal === undefined) aVal = -Infinity;
    if (bVal === undefined) bVal = -Infinity;
    if (typeof aVal === "string") {
      return sortOrder.value === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortOrder.value === "asc" ? aVal - bVal : bVal - aVal;
  });
  return arr;
});
</script>

<style>
.popover {
  min-width: 320px;
  max-width: 400px;
}

.equal-width-col {
  width: 20%; /* 4 columns = 25% each, but leaving some space for borders/padding */
}

/* Style for species name links */
td a {
  transition: color 0.2s ease;
}

td a:hover {
  color: var(--bs-primary) !important;
  text-decoration: underline !important;
}
</style>
