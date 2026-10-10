<template>
  <p class="page-lead">
    {{ $t("intro.description") }}
    <a
      href="https://github.com/AmedeeRoy/defile-migration-forecast"
      target="_blank"
      rel="noopener"
      >{{ $t("intro.neuralNetwork") }}</a
    >. {{ $t("intro.checkActualCount") }}
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
  </p>
</template>

<style scoped>
.page-lead {
  color: var(--dv-muted);
  font-size: 0.9rem;
  max-width: 52rem;
  margin-bottom: 1.25rem;
}
</style>
