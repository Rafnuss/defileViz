<template>
  <div>
    <div class="callout callout-primary">
      <h6 class="callout-heading"><i class="bi bi-lightbulb me-1"></i>In short</h6>
      <ul class="mb-0">
        <li>
          Counters never count every hour of every day. A raw count says as much about the counting
          as about the birds.
        </li>
        <li>
          Each species passes at its own time of day. From that, we know what share of a day's
          passage the hours actually counted represent: the <em>coverage</em>.
        </li>
        <li>
          Dividing a count by its coverage gives birds per full day: the simplest correction, used
          for the species without a trend model.
        </li>
      </ul>
    </div>

    <section id="m-solar">
      <h5><span class="sec-n">1</span>Solar hours and daylight</h5>
      <p>
        Birds follow the sun, not the clock. The page gives hours in <strong>solar time</strong>:
        hour 12 starts when the sun is highest over the Défilé. On the clock, that moment moves from
        13:43 on 1 August to 12:20 on 3 November, with a jump of an hour when summer time ends in
        late October, in the middle of the pigeon and finch passage. In solar time, the hour of a
        raptor's passage stays the same all season. The page converts back to the clock so you can
        plan a visit.
      </p>
      <p>
        The days also shorten by four hours over the season. So the model of the time of day
        measures time as the share of the day's light elapsed, from <strong>civil dawn</strong> to
        <strong>civil dusk</strong> (the sun 6° below the horizon, when nobody can see the birds any
        more): a passage tied to dawn or dusk, like the herons' flights at sunset, keeps its place
        as the days shorten. Nothing is counted in the dark.
      </p>
    </section>

    <section id="m-profile">
      <h5><span class="sec-n">2</span>The time-of-day profile</h5>
      <p>
        Raptors wait for thermals and pass from late morning to afternoon. Pigeons and finches pass
        mostly in the first hours after dawn. Each species'
        <strong>time-of-day profile</strong>&nbsp;<Tex e="p(t)" /> gives the rate of a full day's
        passage at each moment <Tex e="t" /> of the day, as a share of the day per hour. It is a
        smooth surface over the date and the time of day, fitted (by a small GAM of its own) to
        every day counted hour by hour since 2014, so it can change through the season. It is read
        as a continuous curve, not hour by hour: counts are noted by the hour, but counting starts
        and stops at any minute. A species with too few birds timed to the hour borrows the profile
        of its group (raptors, pigeons, passerines, others).
      </p>
      <div class="callout callout-info small">
        <i class="bi bi-check2-square me-1"></i>
        <strong>Checking it: <em>Through the day</em>.</strong> On the page, the bars are the birds
        per counted hour over the main passage, the line what the profile predicts for the same days
        and the same minutes counted. Hours counted for less than half on a day are left out of
        both, so a late flock noted in the last minutes of a count does not make a bar of its own.
      </div>
    </section>

    <section id="m-coverage">
      <h5><span class="sec-n">3</span>Coverage</h5>
      <p>
        The <strong>coverage</strong> of a counted day is the share of that profile falling in the
        time actually counted, to the minute:
      </p>
      <div class="eq">
        <Tex display e="c_d = \int_{t\ \text{counted on day}\ d} p(t)\,\mathrm{d}t \tag{1}" />
      </div>
      <p>
        A day counted from dawn to dusk has <Tex e="c_d = 1" />. A day with no count has
        <Tex e="c_d = 0" />. The same four hours count for little for one species and almost
        everything for another, and starting half an hour later can matter more than ending an hour
        earlier. Try it below.
      </p>

      <figure v-if="row" class="figure w-100">
        <div class="readout small mb-1">
          Counting from <strong>{{ clock(hFrom) }}</strong> to <strong>{{ clock(hTo) }}</strong>
          gives a coverage of
          <strong class="text-primary"><Tex :e="`c_d = ${cov.toFixed(2)}`" /></strong>
          for {{ name }} on {{ rowDate }}.
        </div>
        <div ref="covDiv" class="plot-sm"></div>
        <!-- Two-handle slider on the plot's x axis: same range, inset by the plot's margins -->
        <div
          class="hours"
          :style="{
            marginLeft: `${COV_MARGIN.l - THUMB / 2}px`,
            marginRight: `${COV_MARGIN.r - THUMB / 2}px`,
          }"
        >
          <div class="hours-track"></div>
          <div class="hours-sel" :style="selStyle"></div>
          <input
            v-model.number="hFrom"
            type="range"
            :min="covAxis[0]"
            :max="covAxis[1]"
            :step="SLIDER_STEP"
            aria-label="Start of the count"
          />
          <input
            v-model.number="hTo"
            type="range"
            :min="covAxis[0]"
            :max="covAxis[1]"
            :step="SLIDER_STEP"
            aria-label="End of the count"
          />
        </div>
        <div class="text-center text-muted hours-hint">
          <i class="bi bi-arrows me-1"></i>drag the two handles to choose the time counted
        </div>
        <figcaption class="figure-caption">
          <strong>Figure 1.</strong> Time-of-day profile of {{ name }} on {{ rowDate }}, its main
          passage's median date ({{ sourceLabel }}), in clock time that day. The area in colour is
          the time counted: its share of the whole area is the coverage (1).
        </figcaption>
      </figure>
    </section>

    <section id="m-rate">
      <h5><span class="sec-n">4</span>Birds per full day</h5>
      <p>
        A day's count <Tex e="N_d" /> depends on how long it was counted. Divided by its coverage,
        it becomes <strong>birds per full day</strong>, comparable between days:
      </p>
      <div class="eq">
        <Tex display e="r_d = N_d \,/\, c_d \qquad \text{when } c_d \ge 0.5 \tag{2}" />
      </div>
      <p>
        Dividing only works when much of the day was counted: 75 Black Kites seen in 11 minutes
        would become a 190 000-bird day. So a day counted for less than half its expected passage
        gets no value, and a day nobody counted stays empty. Before 1993, a typical day covered only
        5–10% of a raptor's passage.
      </p>
      <p>
        Each species gets <strong>one correction</strong>, never both. For the species counted on
        enough days (about seventy), the trend model does it: it fills every hour and day nobody
        counted, and replaces eq. (2) everywhere on the page (<a
          href="#"
          @click.prevent="$emit('method', 'model', 'm-model')"
          >The trend model</a
        >). For the others, and where the model fails its test, the page uses eq. (2), and leaves
        blank what it cannot fill.
        <strong>{{ name }}</strong>
        {{
          modelled
            ? "is corrected by the trend model."
            : "is corrected by eq. (2): it has no trend model, or its model's totals are not shown."
        }}
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { usePlot, plotReact } from "../../../utils/usePlot";
import { COLORS, alpha } from "../../../theme.js";
import { doyLabel, doyDate, solarShift, clock } from "../../../services/explore";
import Tex from "../Tex.vue";

