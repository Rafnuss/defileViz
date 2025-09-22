<template>
  <div class="d-flex align-items-center mb-3">
    <h2 class="mb-0 me-2">Today's Predictions by Species</h2>
    <button
      ref="infoBtn"
      type="button"
      class="btn btn-link p-0 text-info"
      tabindex="0"
      data-bs-toggle="popover"
      data-bs-trigger="focus"
      data-bs-html="true"
      :data-bs-content="popoverContent"
      title="Table columns explained"
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
            Species
            <span v-if="sortKey === 'species'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('trektellenCount')" style="cursor: pointer">
            <img
              src="/trektellen_logo.png"
              alt="Défilé de l'Ecluse"
              style="height: 24px; width: auto; display: inline-block; vertical-align: middle"
            />
            Counted
            <span v-if="sortKey === 'trektellenCount'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalPredicted')" style="cursor: pointer">
            Predicted
            <span v-if="sortKey === 'totalPredicted'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalQuantile')" style="cursor: pointer">
            Quantile
            <span v-if="sortKey === 'totalQuantile'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalMedian')" style="cursor: pointer">
            Historical Median
            <span v-if="sortKey === 'totalMedian'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalFold')" style="cursor: pointer">
            Fold
            <span v-if="sortKey === 'totalFold'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedspecies" :key="row?.species">
          <td>{{ row?.species }}</td>
          <td class="text-end">
            {{ row.trektellenCount != null ? row.trektellenCount : "-" }}
          </td>
          <td class="text-end">
            {{ row?.forecast?.predTotal != null ? Math.round(row.forecast.predTotal) : "-" }}
          </td>
          <td class="text-end">
            {{
              row?.forecast?.predTotalQuantile != null
                ? Math.round(row.forecast.predTotalQuantile)
                : "-"
            }}
          </td>
          <td class="text-end">
            {{ row?.totalMedian !== null ? Math.round(row?.totalMedian) : "-" }}
          </td>
          <td class="text-end">
            <template v-if="row?.forecast?.totalFold > 1"
              >x{{ row?.forecast?.totalFold.toFixed(1) }}</template
            >
            <template v-else-if="row?.forecast?.totalFold > 0"
              >/{{ (1 / row?.forecast?.totalFold).toFixed(1) }}</template
            >
            <template v-else>-</template>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { Popover } from "bootstrap";
const props = defineProps({
  species: { type: Array, required: true },
});
const sortKey = ref("totalPredicted");
const sortOrder = ref("desc");
const infoBtn = ref(null);
const popoverContent = `<b>Species</b>: Bird species name.<br>
   <b>Trektellen</b>: Observed total so far species (live data if available).<br>
   <b>Predicted species</b>: Predicted total number of individuals expected species (from 6am to 7pm).<br>
   <b>Quantile</b>: How species's prediction compares to past years (e.g., 90th means higher than 90% of previous years for this date).<br>
   <b>Historical Median</b>: Typical (median) count for this date in past years.<br>
   <b>Fold</b>: How many times higher (or lower) species's prediction is compared to the historical median (e.g., x2.0 means double, /2.0 means half).`;
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
    const totalFold =
      forecast && forecast.predTotalFold !== undefined
        ? forecast.predTotalFold
        : totalPredicted && totalMedian
        ? totalPredicted / totalMedian
        : undefined;
    const trektellenCount = r.trektellen?.count ?? null; // added
    return {
      ...r,
      totalPredicted,
      totalMedian,
      totalQuantile,
      totalFold,
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
</style>
