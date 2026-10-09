<template>
  <!-- The page's methods as a chain, each step opening its modal -->
  <div class="flow-row">
    <template v-for="(s, i) in STEPS" :key="s.key">
      <i
        v-if="i && i < STEPS.length - 1"
        class="bi bi-arrow-right flow-arrow"
        aria-hidden="true"
      ></i>
      <span v-else-if="i" class="flow-gap"></span>
      <button
        type="button"
        class="flow-step"
        :class="`step-${s.key}`"
        @click="$emit('open', s.key)"
      >
        <i :class="`bi ${s.icon}`"></i>
        <span class="flow-title">{{ $t(`explore.method.${s.key}`) }}</span>
        <span class="flow-sub">{{ $t(`explore.method.${s.key}Sub`) }}</span>
      </button>
    </template>
  </div>
</template>

<script setup>
defineEmits(["open"]);

// In the order of the build; age and sex, a branch of its own, set apart at the end
const STEPS = [
  { key: "counts", icon: "bi-journal-text" },
  { key: "coverage", icon: "bi-clock" },
  { key: "model", icon: "bi-graph-up" },
  { key: "reliability", icon: "bi-check2-circle" },
  { key: "shown", icon: "bi-calendar3" },
  { key: "demography", icon: "bi-people" },
];
</script>

<style scoped>
.flow-row {
  display: flex;
  align-items: stretch;
  gap: 0.4rem;
  flex-wrap: wrap;
}
.flow-step {
  flex: 1 1 140px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  border: 1px solid var(--c);
  background: var(--bg);
  border-radius: 0.5rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.85rem;
}
.flow-step:hover {
  filter: brightness(0.97);
}
.flow-step i {
  color: var(--c);
  font-size: 1.1rem;
}
.flow-title {
  font-weight: 600;
}
.flow-sub {
  color: var(--bs-secondary-color);
  font-size: 0.78rem;
}
.flow-arrow {
  align-self: center;
  color: var(--bs-secondary-color);
}
.flow-gap {
  width: 0.8rem;
}
.step-counts {
  --c: #adb5bd;
  --bg: #f8f9fa;
}
.step-coverage {
  --c: #6c757d;
  --bg: #f1f3f5;
}
.step-shown {
  --c: #1f77b4;
  --bg: #eef5fb;
}
.step-model {
  --c: #2ca02c;
  --bg: #eef7ee;
}
.step-reliability {
  --c: #e66c00;
  --bg: #fff5eb;
}
.step-demography {
  --c: #9467bd;
  --bg: #f5f0fa;
}
@media (max-width: 576px) {
  .flow-arrow,
  .flow-gap {
    display: none;
  }
}
</style>
