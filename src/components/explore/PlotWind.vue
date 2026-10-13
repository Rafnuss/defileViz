<template>
  <!-- The wind rose: a 5 m/s wind from each side against calm, the model's effect (slate-blue
       area, the solid circle is ×1) and the counted days with wind from that side (rust dots,
       against calm days, the rest of the model kept); a side faded when unclear or with few days -->
  <svg :viewBox="`0 0 ${W} ${W}`" class="wind" role="img" :aria-label="title">
    <title>{{ title }}</title>
    <circle :cx="C" :cy="C" :r="radius(RING_MAX)" class="ring" stroke-dasharray="3 3" />
    <circle :cx="C" :cy="C" :r="radius(1)" class="ring" />
    <polygon :points="area" :fill="alpha(COLORS.predicted, 0.18)" :stroke="COLORS.predicted" />
    <g v-for="(s, k) in sides" :key="s.from">
      <circle
        :cx="at(k, radius(s.effect))[0]"
        :cy="at(k, radius(s.effect))[1]"
        r="4"
        :fill="s.class === 'hide' ? COLORS.surface : COLORS.predicted"
        :stroke="COLORS.predicted"
      >
        <title>{{ s.hover }}</title>
      </circle>
      <circle
        v-if="s.relative != null && s.days >= minDays"
        :cx="at(k, radius(s.relative))[0]"
        :cy="at(k, radius(s.relative))[1]"
        r="3"
        :fill="alpha(COLORS.counted, 0.85)"
      >
        <title>{{ s.countedHover }}</title>
      </circle>
      <text
        :x="at(k, R + 14)[0]"
        :y="at(k, R + 14)[1] + 4"
        text-anchor="middle"
        :class="['side', { best: s.from === best }]"
      >
        {{ s.label }}
      </text>
    </g>
  </svg>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { COLORS, alpha } from "../../theme.js";

const { t, locale } = useI18n();

const props = defineProps({
  // weather.wind (defile-explore `weather.weather_block`): `rose`, one entry per side (`from`,
  // `effect`, `class`, counted `days` and their `relative` birds), `speed`, `origin`
  wind: { type: Object, required: true },
  // sides with fewer counted days have no dot (defile-explore `reliability.WEATHER_MIN_DAYS`)
  minDays: { type: Number, default: 20 },
});

const W = 240;
const C = W / 2;
const R = 90;
const RING_MAX = 4; // the dashed circle: ×4
const RING_MIN = 0.125; // the centre: ×1/8
const radius = (x) => {
  const v = Math.log(Math.min(Math.max(x, RING_MIN), RING_MAX));
  return ((v - Math.log(RING_MIN)) / (Math.log(RING_MAX) - Math.log(RING_MIN))) * R;
};
const at = (k, r) => {
  const a = ((k * 45 - 90) * Math.PI) / 180;
  return [C + r * Math.cos(a), C + r * Math.sin(a)];
};
const num = (x) => x.toLocaleString(locale.value, { maximumSignificantDigits: 2 });

const best = computed(() => {
  const k = Math.round(props.wind.origin / 45) % 8;
  return props.wind.rose[k]?.from;
});
const sides = computed(() =>
  props.wind.rose.map((s) => ({
    ...s,
    label: t(`explore.weather.sides.${s.from}`),
    hover: t("explore.weather.windHover", {
      side: t(`explore.weather.sides.${s.from}`),
      x: num(s.effect),
      lo: num(s.lo),
      hi: num(s.hi),
    }),
    countedHover: t("explore.weather.windCounted", {
      n: s.days.toLocaleString(locale.value),
      x: num(s.relative ?? 0),
    }),
  })),
);
const area = computed(() => sides.value.map((s, k) => at(k, radius(s.effect)).join(",")).join(" "));
const title = computed(() => t("explore.weather.windTitle", { speed: props.wind.speed }));
</script>

<style scoped>
.wind {
  width: 100%;
  max-width: 280px;
  display: block;
  margin: 0 auto;
}
.ring {
  fill: none;
  stroke: var(--dv-line, #e0dacd);
}
.side {
  font-size: 11px;
  fill: var(--bs-secondary-color);
}
.side.best {
  font-weight: 700;
  fill: var(--bs-body-color);
}
</style>
