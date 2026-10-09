<template>
  <div>
    <div class="callout callout-primary">
      <h6 class="callout-heading"><i class="bi bi-lightbulb me-1"></i>In short</h6>
      <ul class="mb-0">
        <li>
          Every season panel is built from one series of birds per full day:
          {{
            filled
              ? `for ${name}, the trend model's gap-filled days.`
              : `for ${name}, the counts divided by their coverage.`
          }}
        </li>
        <li>
          Passage dates and your chances come from that same series. The counts stay on the page:
          days nobody counted are drawn paler or left blank.
        </li>
        <li>What each line and point of the page includes, and the limits to keep in mind.</li>
      </ul>
    </div>

    <section id="m-rate">
      <h5><span class="sec-n">1</span>One series per species</h5>
      <p>
        Each day of the season gets one value of birds per full day, from the species' one
        correction (<a href="#" @click.prevent="$emit('method', 'coverage', 'm-rate')"
          >Time of day and coverage</a
        >):
      </p>
      <ul>
        <li :class="{ 'fw-semibold': filled }">
          <strong>With a trend model</strong>, its gap-filled days (<a
            href="#"
            @click.prevent="$emit('method', 'model', 'm-fill')"
            >Filling the gaps</a
          >): a well-counted day keeps about <Tex e="N_d / c_d" />, a day counted for an hour leans
          on its neighbours, the season and the year, and a day nobody counted comes from the model
          alone, drawn paler.
        </li>
        <li :class="{ 'fw-semibold': !filled }">
          <strong>Without one</strong>, or where the model's totals are not shown (<a
            href="#"
            @click.prevent="$emit('method', 'reliability', 'm-classes')"
            >How reliable?</a
          >), birds per full day, eq. (2): a day counted for less than half its expected passage is
          left blank, never guessed.
        </li>
      </ul>
      <p>
        {{ name }} uses the {{ filled ? "first" : "second" }}. Each day is then shown as its share
        of the season: the colour of a cell in the timing panel. We tested both by hiding the gaps
        of older seasons in well-counted recent years: the model placed the median passage date 2.7
        days from the truth on average, against 4.4 for eq. (2) with straight lines across the gaps,
        and the gappier the season the larger its lead.
      </p>
    </section>

    <section id="m-dates">
      <h5><span class="sec-n">2</span>Passage dates</h5>
      <p v-if="filled">
        Adding the days up gives the season's curve, and the dates by which <strong>10%</strong>,
        <strong>50%</strong> (the median passage date) and <strong>90%</strong> of its birds had
        passed. They are taken in each of the model's 1 000 draws of the season: the dot is their
        median, and the line through it the 80% interval of the median date. A season with long gaps
        gets a wide interval.
      </p>
      <p v-else>
        Adding the days up gives the season's curve, and the dates by which <strong>10%</strong>,
        <strong>50%</strong> (the median passage date) and <strong>90%</strong> of its birds had
        passed. For that sum only, a blank day takes a value on the straight line between its
        counted neighbours. A season with long gaps is drawn paler: its dates rest on fewer days.
      </p>
      <figure class="figure w-100">
        <div class="d-flex justify-content-between align-items-center small mb-2 gap-2">
          <span class="text-muted">One season, day by day</span>
          <select v-model.number="year" class="form-select form-select-sm w-auto">
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>
        <div ref="seasonDiv" class="plot-md"></div>
        <figcaption class="figure-caption">
          <template v-if="filled">
            <strong>Figure 1.</strong> {{ name }} in {{ year }}: each day's share of the season
            (bars; pale: nobody counted, estimated) and the season's running total (line). The
            dashed lines mark its 10%, 50% and 90% passage dates, the band the 80% interval of the
            median
          </template>
          <template v-else>
            <strong>Figure 1.</strong> {{ name }} in {{ year }}: each counted day's share of the
            season (bars; grey: counted for less than half a day, left blank) and the season's
            running total (line, with blank days on the straight line between their neighbours). The
            dashed lines mark its 10%, 50% and 90% passage dates
          </template>
          <template v-if="passage">
            ({{ passage.dates }}); {{ Math.round(passage.counted * 100) }}% of the days were
            counted.</template
          >
        </figcaption>
      </figure>
      <p>
        The page's timing panel also draws the <em>smooth</em> median date, from the trend model:
        the passage date of a typical season, without that year's weather. It shows where the timing
        is going; the dots show where each season actually fell.
      </p>
    </section>

    <section id="m-chances">
      <h5><span class="sec-n">3</span>Your chances</h5>
      <p v-if="filled">
        <em>Your chances</em> are the chance that a full day of the last ten seasons ({{
          chanceYears
        }}) held at least 1, 10, 100 or 1 000 birds, per five days of the season, over every day: a
        day nobody counted weighs in with the probability the model gives it. It is what a full day
        at the Défilé gave on those dates, recently.
      </p>
      <p v-else>
        <em>Your chances</em> are the share of well-counted days (<Tex e="c_d \ge 0.5" />) of the
        last ten seasons ({{ chanceYears }}) with at least 1, 10, 100 or 1 000 birds, per five days
        of the season. It is what a full day at the Défilé gave on those dates, recently.
      </p>
    </section>

    <section id="m-read">
      <h5><span class="sec-n">4</span>Reading the plots</h5>
      <p>
        For a species with a trend model, what each line and point of the page includes, by the
        terms of eq. (3) (<a href="#" @click.prevent="$emit('method', 'model', 'm-model')"
          >The trend model</a
        >):
      </p>
      <div class="table-responsive">
        <table class="table table-sm align-middle small">
          <thead>
            <tr>
              <th>On the page</th>
              <th>What it is</th>
              <th class="text-center">Includes</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Birds counted (grey bars)</td>
              <td>The raw sum of the counts in the season window, nothing estimated.</td>
              <td class="text-center text-nowrap"><span class="text-nowrap">data</span></td>
            </tr>
            <tr>
              <td>Estimated total (points, 80% / 95%)</td>
              <td>Counted + missed birds, eq. (6): the best estimate of what actually passed.</td>
              <td class="text-center text-nowrap">
                <span class="chip t-trend"><Tex e="\Tr" /></span
                ><span class="chip t-year"><Tex e="\Yr" /></span
                ><span class="chip t-season"><Tex e="\Se" /></span
                ><span class="chip t-shift"><Tex e="\Sh" /></span
                ><span class="chip t-episode"><Tex e="\Ep" /></span>
              </td>
            </tr>
            <tr>
              <td>Smooth trend (blue line), and its change since the first year</td>
              <td>
                The season total of a <em>typical</em> year at that date, everything counted: good
                and bad years and weather episodes are set to their average.
              </td>
              <td class="text-center text-nowrap">
                <span class="chip t-trend"><Tex e="\Tr" /></span
                ><span class="chip t-season"><Tex e="\Se" /></span
                ><span class="chip t-shift"><Tex e="\Sh" /></span>
              </td>
            </tr>
            <tr>
              <td>Smooth median date (black line on the timing panel), main passage</td>
              <td>
                From the smooth season of each year: the day by which half the birds of a typical
                season have passed.
              </td>
              <td class="text-center text-nowrap">
                <span class="chip t-season"><Tex e="\Se" /></span
                ><span class="chip t-shift"><Tex e="\Sh" /></span>
              </td>
            </tr>
            <tr>
              <td>Typical season</td>
              <td>The median of the last ten estimated totals.</td>
              <td class="text-center text-nowrap">
                <span class="chip t-trend"><Tex e="\Tr" /></span
                ><span class="chip t-year"><Tex e="\Yr" /></span
                ><span class="chip t-season"><Tex e="\Se" /></span
                ><span class="chip t-shift"><Tex e="\Sh" /></span
                ><span class="chip t-episode"><Tex e="\Ep" /></span>
              </td>
            </tr>
            <tr>
              <td>Season panels, passage dates, chances</td>
              <td>The series of section 1: the model's gap-filled days, or eq. (2).</td>
              <td class="text-center text-nowrap">all, or data</td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="small text-muted">
        The intervals carry the uncertainty of every term, given the smoothness the model chose.
      </p>
    </section>

    <section id="m-limits">
      <h5><span class="sec-n">5</span>Limits</h5>
      <div class="callout callout-warning small mb-0">
        <h6 class="callout-heading"><i class="bi bi-exclamation-triangle me-1"></i>Keep in mind</h6>
        <ul class="mb-0">
          <li>
            <strong>Counts at a site, not a population.</strong> A trend at the Défilé can also come
            from birds changing route, wintering further north, or migrating higher and out of
            sight.
          </li>
          <li>
            <strong>Compared from {{ startYear }} only.</strong> Daily systematic counts began in
            1993; most passerines were only recorded in full from 2007.
          </li>
          <li>
            <strong>No extrapolation.</strong> The model describes the years counted. It says
            nothing about next year.
          </li>
          <li>
            <strong>A stable daily rhythm is assumed.</strong> The time-of-day profile changes
            through the season, but is taken as the same in all years. It can only be checked since
            2014, when hourly notes began.
          </li>
          <li>
            <strong>Identification changes.</strong> Some names were split differently over the
            years. Pigeons and swallows are therefore also shown as combined series, and
            unidentified birds ("falcon sp.") get no trend.
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../../utils/usePlot";
import { doyLabel } from "../../../services/explore";
import Tex from "../Tex.vue";

