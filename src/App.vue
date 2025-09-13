<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
      <div class="container">
        <a class="navbar-brand mb-0 h1" href="#">Defile Bird Forecasts</a>
        <button class="btn btn-link text-white ms-3" @click="showSettings = true" title="Settings">
          <i class="bi bi-gear" style="font-size: 1.5rem"></i>
        </button>
        <ul class="navbar-nav ms-auto">
          <li class="nav-item">
            <a
              href="https://github.com/AmedeeRoy/defile-migration-forecast"
              target="_blank"
              class="nav-link"
              title="GitHub"
            >
              <i class="bi bi-github" style="font-size: 1.5rem"></i>
            </a>
          </li>
          <li class="nav-item d-flex align-items-center">
            <a href="https://www.trektellen.org/count/view/2422/" target="_blank" class="nav-link">
              <img
                src="/trektellen_logo.png"
                alt="Défilé de l'Ecluse"
                style="height: 24px; width: auto; display: inline-block; vertical-align: middle"
              />
              Trektellen
            </a>
          </li>
        </ul>
      </div>
    </nav>

    <div class="container" style="padding-top: 80px">
      <TodayTable :today="species.map((sp) => ({ ...sp.today, species: sp.species }))" />
      <div class="row">
        <div v-for="sp in speciesDisplay" :key="sp.species" class="col-12 mb-4">
          <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
              <h5 class="card-title my-0">{{ sp.species }}</h5>
              <button
                class="btn btn-sm btn-outline-secondary"
                type="button"
                @click="sp.collapsed = !sp.collapsed"
              >
                <i :class="sp.collapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
              </button>
            </div>
            <div v-show="!sp.collapsed" class="card-body">
              <div class="row">
                <div class="col-6" v-if="plotOptions.find((p) => p.name === 'today').show">
                  <PlotToday v-if="sp.today" :today="sp.today" />
                </div>
                <div class="col-6" v-if="plotOptions.find((p) => p.name === 'nextDays').show">
                  <PlotNextDays v-if="sp.nextDays" :nextdays="sp.nextDays" />
                </div>
                <div class="col-12" v-if="plotOptions.find((p) => p.name === 'season').show">
                  <PlotSeason v-if="sp" :season="sp" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Settings Modal -->
    <div
      class="modal fade"
      :class="{ show: showSettings }"
      tabindex="-1"
      style="display: block"
      v-if="showSettings"
      @click.self="showSettings = false"
    >
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Settings</h5>
            <button type="button" class="btn-close" @click="showSettings = false"></button>
          </div>
          <div class="modal-body">
            <!-- Date selection -->
            <div class="mb-3 form-group">
              <label for="date">Date</label>
              <input type="date" id="date" v-model="selectedDate" class="form-control" disabled />
            </div>
            <!-- Plot selection -->
            <div class="mb-3 form-group">
              <label for="plots">Plots to display</label>
              <div class="btn-group w-100" role="group" aria-label="Plot type selector" id="plots">
                <button
                  v-for="plot in plotOptions"
                  :key="plot.name"
                  type="button"
                  class="btn btn-secondary"
                  :class="{ active: plot.show }"
                  @click="plot.show = !plot.show"
                >
                  {{ plot.label }}
                </button>
              </div>
            </div>
            <!-- Threshold input -->
            <div class="mb-3 form-group">
              <label for="thr">Historical median count threshold </label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                v-model.number="medianThreshold"
                id="thr"
                class="form-control"
                aria-describedby="thrHelp"
              />
              <small id="thrHelp" class="form-text text-muted"
                >Only species with a higher historical median daily count for the day will be
                displayed</small
              >
            </div>
            <!-- Sort selection -->
            <div class="mb-3 form-group">
              <label for="sortOption" class="form-label">Sort species by</label>
              <select v-model="sortOption" class="form-select" id="sortOption">
                <option value="taxonomy">Taxonomy</option>
                <option value="median">Median count</option>
                <option value="predicted">Predicted count</option>
                <option value="quantile">Quantile predicted</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue imports
