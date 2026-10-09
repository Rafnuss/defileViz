<template>
  <!-- A figure's head: a short title (grey), its main result (dark), the (i) to the method, and
       underneath, smaller, how to read the figure -->
  <div class="fig-head">
    <h6 class="mb-0">
      <span class="fig-title">{{ title }}</span>
      <span v-if="result" class="fig-result">{{ result }}</span>
      <button
        type="button"
        class="btn btn-link btn-sm p-0 ms-1 align-baseline info-btn"
        :title="$t('explore.method.link')"
        :aria-label="$t('explore.method.link')"
        @click="$emit('info')"
      >
        <i class="bi bi-info-circle"></i>
      </button>
    </h6>
    <p v-if="caption" class="fig-caption">{{ caption }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  result: { type: String, default: null },
  caption: { type: String, default: null },
});
defineEmits(["info"]);
</script>

<style scoped>
.fig-title {
  color: var(--bs-secondary-color);
  font-weight: 500;
}
.fig-result {
  color: var(--bs-body-color);
  font-weight: 700;
  margin-left: 0.4rem;
}
.fig-caption {
  font-size: 0.8rem;
  color: var(--bs-secondary-color);
  margin: 0.15rem 0 0.35rem;
}
</style>
