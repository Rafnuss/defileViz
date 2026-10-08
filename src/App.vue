<template>
  <nav class="navbar navbar-expand-lg navbar-dark bg-primary fixed-top shadow-sm">
    <div class="container">
      <!-- Brand -->
      <a class="navbar-brand d-flex align-items-center mb-0 h1" href="#">
        <img
          src="/defile_logo_72.webp"
          alt="Défilé de l'Ecluse"
          class="me-2"
          width="36"
          height="36"
        />
        {{ $t("nav.title") }}
      </a>

      <!-- Date selector (desktop: center, mobile: below brand) -->
      <div v-if="page === 'forecast'" class="d-none d-lg-flex mx-auto align-items-center">
        <button
          class="btn btn-outline-light btn-sm me-2"
          :disabled="isLoadingData"
          :title="$t('common.previousDay')"
          @click="changeDateByDays(-1)"
        >
          <i class="bi bi-chevron-left"></i>
        </button>
        <input
          v-model="selectedDate"
          type="date"
          :disabled="isLoadingData"
          :max="todaysDate"
          class="form-control form-control-sm text-center w-auto"
          style="min-width: 150px"
        />
        <button
          v-show="!isToday"
          class="btn btn-outline-light btn-sm ms-2"
          :disabled="isLoadingData"
          :title="$t('common.nextDay')"
          @click="changeDateByDays(1)"
        >
          <i class="bi bi-chevron-right"></i>
        </button>
        <!-- Loading indicator with fixed space -->
        <div
          class="ms-2 d-flex align-items-center justify-content-center"
          style="width: 24px; height: 24px"
        >
          <div
            v-show="isLoadingData"
            class="spinner-border spinner-border-sm text-light"
            role="status"
          >
            <span class="visually-hidden">{{ $t("common.loading") }}</span>
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
      <div id="navbarNav" class="collapse navbar-collapse">
        <!-- Mobile date selector -->
        <div
          v-if="page === 'forecast'"
          class="d-lg-none d-flex justify-content-center align-items-center py-3 border-bottom border-light border-opacity-25 mb-3"
        >
          <button
            class="btn btn-outline-light btn-sm me-2"
            :disabled="isLoadingData"
            :title="$t('common.previousDay')"
            @click="changeDateByDays(-1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <input
            v-model="selectedDate"
            type="date"
            :disabled="isLoadingData"
            :max="todaysDate"
            class="form-control form-control-sm text-center w-auto"
            style="min-width: 150px"
          />
          <button
            v-show="!isToday"
            class="btn btn-outline-light btn-sm ms-2"
            :disabled="isLoadingData"
            :title="$t('common.nextDay')"
            @click="changeDateByDays(1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <!-- Loading indicator with fixed space -->
          <div
            class="ms-2 d-flex align-items-center justify-content-center"
            style="width: 24px; height: 24px"
          >
            <div
              v-show="isLoadingData"
              class="spinner-border spinner-border-sm text-light"
              role="status"
            ></div>
          </div>
        </div>

        <!-- Navigation links -->
        <ul class="navbar-nav ms-auto align-items-lg-center text-center">
          <li class="nav-item">
            <a class="nav-link" :class="{ active: page === 'forecast' }" href="#">{{
              $t("nav.forecast")
            }}</a>
          </li>
          <li class="nav-item me-lg-2">
            <a class="nav-link" :class="{ active: page === 'explore' }" href="#explore">{{
              $t("nav.explore")
            }}</a>
          </li>
          <!-- Language Switcher -->
          <li class="nav-item">
            <div class="d-flex align-items-center">
              <select
                v-model="locale"
                class="form-select form-select-sm bg-primary text-white border-light"
              >
                <option v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :value="lang.code">
                  {{ lang.flag }} {{ lang.shortName }}
                </option>
              </select>
            </div>
          </li>
          <li class="nav-item">
            <a
              href="https://github.com/AmedeeRoy/defile-migration-forecast"
              target="_blank"
              rel="noopener"
              class="nav-link"
              title="GitHub"
            >
              <i class="bi bi-github fs-4"></i>
              <span class="d-lg-none ms-2">GitHub</span>
            </a>
          </li>
          <li class="nav-item">
            <a
              :href="`https://www.trektellen.org/count/view/2422/${selectedDate.replace(/-/g, '')}`"
              target="_blank"
              rel="noopener"
              class="nav-link d-flex align-items-center justify-content-center justify-content-lg-start"
            >
              <img
                src="/trektellen_logo.png"
                alt="Défilé de l'Ecluse"
                style="height: 24px; width: auto"
              />
              <span class="ms-2">Trektellens</span>
            </a>
          </li>
          <li class="nav-item">
            <button
              class="nav-link btn btn-link text-white p-0 border-0 d-flex align-items-center justify-content-center justify-content-lg-start"
              data-bs-toggle="modal"
              data-bs-target="#settingsModal"
            >
              <i class="bi bi-gear fs-4"></i>
              <span class="d-lg-none ms-2">{{ $t("nav.settings") }}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </nav>

  <div v-if="page === 'explore'" class="container">
    <ExplorePage :initial-taxon="exploreTaxon" @select="onExploreSelect" />
  </div>
  <div v-else class="container">
    <IntroSection />

    <TodayTable v-if="species && species.length > 0" :species="todayRows" />
    <div v-if="loadError && !isLoadingData" class="alert alert-warning" role="alert">
      {{ $t("common.noForecast") }}
    </div>
    <div
      v-else-if="!isLoadingData && species.length && !speciesDisplay.length"
      class="alert alert-info"
      role="alert"
    >
      {{ $t("common.outOfSeason") }}
    </div>
    <div class="d-flex justify-content-between align-items-center mb-3">
      <h2 class="mb-0">{{ $t("plots.hourlyPrediction") }}</h2>
      <button class="btn btn-outline-secondary btn-sm" type="button" @click="toggleAllSpecies">
        <i :class="allCollapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
        {{ allCollapsed ? $t("plots.expandAll") : $t("plots.collapseAll") }}
      </button>
    </div>
    <div class="row">
      <div v-for="sp in speciesDisplay" :key="sp.species" class="col-12 mb-1">
        <div class="card h-100">
          <div
            class="card-header d-flex justify-content-between align-items-center"
            style="cursor: pointer"
            @click="sp.collapsed = !sp.collapsed"
          >
            <h5 :id="sp.species" class="card-title my-0 d-flex align-items-center">
              <img
                :src="`/defileViz/species_icon/${sp.species
                  .toLowerCase()
                  .replace(/\s+/g, '_')}.svg`"
                :alt="sp.species + ' icon'"
                class="me-2 flex-shrink-0"
                width="26"
                height="26"
                @error="$event.target.style.display = 'none'"
              />
              {{ $t(`species.${sp.species}`, sp.species) }}
            </h5>
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              @click="sp.collapsed = !sp.collapsed"
            >
              <i :class="sp.collapsed ? 'bi bi-chevron-down' : 'bi bi-chevron-up'"></i>
            </button>
          </div>
          <div v-if="!sp.collapsed" class="card-body">
            <div class="row">
              <div v-if="plotOptions.find((p) => p.name === 'today').show" class="col-6">
                <PlotToday
                  v-if="sp.historical[0]"
                  :historical="sp.historical[0]"
                  :forecast="sp.forecast[0]"
                  :trektellen="sp.trektellen"
                  :date="sp.date[0]"
                />
              </div>
              <div v-if="plotOptions.find((p) => p.name === 'nextDays').show" class="col-6">
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
              <div v-if="plotOptions.find((p) => p.name === 'season').show" class="col-12">
                <PlotSeason
                  v-if="sp"
                  :season="species_doy_statistics.find((s) => s.species === sp.species)"
                  :date="sp.date[0]"
                  :total-predicted="sp.forecast[0]?.predTotal"
                  :total-observed="sp.trektellen?.count"
                  :species-name="sp.species"
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
    id="settingsModal"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="exampleModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title">{{ $t("settings.title") }}</h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            :aria-label="$t('common.close')"
          ></button>
        </div>
        <div class="modal-body">
          <!-- Plot selection -->
          <div class="mb-3 form-group">
            <label for="plots">{{ $t("settings.plotsToDisplay") }}</label>
            <div id="plots" class="btn-group w-100" role="group" aria-label="Plot type selector">
              <button
                v-for="plot in plotOptions"
                :key="plot.name"
                type="button"
                class="btn btn-secondary"
                :class="{ active: plot.show }"
                @click="plot.show = !plot.show"
              >
                {{ $t(`settings.${plot.name}`) }}
              </button>
            </div>
          </div>
          <!-- Threshold input -->
          <div class="mb-3 form-group">
            <label for="thr">{{ $t("settings.threshold") }}</label>
            <input
              id="thr"
              v-model.number="medianThreshold"
              type="number"
              step="1"
              min="0"
              max="100"
              class="form-control"
              aria-describedby="thrHelp"
            />
            <small id="thrHelp" class="form-text text-muted">{{
              $t("settings.thresholdHelp")
            }}</small>
          </div>
          <!-- Next days length -->
          <div class="mb-3 form-group">
            <label for="nextDays">{{ $t("settings.nextDaysCount") }}</label>
            <input
              id="nextDays"
              v-model.number="nextDaysLength"
              type="number"
              step="1"
              min="1"
              max="7"
              class="form-control"
              aria-describedby="nextDaysHelp"
            />
            <small id="nextDaysHelp" class="form-text text-muted">{{
              $t("settings.nextDaysHelp")
            }}</small>
          </div>
          <!-- Sort selection -->
          <div class="mb-3 form-group">
            <label for="sortOption" class="form-label">{{ $t("settings.sortBy") }}</label>
            <select id="sortOption" v-model="sortOption" class="form-select">
              <option value="taxonomy">{{ $t("settings.taxonomy") }}</option>
              <option value="median">{{ $t("settings.median") }}</option>
              <option value="predicted">{{ $t("settings.predicted") }}</option>
              <option value="quantile">{{ $t("settings.quantile") }}</option>
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
import { ref, computed, watch, onMounted, onUnmounted, provide } from "vue";
import { useI18n } from "vue-i18n";
import { LANGUAGE_OPTIONS, updateLocale } from "./i18n";

// Species data
import species_doy_statistics0 from "../src/species_doy_statistics.json";
const species_doy_statistics = species_doy_statistics0.filter((sp) => sp.species !== "Merlin");

// Stats functions
import { predictQuantile } from "./utils/stats";
import { dayWindow, dayOfYear, localDateString, addDays } from "./utils/daylight";

// Fetcher service
import { fetchNetCDF } from "./services/netcdf";
import { fetchTrektellenData } from "./services/trektellen";

// Component imports
import PlotToday from "./components/PlotToday.vue";
import PlotNextDays from "./components/PlotNextDays.vue";
import PlotSeason from "./components/PlotSeason.vue";
import TodayTable from "./components/TodayTable.vue";
import PlotWeather from "./components/PlotWeather.vue";
import IntroSection from "./components/IntroSection.vue";
import Footer from "./components/Footer.vue";
import ExplorePage from "./components/explore/ExplorePage.vue";

// Constants
const QUANTILE_LEVELS = species_doy_statistics[0]?.quantile_levels || [
  1, 5, 10, 20, 30, 40, 50, 60, 70, 80, 90, 95, 99,
];
const ID_MEDIAN = QUANTILE_LEVELS.indexOf(50);
const ID_LOWER = QUANTILE_LEVELS.indexOf(20);
const ID_UPPER = QUANTILE_LEVELS.indexOf(80);

provide("ID_MEDIAN", ID_MEDIAN);
provide("ID_LOWER", ID_LOWER);
provide("ID_UPPER", ID_UPPER);

// i18n setup
const { locale } = useI18n();

// Page from the URL hash: "#explore" or "#explore/<taxon_id>" is the Explore page, anything
// else (including species anchors) the forecast.
const parseHash = () => {
  const m = window.location.hash.match(/^#explore(?:\/(.+))?$/);
  return m
    ? { page: "explore", taxon: m[1] ? decodeURIComponent(m[1]) : null }
    : { page: "forecast", taxon: null };
};
const page = ref(parseHash().page);
const exploreTaxon = ref(parseHash().taxon);
const onHashChange = () => {
  const h = parseHash();
  page.value = h.page;
  if (h.taxon) exploreTaxon.value = h.taxon;
};
const onExploreSelect = (id) => {
  const hash = `#explore/${encodeURIComponent(id)}`;
  if (window.location.hash !== hash) history.replaceState(null, "", hash);
};
window.addEventListener("hashchange", onHashChange);