const { locale } = useI18n();

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

const CONFIG = { displayModeBar: false, responsive: true };
// Figure 1's x axis (clock hours) and margins, shared by the plot and the hour slider below it
const COV_MARGIN = { t: 8, l: 48, r: 12, b: 28 };
const THUMB = 16; // px, the range thumb: its centre sits THUMB / 2 inside the input
const SLIDER_STEP = 0.25; // hours: the count's start and end move by a quarter of an hour

// Corrected by the trend model's gap-filled days (defile-explore `season.source`), else by eq. (2)
const modelled = computed(() => props.data.season?.source === "gam");
const lastYear = computed(() => props.data.trend?.last_year ?? new Date().getFullYear() - 1);

// The profile on the main passage's median date (profile.day): a continuous curve, the share of
// the day per hour at each slot of 1 / per_hour hours from solar hour `start`
const row = computed(() => props.data.profile?.day ?? null);
const shift = computed(() => (row.value ? solarShift(doyDate(row.value.doy, lastYear.value)) : 1));
// Clock hours from civil dawn to dusk on that day, rounded out to whole hours
const covAxis = computed(() => {
  const r = row.value;
  if (!r) return [4, 22];
  const t0 = r.start + shift.value;
  return [Math.floor(t0), Math.ceil(t0 + r.p.length / r.per_hour)];
});
const rowDate = computed(() => (row.value ? doyLabel(row.value.doy, locale.value) : ""));
const sourceLabel = computed(
  () =>
    ({ own: "its own profile", uniform: "uniform over daylight, too few birds timed to the hour" })[
      props.data.profile?.source
    ] ??
    `the profile of its group (${props.data.profile?.source}), too few birds timed to the hour`,
);

