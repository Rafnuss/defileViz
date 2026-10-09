<template>
  <div>
    <div class="callout callout-primary">
      <h6 class="callout-heading"><i class="bi bi-lightbulb me-1"></i>In short</h6>
      <ul class="mb-0">
        <li>
          Migration has been counted at the Défilé since 1966, but not always the same way. Each
          species is compared only from the year it was counted in full.
        </li>
        <li>
          Totals are of a season window, the part of autumn counted nearly every year, widened for
          species still passing at its edges.
        </li>
        <li>
          Everything else is built in a line from here: the time of day and the coverage of each
          day, the trend model that fills the gaps, its test, and what the page shows.
        </li>
      </ul>
    </div>

    <section id="m-history">
      <h5><span class="sec-n">1</span>Sixty years of counting</h5>
      <p>
        Migration has been counted at the Défilé since 1966, but not always the same way. The first
        decades are notebooks of a few days or hours a season. Counting became daily and systematic
        in <strong>1993</strong>; most passerines were recorded in full from <strong>2007</strong>;
        counts were noted hour by hour from <strong>2014</strong>, and entered on Trektellen from
        <strong>2021</strong>.
      </p>
      <figure v-if="effort" class="figure w-100">
        <div ref="historyDiv" class="plot-sm"></div>
        <figcaption class="figure-caption">
          <strong>Figure 1.</strong> Days counted each season between 18 July and 18 November, all
          species; in colour, the seasons compared for {{ name }}.
        </figcaption>
      </figure>
      <p>
        So each species is compared only from the year it was counted in full:
        <strong>{{ startYear }}</strong> for {{ name }}. Earlier counts stay in the data and in the
        records, but are not part of totals or trends.
      </p>
    </section>

    <section id="m-window">
      <h5><span class="sec-n">2</span>Which days</h5>
      <p>
        Totals are of a <strong>season window</strong>. By default it runs from 18 July to 18
        November, when the count is near-complete. A species still passing at its edges gets a wider
        window, as long as most years were counted then: <strong>{{ windowText }}</strong> for
        {{ name }}.
        <template v-if="beyond">
          {{ name }} still passes when counting thins out at the end of {{ beyond }}: its totals
          stop there.</template
        >
        The trend model is fitted on the days of this window only.
      </p>
    </section>

    <section id="m-entries">
      <h5><span class="sec-n">3</span>The entries</h5>
      <p>
        The counts are those of the published dataset, as the counters entered them, each with its
        survey: when counting started and stopped, to the minute. That survey time is what the
        coverage of a day is made of (<a
          href="#"
          @click.prevent="$emit('method', 'coverage', 'm-coverage')"
          >Time of day and coverage</a
        >). Entries that look like recording errors, such as a block's total noted at its last
        minute, a clock an hour off on the day summer time ends, or a count entered twice, are
        listed for the editors and corrected in the dataset, not by rules here.
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-basic-dist-min";
import { usePlot } from "../../../utils/usePlot";

const { locale } = useI18n();

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

const PROTOCOL = {
  1993: "daily counts",
  2007: "passerines",
  2014: "hour by hour",
  2021: "Trektellen",
};

const startYear = computed(() => props.data.settings.start_year.value);
const lastYear = computed(() => props.data.trend?.last_year ?? new Date().getFullYear() - 1);

// "MM-DD" -> "18 Jul" in the locale
const md = (mmdd) => {
  const [m, d] = mmdd.split("-").map(Number);
  return new Date(Date.UTC(2001, m - 1, d)).toLocaleDateString(locale.value, {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
};
const windowText = computed(() => props.data.window.model.map(md).join(" – "));
const beyond = computed(() =>
  props.data.window.beyond_counting
    .map((w) => ({ early: "the season's start", late: "the season" })[w] ?? w)
    .join(" and "),
);

const historyDiv = ref(null);
const visible = usePlot(historyDiv);

function plotHistory() {
  if (!visible.value || !historyDiv.value || !props.effort) return;
  const e = props.effort.filter((r) => r.year <= lastYear.value);
  Plotly.react(
    historyDiv.value,
    [
      {
        x: e.map((r) => r.year),
        y: e.map((r) => r.window_days),
        type: "bar",
        marker: { color: e.map((r) => (r.year >= startYear.value ? "#1f77b4" : "#adb5bd")) },
        hovertemplate: "%{x}: %{y} days<extra></extra>",
      },
    ],
    {
      margin: { t: 34, l: 40, r: 8, b: 28 },
      dragmode: false,
      autosize: true,
      showlegend: false,
      font: { size: 11 },
      xaxis: { fixedrange: true },
      yaxis: { fixedrange: true, title: { text: "days" }, gridcolor: "rgba(0,0,0,0.08)" },
      shapes: Object.keys(PROTOCOL).map((y) => ({
        type: "line",
        x0: y - 0.5,
        x1: y - 0.5,
        yref: "paper",
        y0: 0,
        y1: 1,
        line: { color: "#6c757d", dash: "dot", width: 1 },
      })),
      annotations: Object.entries(PROTOCOL).map(([y, text], k) => ({
        x: y - 0.5,
        y: 1.02 + 0.1 * (k % 2),
        yanchor: "bottom",
        yref: "paper",
        text,
        showarrow: false,
        xanchor: "right",
        font: { size: 10, color: "#6c757d" },
      })),
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.effort, startYear.value], plotHistory);
</script>
