<template>
  <div>
    <section id="m-share">
      <h5><span class="sec-n">1</span>Shares among the birds classed</h5>
      <p>
        Counters age or sex only some of the birds, when the light, the distance and the time allow,
        and that share changes from year to year. So every value is a
        <strong>share among the birds given an age (or a sex)</strong> that year, with a 95%
        interval (Wilson's). It assumes the birds classed are a fair sample of those passing.
      </p>
      <ul>
        <li>
          <strong>Age:</strong> adults against all younger birds. First-year, juvenile, immature and
          second-year birds are one class, because the codes counters used switched between years.
        </li>
        <li>
          <strong>Sex:</strong> males against females and "female-coloured" birds (a female or a
          young bird, not separable in the field).
        </li>
      </ul>
    </section>

    <section id="m-years">
      <h5><span class="sec-n">2</span>Which years</h5>
      <p>
        A year is used only if at least 20 birds were classed, 5% of those counted, and
        <strong>both classes were recorded</strong>: the smaller at least 10% of the birds classed.
        That last rule matters. Counters often tag one class and leave the other blank: in 2024, 4
        030 Red Kites were noted as young and only 8 as adults, among 17 372 counted. The share
        among aged birds would then measure what was tagged, not what passed. A species needs three
        such years for the panel.
      </p>
      <p v-if="blocks.length" class="small">
        <template v-for="b in blocks" :key="b.what">
          {{ name }}, {{ b.what }}: {{ b.years.length }} years ({{ b.years[0] }}–{{
            b.years.at(-1)
          }}), {{ Math.round(b.overall.n).toLocaleString() }} birds classed of
          {{ Math.round(b.overall.counted).toLocaleString() }} counted in those years.
        </template>
      </p>
      <p v-else class="small text-muted">
        {{ name }} has no year where enough birds were aged or sexed.
      </p>
    </section>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  name: { type: String, required: true },
  data: { type: Object, required: true },
  effort: { type: Array, default: null },
});
defineEmits(["method"]);

const blocks = computed(() =>
  [
    ["age", "age"],
    ["sex", "sex"],
  ]
    .filter(([k]) => props.data[k])
    .map(([k, what]) => ({ what, ...props.data[k] })),
);
</script>