const { locale } = useI18n();

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

const s = computed(() => props.data.season);
// From the trend's gap-filled days (defile-explore `season.source`), else from the counts
const filled = computed(() => s.value.source === "gam");
const years = computed(() => s.value.years.slice().reverse());
const year = ref(years.value[0]);
watch(years, (ys) => !ys.includes(year.value) && (year.value = ys[0]));

const startYear = computed(() => props.data.settings.start_year.value);
const chanceYears = computed(() => s.value.chances?.years?.join("–") ?? "");
const passage = computed(() => {
  const p = s.value.passage.find((r) => r.year === year.value);
  if (!p || p.q50 == null) return null;
  return { ...p, dates: ["q10", "q50", "q90"].map((k) => doyLabel(p[k], locale.value)).join(", ") };
});

// "MM-DD" -> day of year in a non-leap year
const doyOf = (mmdd) => {
  const [m, d] = mmdd.split("-").map(Number);
  return Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000) + 1;
};

// The season's running total over the model window (as defile-explore season.py sums it), blank
// days on the straight line between their counted neighbours; null outside the window
function running(share, doy) {
  const [w0, w1] = props.data.window.model.map(doyOf);
  const inWindow = doy.map((d) => d >= w0 && d <= w1);
  const v = share.map((x, i) => (inWindow[i] ? x : 0));
  const known = v.map((x, i) => (x == null ? -1 : i)).filter((i) => i >= 0);
  for (let i = 0; i < v.length; i++) {
    if (v[i] != null) continue;
    const a = known.filter((k) => k < i).at(-1);
    const b = known.find((k) => k > i);
    v[i] = a == null || b == null ? 0 : v[a] + ((v[b] - v[a]) * (i - a)) / (b - a);
  }
  const total = v.reduce((t, x) => t + x, 0) || 1;
  let c = 0;
  return v.map((x, i) => ((c += x / total), inWindow[i] ? c : null));
}

