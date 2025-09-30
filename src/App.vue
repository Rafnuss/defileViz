<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
    <div class="container">
      <!-- Brand -->
      <a class="navbar-brand d-flex align-items-center mb-0 h1" href="#">
        <img
          src="/defile_logo.png"
          alt="Défilé de l'Ecluse"
          style="height: 36px; width: auto; margin-right: 10px"
        />
        Defile Bird Forecasts
      </a>

      <!-- Date selector (desktop: center, mobile: below brand) -->
      <div class="d-none d-lg-flex mx-auto align-items-center">
        <button
          class="btn btn-outline-light btn-sm me-2"
          @click="changeDateByDays(-1)"
          :disabled="isLoadingData"
          title="Previous day"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <input
          type="date"
          v-model="selectedDate"
          :disabled="isLoadingData"
          :max="todaysDate"
          class="form-control form-control-sm text-center"
          style="width: 150px"
        />
        <button
          v-show="!isToday"
          class="btn btn-outline-light btn-sm ms-2"
          @click="changeDateByDays(1)"
          :disabled="isLoadingData"
          title="Next day"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
        <!-- Loading indicator with fixed space -->
        <div class="ms-2" style="width: 24px; height: 24px">
          <div
            v-show="isLoadingData"
            class="spinner-border spinner-border-sm text-light"
            role="status"
          >
            <span class="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>

      <!-- Hamburger menu button -->
      <button
        class="navbar-toggler"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#navbarNav"
        aria-controls="navbarNav"
        aria-expanded="false"
        aria-label="Toggle navigation"
      >
        <span class="navbar-toggler-icon"></span>
      </button>

      <!-- Collapsible navbar content -->
      <div class="collapse navbar-collapse" id="navbarNav">
        <!-- Mobile date selector -->
        <div
          class="d-lg-none d-flex justify-content-center align-items-center py-3 border-bottom border-light border-opacity-25 mb-3"
        >
          <button
            class="btn btn-outline-light btn-sm me-2"
            @click="changeDateByDays(-1)"
            :disabled="isLoadingData"
            title="Previous day"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <input
            type="date"
            v-model="selectedDate"
            :disabled="isLoadingData"
            :max="todaysDate"
            class="form-control form-control-sm text-center"
            style="width: 150px"
          />
          <button
            v-show="!isToday"
            class="btn btn-outline-light btn-sm ms-2"
            @click="changeDateByDays(1)"
            :disabled="isLoadingData"
            title="Next day"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <!-- Loading indicator with fixed space -->
          <div class="ms-2" style="width: 24px; height: 24px">
            <div
              v-show="isLoadingData"
              class="spinner-border spinner-border-sm text-light"
              role="status"
            >
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>

        <!-- Navigation links -->
        <ul class="navbar-nav ms-auto align-items-lg-center text-center">
          <li class="nav-item">
            <a
              href="https://github.com/AmedeeRoy/defile-migration-forecast"
              target="_blank"
              class="nav-link"
              title="GitHub"
            >
              <i class="bi bi-github" style="font-size: 1.5rem"></i>
              <span class="d-lg-none ms-2">GitHub</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              :href="trektellenURL"
              target="_blank"
              class="nav-link d-flex align-items-center justify-content-center justify-content-lg-start"
            >
              <img
                src="/trektellen_logo.png"
                alt="Défilé de l'Ecluse"
                style="height: 24px; width: auto"
              />
              <span class="ms-2">Trektellen</span>
            </a>
          </li>
          <li class="nav-item">
            <button
              class="nav-link btn btn-link text-white p-0 border-0 d-flex align-items-center justify-content-center justify-content-lg-start"
              @click="showSettings = true"
              title="Settings"
            >
              <i class="bi bi-gear" style="font-size: 1.5rem"></i>
              <span class="d-lg-none ms-2">Settings</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <div class="container">
    <h1>Welcome to Defile Bird Forecasts</h1>
    <div v-if="showIntro" class="alert alert-info alert-dismissible" role="alert">
      <button type="button" class="btn-close" aria-label="Close" @click="showIntro = false" />
      <span>
        This website provides a daily migration forecasts for the count of raptor species at the
        Défilé de l'Ecluse, based on a
        <a
          href="https://github.com/AmedeeRoy/defile-migration-forecast"
          target="_blank"
          rel="noopener"
          >neural network model</a
        >.<br />
        Check out the actual count on
        <a href="https://www.trektellen.org/count/view/2422/" target="_blank" rel="noopener"
          >Trektellen</a
        >
        and read more about this history of this project (in French) on the website of
        <a
          href="https://auvergne-rhone-alpes.lpo.fr/projets/migration-post-nuptiale-au-defile-de-lecluse/"
          target="_blank"
          rel="noopener"
          >LPO Auvergne-Rhône-Alpes</a
        >.
      </span>
    </div>
    <TodayTable
      v-if="species && species.length > 0"
      :species="
        species.map((sp) => ({
          species: sp.species,
          historical: sp.historical[0],
          forecast: sp.forecast[0],
          trektellen: sp.trektellen,
        }))
      "
    />
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">Hourly Prediction</h2>
      <button class="btn btn-outline-secondary btn-sm" @click="toggleAllSpecies" type="button">
        <i :class="allCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
        {{ allCollapsed ? "Expand All" : "Collapse All" }}
      </button>
    </div>
    <div class="row">
      <div v-for="sp in speciesDisplay" :key="sp.species" class="col-12 mb-1">
        <div class="card h-100">
          <div
            class="card-header d-flex justify-content-between align-items-center"
            @click="sp.collapsed = !sp.collapsed"
            style="cursor: pointer"
          >
            <h5 class="card-title my-0 d-flex align-items-center" :id="sp.species">
              <img
                :src="`/defileViz/species_icon/${sp.species
                  .toLowerCase()
                  .replace(/\s+/g, '_')}.svg`"
                :alt="sp.species + ' icon'"
                style="height: 26px; width: 26px; margin-right: 8px; flex-shrink: 0"
                @error="$event.target.style.display = 'none'"
              />
              {{ sp.species }}
            </h5>
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
                <PlotToday
                  v-if="sp.historical[0]"
                  :historical="sp.historical[0]"
                  :forecast="sp.forecast[0]"
                  :trektellen="sp.trektellen"
                />
              </div>
              <div class="col-6" v-if="plotOptions.find((p) => p.name === 'nextDays').show">
                <PlotNextDays
                  v-if="
                    sp.historical &&
                    sp.historical.length > 1 &&
                    sp.forecast &&
                    sp.forecast.length > 1
                  "
                  :historical="sp.historical.slice(1, nextDaysLength + 1)"
                  :forecast="sp.forecast.slice(1, nextDaysLength + 1)"
                  :date="sp.date.slice(1, nextDaysLength + 1)"
                />
              </div>
              <div class="col-12" v-if="plotOptions.find((p) => p.name === 'season').show">
                <PlotSeason
                  v-if="sp"
                  :season="species_doy_statistics.find((s) => s.species === sp.species)"
                  :date="sp.date[0]"
                  :totalPredicted="sp.forecast[0]?.predTotal"
                  :totalObserved="sp.trektellen?.count"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Replace debug object dump -->
    <PlotWeather v-if="weather" :weather="weather" />
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
          <!-- Next days length -->
          <div class="mb-3 form-group">
            <label for="nextDays">Number of next days to display</label>
            <input
              type="number"
              step="1"
              min="1"
              max="7"
              v-model.number="nextDaysLength"
              id="nextDays"
              class="form-control"
              aria-describedby="nextDaysHelp"
            />
            <small id="nextDaysHelp" class="form-text text-muted"
              >Number of days after today to show in the "Next Days" forecast</small
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
  <Footer />
</template>

<script setup>
// Vue imports
import { ref, watch, onMounted, computed, provide } from "vue";

// Species data
import species_doy_statistics from "../src/species_doy_statistics.json";

// Stats functions
import { predictQuantile } from "./utils/stats";

// Fetcher service
import { fetchNetCDF } from "./services/netcdf";
import { fetchTrektellenData } from "./services/trektellen";

// Component imports
import PlotToday from "./components/PlotToday.vue";
import PlotNextDays from "./components/PlotNextDays.vue";
import PlotSeason from "./components/PlotSeason.vue";
import TodayTable from "./components/TodayTable.vue";
import PlotWeather from "./components/PlotWeather.vue";
import Footer from "./components/Footer.vue";

/**
 * Gets date from URL or defaults to today, validates it's not in future
 * @returns {string} Valid date string in YYYY-MM-DD format
 */
function getDateFromURL() {
  const dateParam = new URLSearchParams(window.location.search).get("date");
  const today = new Date().toISOString().split("T")[0];

  // Return URL date if valid and not in future, otherwise today
  return dateParam && dateParam <= today && !isNaN(new Date(dateParam)) ? dateParam : today;
}

/**
 * Updates URL and browser history with current date
 */
function updateURL(dateStr) {
  const url = new URL(window.location);
  url.searchParams.set("date", dateStr);
  window.history.pushState({ date: dateStr }, "", url);
}

// Constants
const N_HOURS = 12;
const QUANTILE_LEVELS = species_doy_statistics[0]?.quantile_levels || [
  1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99,
];
const ID_MEDIAN = QUANTILE_LEVELS.indexOf(50);
const ID_LOWER = QUANTILE_LEVELS.indexOf(20);
const ID_UPPER = QUANTILE_LEVELS.indexOf(80);

provide("N_HOURS", N_HOURS);
provide("ID_MEDIAN", ID_MEDIAN);
provide("ID_LOWER", ID_LOWER);
provide("ID_UPPER", ID_UPPER);

// Reactive data
const species = ref([]);
const weather = ref(null);
const selectedDate = ref(getDateFromURL());
const isLoadingData = ref(false);

// UI state
const plotOptions = ref([
  { name: "today", label: "Today", show: true },
  { name: "nextDays", label: "Next Days", show: true },
  { name: "season", label: "Season", show: true },
]);
const showSettings = ref(false);
const showIntro = ref(true);

// Settings
const medianThreshold = ref(0);
const nextDaysLength = ref(4);
const sortOption = ref("taxonomy");

// Computed properties
const todaysDate = computed(() => new Date().toISOString().split("T")[0]);
const isToday = computed(() => selectedDate.value === todaysDate.value);
const trektellenURL = computed(
  () => `https://www.trektellen.org/count/view/2422/${selectedDate.value.replace(/-/g, "")}`
);