// Reactive data
const species = ref([]);
const weather = ref(null);
// Dates are "YYYY-MM-DD" days at the count site (Europe/Paris), whatever the browser's time zone
const todaysDate = ref(localDateString());
const selectedDate = ref(todaysDate.value);
const isLoadingData = ref(false);
const loadError = ref(null);

// UI state
// Settings, remembered in localStorage
const SETTINGS_KEY = "defile-settings";
const savedSettings = (() => {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
})();
const plotOptions = ref(
  ["today", "nextDays", "season"].map((name) => ({
    name,
    show: savedSettings.plots?.[name] ?? true,
  })),
);
const medianThreshold = ref(savedSettings.medianThreshold ?? 0);
const nextDaysLength = ref(savedSettings.nextDaysLength ?? 4);
const sortOption = ref(savedSettings.sortOption ?? "taxonomy");

watch(
  [plotOptions, medianThreshold, nextDaysLength, sortOption],
  () => {
    const settings = {
      plots: Object.fromEntries(plotOptions.value.map((p) => [p.name, p.show])),
      medianThreshold: medianThreshold.value,
      nextDaysLength: nextDaysLength.value,
      sortOption: sortOption.value,
    };
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch {
      // Storage blocked (private mode): settings just aren't remembered
    }
  },
  { deep: true },
);