const seasonDiv = ref(null);
const visible = usePlot(seasonDiv);

function plot() {
  if (!visible.value || !seasonDiv.value) return;
  const i = s.value.years.indexOf(year.value);
  const share = s.value.share[i];
  const count = s.value.count[i];
  const doy = s.value.doy;
  const ticks = [196, 213, 227, 244, 258, 274, 288, 305, 319, 335].filter(
    (d) => d >= doy[0] && d <= doy.at(-1),
  );
  const p = passage.value;
  Plotly.react(
    seasonDiv.value,
    [
      {
        x: doy,
        y: share.map((v) => (v == null ? null : v)),
        type: "bar",
        // a day nobody counted, its share estimated, paler
        marker: {
          color: count.map((n) =>
            filled.value && n == null ? "rgba(31, 119, 180, 0.25)" : "rgba(31, 119, 180, 0.6)",
          ),
        },
        text: doy.map((d) => doyLabel(d, locale.value)),
        hovertemplate: "%{text}: %{y:.1%} of the season<extra></extra>",
      },
      {
        x: doy,
        y: share.map((v) => (v == null ? 0.004 : null)),
        type: "bar",
        marker: { color: "rgba(150, 150, 150, 0.5)" },
        hoverinfo: "skip",
      },
      {
        x: doy,
        y: running(share, doy),
        yaxis: "y2",
        mode: "lines",
        line: { color: "#212529", width: 2 },
        hoverinfo: "skip",
      },
    ],
    {
      margin: { t: 8, l: 48, r: 44, b: 30 },
      dragmode: false,
      autosize: true,
      showlegend: false,
      font: { size: 11 },
      bargap: 0.1,
      barmode: "overlay",
      xaxis: {
        fixedrange: true,
        tickvals: ticks,
        ticktext: ticks.map((d) => doyLabel(d, locale.value)),
      },
      yaxis: {
        fixedrange: true,
        tickformat: ".0%",
        title: { text: "share per day" },
        gridcolor: "rgba(0,0,0,0.08)",
      },
      yaxis2: {
        fixedrange: true,
        overlaying: "y",
        side: "right",
        range: [0, 1.02],
        tickvals: [0, 0.25, 0.5, 0.75, 1],
        tickformat: ".0%",
        showgrid: false,
      },
      shapes: p
        ? [
            ...["q10", "q50", "q90"].map((k) => ({
              type: "line",
              x0: p[k],
              x1: p[k],
              yref: "paper",
              y0: 0,
              y1: 1,
              line: { color: "#d62728", dash: k === "q50" ? "dash" : "dot", width: 1.5 },
            })),
            ...(p.q50_lo != null
              ? [
                  {
                    type: "rect",
                    x0: p.q50_lo,
                    x1: p.q50_hi,
                    yref: "paper",
                    y0: 0,
                    y1: 1,
                    fillcolor: "rgba(214, 39, 40, 0.12)",
                    line: { width: 0 },
                    layer: "below",
                  },
                ]
              : []),
          ]
        : [],
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, year.value, s.value, locale.value], plot);
</script>
