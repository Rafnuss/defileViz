<template>
  <!-- An authored text (defile-explore content/accounts): a quote-like block with a short bold
       lead-in, and a mark saying how it was written, explained on hover or focus -->
  <blockquote class="authored">
    <p class="mb-0">
      <strong v-if="label" class="lead-in">{{ label }}.</strong>
      {{ text }}
      <span class="ai-mark" tabindex="0" :aria-label="$t('explore.account.ai')">
        <i class="bi bi-stars"></i>
        <span class="ai-tip" role="tooltip">{{ $t("explore.account.ai") }}</span>
      </span>
    </p>
  </blockquote>
</template>

<script setup>
defineProps({
  label: { type: String, default: null },
  text: { type: String, required: true },
});
</script>

<style scoped>
.authored {
  border-left: 3px solid var(--bs-border-color);
  padding: 0.1rem 0 0.1rem 0.85rem;
  margin: 0;
  color: var(--bs-body-color);
  font-style: normal;
  font-size: 1rem;
}
.lead-in {
  font-weight: 600;
  margin-right: 0.15rem;
}
.ai-mark {
  position: relative;
  display: inline-block;
  margin-left: 0.15rem;
  font-size: 0.8em;
  color: var(--bs-secondary-color);
  outline: none;
}
.ai-tip {
  position: absolute;
  z-index: 10;
  bottom: calc(100% + 6px);
  right: -0.5rem;
  width: max-content;
  max-width: 16rem;
  padding: 0.3rem 0.55rem;
  border-radius: 0.35rem;
  background: var(--bs-emphasis-color);
  color: var(--bs-body-bg);
  font-size: 0.75rem;
  line-height: 1.3;
  white-space: normal;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.12s;
  pointer-events: none;
}
.ai-mark:hover .ai-tip,
.ai-mark:focus .ai-tip {
  opacity: 1;
  visibility: visible;
}
</style>
