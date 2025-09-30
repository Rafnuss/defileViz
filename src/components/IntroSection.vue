<template>
  <div>
    <h1>{{ $t("intro.title") }}</h1>
    <div v-if="showIntro" class="alert alert-info alert-dismissible" role="alert">
      <button
        type="button"
        class="btn-close"
        :aria-label="$t('common.close')"
        @click="closeIntro"
      />
      <span>
        {{ $t("intro.description") }}
        <a
          href="https://github.com/AmedeeRoy/defile-migration-forecast"
          target="_blank"
          rel="noopener"
          >{{ $t("intro.neuralNetwork") }}</a
        >.<br />
        {{ $t("intro.checkActualCount") }}
        <a href="https://www.trektellen.org/count/view/2422/" target="_blank" rel="noopener"
          >Trektellen</a
        >
        {{ $t("intro.readMore") }}
        <a
          href="https://auvergne-rhone-alpes.lpo.fr/projets/migration-post-nuptiale-au-defile-de-lecluse/"
          target="_blank"
          rel="noopener"
          >LPO Auvergne-Rhône-Alpes</a
        >.
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";

// i18n setup
const { t } = useI18n();

// Internal state for intro visibility with localStorage persistence
const showIntro = ref(true);

// Load saved state from localStorage
onMounted(() => {
  const savedState = localStorage.getItem("defile-intro-dismissed");
  if (savedState === "true") {
    showIntro.value = false;
  }
});

// Function to handle closing intro and save state
function closeIntro() {
  showIntro.value = false;
  localStorage.setItem("defile-intro-dismissed", "true");
}
</script>
