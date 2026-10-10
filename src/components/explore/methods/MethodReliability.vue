<template>
  <div>
    <div class="callout callout-primary">
      <h6 class="callout-heading"><i class="bi bi-lightbulb me-1"></i>In short</h6>
      <ul class="mb-0">
        <li>
          Every species' model is tested on its own counts: well-counted seasons are given the gaps
          of older ones, and the model has to find the birds it was not shown.
        </li>
        <li>
          From that test and from how uncertain the estimates are, each result is
          <em>shown</em>, <em>read with care</em>, or <em>not shown</em>.
        </li>
        <li>The counts themselves are always shown.</li>
      </ul>
    </div>

    <section id="m-test">
      <h5><span class="sec-n">1</span>Testing on known seasons</h5>
      <p>
        Recent seasons were counted almost every hour of every day, so their totals are known. Each
        one is given the hours and days that went uncounted in an older season, then filled by the
        model exactly as the page fills real gaps, and the estimate is compared with what was
        actually counted. This is repeated with different older seasons, for every species with a
        model.
      </p>
      <div class="row g-2 mb-3 text-center">
        <div v-for="s in STATS" :key="s.l" class="col-6 col-md-3">
          <div class="stat">
            <div class="stat-v">{{ s.v }}</div>
            <div class="stat-l">{{ s.l }}</div>
          </div>
        </div>
      </div>
      <p class="small text-muted">
        Medians over the 73 species tested (2025 counts). The intervals are about right, slightly
        too narrow for some: the estimates fall a little short of the truth on average (−4%), most
        for species passing in a few big flocks (Purple Heron, curlews, Whimbrel, Mediterranean
        Gull), whose missed days hold the birds nobody saw.
      </p>

      <figure v-if="gap" class="figure w-100">
        <div ref="testDiv" class="plot-md"></div>
        <figcaption class="figure-caption">
          <strong>Figure 1.</strong> {{ name }}: each test, the season total filled by the model
          against the birds actually counted that season (80% interval thick, 95% thin). On the
          dotted line, the estimate is exact. Median error
          <strong>{{ pct(gap.abs_log_err) }}</strong
          >; {{ pct(gap.cover80) }} of the 80% intervals hold the truth ({{ gap.n }} tests).
        </figcaption>
      </figure>
      <p v-else class="text-muted small">
        {{ name }} has no well-counted season to test on, or no model.
      </p>
    </section>

    <section id="m-classes">
      <h5><span class="sec-n">2</span>Shown, read with care, or not shown</h5>
      <p>
        Three things the model claims are judged separately, each by fixed rules. The counts are
        never judged: they are what was seen. The season panels, made of the model's gap-filled
        days, follow the totals: drawn as read with care when the totals are, and rebuilt from the
        counts alone, birds per full day, when the totals are not shown (<a
          href="#"
          @click.prevent="$emit('method', 'shown', 'm-rate')"
          >What the page shows</a
        >).
      </p>
      <div class="table-responsive">
        <table class="table table-sm align-middle small">
          <thead>
            <tr>
              <th>Claim</th>
              <th>Judged by</th>
              <th v-if="q" class="text-nowrap">{{ name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in CLAIMS" :key="c.key">
              <td>
                <strong>{{ c.name }}</strong>
              </td>
              <td>{{ c.rule }}</td>
              <td v-if="q">
                <span class="badge" :class="BADGE[q[c.key].class]">{{
                  LABEL[q[c.key].class]
                }}</span>
                <div v-for="r in q[c.key].reasons" :key="r.code" class="text-muted">
                  {{ $t(`explore.reasons.${r.code}`) }}
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p v-if="q?.estimated_years?.length" class="small">
        Seasons less than half counted are ringed on the page as mostly estimated:
        {{ q.estimated_years.join(", ") }}.
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { usePlot, plotReact } from "../../../utils/usePlot";
import { COLORS, alpha } from "../../../theme.js";

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

// defile-explore DECISIONS.md -> Pipeline (benchmark@1) and reliability.py: update them there first
const STATS = [
  { v: "10%", l: "typical error on a season total (6–16% between quartiles)" },
  { v: "17%", l: "the same, dividing each count by its coverage" },
  { v: "83%", l: "of 80% intervals hold the truth" },
  { v: "100%", l: "of 95% intervals hold the truth" },
];
const CLAIMS = [
  {
    key: "totals",
    name: "Season totals",
    rule: "The test above: hidden when the fill misses known totals by more than 40%, read with care above 15%, when its intervals hold the truth too rarely, when most of a season is estimated, or when the intervals are very wide.",
  },
  {
    key: "trend",
    name: "Smooth trend",
    rule: "Needs the totals, and a 95% interval narrower than a factor 4 (read with care) or 20 (hidden).",
  },
  {
    key: "season",
    name: "Passage dates",
    rule: "The median date's 80% interval: read with care above 10 days, hidden above 30; read with care when the species still passes when counting ends.",
  },
];
const BADGE = { show: "text-bg-success", caveat: "text-bg-warning", hide: "text-bg-secondary" };
const LABEL = { show: "shown", caveat: "read with care", hide: "not shown" };

const q = computed(() => props.data.reliability);
const gap = computed(() => props.data.benchmark?.gap ?? null);
const pct = (x) => `${Math.round(x * 100)}%`;

const testDiv = ref(null);
const visible = usePlot(testDiv);

function plot() {
  const trials = props.data.benchmark?.gap_trials;
  if (!visible.value || !testDiv.value || !trials?.length) return;
  const x = trials.map((r) => r.truth);
  const y = trials.map((r) => r.estimate);
  const lo = Math.min(...x, ...trials.map((r) => r["q2.5"])) * 0.8;
  const hi = Math.max(...x, ...trials.map((r) => r["q97.5"])) * 1.25;
  const bars = (a, b, w) => ({
    x,
    y,
    mode: "markers",
    marker: { size: 1, color: COLORS.predicted },
    error_y: {
      type: "data",
      symmetric: false,
      array: trials.map((r) => r[b] - r.estimate),
      arrayminus: trials.map((r) => r.estimate - r[a]),
      width: 0,
      thickness: w,
      color: alpha(COLORS.predicted, 0.6),
    },
    hoverinfo: "skip",
  });
  plotReact(
    testDiv.value,
    [
      {
        x: [lo, hi],
        y: [lo, hi],
        mode: "lines",
        line: { color: COLORS.faint, dash: "dot" },
        hoverinfo: "skip",
      },
      bars("q2.5", "q97.5", 1),
      bars("q10", "q90", 3.5),
      {
        x,
        y,
        mode: "markers",
        marker: { color: COLORS.predicted, size: 7 },
        customdata: trials.map((r) => [r.target, r.donor]),
        hovertemplate:
          "%{customdata[0]} with the gaps of %{customdata[1]}: counted %{x:,.0f}, estimated %{y:,.0f}<extra></extra>",
      },
    ],
    {
      margin: { t: 8, l: 64, r: 8, b: 44 },
      dragmode: false,
      autosize: true,
      showlegend: false,
      font: { size: 11 },
      xaxis: {
        type: "log",
        fixedrange: true,
        range: [Math.log10(lo), Math.log10(hi)],
        title: { text: "birds counted" },
      },
      yaxis: {
        type: "log",
        fixedrange: true,
        range: [Math.log10(lo), Math.log10(hi)],
        title: { text: "estimated" },
      },
    },
    { displayModeBar: false, responsive: true },
  );
}

watch(() => [visible.value, props.data], plot);
</script>
