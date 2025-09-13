<template>
  <div class="table-responsive mb-4">
    <table class="table table-striped table-bordered table-sm align-middle">
      <thead class="table-light">
        <tr>
          <th @click="setSort('species')" style="cursor: pointer">
            Species
            <span v-if="sortKey === 'species'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalPredicted')" style="cursor: pointer">
            Predicted Today
            <span v-if="sortKey === 'totalPredicted'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalQuantile')" style="cursor: pointer">
            Quantile
            <span v-if="sortKey === 'totalQuantile'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalFold')" style="cursor: pointer">
            Fold
            <span v-if="sortKey === 'totalFold'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
          <th class="text-end" @click="setSort('totalMedian')" style="cursor: pointer">
            Historical Median
            <span v-if="sortKey === 'totalMedian'">{{ sortOrder === "asc" ? "▲" : "▼" }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in sortedToday" :key="row?.species">
          <td>{{ row?.species }}</td>
          <td class="text-end">{{ Math.round(row?.totalPredicted) ?? "-" }}</td>
          <td class="text-end">
            {{
              row?.totalQuantile !== undefined ? Math.round(row.totalQuantile * 100) + "th" : "-"
            }}
          </td>
          <td class="text-end">
            <template v-if="row.totalFold > 1">x{{ row.totalFold.toFixed(1) }}</template>
            <template v-else-if="row.totalFold > 0">/{{ (1 / row.totalFold).toFixed(1) }}</template>
            <template v-else>-</template>
          </td>
          <td class="text-end">{{ Math.round(row?.totalMedian) ?? "-" }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
const props = defineProps({
  today: { type: Array, required: true },
});
const sortKey = ref("totalPredicted");
const sortOrder = ref("desc");
function setSort(key) {
  if (sortKey.value === key) {
    sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
  } else {
    sortKey.value = key;
    sortOrder.value = "desc";
  }
}
const sortedToday = computed(() => {
  const arr = props.today.slice();
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
