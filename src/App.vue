<template>
  <header class="site-header">
    <div class="container header-row">
      <a class="brand" href="#">
        <img src="/defile_logo_72.webp" alt="" width="40" height="40" />
        <span class="brand-text">
          <span class="brand-name">Défilé de l'Ecluse</span>
          <span class="brand-sub">{{ $t("nav.subtitle") }}</span>
        </span>
      </a>
      <nav class="page-tabs" :aria-label="$t('nav.pages')">
        <a
          href="#"
          :class="{ active: page === 'forecast' }"
          :aria-current="page === 'forecast' ? 'page' : null"
          >{{ $t("nav.forecast") }}</a
        >
        <a
          href="#explore"
          :class="{ active: page === 'explore' }"
          :aria-current="page === 'explore' ? 'page' : null"
          >{{ $t("nav.explore") }}</a
        >
      </nav>
      <div class="header-end">
        <a
          href="https://github.com/AmedeeRoy/defile-migration-forecast"
          target="_blank"
          rel="noopener"
          class="icon-link-btn"
          :title="$t('footer.modelRepo') + ' (GitHub)'"
          :aria-label="$t('footer.modelRepo') + ' (GitHub)'"
        >
          <i class="bi bi-github"></i>
        </a>
        <select
          v-model="locale"
          class="form-select form-select-sm lang-select"
          aria-label="Language"
        >
          <option v-for="lang in LANGUAGE_OPTIONS" :key="lang.code" :value="lang.code">
            {{ lang.shortName }}
          </option>
        </select>
      </div>
    </div>
  </header>

  <main>
    <div v-if="page === 'explore'" class="container">
      <ExplorePage :initial-taxon="exploreTaxon" @select="onExploreSelect" />
    </div>
    <div v-else class="container">
      <!-- The day shown, its count on Trektellen and the display settings -->
      <div class="toolbar">
        <div class="date-nav">
          <button
            class="btn btn-outline-secondary btn-sm"
            :disabled="isLoadingData"
            :title="$t('common.previousDay')"
            :aria-label="$t('common.previousDay')"
            @click="changeDateByDays(-1)"
          >
            <i class="bi bi-chevron-left"></i>
          </button>
          <input
            v-model="selectedDate"
            type="date"
            :disabled="isLoadingData"
            :max="todaysDate"
            class="form-control form-control-sm date-input"
            :aria-label="$t('plots.date')"
          />
          <button
            class="btn btn-outline-secondary btn-sm"
            :disabled="isLoadingData || isToday"
            :title="$t('common.nextDay')"
            :aria-label="$t('common.nextDay')"
            @click="changeDateByDays(1)"
          >
            <i class="bi bi-chevron-right"></i>
          </button>
          <button
            v-if="!isToday"
            class="btn btn-link btn-sm"
            :disabled="isLoadingData"
            @click="selectedDate = todaysDate"
          >
            {{ $t("common.today") }}
          </button>
          <span class="spinner-slot">
            <span
              v-show="isLoadingData"
              class="spinner-border spinner-border-sm"
              role="status"
              :aria-label="$t('common.loading')"
            ></span>
          </span>
        </div>
        <div class="toolbar-end">
          <a
            :href="`https://www.trektellen.org/count/view/2422/${selectedDate.replace(/-/g, '')}`"
            target="_blank"
            rel="noopener"
            class="btn btn-outline-secondary btn-sm"
          >
            <img src="/trektellen_logo.png" alt="" class="btn-logo" />
            {{ $t("nav.countOnTrektellen") }}
            <i class="bi bi-box-arrow-up-right small ms-1"></i>
          </a>
          <button
            class="btn btn-outline-secondary btn-sm"
            data-bs-toggle="modal"
            data-bs-target="#settingsModal"
          >
            <i class="bi bi-sliders me-1"></i>{{ $t("nav.settings") }}
          </button>
        </div>
      </div>

      <div v-if="loadError && !isLoadingData" class="alert alert-warning load-alert" role="alert">
        <i class="bi bi-exclamation-triangle me-2"></i>{{ $t("common.noForecast") }}
      </div>

      <IntroSection />

      <TodayOverview v-if="speciesDisplay.length" :species="todayRows" />
      <div
        v-if="!isLoadingData && species.length && !speciesDisplay.length"
        class="alert alert-info"
        role="alert"
      >
        {{ $t("common.outOfSeason") }}
      </div>

      <div v-if="speciesDisplay.length" class="section-head">
        <h2>{{ $t("plots.hourlyPrediction") }}</h2>
        <button
          class="btn btn-outline-secondary btn-sm ms-auto"
          type="button"
          @click="toggleAllSpecies"
        >
          <i :class="allCollapsed ? 'bi bi-arrows-expand' : 'bi bi-arrows-collapse'"></i>
          {{ allCollapsed ? $t("plots.expandAll") : $t("plots.collapseAll") }}
        </button>
        <p class="section-note">
          <span class="swatch predicted"></span>{{ $t("plots.forecast") }}
          <span class="swatch counted ms-3"></span>{{ $t("table.counted") }}
          <span class="swatch band ms-3"></span>{{ $t("plots.pastYears") }}
        </p>
      </div>
      <div
        v-for="sp in speciesDisplay"
        :key="sp.species"
        class="card species-card"
        :class="{ collapsed: sp.collapsed }"
      >
        <button
          type="button"
          class="species-head"
          :aria-expanded="!sp.collapsed"
          @click="sp.collapsed = !sp.collapsed"
        >
          <img
            :src="`/defileViz/species_icon/${sp.species.toLowerCase().replace(/\s+/g, '_')}.svg`"
            alt=""
            width="28"
            height="28"
            @error="$event.target.style.display = 'none'"
          />
          <h3 :id="sp.species">{{ $t(`species.${sp.species}`, sp.species) }}</h3>
          <span class="species-totals tnum">
            <span v-if="sp.forecast[0]?.predTotal != null" class="total predicted">
              <span class="swatch predicted"></span>{{ fmtTotal(sp.forecast[0].predTotal) }}
              {{ $t("table.predicted").toLowerCase() }}
            </span>
            <span v-if="sp.trektellen?.count > 0" class="total counted">
              <span class="swatch counted"></span>{{ sp.trektellen.count }}
              {{ $t("table.counted").toLowerCase() }}
            </span>
          </span>
          <i class="bi bi-chevron-down chevron"></i>
        </button>
        <div v-if="!sp.collapsed" class="card-body">
          <div class="row g-4">
            <div v-if="plotOptions.find((p) => p.name === 'today').show" class="col-lg-6">
              <PlotToday
                v-if="sp.historical[0]"
                :historical="sp.historical[0]"
                :forecast="sp.forecast[0]"
                :trektellen="sp.trektellen"
                :date="sp.date[0]"
              />
            </div>
            <div v-if="plotOptions.find((p) => p.name === 'nextDays').show" class="col-lg-6">
              <PlotNextDays
                v-if="
                  sp.historical && sp.historical.length > 1 && sp.forecast && sp.forecast.length > 1
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

      <PlotWeather v-if="weather" :weather="weather" />
    </div>
  </main>

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
          <div class="mb-4">
            <label for="plots" class="form-label">{{ $t("settings.plotsToDisplay") }}</label>
            <div id="plots" class="btn-group w-100" role="group" aria-label="Plot type selector">
              <button
                v-for="plot in plotOptions"
                :key="plot.name"
                type="button"
                class="btn"
                :class="plot.show ? 'btn-secondary' : 'btn-outline-secondary'"
                :aria-pressed="plot.show"
                @click="plot.show = !plot.show"
              >
                <i :class="plot.show ? 'bi bi-check-lg' : 'bi bi-dash'" class="me-1"></i>
                {{ $t(`settings.${plot.name}`) }}
              </button>
            </div>
          </div>
          <!-- Species filter -->
          <div class="mb-4">
            <div class="form-check form-switch">
              <input
                id="thrOn"
                v-model="medianFilter"
                class="form-check-input"
                type="checkbox"
                role="switch"
              />
              <label class="form-check-label" for="thrOn">{{ $t("settings.threshold") }}</label>
            </div>
            <div class="input-group input-group-sm threshold-input mt-2">
              <span class="input-group-text">{{ $t("settings.thresholdAbove") }}</span>
              <input
                id="thr"
                v-model.number="medianThreshold"
                type="number"
                step="1"
                min="0"
                class="form-control"
                :disabled="!medianFilter"
                aria-describedby="thrHelp"
              />
              <span class="input-group-text">{{ $t("settings.birds") }}</span>
            </div>
            <small id="thrHelp" class="form-text text-muted">{{
              $t("settings.thresholdHelp")
            }}</small>
          </div>
          <!-- Next days length -->
          <div class="mb-4">
            <label for="nextDays" class="form-label d-flex">
              {{ $t("settings.nextDaysCount") }}
              <strong class="ms-auto tnum">{{ nextDaysLength }}</strong>
            </label>
            <input
              id="nextDays"
              v-model.number="nextDaysLength"
              type="range"
              step="1"
              min="1"
              max="7"
              class="form-range"
              aria-describedby="nextDaysHelp"
            />
            <div class="range-ticks tnum" aria-hidden="true">
              <span v-for="n in 7" :key="n">{{ n }}</span>
            </div>
            <small id="nextDaysHelp" class="form-text text-muted">{{
              $t("settings.nextDaysHelp")
            }}</small>
          </div>
          <!-- Sort selection -->
          <div class="mb-2">
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
import { ref, computed, watch, onMounted, onUnmounted, provide, defineAsyncComponent } from "vue";
import { useI18n } from "vue-i18n";
import { LANGUAGE_OPTIONS, updateLocale } from "./i18n";