// Computed properties
const isToday = computed(() => selectedDate.value === todaysDate.value);

const speciesDisplay = computed(() => {
  const filtered = species.value.filter(
    (sp) =>
      sp.historical[0]?.median &&
      sp.historical[0].median * sp.historical[0].window.nHours > medianThreshold.value,
  );

  const sortFunctions = {
    taxonomy: () => filtered,
    median: () =>
      [...filtered].sort((a, b) => (b.historical[0]?.median || 0) - (a.historical[0]?.median || 0)),
    predicted: () =>
      [...filtered].sort(
        (a, b) => (b.forecast[0]?.predTotal || 0) - (a.forecast[0]?.predTotal || 0),
      ),
    quantile: () =>
      [...filtered].sort(
        (a, b) => (b.forecast[0]?.predTotalQuantile || 0) - (a.forecast[0]?.predTotalQuantile || 0),
      ),
  };

  return sortFunctions[sortOption.value]() || filtered;
});

const WEATHER_VARIABLES = [
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
];

const todayRows = computed(() =>
  species.value.map((sp) => ({
    species: sp.species,
    historical: sp.historical[0],
    forecast: sp.forecast[0],
    trektellen: sp.trektellen,
  })),
);

const allCollapsed = computed(() => {
  return species.value.every((sp) => sp.collapsed);
});