const speciesDisplay = computed(() => {
  const filtered = species.value.filter(
    (sp) => sp.historical[0]?.median && sp.historical[0]?.median * N_HOURS > medianThreshold.value
  );

  const sortFunctions = {
    taxonomy: () => filtered,
    median: () =>
      [...filtered].sort((a, b) => (b.historical[0]?.median || 0) - (a.historical[0]?.median || 0)),
    predicted: () =>
      [...filtered].sort(
        (a, b) => (b.forecast[0]?.predTotal || 0) - (a.forecast[0]?.predTotal || 0)
      ),
    quantile: () =>
      [...filtered].sort(
        (a, b) => (b.forecast[0]?.predTotalQuantile || 0) - (a.forecast[0]?.predTotalQuantile || 0)
      ),
  };

  return sortFunctions[sortOption.value]() || filtered;
});

const allCollapsed = computed(() => {
  return species.value.every((sp) => sp.collapsed);
});

/**
 * Updates species data for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 */
async function updateSpeciesData(dateStr) {
  isLoadingData.value = true;

  // Convert date to day of year
  const date = new Date(dateStr);
  const startOfYear = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
  species.value = species_doy_statistics.map((sp0) => {
    const sp = {
      species: sp0.species,
      trektellen_species_id: sp0.trektellen_species_id,
      quantile_levels: sp0.quantile_levels,
      collapsed: false,
    };

    // Initialize per-day arrays for the window [today .. today + nextDaysLength-1]
    sp.date = [];
    sp.historical = [];
    sp.forecast = [];
    sp.trektellen = {};

    const sds = species_doy_statistics.find((s) => s.species === sp.species); // ensure reference
    const todayId = sds.doy.indexOf(doy);
    const maxDays = 14; // Limit to 14 days max
    const id_median = sp.quantile_levels.indexOf(50);

    for (let i = 0; i < maxDays; i++) {
      // Date entry
      const d2 = new Date(date);
      d2.setDate(d2.getDate() + i);
      sp.date.push(d2);

      // Historical stats entry with bounds guards
      const idx = todayId + i;
      sp.historical.push({
        quantiles: sds.quantiles?.[idx] ?? null,
        min: sds.min?.[idx] ?? null,
        max: sds.max?.[idx] ?? null,
        mean: sds.mean?.[idx] ?? null,
        ratio: sds.ratio?.[idx] ?? null,
        median: sds.quantiles?.[idx][id_median] ?? null,
      });
    }

    return sp;
  });

  // Fetch forecast data for all species
  const promises = species.value.map(async (sp) => {
    try {
      const varsData = await fetchNetCDF(dateStr, sp.species, ["pred_log_hourly_count"]);
      const forecastDataRaw = varsData?.pred_log_hourly_count || [];
      // Apply transform locally: pred_log_hourly_count is exp(x) - 1
      const forecastData = forecastDataRaw.map((row) => row.map((x) => Math.exp(x) - 1));

      if (!forecastData.length || !forecastData[0]?.length) throw new Error("No forecast data");

      sp.forecast = forecastData.map((arr, idx) => {
        const predTotal = (arr || []).reduce((x, y) => x + (y ?? 0), 0);

        const predTotalQuantile = predictQuantile(
          predTotal,
          sp.historical[idx].quantiles.map((q) => q * N_HOURS), // historical is per hour, scale to total
          sp.quantile_levels
        );
        return {
          predHourlyCount: arr,
          predTotal: predTotal,
          predTotalQuantile: predTotalQuantile,
        };
      });
    } catch (e) {
      console.error(`Failed to fetch forecast for ${sp.species}:`, e);
      // update with what we have
    }
  });

  await Promise.all(promises);

  // Fetch weather data
  try {
    weather.value = await fetchNetCDF(dateStr, "Osprey", [
      "temperature_2m",
      "dewpoint_temperature_2m",
      "total_precipitation",
      "surface_pressure",
      "u_component_of_wind_10m",
      "v_component_of_wind_10m",
      "u_component_of_wind_100m",
      "v_component_of_wind_100m",
      "instantaneous_10m_wind_gust",
      "high_cloud_cover",
      "low_cloud_cover",
      "medium_cloud_cover",
      "total_cloud_cover",
      "surface_solar_radiation_downwards",
      "sun_altitude",
      "sun_azimuth",
    ]);
  } catch (e) {
    console.error("Error fetching weather data:", e);
    weather.value = null;
  }

  // Fetch Trektellen data
  try {
    const bySpecies = await fetchTrektellenData(dateStr);
    if (!bySpecies || Object.keys(bySpecies).length === 0) {
      console.warn("Trektellen: no data for date or empty response");
    } else {
      for (const sp of species.value) {
        const obsList = bySpecies[String(sp.trektellen_species_id)];
        if (obsList?.length) {
          sp.trektellen = {
            observations: obsList,
            count: obsList.reduce((sum, o) => sum + (o?.left ?? 0), 0),
          };
        } else {
          sp.trektellen = {
            observations: [],
            count: 0,
          };
        }
        sp.trektellen.totalQuantile = predictQuantile(
          sp.trektellen.count,
          sp.historical[0].quantiles.map((q) => q * N_HOURS), // historical is per hour, scale to total
          sp.quantile_levels
        );
      }
    }
  } catch (e) {
    console.error("Error fetching Trektellen data:", e);
  }

  // Always reset loading state
  isLoadingData.value = false;
}

