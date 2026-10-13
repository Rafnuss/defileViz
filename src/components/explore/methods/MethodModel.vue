<template>
  <div>
    <div class="callout callout-primary">
      <h6 class="callout-heading"><i class="bi bi-lightbulb me-1"></i>In short</h6>
      <ul class="mb-0">
        <li>
          A statistical model (a <em>generalised additive model</em>, GAM) describes the birds
          expected on each day of each season, from the counts, their coverage and the day's
          weather.
        </li>
        <li>
          It fills in the hours and days nobody counted, with an honest uncertainty: a day lost to
          rain is filled as a rainy day, not as an average one.
        </li>
        <li>
          It separates the long-term trend from good and bad years, from the timing of the season
          and from the weather of the day.
        </li>
        <li>
          Only species counted on enough days get a model (about ninety); the page always shows
          their counts too.
        </li>
      </ul>
    </div>
    <!-- 1. Model -->
    <section id="m-model">
      <h5><span class="sec-n">1</span>The model</h5>
      <p>
        For every day <Tex e="d" /> of the season window (<a
          href="#"
          @click.prevent="$emit('method', 'counts', 'm-window')"
          >{{ windowText }}</a
        >) in year <Tex e="y" />, with <Tex e="t" /> the day of the year, the model gives the number
        of birds <em>expected</em> in the hours counted, <Tex e="c_d" /> being the day's coverage
        (<a href="#" @click.prevent="$emit('method', 'coverage', 'm-profile')"
          >Time of day and coverage</a
        >), eq. (3):
      </p>
      <div class="eq">
        <Tex
          display
          e="\mu_d = c_d \times \exp\left(\alpha + \Tr(y) + \Yr_y + \Se(t) + \Sh(y,t) + \Wx_d + \Ep_y(t)\right) \tag{3}"
        />
      </div>
      <p>Inside the exponential, each term has one job, on one time scale:</p>
      <table class="terms">
        <tbody v-for="g in GROUPS" :key="g.name">
          <tr>
            <th colspan="3" class="terms-group">{{ g.name }}</th>
          </tr>
          <tr v-for="term in g.terms" :key="term.name">
            <td class="terms-sym"><Tex :e="term.tex" /></td>
            <th scope="row" :class="term.cls">{{ term.name }}</th>
            <td>{{ term.text }}</td>
          </tr>
        </tbody>
      </table>
      <p>
        The terms are added on the logarithmic scale, so they <em>multiply</em> the number of birds.
        A trend of +0.1 means about 10% more birds, whatever the day or year. Each term averages to
        zero over its range, so each effect is counted once and only once.
      </p>

      <figure class="figure w-100">
        <div class="row g-2">
          <div class="col-md-4">
            <div class="panel-title t-trend">a. Trend, <Tex e="\Tr(y)" /></div>
            <div ref="trendDiv" class="plot-sm"></div>
          </div>
          <div class="col-md-4">
            <div class="panel-title t-year">b. Year level, <Tex e="\Yr_y" /></div>
            <div ref="yearDiv" class="plot-sm"></div>
          </div>
          <div class="col-md-4">
            <div class="panel-title t-season">
              c. Season <Tex e="\Se(t)" />, changed by <Tex e="\Sh(y,t)" />
            </div>
            <div ref="seasonDiv" class="plot-sm"></div>
          </div>
        </div>
        <figcaption class="figure-caption">
          <strong>Figure 1.</strong> The pieces of the model for {{ name }}. <strong>a.</strong> The
          smooth trend relative to {{ trend.first_year }}, with its 95% interval.
          <strong>b.</strong> Each year's estimated total relative to the trend: above 1, a better
          year than the trend says. <strong>c.</strong> Share of the season's birds per day, in
          {{ seasonYears[0] }} and {{ seasonYears[1] }}. The area under each curve is 1, so only the
          timing is compared, not the numbers.
        </figcaption>
      </figure>
    </section>

    <!-- 2. Day to day -->
    <section id="m-days">
      <h5><span class="sec-n">2</span>From day to day: weather and episodes</h5>
      <p id="m-weather">
        <strong class="t-weather">The weather</strong>,
        <Tex e="\Wx_d = \sum_j \beta_j\, w_{j,d}" />. Each day at the Défilé is described by nine
        numbers from ERA5, an hourly reconstruction of the weather on a grid of about 30 km: rain,
        rain the day before, sunshine, how high the thermals rise (the depth of the mixed layer near
        the ground), the wind's direction and strength at 100 m, the change of pressure over 24
        hours (a front passing), and how warm the day is for the date. Each <Tex e="w_{j,d}" /> is
        averaged over the hours the species flies, weighted by its time of day, and put on a common
        scale. Every species has all nine, each with its own effect <Tex e="\beta_j" />, held near
        zero unless its counts say otherwise. Figure 1 and the trend are at average weather.
      </p>
      <p>
        <strong class="t-episode">The episodes</strong>, <Tex e="\Ep_y(t)" />: a short-range curve
        of its own each year, for the runs of good or bad days the weather of the day does not
        explain, such as a wave of birds arriving from further north. Neighbouring days look alike,
        so a day nobody counted leans on the days around it.
      </p>
      <EpisodeWidget
        v-if="trend.episodes && data.days"
        :name="name"
        :episodes="trend.episodes"
        :theta="trend.theta"
        :days="data.days"
      />
      <p>
        The page's weather panel shows the clearest of each species' effects (how to read it:
        <a href="#" @click.prevent="$emit('method', 'shown', 'm-weather-read')"
          >What the page shows</a
        >; when an effect is shown:
        <a href="#" @click.prevent="$emit('method', 'reliability', 'm-weather-classes')"
          >How reliable?</a
        >). They are associations, not causes: a count is birds passing <em>and</em> birds seen, and
        a headwind brings birds lower while strong thermals can lift them out of sight.
      </p>
    </section>

    <!-- 3. Counts scatter -->
    <section id="m-scatter">
      <h5><span class="sec-n">3</span>Counts scatter around the expectation</h5>
      <p>
        The count on a day, <Tex e="N_d" />, is not exactly <Tex e="\mu_d" />. If each bird decided
        to fly independently of the others, counts would follow a
        <strong>Poisson</strong> distribution, the textbook law of counting rare independent events:
        a day expected to bring 100 birds would bring 100 give or take 10 (its variance equals its
        mean). Real days are far more variable: birds travel in flocks, and some days are much
        better than anything the model knows about. So the model uses a
        <strong>negative binomial</strong>: a Poisson count whose expected value itself varies from
        day to day, with a variance larger than the mean.
      </p>
      <div class="eq">
        <Tex
          display
          e="N_d \sim \operatorname{NegBin}(\mu_d,\ \theta), \qquad \operatorname{Var}(N_d) = \mu_d + \frac{\mu_d^2}{\theta} \tag{4}"
        />
      </div>
      <p>
        The second term of the variance, <Tex e="\mu_d^2/\theta" />, is the extra spread beyond
        Poisson. A small <Tex e="\theta" /> means very variable days: most bring few birds, a few
        bring a great many. As <Tex e="\theta" /> grows, the extra term vanishes and the count
        becomes Poisson again. The figure below keeps the Poisson as that reference. Move the
        sliders to see the difference.
      </p>
      <NegBinWidget :name="name" :species-theta="trend.theta" />
    </section>

    <!-- 4. Smoothness -->
    <section id="m-smooth">
      <h5><span class="sec-n">4</span>How smooth is smooth?</h5>
      <p>
        Each curve (<Tex e="\Tr" />, <Tex e="\Se" />, <Tex e="\Sh" />, <Tex e="\Ep" />) is a
        <em>spline</em>: a chain of short polynomial pieces joined smoothly, flexible enough to
        follow almost any shape. Too flexible, it would follow every lucky day. So each curve pays a
        penalty for wiggling, and the model maximises
      </p>
      <div class="eq">
        <Tex
          display
          e="\text{log-likelihood of the counts} \;-\; \sum_k \lambda_k \times \text{wiggliness}_k \tag{5}"
        />
      </div>
      <p>
        A large <Tex e="\lambda" /> flattens a curve; a small one lets it bend. The
        <Tex e="\lambda" />'s and <Tex e="\theta" /> are not set by hand. They are the values under
        which the observed counts are most probable overall, the <em>marginal likelihood</em>. This
        is the standard method of GAMs in ecology (Wood 2017). With 30 years of data, the trend can
        bend over a decade but not from one year to the next. The year levels <Tex e="\Yr" /> are
        there for year-to-year jumps. The weather effects <Tex e="\beta_j" /> are straight lines,
        with a fixed penalty of their own: without a clear signal in the counts, an effect stays
        near zero.
      </p>
      <SmoothWidget :name="name" :annual="trend.annual" />
    </section>

    <!-- 5. Filling the gaps -->
    <section id="m-fill">
      <h5><span class="sec-n">5</span>Filling the gaps</h5>
      <p>
        The <strong>estimated total</strong> of a season is the birds actually counted, plus an
        estimate of those that passed while nobody was counting:
      </p>
      <div class="eq">
        <Tex
          display
          e="\text{Total}_y = \sum_d N_d \;+\; \sum_d \, \text{missed birds on day } d \tag{6}"
        />
      </div>
      <p>
        The missed birds are drawn 1 000 times from the fitted model, which gives a range rather
        than a single number. Two details make that range realistic:
      </p>
      <ul>
        <li>
          <strong>Partly counted days use their own count.</strong> If the morning was busy, the
          afternoon probably was too. The missed share <Tex e="1 - c_d" /> is filled at a rate that
          blends the day's own count with the model's expectation,
          <Tex e="\dfrac{\theta + N_d}{\theta/\mu_d + c_d}" />
          birds per full day. The more of the day was counted, the more the count weighs.
        </li>
        <li>
          <strong>Birds come in flocks.</strong> Within a day, passage arrives in bursts of a few
          hours. The model learns how bursty from the days counted hour by hour (<Tex
            :e="`\kappa = ${trend.kappa.toFixed(1)}`"
          />
          for {{ name }}), so a missed afternoon may hold a big flock or nothing.
        </li>
        <li>
          <strong>Each day is filled with its own weather.</strong> A day nobody counted because it
          rained is filled as a rainy day, with few birds for most species, not as an average day.
          Days with no count at all come from the model alone, eq. (3): their weather and the
          episode of good or bad days around them.
        </li>
      </ul>
      <p>
        The same draws give every day of the season its own <strong>full-day estimate</strong>: the
        birds counted plus that day's missed birds (all of them on a day nobody counted), shown as
        its mean and 80% interval when a year is selected under the totals. This one complete series
        is also what the season panels are made of (<a
          href="#"
          @click.prevent="$emit('method', 'shown', 'm-rate')"
          >What the page shows</a
        >). The mean, not the median, because the missed part is skewed (a flock or nothing): the
        means of the days add up, the medians fall short. On a day with no bird counted, a rare
        large flock in the hours missed can even put the mean above the 80% interval. A day counted
        in full keeps its count; a day counted for an hour leans on its neighbours, the season and
        the year, and its interval says so.
      </p>

      <figure class="figure w-100">
        <div ref="fillDiv" class="plot-md"></div>
        <figcaption class="figure-caption">
          <strong>Figure 5.</strong> {{ name }}, last {{ fillYears }} seasons: birds counted (grey)
          and birds estimated to have passed uncounted (blue). Black bars are the 80% interval of
          the estimated total. In {{ last.year }}, the hours counted held
          {{ Math.round(last.observed_share * 100) }}% of the estimated passage.
        </figcaption>
      </figure>

      <div class="callout callout-info small">
        <i class="bi bi-question-circle me-1"></i>
        <strong>Why not simply divide each count by its coverage?</strong> Dividing, eq. (2) in
        <a href="#" @click.prevent="$emit('method', 'coverage', 'm-rate')"
          >Time of day and coverage</a
        >, works on average but goes badly wrong on short counts, and leaves the days nobody counted
        empty. Tested on 91 species (see
        <a href="#" @click.prevent="$emit('method', 'reliability', 'm-test')">How reliable?</a>), it
        misses known season totals by 17% (median), the model by 9%. Days below
        <Tex e="c_d = 0.1" /> are not used to estimate rates at all; their birds are just added to
        the total.
      </div>
    </section>

    <p class="small text-muted mt-4 mb-0">
      Counts of migrating birds are commonly read this way: a regression of the daily counts with
      the counting effort as an offset and the date and weather as covariates (for raptors, Farmer
      et al. 2007). References: Farmer, C.J., Hussell, D.J.T. & Mizrahi, D. (2007). Detecting
      population trends in migratory birds of prey. <em>The Auk</em> 124, 1047–1062. Wood, S.N.
      (2017). <em>Generalized Additive Models: An Introduction with R</em>, 2nd ed. CRC Press. Code
      and the full record of choices and tests:
      <a href="https://github.com/Rafnuss/defile-explore" target="_blank" rel="noopener"
        >defile-explore</a
      >
      (<code>src/defile_explore/trend.py</code>, <code>weather.py</code>,
      <code>DECISIONS.md</code>).
    </p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { plotReact } from "../../../utils/usePlot";