import { ref, watch, onMounted, computed } from "vue";
import { NetCDFReader } from "netcdfjs";

// Component imports
import PlotToday from "./components/PlotToday.vue";
import PlotNextDays from "./components/PlotNextDays.vue";
import PlotSeason from "./components/PlotSeason.vue";
import TodayTable from "./components/TodayTable.vue";
import species_doy_statistics from "../src/species_doy_statistics.json";

// Reactive data
const species = ref(species_doy_statistics);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const plotOptions = ref([
  { name: "today", label: "Today", show: true },
  { name: "nextDays", label: "Next Days", show: false },
  { name: "season", label: "Season", show: false },
]);
const showSettings = ref(false);
const medianThreshold = ref(5);
const sortOption = ref("quantile");

// Computed properties
const speciesDisplay = computed(() => {
  let arr = species.value.filter(
    (sp) => sp.today?.median && sp.today?.median * 15 > medianThreshold.value
  );
  if (sortOption.value === "taxonomy") {
    return arr;
  } else if (sortOption.value === "median") {
    return [...arr].sort((a, b) => (b.today?.totalMedian || 0) - (a.today?.totalMedian || 0));
  } else if (sortOption.value === "predicted") {
    return [...arr].sort((a, b) => (b.today?.totalPredicted || 0) - (a.today?.totalPredicted || 0));
  } else if (sortOption.value === "quantile") {
    return [...arr].sort((a, b) => (b.today?.totalQuantile || 0) - (a.today?.totalQuantile || 0));
  }
  return arr;
});

// Configuration
const nextDaysLength = 3;

/**
 * Updates species data for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 */
async function updateSpeciesData(dateStr) {
  // Convert date to day of year
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - start) / (1000 * 60 * 60 * 24));

  // Update statistics for all species
  species.value.forEach((sp) => {
    const todayId = sp.doy.indexOf(doy);

    // Set today's data
    sp.today = {
      date: date,
      median: sp.median[todayId],
      q25: sp.q25[todayId],
      q75: sp.q75[todayId],
      mean: sp.mean[todayId],
      forecast: [],
    };

    // Set next days data
    const nextIds = Array.from({ length: nextDaysLength }, (_, i) => todayId + i + 1);
    sp.nextDays = {
      date: date,
      median: nextIds.map((id) => sp.median[id]),
      q25: nextIds.map((id) => sp.q25[id]),
      q75: nextIds.map((id) => sp.q75[id]),
      mean: nextIds.map((id) => sp.mean[id]),
      forecast: [],
    };

    // Initialize collapsed state if not set
    if (sp.collapsed === undefined) {
      sp.collapsed = false;
    }
  });

  // Fetch forecast data for all species
  const promises = species.value.map(async (sp) => {
    try {
      const forecastData = await fetchNetCDF(dateStr, sp.species);
      sp.today.forecast = forecastData[0];
      sp.nextDays.forecast = forecastData.slice(1, nextDaysLength + 1);
      // Add totalPredicted, totalMedian, totalRatio to sp.today
      sp.today.totalPredicted = sp.today.forecast?.predHourlyCount?.reduce((x, y) => x + y, 0) || 0;
      sp.today.totalMedian = sp.today.median * 15;

      sp.today.totalQuantile = predictQuantile(
        sp.today.totalPredicted,
        sp.today.q25 * 15,
        sp.today.totalMedian,
        sp.today.q75 * 15
      );

      sp.today.totalFold = sp.today.totalPredicted / sp.today.totalMedian;
    } catch (e) {
      console.error(`Failed to fetch forecast for ${sp.species}:`, e);
      sp.today.forecast = [];
      sp.nextDays.forecast = [];
      sp.today.totalPredicted = 0;
      sp.today.totalMedian = 0;
      sp.today.totalQuantile = 0;
      sp.today.totalFold = 0;
    }
  });

  await Promise.all(promises);
}

/**
 * Fetches NetCDF forecast data for a specific species and date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {string} speciesName - Name of the species
 * @returns {Array} Array of forecast data objects
 */