/**
 * Updates species data for a given date
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 */
// Incremented on every load so a slower, older load can't overwrite a newer one
let loadId = 0;

async function updateSpeciesData(dateStr) {
  const myLoad = ++loadId;
  isLoadingData.value = true;
  loadError.value = null;
  try {
    await loadSpeciesData(dateStr, () => myLoad !== loadId);
  } finally {
    if (myLoad === loadId) isLoadingData.value = false;
  }
}

async function loadSpeciesData(dateStr, isStale) {
  const doy = dayOfYear(dateStr);
  const maxDays = 14; // Limit to 14 days max
  const list = species_doy_statistics.map((sds) => {
    const sp = {
      species: sds.species,
      trektellen_species_id: sds.trektellen_species_id,
      quantile_levels: sds.quantile_levels,
      collapsed: false,
      date: [],
      historical: [],
      forecast: [],
      trektellen: {},
    };
    const id_median = sp.quantile_levels.indexOf(50);

    for (let i = 0; i < maxDays; i++) {
      const d2 = new Date(addDays(dateStr, i));
      sp.date.push(d2);

      // Historical stats only cover the season: outside it every field is null
      const idx = sds.doy.indexOf(doy + i);
      const at = (arr) => (idx >= 0 ? (arr?.[idx] ?? null) : null);
      sp.historical.push({
        quantiles: at(sds.quantiles),
        min: at(sds.min),
        max: at(sds.max),
        mean: at(sds.mean),
        ratio: at(sds.ratio),
        median: at(sds.quantiles)?.[id_median] ?? null,
        // Non-night UTC hours of that day, same rule as the forecast model's night mask
        window: dayWindow(d2),
      });
    }
    return sp;
  });

  // Forecasts, weather and Trektellen counts are independent: fetch them in parallel
  const forecastsPromise = Promise.allSettled(
    list.map(async (sp) => {
      const varsData = await fetchNetCDF(dateStr, sp.species, ["pred_log_hourly_count"]);
      // Apply transform locally: pred_log_hourly_count is exp(x) - 1
      const forecastData = (varsData.pred_log_hourly_count || []).map((row) =>
        row.map((x) => Math.exp(x) - 1),
      );
      if (!forecastData.length || !forecastData[0]?.length) throw new Error("No forecast data");

      sp.forecast = forecastData.map((arr, idx) => {
        const predTotal = (arr || []).reduce((x, y) => x + (y ?? 0), 0);
        const predTotalQuantile = predictQuantile(
          predTotal,
          // historical is birds/h: scale by that day's non-night hours to get a daily total
          sp.historical[idx]?.quantiles?.map((q) => q * sp.historical[idx].window.nHours),
          sp.quantile_levels,
        );
        return { predHourlyCount: arr, predTotal, predTotalQuantile };
      });
    }),
  );

  const weatherPromise = fetchNetCDF(dateStr, "Osprey", WEATHER_VARIABLES).catch((e) => {
    console.error("Error fetching weather data:", e);
    return null;
  });

  const trektellenPromise = fetchTrektellenData(dateStr).catch((e) => {
    console.error("Error fetching Trektellen data:", e);
    return null;
  });

  const [forecasts, weatherData, bySpecies] = await Promise.all([
    forecastsPromise,
    weatherPromise,
    trektellenPromise,
  ]);
  if (isStale()) return;

  const failed = forecasts.filter((r) => r.status === "rejected");
  failed.forEach((r) => console.error("Failed to fetch forecast:", r.reason));
  if (failed.length === forecasts.length) loadError.value = "noForecast";

  if (bySpecies && Object.keys(bySpecies).length > 0) {
    for (const sp of list) {
      const obsList = bySpecies[String(sp.trektellen_species_id)] || [];
      const count = obsList.reduce((sum, o) => sum + (o?.left ?? 0), 0);
      sp.trektellen = {
        observations: obsList,
        count,
        totalQuantile: predictQuantile(
          count,
          // historical is birds/h: scale by the day's non-night hours to get a daily total
          sp.historical[0].quantiles?.map((q) => q * sp.historical[0].window.nHours),
          sp.quantile_levels,
        ),
      };
    }
  }

  // Keep the user's collapsed/expanded choice across date changes
  const collapsed = new Map(species.value.map((sp) => [sp.species, sp.collapsed]));
  list.forEach((sp) => (sp.collapsed = collapsed.get(sp.species) ?? false));

  species.value = list;
  weather.value = weatherData;
}