// Species data
import species_doy_statistics0 from "../src/species_doy_statistics.json";
const species_doy_statistics = species_doy_statistics0
  .filter((sp) => sp.species !== "Merlin")
  .sort((a, b) => taxonomicRank(a.species) - taxonomicRank(b.species));

import { localDateString, addDays } from "./utils/daylight";
import { loadSpeciesData } from "./services/forecast";
import { useSettings } from "./composables/useSettings";
import { useHashRoute } from "./composables/useHashRoute";

// Component imports
import PlotToday from "./components/PlotToday.vue";
import PlotNextDays from "./components/PlotNextDays.vue";
import PlotSeason from "./components/PlotSeason.vue";
import TodayOverview from "./components/TodayOverview.vue";
import PlotWeather from "./components/PlotWeather.vue";
import { taxonomicRank } from "./utils/taxonomy.js";
import IntroSection from "./components/IntroSection.vue";
import Footer from "./components/Footer.vue";
// Explore is only needed on #explore: keep it (and KaTeX) out of the forecast page's first load
const ExplorePage = defineAsyncComponent(() => import("./components/explore/ExplorePage.vue"));

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

const { page, exploreTaxon, onExploreSelect } = useHashRoute();

// Reactive data
const species = ref([]);
const weather = ref(null);
// Dates are "YYYY-MM-DD" days at the count site (Europe/Paris), whatever the browser's time zone
const todaysDate = ref(localDateString());
const selectedDate = ref(todaysDate.value);
const isLoadingData = ref(false);
const loadError = ref(null);