async function fetchNetCDF(dateStr, speciesName) {
  // Build file URL based on date and species name
  //const url = `/${dateStr.replace(/-/g, "")}_${speciesName.replace(" ", "_")}.nc`;
  const url = `https://amedeeroy.github.io/defile-migration-forecast/img/${encodeURIComponent(
    speciesName
  )}/${dateStr.replace(/-/g, "")}_${speciesName.replace(/ /g, "_")}.nc`;
  console.log(url);
  try {
    // Fetch and parse NetCDF file
    const response = await window.fetch(url);
    if (!response.ok) throw new Error("Failed to fetch NetCDF file");
    const arrayBuffer = await response.arrayBuffer();
    const nc = new NetCDFReader(new Uint8Array(arrayBuffer));

    // Extract and transform prediction data
    const predLogHourlyCount = nc.getDataVariable("pred_log_hourly_count");
    const predHourlyCount = predLogHourlyCount.map((x) => Math.exp(x) - 1);

    // Extract date information from NetCDF metadata
    const dateVar = nc.getDataVariable("date");
    const dateVarMeta = nc.variables.find((v) => v.name === "date");
    const unitsAttr = dateVarMeta.attributes.find((a) => a.name === "units");
    const baseStr = unitsAttr.value.replace("days since ", "").split(" ")[0];
    const baseDate = new Date(baseStr);

    // Get data dimensions
    const nDates = nc.dimensions.find((d) => d.name === "date").size;
    const nHours = nc.dimensions.find((d) => d.name === "time").size;

    // Process forecast data for each date
    const forecastData = [];
    for (let k = 0; k < nDates; k++) {
      const subset = predHourlyCount.slice(k * nHours, (k + 1) * nHours);

      // Calculate actual date for this forecast
      const actualDate = new Date(baseDate);
      actualDate.setDate(actualDate.getDate() + dateVar[k]);

      forecastData.push({
        date: actualDate,
        predHourlyCount: subset,
      });
    }

    return forecastData;
  } catch (e) {
    console.error(`Error fetching NetCDF for ${speciesName}:`, e);
    return [];
  }
}

import { jStat } from "jstat";

// Predict quantile of a given count
function predictQuantile(count, q25, q50, q75) {
  if (count <= 0) return 0;
  // Collect valid quantiles and their probabilities
  const qs = [q25, q50, q75];
  const ps = [0.25, 0.5, 0.75];
  const valid = qs.map((q, i) => (q > 0 ? { logq: Math.log(q), p: ps[i] } : null)).filter(Boolean);
  if (valid.length === 0) return 0;
  if (valid.length === 1) {
    // Only one valid quantile, use as mean for lognormal
    const mu = valid[0].logq;
    const sigma = 1e-6; // almost deterministic
    return jStat.lognormal.cdf(count, mu, sigma);
  }
  // Fit lognormal using linear regression on available quantiles
  const zs = valid.map((v) => jStat.normal.inv(v.p, 0, 1));
  const logs = valid.map((v) => v.logq);
  const meanZ = jStat.mean(zs);
  const meanY = jStat.mean(logs);
  const covZY = jStat.sum(zs.map((z, i) => (z - meanZ) * (logs[i] - meanY)));
  const varZ = jStat.sum(zs.map((z) => (z - meanZ) ** 2));
  const sigma = covZY / varZ;
  const mu = meanY - sigma * meanZ;
  return jStat.lognormal.cdf(count, mu, sigma);
}

// Lifecycle hooks
onMounted(() => {
  updateSpeciesData(selectedDate.value);
});

// Watchers
watch(selectedDate, (newDate) => {
  updateSpeciesData(newDate, medianThreshold.value);
});
</script>

<style scoped>
.navbar {
  min-height: 70px;
}
.modal {
  display: block;
  background: rgba(0, 0, 0, 0.5);
}
.modal.fade:not(.show) {
  opacity: 0;
  pointer-events: none;
}
</style>
