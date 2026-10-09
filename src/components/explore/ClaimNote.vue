<template>
  <!-- What defile-explore's reliability classes say about the fields a figure draws -->
  <div v-if="notes.length" class="claim small">
    <div v-for="n in notes" :key="n.cls" :class="`claim-${n.cls}`">
      <i
        class="me-1"
        :class="n.cls === 'hide' ? 'bi bi-eye-slash' : 'bi bi-exclamation-triangle'"
      ></i>
      <strong>{{ n.cls === "hide" ? $t("explore.hidden") : $t("explore.caveat") }}:</strong>
      {{ n.text }}
      <a href="#" class="text-nowrap" @click.prevent="$emit('method')">
        <i class="bi bi-info-circle"></i>
      </a>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { fate, reasonsOf } from "../../services/explore";

const { t } = useI18n();

const props = defineProps({
  data: { type: Object, required: true },
  // fields of the species file the figure draws (reliability.elements keys)
  elements: { type: Array, required: true },
});
defineEmits(["method"]);

const notes = computed(() =>
  ["hide", "caveat"]
    .map((cls) => {
      const codes = new Set(
        props.elements
          .filter((e) => fate(props.data, e) === cls)
          .flatMap((e) => reasonsOf(props.data, e)),
      );
      // "totals" (the trend resting on uncertain totals) adds nothing to the totals' own reasons
      if (codes.size > 1) codes.delete("totals");
      return { cls, text: [...codes].map((c) => t(`explore.reasons.${c}`)).join("; ") };
    })
    .filter((n) => n.text),
);
</script>

<style scoped>
.claim > div {
  border-left: 3px solid var(--c);
  background: var(--bg);
  padding: 0.3rem 0.6rem;
  border-radius: 0.25rem;
  margin-bottom: 0.4rem;
}
.claim-caveat {
  --c: var(--bs-warning);
  --bg: var(--bs-warning-bg-subtle);
}
.claim-hide {
  --c: var(--bs-secondary);
  --bg: var(--bs-light);
}
</style>