import { COLORS, alpha } from "../../../theme.js";
import { doyLabel } from "../../../services/explore";
import Tex from "../Tex.vue";
import NegBinWidget from "../NegBinWidget.vue";
import EpisodeWidget from "../EpisodeWidget.vue";
import SmoothWidget from "../SmoothWidget.vue";

const { locale } = useI18n();

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

// The terms of eq. (3), in the order of the equation, by time scale
const GROUPS = [
  {
    name: "Over the years",
    terms: [
      {
        tex: "\\alpha",
        name: "level",
        cls: "",
        text: "The overall level: how common the species is at the Défilé.",
      },
      {
        tex: "\\Tr(y)",
        name: "trend",
        cls: "t-trend",
        text: "A smooth curve over the years: the long-term rise or decline.",
      },
      {
        tex: "\\Yr_y",
        name: "year level",
        cls: "t-year",
        text: "One value per year: good and bad years around the trend (breeding success, a shifted route).",
      },
    ],
  },
  {
    name: "Over the season",
    terms: [
      {
        tex: "\\Se(t)",
        name: "season",
        cls: "t-season",
        text: "The average shape of the season: when the species passes, and how spread out.",
      },
      {
        tex: "\\Sh(y,t)",
        name: "change of timing",
        cls: "t-shift",
        text: "A slow change of that shape over the decades, for example a season starting earlier or lasting longer.",
      },
    ],
  },
  {
    name: "From day to day",
    terms: [
      {
        tex: "\\Wx_d",
        name: "weather",
        cls: "t-weather",
        text: "The day's weather: rain, sunshine, thermals, wind, fronts and temperature (section 2).",
      },
      {
        tex: "\\Ep_y(t)",
        name: "episodes",
        cls: "t-episode",
        text: "Runs of a few good or bad days that the weather does not explain (section 2).",
      },
    ],
  },
];
// Term colours, as in the CSS below (.t-*)
const C = {
  trend: COLORS.predicted,
  year: COLORS.counted,
  season: COLORS.sage,
  shift: COLORS.plum,
  episode: COLORS.ochre,
  weather: COLORS.teal,
  counted: alpha(COLORS.faint, 0.6),
};
const FILL_YEARS = 12;
const LOG_TICKS = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50];