/**
 * Changes the selected date by a specified number of days
 * @param {number} days - Number of days to add (positive) or subtract (negative)
 */
function changeDateByDays(days) {
  if (isLoadingData.value) return;

  const newDate = new Date(selectedDate.value);
  newDate.setDate(newDate.getDate() + days);
  const newDateStr = newDate.toISOString().split("T")[0];

  // Only update if new date doesn't exceed today
  if (newDateStr <= todaysDate.value) {
    selectedDate.value = newDateStr;
  }
}

/**
 * Toggles collapse state of all species cards
 */
function toggleAllSpecies() {
  const shouldCollapse = !allCollapsed.value;
  species.value.forEach((sp) => {
    sp.collapsed = shouldCollapse;
  });
}

// Lifecycle hooks
onMounted(() => {
  updateSpeciesData(selectedDate.value);

  // Handle browser back/forward navigation
  window.addEventListener("popstate", () => {
    selectedDate.value = getDateFromURL();
  });
});

// Watchers
watch(selectedDate, (newDate) => {
  updateSpeciesData(newDate);
  updateURL(newDate);
});
</script>

<style>
body {
  padding-top: 80px;
}

/* Fix anchor links appearing behind fixed navbar */
:target {
  scroll-margin-top: 80px;
}
</style>
