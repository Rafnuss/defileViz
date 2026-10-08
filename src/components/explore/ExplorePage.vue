<template>
  <div class="mt-3">
    <h2>{{ $t("explore.title") }}</h2>
    <p class="text-muted">{{ $t("explore.intro") }}</p>

    <div class="row g-2 align-items-end mb-3">
      <div class="col-md-6">
        <label for="exploreTaxon" class="form-label mb-1">{{ $t("explore.species") }}</label>
        <select id="exploreTaxon" v-model="taxonId" class="form-select">
          <option v-for="tx in options" :key="tx.taxon_id" :value="tx.taxon_id">
            {{ taxonName(tx, locale) }}
          </option>
        </select>
      </div>
      <div class="col-md-6 text-md-end">
        <div class="form-check form-switch d-inline-block">
          <input id="exploreLog" v-model="logScale" class="form-check-input" type="checkbox" />
          <label class="form-check-label" for="exploreLog">{{ $t("explore.logScale") }}</label>
        </div>
      </div>
    </div>

    <div v-if="loadError" class="alert alert-warning">{{ loadError }}</div>
    <div v-else-if="!data" class="text-muted">{{ $t("explore.loading") }}</div>
    <div v-else-if="!trend" class="alert alert-info">{{ $t("explore.noTrend") }}</div>

    <template v-else>
      <h4 class="mb-1">
        {{ taxonName(taxon, locale) }}
        <small class="text-muted fst-italic">{{ taxon.scientific_name }}</small>
      </h4>
      <p class="text-muted small mb-3">{{ $t("explore.since", { year: trend.first_year }) }}</p>

      <div class="row g-2 mb-3">
        <div class="col-sm-4">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="text-muted small">{{ $t("explore.lastYear", { year: last.year }) }}</div>
              <div class="fs-4 fw-bold">{{ fmt(last.total) }}</div>
              <div class="small">
                {{ fmt(last["q10"]) }}–{{ fmt(last["q90"]) }} ({{ $t("explore.interval80") }})
              </div>
              <div class="small text-muted">
                {{ fmt(last.observed) }} {{ $t("explore.counted") }},
                {{ Math.round(last.observed_share * 100) }}% {{ $t("explore.shareCounted") }}
              </div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="text-muted small">
                {{ $t("explore.change", { year: trend.first_year }) }}
              </div>
              <div class="fs-4 fw-bold" :class="change >= 1 ? 'text-success' : 'text-danger'">
                {{ changeLabel }}
              </div>
              <div class="small text-muted">{{ $t("explore.trend") }}</div>
            </div>
          </div>
        </div>
        <div class="col-sm-4">
          <div class="card h-100">
            <div class="card-body py-2">
              <div class="text-muted small">{{ $t("explore.passageTitle") }}</div>
              <div class="fs-4 fw-bold">{{ doyLabel(passageLast.mid, locale) }}</div>
              <div class="small text-muted">
                {{ trend.first_year }}: {{ doyLabel(passageFirst.mid, locale) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="card mb-3">
        <div class="card-body">
          <h6 class="text-muted">{{ $t("explore.annualTitle") }}</h6>
          <PlotAnnual :annual="trend.annual" :log="logScale" />
        </div>
      </div>
      <div class="row g-3 mb-3">
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="text-muted mb-0">{{ $t("explore.passageTitle") }}</h6>
              <p class="small text-muted">{{ $t("explore.passageHelp") }}</p>
              <PlotPassage :passage="trend.passage" />
            </div>
          </div>
        </div>
        <div class="col-lg-6">
          <div class="card h-100">
            <div class="card-body">
              <h6 class="text-muted mb-0">{{ $t("explore.seasonTitle") }}</h6>
              <p class="small text-muted">{{ $t("explore.seasonHelp") }}</p>
              <PlotSeasonShape :season="trend.season" />
            </div>
          </div>
        </div>
      </div>
      <p class="small text-muted">{{ $t("explore.method") }}</p>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { fetchTaxa, fetchSpecies, doyLabel, taxonName } from "../../services/explore";
import PlotAnnual from "./PlotAnnual.vue";
import PlotPassage from "./PlotPassage.vue";
import PlotSeasonShape from "./PlotSeasonShape.vue";

const { locale } = useI18n();

const props = defineProps({
  // taxon_id from the URL (#explore/<taxon_id>), if any
  initialTaxon: { type: String, default: null },
});
const emit = defineEmits(["select"]);

// Taxa with a trend in the export (src/explore/trend.py TREND_RANKS, full tier)
const TREND_RANKS = ["species", "combined"];
const DEFAULT_TAXON = "Red Kite";

const taxa = ref([]);
const taxonId = ref(props.initialTaxon);
const data = ref(null);
const loadError = ref(null);
const logScale = ref(false);

const options = computed(() =>
  taxa.value
    .filter((tx) => tx.tier === "full" && TREND_RANKS.includes(tx.taxon_rank))
    .sort((a, b) => taxonName(a, locale.value).localeCompare(taxonName(b, locale.value))),
);
const taxon = computed(() => taxa.value.find((tx) => tx.taxon_id === taxonId.value));
const trend = computed(() => data.value?.trend ?? null);
const last = computed(() => trend.value.annual.at(-1));
const passageFirst = computed(() => trend.value.passage[0]);
const passageLast = computed(() => trend.value.passage.at(-1));
const change = computed(() => last.value.smooth / trend.value.annual[0].smooth);
const changeLabel = computed(() => {
  const c = change.value;
  if (!isFinite(c)) return "–";
  return c >= 2 || c <= 0.5
    ? `×${c.toFixed(c < 1 ? 2 : 1)}`
    : `${c >= 1 ? "+" : ""}${Math.round((c - 1) * 100)}%`;
});

const fmt = (x) => (x == null ? "–" : Math.round(x).toLocaleString(locale.value));

onMounted(async () => {
  try {
    taxa.value = await fetchTaxa();
    if (!taxon.value) {
      taxonId.value = (
        options.value.find((tx) => tx.english_name === DEFAULT_TAXON) ?? options.value[0]
      )?.taxon_id;
    }
  } catch (e) {
    loadError.value = String(e);
  }
});

watch(
  taxonId,
  async (id) => {
    if (!id) return;
    emit("select", id);
    data.value = null;
    loadError.value = null;
    try {
      const d = await fetchSpecies(id);
      if (taxonId.value === id) data.value = d;
    } catch (e) {
      loadError.value = String(e);
    }
  },
  { immediate: true },
);
</script>