const trendDiv = ref(null);
const yearDiv = ref(null);
const seasonDiv = ref(null);
const fillDiv = ref(null);

const trend = computed(() => props.data.trend);
const annual = computed(() => trend.value.annual);
const last = computed(() => annual.value.at(-1));
const fillYears = computed(() => Math.min(FILL_YEARS, annual.value.length));
const seasonYears = computed(() =>
  Object.keys(trend.value.season)
    .filter((k) => k !== "doy")
    .sort(),
);
// "MM-DD" -> "18 Jul" in the locale
const md = (mmdd) => {
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(Date.UTC(2001, m - 1, d)).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};
const windowText = computed(() => trend.value.window.map(md).join(" – "));

const CONFIG = { displayModeBar: false, responsive: true };
const baseLayout = (extra = {}) => ({
  margin: { t: 8, l: 48, r: 8, b: 36 },
  dragmode: false,
  autosize: true,
  showlegend: false,
  font: { size: 11 },
  ...extra,
});

function plotPieces() {
  const a = annual.value;
  const year = a.map((r) => r.year);
  const s0 = a[0].smooth;
  if (trendDiv.value) {
    plotReact(
      trendDiv.value,
      [
        {
          x: [...year, ...year.slice().reverse()],
          y: [
            ...a.map((r) => r["smooth_q97.5"] / s0),
            ...a.map((r) => r["smooth_q2.5"] / s0).reverse(),
          ],
          fill: "toself",
          fillcolor: alpha(C.trend, 0.15),
          line: { color: "transparent" },
          hoverinfo: "skip",
        },
        {
          x: year,
          y: a.map((r) => r.smooth / s0),
          mode: "lines",
          line: { color: C.trend, width: 2.5 },
          hovertemplate: "%{x}: ×%{y:.2f}<extra></extra>",
        },
      ],
      baseLayout({
        xaxis: { fixedrange: true },
        yaxis: {
          type: "log",
          fixedrange: true,
          title: { text: `× ${a[0].year}` },
          tickvals: LOG_TICKS,
          ticktext: LOG_TICKS.map((v) => `×${v}`),
        },
        shapes: [hline(1)],
      }),
      CONFIG,
    );
  }
  if (yearDiv.value) {
    const ratio = a.map((r) => r.total / r.smooth);
    plotReact(
      yearDiv.value,
      [
        {
          x: year,
          y: ratio.map((v) => v - 1),
          base: 1,
          type: "bar",
          marker: { color: ratio.map((v) => (v >= 1 ? C.year : alpha(C.year, 0.45))) },
          customdata: ratio,
          hovertemplate: "%{x}: ×%{customdata:.2f} the trend<extra></extra>",
        },
      ],
      baseLayout({
        bargap: 0.15,
        xaxis: { fixedrange: true },
        yaxis: { fixedrange: true, title: { text: "total / trend" } },
        shapes: [hline(1)],
      }),
      CONFIG,
    );
  }
  if (seasonDiv.value) {
    const { doy } = trend.value.season;
    const [y0, y1] = seasonYears.value;
    const norm = (v) => {
      const s = v.reduce((t, x) => t + x, 0) || 1;
      return v.map((x) => x / s);
    };
    const ticks = [213, 244, 274, 305];
    plotReact(
      seasonDiv.value,
      [y0, y1].map((y, i) => ({
        x: doy,
        y: norm(trend.value.season[y]),
        mode: "lines",
        line: {
          color: i ? C.season : alpha(C.season, 0.55),
          width: 2,
          dash: i ? "solid" : "dot",
        },
        name: y,
        hovertemplate: `${y}: %{y:.1%}<extra></extra>`,
      })),
      baseLayout({
        showlegend: true,
        legend: { orientation: "h", x: 0, y: 1.12, font: { size: 10 } },
        xaxis: {
          fixedrange: true,
          tickvals: ticks,
          ticktext: ticks.map((d) => doyLabel(d, locale.value)),
        },
        yaxis: { fixedrange: true, tickformat: ".1%", rangemode: "tozero" },
      }),
      CONFIG,
    );
  }
}

