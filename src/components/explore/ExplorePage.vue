<template>
  <div class="mt-3 explore">
    <div v-if="loadError" class="alert alert-warning">{{ loadError }}</div>

    <!-- The species: picker, links and its general account -->
    <div class="card species-box mb-3">
      <div class="card-body">
        <div class="picker-wrap mx-auto">
          <SpeciesPicker v-model="taxonId" :taxa="options" />
          <TaxonMembers v-if="taxon" :taxon="taxon" :taxa="taxa" @select="(id) => (taxonId = id)" />
          <div v-if="data" class="links d-flex flex-wrap justify-content-center gap-1 mt-2">
            <a
              v-for="(url, k) in links"
              :key="k"
              :href="url"
              target="_blank"
              rel="noopener"
              class="btn btn-sm btn-outline-secondary link-btn"
            >
              <i :class="`bi ${LINKS[k]?.icon ?? 'bi-box-arrow-up-right'} me-1`"></i
              >{{ LINKS[k]?.label ?? k }}
            </a>
          </div>
        </div>
        <div v-if="data" class="account mx-auto mt-3">
          <AuthoredText
            v-if="account('passage')"
            :label="$t('explore.account.passage')"
            :text="account('passage')"
          />
        </div>
      </div>
    </div>

    <div v-if="!data && !loadError" class="text-muted">{{ $t("explore.loading") }}</div>

    <template v-if="data">
      <div class="row g-2 mb-4">
        <div v-for="k in keyCards" :key="k.title" class="col-6 col-lg">
          <div class="card h-100 key" :class="{ caveat: k.caveat }">
            <div class="card-body py-2">
              <div class="text-muted small">{{ k.title }}</div>
              <div class="fs-5 fw-bold" :class="k.cls">{{ k.value }}</div>
              <div class="small text-muted">{{ k.sub }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 1. When to see it -->
      <section class="mb-4">
        <h4 class="section-title">{{ $t("explore.when.title") }}</h4>
        <div class="row g-3">
          <div v-if="hasChances" class="col-lg-6">
            <div class="card h-100">
              <div class="card-body">
                <FigureHead
                  :title="$t('explore.when.season')"
                  :result="passageRange"
                  :caption="
                    $t(seasonFilled ? 'explore.when.seasonHelpFilled' : 'explore.when.seasonHelp', {
                      from: data.season.chances.years[0],
                      to: data.season.chances.years[1],
                    })
                  "
                  @info="openMethod('shown', 'm-chances')"
                />
                <ClaimNote
                  :data="data"
                  :elements="['season.chances']"
                  @method="openMethod('reliability', 'm-classes')"
                />
                <PlotChances :chances="data.season.chances" :passage="passageShown" />
              </div>
            </div>
          </div>
          <div class="col-lg-6">
            <div class="card h-100">
              <div class="card-body">
                <FigureHead
                  :title="$t('explore.when.day')"
                  :result="bestHours"
                  :caption="
                    data.daytime?.hours
                      ? $t('explore.when.dayHelp', { ...mainSpan, date: dayDate, zone: dayZone })
                      : null
                  "
                  @info="openMethod('coverage', 'm-profile')"
                />
                <template v-if="data.daytime?.hours">
                  <PlotDaytime
                    :hours="data.daytime.hours"
                    :expected="data.daytime.expected"
                    :shift="dayShift"
                  />
                  <p v-if="daytimeShift" class="small mb-0">{{ daytimeShift }}</p>
                </template>
                <p v-else class="small text-muted">{{ $t("explore.when.noTimed") }}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 2. How many each year -->
      <section class="mb-4">
        <h4 class="section-title">{{ $t("explore.many.title") }}</h4>
        <div class="card">
          <div class="card-body">
            <FigureHead
              :title="$t('explore.many.figure')"
              :result="manyResult"
              :caption="$t('explore.many.help', { window: windowText })"
              @info="openMethod('model', 'm-fill')"
            />
            <ClaimNote
              :data="data"
              :elements="['trend.annual.total', 'trend.annual.smooth']"
              @method="openMethod('reliability', 'm-classes')"
            />
            <p v-if="!trend" class="small text-muted mb-1">{{ $t("explore.many.noTrend") }}</p>
            <PlotAnnual
              :annual="annualRows"
              :totals="fate(data, 'trend.annual.total')"
              :smooth="fate(data, 'trend.annual.smooth')"
              :estimated="data.reliability?.estimated_years ?? []"
              :selected="selectedYear"
              @select="(y) => (selectedYear = y)"
            />
            <AuthoredText
              v-if="account('evolution')"
              class="intro mt-2"
              :label="$t('explore.account.evolution')"
              :text="account('evolution')"
            />
            <div v-if="selectedRow" class="year-panel">
              <div class="d-flex flex-wrap align-items-baseline gap-3 mb-1">
                <span class="fs-5 fw-bold">{{ selectedYear }}</span>
                <span class="small"
                  ><strong>{{ fmt(selectedRow.observed) }}</strong>
                  {{ $t("explore.many.countedShort") }}</span
                >
                <span v-if="selectedRow.total != null && totalsShown" class="small"
                  ><strong>{{ fmt(selectedRow.total) }}</strong>
                  {{ $t("explore.many.estimatedShort") }} ({{ fmt(selectedRow["q10"]) }}–{{
                    fmt(selectedRow["q90"])
                  }})</span
                >
                <span class="small text-muted ms-auto">
                  <i class="bi bi-hand-index me-1"></i>{{ $t("explore.many.clickYear") }}
                </span>
              </div>
              <p class="small text-muted mb-1">{{ $t("explore.many.daysHelp") }}</p>
              <PlotYearDays
                v-if="trend?.days"
                :days="trend.days"
                :year="selectedYear"
                :totals="fate(data, 'trend.days.total')"
              />
              <AuthoredText v-if="selectedAccount" :text="selectedAccount" />
              <p v-else class="small text-muted mb-0">{{ $t("explore.many.noAccount") }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- 3. Has the timing changed -->
      <section v-if="data.season?.years?.length" class="mb-4">
        <h4 class="section-title">{{ $t("explore.timing.title") }}</h4>
        <div class="card">
          <div class="card-body">
            <FigureHead
              :title="$t('explore.timing.figure')"
              :result="timingShift"
              :caption="$t(seasonFilled ? 'explore.timing.helpFilled' : 'explore.timing.help')"
              @info="openMethod('shown', 'm-dates')"
            />
            <ClaimNote
              :data="data"
              :elements="['season.share', 'season.passage', 'trend.passage_q']"
              @method="openMethod('reliability', 'm-classes')"
            />
            <PlotPhenology :season="data.season" :smooth="smoothShown ? trend.passage_q : null" />
          </div>
        </div>
      </section>

      <!-- 4. Who passes -->
      <section v-if="data.age || data.sex" class="mb-4">
        <h4 class="section-title">{{ $t("explore.who.title") }}</h4>
        <div class="row g-3">
          <div v-for="b in demography" :key="b.key" class="col-lg-6">
            <div class="card h-100">
              <div class="card-body">
                <FigureHead
                  :title="b.title"
                  :result="`${Math.round(b.block.overall.share * 100)}%`"
                  :caption="
                    b.block.display === 'pooled'
                      ? $t('explore.who.pooledHelp', {
                          n: fmt(b.block.overall.n),
                          years: yearSpan(b.block.years),
                          lo: Math.round(b.block.overall.lo * 100),
                          hi: Math.round(b.block.overall.hi * 100),
                        })
                      : b.help
                  "
                  @info="openMethod('demography')"
                />
                <template v-if="b.block.display === 'pooled'">
                  <div class="share-bar mt-2" role="img" :aria-label="b.title">
                    <div
                      class="share-a"
                      :style="{ width: `${b.block.overall.share * 100}%`, background: b.color }"
                    >
                      {{ b.classes[0] }} {{ Math.round(b.block.overall.share * 100) }}%
                    </div>
                    <div class="share-b">
                      {{ b.classes[1] }} {{ Math.round((1 - b.block.overall.share) * 100) }}%
                    </div>
                  </div>
                </template>
                <PlotShare v-else :block="b.block" :color="b.color" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 5. Memorable days -->
      <section class="mb-4">
        <h4 class="section-title">{{ $t("explore.days.title") }}</h4>
        <AuthoredText
          v-if="account('particularites')"
          class="intro"
          :label="$t('explore.account.particularites')"
          :text="account('particularites')"
        />
        <p class="small text-muted mb-1">
          {{ $t("explore.days.help", { year: firstYear }) }}
        </p>
        <div class="table-responsive">
          <table class="table table-sm align-top days-table">
            <thead>
              <tr>
                <th class="text-nowrap">{{ $t("explore.days.date") }}</th>
                <th class="text-end">{{ $t("explore.days.birds") }}</th>
                <th>{{ $t("explore.days.written") }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in records" :key="r.date">
                <td class="text-nowrap">
                  <a v-if="r.trektellen" :href="r.trektellen" target="_blank" rel="noopener">{{
                    dateLabel(r.date)
                  }}</a>
                  <span v-else>{{ dateLabel(r.date) }}</span>
                </td>
                <td class="text-end fw-bold">{{ fmt(r.count) }}</td>
                <td class="notes">
                  <p v-for="(n, i) in r.notes" :key="i" class="mb-1">
                    {{ n.text }}
                    <span v-if="n.ref" class="text-muted text-nowrap">({{ n.ref }})</span>
                  </p>
                  <span v-if="!r.notes.length" class="text-muted">–</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <!-- How it's made -->
      <section class="mb-4">
        <h4 class="section-title">{{ $t("explore.method.title") }}</h4>
        <MethodFlow @open="(k) => openMethod(k)" />
      </section>

      <Teleport to="body">
        <MethodModal
          ref="method"
          :name="taxon ? taxonName(taxon, locale) : ''"
          :data="data"
          :effort="effort"
        />
      </Teleport>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import {
  fetchTaxa,
  fetchSpecies,
  fetchEffort,
  doyLabel,
  doyDate,
  taxonName,
  isGroup,
  LINKS,
  linksOf,
  solarShift,
  clock,
  fate,
} from "../../services/explore";
import { COLORS } from "../../theme.js";
import AuthoredText from "./AuthoredText.vue";
import PlotAnnual from "./PlotAnnual.vue";
import PlotChances from "./PlotChances.vue";
import PlotDaytime from "./PlotDaytime.vue";
import PlotPhenology from "./PlotPhenology.vue";
import PlotShare from "./PlotShare.vue";
import PlotYearDays from "./PlotYearDays.vue";
import ClaimNote from "./ClaimNote.vue";
import MethodFlow from "./MethodFlow.vue";
import MethodModal from "./methods/MethodModal.vue";
import SpeciesPicker from "./SpeciesPicker.vue";
import TaxonMembers from "./TaxonMembers.vue";
import FigureHead from "./FigureHead.vue";

const { t, locale } = useI18n();

const props = defineProps({
  // taxon_id from the URL (#explore/<taxon_id>), if any
  initialTaxon: { type: String, default: null },
});
const emit = defineEmits(["select"]);

const DEFAULT_TAXON = "Red Kite";
const RECORDS = 10;

const taxa = ref([]);
const taxonId = ref(props.initialTaxon);
const data = ref(null);
const effort = ref(null);
const loadError = ref(null);
const method = ref(null);
const openMethod = (topic, section) => method.value?.open(topic, section);

// Full-tier taxa: those counted on enough days for a page
const options = computed(() => taxa.value.filter((tx) => tx.tier === "full"));
const taxon = computed(() => taxa.value.find((tx) => tx.taxon_id === taxonId.value));
// The taxon's external pages; a group's Trektellen graph is of one of its ids only, so not shown
const links = computed(() => {
  const all = data.value?.links ?? {};
  return group.value ? linksOf({ ...taxon.value, links: all }) : all;
});
const group = computed(() => taxon.value && isGroup(taxon.value));
const trend = computed(() => data.value?.trend ?? null);
// The season block from the trend's gap-filled days (defile-explore `season.source`), else counts
const seasonFilled = computed(() => data.value?.season?.source === "gam");
const startYear = computed(() => data.value.settings.start_year.value);
const firstYear = computed(() => taxon.value?.first_year ?? startYear.value);
const lastYear = computed(() => trend.value?.last_year ?? data.value.season?.years?.at(-1));

const fmt = (x) => (x == null ? "–" : Math.round(x).toLocaleString(locale.value));
const dateLabel = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
const md = (mmdd) => {
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(Date.UTC(2001, m - 1, d)).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};
const windowText = computed(() => data.value.window.model.map(md).join(" – "));
// Written accounts are in French and English
const account = (k) => {
  const a = data.value.accounts?.general?.[k];
  return a ? (locale.value === "fr" ? a.fr : a.en) : null;
};
const yearAccounts = computed(() =>
  (data.value.accounts?.years ?? []).map((y) => ({
    year: y.year,
    text: locale.value === "fr" ? y.fr : y.en,
  })),
);

// --- key numbers ---
const kn = computed(() => data.value.key_numbers);
const passageFate = computed(() =>
  kn.value.passage?.source === "smooth" ? fate(data.value, "key_numbers.passage") : "show",
);
const passageShown = computed(() =>
  kn.value.passage?.q50 != null && passageFate.value !== "hide" ? kn.value.passage : null,
);
// Clock time on the main passage's median date of the last year
const dayDoy = computed(() => kn.value.passage?.q50 ?? 274);
const dayShift = computed(() => solarShift(doyDate(dayDoy.value, lastYear.value)));
const dayDate = computed(() => doyLabel(dayDoy.value, locale.value));
// The days the time-of-day bars pool: the main passage, else the whole season
const mainSpan = computed(() => {
  const m = data.value.daytime?.main_doy;
  return m
    ? { from: doyLabel(m[0], locale.value), to: doyLabel(m[1], locale.value) }
    : { from: "", to: "" };
});
const dayZone = computed(() =>
  dayShift.value > 1.2 ? t("explore.when.summer") : t("explore.when.winter"),
);
const changeLabel = (c) => {
  if (c == null) return "–";
  const r = c + 1;
  if (!isFinite(r)) return "–";
  return r >= 2 || r <= 0.5
    ? `×${r.toFixed(r < 1 ? 2 : 1)}`
    : `${r >= 1 ? "+" : ""}${Math.round((r - 1) * 100)}%`;
};
const keyCards = computed(() => {
  const k = kn.value;
  const cards = [];
  if (passageShown.value) {
    const p = passageShown.value;
    cards.push({
      title: t("explore.keys.passage"),
      value: `${doyLabel(p.q10, locale.value)} – ${doyLabel(p.q90, locale.value)}`,
      sub: t("explore.keys.passageSub", { date: doyLabel(p.q50, locale.value) }),
      caveat: passageFate.value === "caveat",
    });
  }
  if (k.best_hours) {
    const s = dayShift.value;
    cards.push({
      title: t("explore.keys.bestHours"),
      value: `${clock(k.best_hours.from + s, 30)} – ${clock(k.best_hours.to + s, 30)}`,
      sub: t("explore.keys.bestHoursSub", { share: `${Math.round(k.best_hours.share * 100)}%` }),
    });
  }
  const typical = fate(data.value, "key_numbers.typical_season");
  if (k.typical_season && typical !== "hide") {
    const ts = k.typical_season;
    cards.push({
      title: t("explore.keys.typical"),
      value: fmt(ts.median),
      sub: t("explore.keys.typicalSub", {
        min: fmt(ts.min),
        max: fmt(ts.max),
        from: ts.years[0],
        to: ts.years[1],
      }),
      caveat: typical === "caveat",
    });
  }
  const tr = fate(data.value, "key_numbers.trend");
  if (k.trend && tr !== "hide") {
    cards.push({
      title: t("explore.keys.trend", { year: k.trend.from }),
      value: changeLabel(k.trend.change),
      sub: t("explore.keys.trendSub", { to: k.trend.to }),
      cls: k.trend.change >= 0 ? "text-success" : "text-danger",
      caveat: tr === "caveat",
    });
  }
  if (k.record)
    cards.push({
      title: t("explore.keys.record"),
      value: fmt(k.record.count),
      sub: dateLabel(k.record.date),
    });
  return cards;
});

// --- figures ---
const hasChances = computed(() =>
  Object.keys(data.value.season?.chances ?? {}).some((k) => k.startsWith("at_least_")),
);
const daytimeShift = computed(() => {
  const c = data.value.daytime?.change;
  if (!c?.show) return null;
  return t("explore.when.shift", {
    h: Math.abs(c.shift).toFixed(1),
    dir: c.shift < 0 ? t("explore.when.earlier") : t("explore.when.later"),
  });
});
// The yearly totals, or the counts alone (in the model window) for a taxon without a trend
const annualRows = computed(() =>
  trend.value
    ? trend.value.annual
    : data.value.annual
        .filter((r) => r.year >= startYear.value && r.year <= lastYear.value)
        .map((r) => ({ year: r.year, observed: r.window })),
);
// Figure results: the main passage, the best hours (clock time), the trend or the typical season
const passageRange = computed(() => {
  const p = passageShown.value;
  return p ? `${doyLabel(p.q10, locale.value)} – ${doyLabel(p.q90, locale.value)}` : null;
});
const bestHours = computed(() => {
  const b = kn.value.best_hours;
  if (!b || !data.value.daytime?.hours) return null;
  return `${clock(b.from + dayShift.value, 30)} – ${clock(b.to + dayShift.value, 30)}`;
});
const manyResult = computed(() => {
  const k = kn.value;
  if (k.trend && fate(data.value, "key_numbers.trend") !== "hide")
    return t("explore.many.result", { change: changeLabel(k.trend.change), year: k.trend.from });
  if (k.typical_season && fate(data.value, "key_numbers.typical_season") !== "hide")
    return t("explore.many.typical", { n: fmt(k.typical_season.median) });
  return null;
});

// The year selected on the totals: the last with a written account, else the last
const selectedYear = ref(null);
const totalsShown = computed(() => fate(data.value, "trend.annual.total") !== "hide");
const selectedRow = computed(() => annualRows.value.find((r) => r.year === selectedYear.value));
const selectedAccount = computed(
  () => yearAccounts.value.find((y) => y.year === selectedYear.value)?.text,
);
watch(data, (d) => {
  if (!d) return;
  const years = annualRows.value.map((r) => r.year);
  const written = yearAccounts.value.map((y) => y.year).filter((y) => years.includes(y));
  selectedYear.value = written.length ? Math.max(...written) : (years.at(-1) ?? null);
});
const smoothShown = computed(
  () => trend.value?.passage_q && fate(data.value, "trend.passage_q") !== "hide",
);
const timingShift = computed(() => {
  if (!smoothShown.value) return null;
  const q = trend.value.passage_q;
  const d = Math.round(q.at(-1).q50 - q[0].q50);
  if (Math.abs(d) < 2) return t("explore.timing.same", { year: q[0].year });
  return t("explore.timing.shift", {
    n: Math.abs(d),
    dir: d < 0 ? t("explore.timing.earlier") : t("explore.timing.later"),
    year: q[0].year,
  });
});
const demography = computed(() =>
  [
    ["age", t("explore.who.age"), t("explore.who.ageHelp"), COLORS.ochre],
    ["sex", t("explore.who.sex"), t("explore.who.sexHelp"), COLORS.plum],
  ]
    .filter(([k]) => data.value[k])
    .map(([key, title, help, color]) => ({
      key,
      title,
      help,
      color,
      block: data.value[key],
      classes: data.value[key].classes.map((c) => t(`explore.who.class.${c}`)),
    })),
);
// "2019" or "2001–2025 (12 seasons)"
const yearSpan = (years) =>
  years.length === 1
    ? String(years[0])
    : t("explore.who.span", { from: years[0], to: years.at(-1), n: years.length });
const records = computed(() => data.value.records.top_days.slice(0, RECORDS));

onMounted(async () => {
  try {
    taxa.value = await fetchTaxa();
    if (!taxon.value) {
      taxonId.value = (
        options.value.find((tx) => tx.english_name === DEFAULT_TAXON) ?? options.value[0]
      )?.taxon_id;
    }
    effort.value = await fetchEffort();
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

<style scoped>
.section-title {
  font-size: 1.15rem;
  font-weight: 600;
  color: var(--dv-ink);
  border-bottom: 1px solid var(--dv-line);
  padding-bottom: 0.25rem;
  margin-bottom: 0.75rem;
}
.key .fs-5 {
  font-variant-numeric: tabular-nums;
}
.key.caveat {
  border-color: var(--bs-warning);
}
.species-box {
  border-color: var(--bs-primary-border-subtle);
}
.picker-wrap {
  max-width: 56rem;
}
.account {
  max-width: 50rem;
}
.link-btn {
  border-radius: 1rem;
  font-size: 0.8rem;
  padding: 0.1rem 0.6rem;
}
.intro {
  max-width: 50rem;
  margin-bottom: 0.75rem;
}
.share-bar {
  display: flex;
  height: 2rem;
  border-radius: 0.4rem;
  overflow: hidden;
  font-size: 0.8rem;
  line-height: 2rem;
  white-space: nowrap;
}
.share-a {
  color: #fff;
  padding-left: 0.5rem;
  overflow: hidden;
}
.share-b {
  flex: 1;
  background: var(--bs-tertiary-bg);
  text-align: right;
  padding-right: 0.5rem;
  overflow: hidden;
}
/* The selected year, under the bars across the card */
.year-panel {
  margin: 0.5rem -1rem -1rem;
  padding: 0.75rem 1rem;
  background: var(--bs-tertiary-bg);
  border-top: 1px solid var(--bs-border-color);
  border-radius: 0 0 var(--bs-card-inner-border-radius) var(--bs-card-inner-border-radius);
}
.days-table {
  font-size: 0.875rem;
}
.days-table .notes {
  min-width: 18rem;
  max-width: 50rem;
}
</style>
