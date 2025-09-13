<template>
  <div>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
      <div class="container">
        <a class="navbar-brand mb-0 h1" href="#">Defile Bird Forecasts</a>
        <form class="d-flex align-items-center ms-3">
          <label class="form-label mb-0 me-2 text-white">Date</label>
          <input type="date" v-model="selectedDate" class="form-control form-control-sm" disabled />
        </form>
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
        </ul>
      </div>
    </nav>
    <div class="container" style="padding-top: 80px">
      <div v-for="sp in species.filter((s) => s.active)" :key="sp.species" class="card mb-4">
        <div class="card-header d-flex justify-content-between align-items-center">
          <h5 class="card-title mb-0">{{ sp.species }}</h5>
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
            <div class="col-6">
              <PlotToday v-if="sp.today" :today="sp.today" />
            </div>
            <div class="col-6">
              <PlotNextDays v-if="sp.nextDays" :nextdays="sp.nextDays" />
            </div>
          </div>
          <div class="row mt-3">
            <div class="col-12">
              <PlotSeason v-if="sp" :season="sp" />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Vue imports
import { ref, watch, onMounted } from "vue";
import { NetCDFReader } from "netcdfjs";

// Component imports
import PlotToday from "./components/PlotToday.vue";
import PlotNextDays from "./components/PlotNextDays.vue";
import PlotSeason from "./components/PlotSeason.vue";
import species_doy_statistics from "../src/species_doy_statistics.json";

// Reactive data
const species = ref(species_doy_statistics);
const selectedDate = ref(new Date().toISOString().split("T")[0]);

// Configuration
const nextDaysLength = 3;

/**
 * Updates species data for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @param {number} thr - Threshold for species activity (default: 0.1)
 */
async function updateSpeciesData(dateStr, thr = 0.1) {
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

    // Determine if species is active based on threshold
    sp.active = sp.today.median > thr;

    // Initialize collapsed state if not set
    if (sp.collapsed === undefined) {
      sp.collapsed = false;
    }
  });

  // Fetch forecast data for active species only
  const activeSpecies = species.value.filter((sp) => sp.active);
  const promises = activeSpecies.map(async (sp) => {
    try {
      const forecastData = await fetchNetCDF(dateStr, sp.species);
      sp.today.forecast = forecastData[0];
      sp.nextDays.forecast = forecastData.slice(1, nextDaysLength + 1);
    } catch (e) {
      console.error(`Failed to fetch forecast for ${sp.species}:`, e);
      sp.today.forecast = [];
      sp.nextDays.forecast = [];
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
  const url = `https://amedeeroy.github.io/defile-migration-forecast/img/${speciesName.replace(
    " ",
    "%20"
  )}/${dateStr.replace(/-/g, "")}_${speciesName.replace(" ", "_")}.nc`;
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

// Lifecycle hooks
onMounted(() => {
  updateSpeciesData(selectedDate.value);
});

// Watchers
watch(selectedDate, (newDate) => {
  updateSpeciesData(newDate);
});
</script>

<style scoped>
.navbar {
  min-height: 70px;
}
</style>