function plotFill() {
  if (!fillDiv.value) return;
  const a = annual.value.slice(-fillYears.value);
  const year = a.map((r) => r.year);
  plotReact(
    fillDiv.value,
    [
      {
        x: year,
        y: a.map((r) => r.observed),
        type: "bar",
        marker: { color: C.counted },
        name: "Counted",
        hovertemplate: "%{x}: %{y:,.0f} counted<extra></extra>",
      },
      {
        x: year,
        y: a.map((r) => r.total - r.observed),
        type: "bar",
        marker: { color: alpha(COLORS.predicted, 0.55) },
        name: "Estimated, not counted",
        error_y: {
          type: "data",
          symmetric: false,
          array: a.map((r) => r.q90 - r.total),
          arrayminus: a.map((r) => r.total - r.q10),
          color: COLORS.ink,
          thickness: 1.5,
          width: 4,
        },
        customdata: a.map((r) => [r.total, Math.round(r.observed_share * 100)]),
        hovertemplate:
          "%{x}: +%{y:,.0f} missed, total %{customdata[0]:,.0f} (%{customdata[1]}% counted)<extra></extra>",
      },
    ],
    baseLayout({
      barmode: "stack",
      bargap: 0.2,
      showlegend: true,
      legend: { orientation: "h", x: 0, y: 1.12, traceorder: "normal" },
      margin: { t: 24, l: 60, r: 8, b: 36 },
      xaxis: { fixedrange: true, dtick: 1 },
      yaxis: { fixedrange: true, title: { text: "birds" }, rangemode: "tozero" },
    }),
    CONFIG,
  );
}

const hline = (y) => ({
  type: "line",
  xref: "paper",
  x0: 0,
  x1: 1,
  y0: y,
  y1: y,
  line: { color: alpha(COLORS.ink, 0.35), width: 1, dash: "dot" },
});

function drawAll() {
  plotPieces();
  plotFill();
}

onMounted(drawAll);
watch(() => [props.data, locale.value], drawAll);
onBeforeUnmount(() =>
  [trendDiv, yearDiv, seasonDiv, fillDiv].forEach((d) => d.value && Plotly.purge(d.value)),
);
</script>