const { plotOptions, medianFilter, medianThreshold, nextDaysLength, sortOption } = useSettings();

// Computed properties
const isToday = computed(() => selectedDate.value === todaysDate.value);

const speciesDisplay = computed(() => {
  // One filter and one order for both the overview and the hourly cards
  const filtered = medianFilter.value
    ? species.value.filter(
        (sp) =>
          sp.historical[0]?.median &&
          sp.historical[0].median * sp.historical[0].window.nHours > medianThreshold.value,
      )
    : species.value;

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

const todayRows = computed(() =>
  speciesDisplay.value.map((sp) => ({
    species: sp.species,
    historical: sp.historical[0],
    forecast: sp.forecast[0],
    trektellen: sp.trektellen,
  })),
);

// Daily totals in the species headers: whole birds, or one decimal below one bird
const fmtTotal = (x) => (x >= 1 ? Math.round(x) : x.toFixed(1));

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
    await loadData(dateStr, () => myLoad !== loadId);
  } finally {
    if (myLoad === loadId) isLoadingData.value = false;
  }
}

async function loadData(dateStr, isStale) {
  const {
    list,
    weather: weatherData,
    noForecast,
  } = await loadSpeciesData(dateStr, species_doy_statistics);
  if (isStale()) return;
  if (noForecast) loadError.value = "noForecast";

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
/* Header: the site, its pages, the language */
.site-header {
  position: sticky;
  top: 0;
  z-index: 1030;
  background: rgba(255, 255, 255, 0.94);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--dv-line);
}
.header-row {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  min-height: var(--dv-header-h);
}
.brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--dv-ink);
  text-decoration: none;
}
.brand:hover {
  color: var(--dv-ink);
}
.brand-text {
  display: flex;
  flex-direction: column;
  line-height: 1.15;
}
.brand-name {
  font-weight: 700;
  font-size: 1.05rem;
}
.brand-sub {
  font-size: 0.75rem;
  color: var(--dv-muted);
}
.page-tabs {
  display: flex;
  align-self: stretch;
  gap: 1.25rem;
}
.page-tabs a {
  display: flex;
  align-items: center;
  color: var(--dv-muted);
  font-weight: 550;
  text-decoration: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
}
.page-tabs a:hover {
  color: var(--dv-ink);
}
.page-tabs a.active {
  color: var(--dv-ink);
  border-bottom-color: var(--dv-accent);
}
.header-end {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.icon-link-btn {
  color: var(--dv-muted);
  font-size: 1.25rem;
  line-height: 1;
}
.icon-link-btn:hover {
  color: var(--dv-ink);
}
.lang-select {
  width: auto;
  min-width: 4.25rem;
  padding-right: 1.75rem;
  background-color: transparent;
}

/* The day's forecast is missing: said right under the date */
.load-alert {
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}

/* Settings */
.threshold-input {
  max-width: 16rem;
}
.range-ticks {
  display: flex;
  justify-content: space-between;
  padding: 0 0.3rem;
  margin-top: -0.35rem;
  font-size: 0.75rem;
  color: var(--dv-faint);
}

/* Forecast toolbar: sticks under the header */
.toolbar {
  position: sticky;
  top: var(--dv-header-h);
  z-index: 1020;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  padding: 0.6rem 0;
  background: var(--dv-paper);
  border-bottom: 1px solid var(--dv-line);
  margin-bottom: 1rem;
}
.date-nav,
.toolbar-end {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.toolbar-end {
  margin-left: auto;
  gap: 0.5rem;
}
.date-input {
  width: auto;
  min-width: 9.5rem;
  text-align: center;
  font-variant-numeric: tabular-nums;
}
.spinner-slot {
  display: inline-flex;
  width: 1.25rem;
  color: var(--dv-muted);
}
.btn-logo {
  height: 16px;
  width: auto;
  margin-right: 0.3rem;
  vertical-align: -0.15rem;
}

/* Species cards */
.species-card {
  margin-bottom: 0.5rem;
  overflow: hidden;
}
.species-head {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  width: 100%;
  padding: 0.6rem 1rem;
  background: none;
  border: 0;
  text-align: left;
  color: inherit;
}
.species-head:hover {
  background: var(--dv-surface-2);
}
.species-head h3 {
  font-size: 1rem;
  margin: 0;
}
.species-totals {
  margin-left: auto;
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--dv-muted);
}
.chevron {
  color: var(--dv-faint);
  transition: transform 0.15s;
  transform: rotate(180deg);
}
.collapsed .chevron {
  transform: none;
}
.species-card .card-body {
  border-top: 1px solid var(--dv-line);
}

@media (max-width: 575.98px) {
  .header-row {
    gap: 0.75rem;
  }
  .brand-sub,
  .icon-link-btn {
    display: none;
  }
  .brand-name {
    font-size: 0.95rem;
  }
  .page-tabs {
    gap: 0.75rem;
  }
  .brand img {
    width: 34px;
    height: 34px;
  }
  .toolbar {
    position: static;
  }
  .toolbar-end {
    margin-left: 0;
  }
  .species-totals .total:not(:first-child) {
    display: none;
  }
}

/* Anchor links land below the sticky header and toolbar */
:target {
  scroll-margin-top: 120px;
}
</style>
