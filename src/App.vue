<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
    <div class="container">
      <a class="navbar-brand d-flex align-items-center mb-0 h1" href="#">
        <img
          src="/defile_logo.png"
          alt="Défilé de l'Ecluse"
          style="height: 36px; width: auto; margin-right: 10px"
        />
        Defile Bird Forecasts
      </a>

      <!-- Centered date selector -->
      <div class="d-flex mx-auto align-items-center">
        <input
          type="date"
          v-model="selectedDate"
          class="form-control form-control-sm text-center"
          style="width: 150px"
        />
      </div>

      <ul class="navbar-nav ms-auto align-items-center">
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
          <a
            :href="`https://www.trektellen.org/count/view/2422/${selectedDate.replace(/-/g, '')}`"
            target="_blank"
            class="nav-link"
          >
            <img
              src="/trektellen_logo.png"
              alt="Défilé de l'Ecluse"
              style="height: 24px; width: auto; display: inline-block; vertical-align: middle"
            />
            Trektellen
          </a>
        </li>
        <li class="nav-item d-flex align-items-center">
          <button
            class="btn btn-link text-white ms-2 p-0"
            @click="showSettings = true"
            title="Settings"
          >
            <i class="bi bi-gear" style="font-size: 1.5rem"></i>
          </button>
        </li>
      </ul>
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
    <h2>Hourly Prediction</h2>
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
                <PlotToday
                  v-if="sp.historical[0] && sp.forecast[0]"
                  :historical="sp.historical[0]"
                  :forecast="sp.forecast[0]"
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
import { ref, watch, onMounted, computed } from "vue";

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

// Reactive data
const nextDaysLength = 3;
const species = ref([]);
const weather = ref(null);
const selectedDate = ref(new Date().toISOString().split("T")[0]);
const plotOptions = ref([
  { name: "today", label: "Today", show: true },
  { name: "nextDays", label: "Next Days", show: true },
  { name: "season", label: "Season", show: true },
]);
const showSettings = ref(false);
const showIntro = ref(true);
const medianThreshold = ref(0); // unified name (was historicalMedianThreshold)
const nHours = ref(15);
const sortOption = ref("quantile");

// Computed properties
const speciesDisplay = computed(() => {
  let arr = species.value.filter(
    (sp) =>
      sp.historical[0]?.median && sp.historical[0]?.median * nHours.value > medianThreshold.value
  );
  if (sortOption.value === "taxonomy") {
    return arr;
  } else if (sortOption.value === "median") {
    return [...arr].sort((a, b) => (b.historical[0]?.median || 0) - (a.historical[0]?.median || 0));
  } else if (sortOption.value === "predicted") {
    return [...arr].sort(
      (a, b) => (b.forecast[0]?.predTotal || 0) - (a.forecast[0]?.predTotal || 0)
    );
  } else if (sortOption.value === "quantile") {
    return [...arr].sort(
      (a, b) => (b.forecast[0]?.predTotalQuantile || 0) - (a.forecast[0]?.predTotalQuantile || 0)
    );
  }
  return arr;
});

/**
 * Updates species data for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 */
async function updateSpeciesData(dateStr) {
  // Convert date to day of year
  const date = new Date(dateStr);
  const start = new Date(date.getFullYear(), 0, 0);
  const doy = Math.floor((date - start) / (1000 * 60 * 60 * 24));

  species.value = species_doy_statistics.map((sp0) => {
    const sp = {
      species: sp0.species,
      trektellen_species_id: sp0.trektellen_species_id,
      collapsed: false,
    };

    // Initialize per-day arrays for the window [today .. today + nextDaysLength-1]
    sp.date = [];
    sp.historical = [];
    sp.forecast = [];
    sp.trektellen = {};

    const sds = species_doy_statistics.find((s) => s.species === sp.species); // ensure reference
    const todayId = sds.doy.indexOf(doy);

    for (let i = 0; i < nextDaysLength + 1; i++) {
      // Date entry
      const d2 = new Date(date);
      d2.setDate(d2.getDate() + i);
      sp.date.push(d2);

      // Historical stats entry with bounds guards
      const idx = todayId + i;
      sp.historical.push({
        median: sds.median?.[idx] ?? null,
        q25: sds.q25?.[idx] ?? null,
        q75: sds.q75?.[idx] ?? null,
        mean: sds.mean?.[idx] ?? null,
        ratio: sds.ratio?.[idx] ?? null,
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

      const NbOfHours = forecastData[0].length;

      sp.forecast = forecastData.slice(0, nextDaysLength + 1).map((arr, idx) => {
        const predTotal = (arr || []).reduce((x, y) => x + (y ?? 0), 0);

        const predTotalQuantile = predictQuantile(
          predTotal,
          sp.historical[idx].q25 * NbOfHours,
          sp.historical[idx].median * NbOfHours,
          sp.historical[idx].q75 * NbOfHours
        );

        const predTotalFold =
          sp.historical[idx].median && NbOfHours
            ? predTotal / (sp.historical[idx].median * NbOfHours)
            : null;

        return {
          predHourlyCount: arr,
          predTotal: predTotal,
          predTotalQuantile: predTotalQuantile,
          predTotalFold: predTotalFold,
        };
      });
    } catch (e) {
      console.error(`Failed to fetch forecast for ${sp.species}:`, e);
      // update with what we have
    }
  });

  await Promise.all(promises);

  // Fetch weather data
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

  // Fetch Trektellen data (requires authentication)
  try {
    const bySpecies = await fetchTrektellenData(dateStr, 2422);
    if (!bySpecies || Object.keys(bySpecies).length === 0) {
      console.warn("Trektellen: no data for date or empty response");
    }
    for (const sp of species.value) {
      const obsList = bySpecies[String(sp.trektellen_species_id)];
      if (!obsList || !obsList.length) continue;
      sp.trektellen = {
        observations: obsList,
        count: obsList.reduce((sum, o) => sum + (o?.left ?? 0), 0),
      };
    }
  } catch (e) {
    console.error("Error fetching Trektellen data:", e);
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

<style>
body {
  padding-top: 120px;
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