const hFrom = ref(8);
const hTo = ref(12);
watch(covAxis, ([a, b]) => {
  hFrom.value = Math.min(Math.max(hFrom.value, a), b - SLIDER_STEP);
  hTo.value = Math.max(Math.min(hTo.value, b), hFrom.value + SLIDER_STEP);
});
// Equation (1): the curve integrated over the time counted, slot by slot
const cov = computed(() => {
  const r = row.value;
  if (!r) return 0;
  const [a, b] = [hFrom.value - shift.value, hTo.value - shift.value];
  const w = 1 / r.per_hour;
  return r.p.reduce((s, x, k) => {
    const t0 = r.start + k * w;
    return s + x * Math.max(0, Math.min(b, t0 + w) - Math.max(a, t0));
  }, 0);
});
const selStyle = computed(() => {
  const f = (h) => (h - covAxis.value[0]) / (covAxis.value[1] - covAxis.value[0]);
  const pos = (h) => `calc(${THUMB / 2}px + ${f(h)} * (100% - ${THUMB}px))`;
  return {
    left: pos(hFrom.value),
    width: `calc(${f(hTo.value) - f(hFrom.value)} * (100% - ${THUMB}px))`,
  };
});

const covDiv = ref(null);
const covVisible = usePlot(covDiv);

function plotCoverage() {
  const r = row.value;
  if (!covVisible.value || !covDiv.value || !r) return;
  const s = shift.value;
  const w = 1 / r.per_hour;
  const x = r.p.map((_, k) => r.start + (k + 0.5) * w + s);
  const inside = x.map((t) => t > hFrom.value && t < hTo.value);
  const [a, b] = covAxis.value;
  const ticks = Array.from({ length: b - a + 1 }, (_, i) => a + i).filter((h) => h % 2 === 0);
  plotReact(
    covDiv.value,
    [
      {
        x,
        y: r.p,
        mode: "lines",
        fill: "tozeroy",
        line: { color: alpha(COLORS.faint, 0.9), width: 1.5 },
        fillcolor: alpha(COLORS.historyInner, 0.35),
        text: x.map((t) => clock(t, 5)),
        hovertemplate: "%{text}: %{y:.1%} of the day per hour<extra></extra>",
      },
      {
        x: x.map((t, k) => (inside[k] ? t : null)),
        y: r.p.map((p, k) => (inside[k] ? p : null)),
        mode: "lines",
        fill: "tozeroy",
        line: { color: COLORS.predicted, width: 2 },
        fillcolor: alpha(COLORS.predicted, 0.55),
        hoverinfo: "skip",
      },
    ],
    {
      margin: COV_MARGIN,
      dragmode: false,
      autosize: true,
      showlegend: false,
      font: { size: 11 },
      xaxis: {
        fixedrange: true,
        range: covAxis.value,
        tickvals: ticks,
        ticktext: ticks.map((h) => clock(h)),
      },
      yaxis: {
        title: { text: "p(t), per hour" },
        tickformat: ".0%",
        fixedrange: true,
        rangemode: "tozero",
      },
    },
    CONFIG,
  );
}

// The handles never cross: at least a quarter of an hour counted
watch(hFrom, (h) => h >= hTo.value && (hFrom.value = hTo.value - SLIDER_STEP));
watch(hTo, (h) => h <= hFrom.value && (hTo.value = hFrom.value + SLIDER_STEP));
watch(() => [covVisible.value, row.value, hFrom.value, hTo.value], plotCoverage);
</script>