/**
 * Changes the selected date by a specified number of days
 * @param {number} days - Number of days to add (positive) or subtract (negative)
 */
function changeDateByDays(days) {
  if (isLoadingData.value) return;

  const newDateStr = addDays(selectedDate.value, days);

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
function onPopstate() {
  handleUrlParameters(new URLSearchParams(window.location.search));
}

// "Today" moves on at midnight in Paris: refresh it when the tab comes back or periodically
function refreshToday() {
  todaysDate.value = localDateString();
}
let todayTimer;

onMounted(() => {
  // A date from the URL triggers the selectedDate watcher, which loads the data
  const initialDate = selectedDate.value;
  handleUrlParameters(new URLSearchParams(window.location.search));
  if (selectedDate.value === initialDate) updateSpeciesData(initialDate);

  // Handle browser back/forward navigation
  window.addEventListener("popstate", onPopstate);
  document.addEventListener("visibilitychange", refreshToday);
  todayTimer = setInterval(refreshToday, 10 * 60 * 1000);
});

onUnmounted(() => {
  window.removeEventListener("popstate", onPopstate);
  document.removeEventListener("visibilitychange", refreshToday);
  clearInterval(todayTimer);
});

/**
 * Handle URL parameters for both initial load and popstate events
 * @param {URLSearchParams} urlParams - URL search parameters
 */
function handleUrlParameters(urlParams) {
  const supportedLocales = LANGUAGE_OPTIONS.map((lang) => lang.code);

  // Handle date parameter; no (valid) date means today
  const dateParam = urlParams.get("date");
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(dateParam ?? "") &&
    !isNaN(new Date(dateParam)) &&
    dateParam <= todaysDate.value;
  selectedDate.value = validDate ? dateParam : todaysDate.value;

  // Handle language parameter
  const langParam = urlParams.get("lang");
  if (langParam && supportedLocales.includes(langParam) && locale.value !== langParam) {
    locale.value = langParam;
    updateLocale(langParam);
  }
}

/**
 * Push a history entry for a new date/language, unless the URL already says so (initial load,
 * back/forward): pushing then would add an entry on every back press and trap the user.
 */
function pushUrl(param, value, isDefault) {
  const url = new URL(window.location);
  const current = url.searchParams.get(param);
  if (current === value || (current === null && isDefault)) return;
  url.searchParams.set(param, value);
  window.history.pushState({ date: selectedDate.value, lang: locale.value }, "", url);
}

// Watchers
watch(selectedDate, (newDate) => {
  updateSpeciesData(newDate);
  pushUrl("date", newDate, newDate === todaysDate.value);
});

watch(locale, (newLocale) => {
  updateLocale(newLocale);
  pushUrl("lang", newLocale, false);
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
