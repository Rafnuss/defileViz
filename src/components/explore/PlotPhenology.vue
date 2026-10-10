<template>
  <div class="pheno">
    <svg
      ref="svgEl"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-100"
      role="img"
      :aria-label="$t('explore.timing.title')"
      @pointermove="onMove"
      @pointerleave="tip = null"
    >
      <g v-for="(row, i) in rows" :key="row.year">
        <rect
          v-for="(v, j) in row.share"
          :key="j"
          :x="x0 + j * cw"
          :y="yOf(i)"
          :width="cw + 0.3"
          :height="RH - 1"
          :fill="color(v)"
          :fill-opacity="filled && v != null && row.count[j] == null ? PALE : 1"
        />
      </g>
      <!-- smooth median (and 10/90%) passage dates -->
      <template v-if="smoothPaths">
        <path
          v-for="(d, k) in smoothPaths"
          :key="'s' + k"
          :d="d"
          class="smooth"
          :class="{ outer: k !== 1 }"
        />
      </template>
      <!-- each season's median date, with its 80% interval when gap-filled -->
      <line
        v-for="p in dots.filter((d) => d.lo != null)"
        :key="'b' + p.year"
        :x1="p.lo"
        :x2="p.hi"
        :y1="p.y"
        :y2="p.y"
        class="band"
      />
      <circle
        v-for="p in dots"
        :key="'d' + p.year"
        :cx="p.x"
        :cy="p.y"
        r="3.2"
        class="dot"
        :style="{ opacity: p.opacity }"
      />
      <!-- axes -->
      <text
        v-for="r in yearTicks"
        :key="'y' + r.year"
        :x="x0 - 6"
        :y="r.y + RH / 2"
        class="tick"
        text-anchor="end"
        dominant-baseline="middle"
      >
        {{ r.year }}
      </text>
      <g v-for="m in monthTicks" :key="'m' + m.doy">
        <line :x1="m.x" :x2="m.x" :y1="TOP" :y2="TOP + rows.length * RH" class="grid" />
        <text :x="m.x + 3" :y="H - 6" class="tick">{{ m.label }}</text>
      </g>
    </svg>
    <div v-if="tip" class="tip small" :style="{ left: `${tip.left}%`, top: `${tip.top}%` }">
      {{ tip.text }}
    </div>
    <div class="legend small text-muted d-flex flex-wrap gap-3 mt-1">
      <span
        ><span class="sw-dot"></span
        >{{ $t(filled ? "explore.timing.medianFilled" : "explore.timing.medianCounted") }}</span
      >
      <span v-if="smoothPaths"
        ><span class="sw-line"></span>{{ $t("explore.timing.medianSmooth") }}</span
      >
      <span v-if="filled"><span class="sw-pale"></span>{{ $t("explore.timing.estimated") }}</span>
      <span><span class="sw-gap"></span>{{ $t("explore.timing.notCounted") }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";
import { useI18n } from "vue-i18n";
import { doyLabel } from "../../services/explore";
import { COLORS } from "../../theme.js";

const { t, locale } = useI18n();

const props = defineProps({
  // season: {source, years, doy, share: [[...]], count: [[...]], c: [[...]],
  //   passage: [{year, q10, q50, q90, q50_lo, q50_hi, counted}]}; source "gam": every day of the
  //   model window gap-filled by the trend (count null = not counted), "counts": share null there
  season: { type: Object, required: true },
  // trend.passage_q: [{year, q10, q50, q90}], or null when not shown (a caveat hides it:
  // defile-explore `reliability.NO_CAVEAT`)
  smooth: { type: Array, default: null },
});

const W = 900;
const RH = 10; // px per season, in the viewBox
const TOP = 4;
const BOTTOM = 24;
const x0 = 46;
const x1 = W - 8;
// Sequential scale (pale gold to deep rust, from the palette), on the share relative to a high
// quantile; hex only (color() interpolates them). First and last stops: a light gold and a rust
// darker than COLORS.red, the ends the palette lacks.
const STOPS = ["#f5e6b8", COLORS.gold, COLORS.ochre, COLORS.counted, COLORS.red, "#6e2a12"];
const C_ZERO = COLORS.paper; // counted, no bird
const C_GAP = COLORS.line; // not counted
const MONTHS = [182, 213, 244, 274, 305, 335];
const PALE = 0.45; // opacity of a day not counted, its share estimated

const svgEl = ref(null);
const tip = ref(null);

const filled = computed(() => props.season.source === "gam");
// Newest season on top
const rows = computed(() =>
  props.season.years
    .map((year, i) => ({ year, share: props.season.share[i], count: props.season.count[i] }))
    .reverse(),
);
const H = computed(() => TOP + rows.value.length * RH + BOTTOM);
const cw = computed(() => (x1 - x0) / props.season.doy.length);
const xOf = (doy) => x0 + (doy - props.season.doy[0] + 0.5) * cw.value;
const yOf = (i) => TOP + i * RH;
const rowIndex = computed(() => Object.fromEntries(rows.value.map((r, i) => [r.year, i])));

const vmax = computed(() => {
  const v = props.season.share
    .flat()
    .filter((x) => x != null && x > 0)
    .sort((a, b) => a - b);
  return v.length ? v[Math.floor(0.98 * (v.length - 1))] : 1;
});
function color(v) {
  if (v == null) return C_GAP;
  if (v <= 0) return C_ZERO;
  const f = Math.min(v / vmax.value, 1) * (STOPS.length - 1);
  const i = Math.min(Math.floor(f), STOPS.length - 2);
  const mix = (a, b, w) => Math.round(a + (b - a) * w);
  const [c0, c1] = [STOPS[i], STOPS[i + 1]].map((s) =>
    [1, 3, 5].map((k) => parseInt(s.slice(k, k + 2), 16)),
  );
  const w = f - i;
  return `rgb(${mix(c0[0], c1[0], w)},${mix(c0[1], c1[1], w)},${mix(c0[2], c1[2], w)})`;
}

const dots = computed(() =>
  props.season.passage
    .filter((p) => p.q50 != null && p.year in rowIndex.value)
    .map((p) => ({
      year: p.year,
      x: xOf(p.q50),
      y: yOf(rowIndex.value[p.year]) + RH / 2 - 0.5,
      lo: p.q50_lo != null ? xOf(p.q50_lo) : null,
      hi: p.q50_hi != null ? xOf(p.q50_hi) : null,
      // gap-filled dates carry their interval; counted ones pale with the share of days counted
      opacity: filled.value ? 1 : 0.35 + 0.65 * (p.counted ?? 1),
    })),
);
const smoothPaths = computed(() => {
  if (!props.smooth) return null;
  return ["q10", "q50", "q90"].map((k) =>
    props.smooth
      .filter((p) => p.year in rowIndex.value)
      .map(
        (p, i) =>
          `${i ? "L" : "M"}${xOf(p[k]).toFixed(1)},${(yOf(rowIndex.value[p.year]) + RH / 2).toFixed(1)}`,
      )
      .join(""),
  );
});
const yearTicks = computed(() =>
  rows.value
    .map((r, i) => ({ year: r.year, y: yOf(i) }))
    .filter((r) => r.year % 5 === 0 || r.year === rows.value[0].year),
);
const monthTicks = computed(() => {
  const [d0, d1] = [props.season.doy[0], props.season.doy.at(-1)];
  return MONTHS.filter((d) => d > d0 && d < d1 - 10).map((d) => ({
    doy: d,
    x: x0 + (d - d0) * cw.value,
    label: doyLabel(d, locale.value),
  }));
});

function onMove(ev) {
  const svg = svgEl.value;
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX;
  pt.y = ev.clientY;
  const p = pt.matrixTransform(svg.getScreenCTM().inverse());
  const j = Math.floor((p.x - x0) / cw.value);
  const i = Math.floor((p.y - TOP) / RH);
  const row = rows.value[i];
  if (!row || j < 0 || j >= props.season.doy.length) return (tip.value = null);
  const date = `${doyLabel(props.season.doy[j], locale.value)} ${row.year}`;
  const n = row.count[j];
  const v = row.share[j];
  const pct = v == null ? "" : ` (${(100 * v).toFixed(1)}%)`;
  let text;
  if (n != null) text = `${Math.round(n).toLocaleString(locale.value)} ${t("explore.birds")}${pct}`;
  else if (v != null) text = `${t("explore.timing.estimated")}${pct}`;
  else text = t("explore.timing.notCounted");
  tip.value = { left: (p.x / W) * 100, top: (p.y / H.value) * 100, text: `${date}: ${text}` };
}
</script>

<style scoped>
.pheno {
  position: relative;
}
.tick {
  font-size: 11px;
  fill: var(--dv-muted);
}
.grid {
  stroke: color-mix(in srgb, var(--dv-surface) 70%, transparent);
  stroke-width: 1;
}
.smooth {
  fill: none;
  stroke: var(--dv-ink);
  stroke-width: 2;
}
.smooth.outer {
  stroke-width: 1.2;
  stroke-dasharray: 2 3;
}
.band {
  stroke: var(--dv-ink);
  stroke-width: 1.2;
}
.dot {
  fill: var(--dv-surface);
  stroke: var(--dv-ink);
  stroke-width: 1.2;
}
.tip {
  position: absolute;
  transform: translate(-50%, -130%);
  background: color-mix(in srgb, var(--dv-ink) 90%, transparent);
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  pointer-events: none;
  white-space: nowrap;
}
.sw-dot,
.sw-line,
.sw-gap,
.sw-pale {
  display: inline-block;
  vertical-align: middle;
  margin-right: 4px;
}
.sw-dot {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  border: 1.2px solid var(--dv-ink);
  background: var(--dv-surface);
}
.sw-line {
  width: 18px;
  border-top: 2px solid var(--dv-ink);
}
.sw-pale {
  width: 12px;
  height: 9px;
  background: var(--dv-ochre);
  opacity: 0.45;
}
.sw-gap {
  width: 12px;
  height: 9px;
  background: var(--dv-line);
}
</style>
