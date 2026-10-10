<template>
  <footer class="site-footer">
    <div class="container footer-grid">
      <section>
        <h2>{{ $t("footer.partners") }}</h2>
        <div class="partners">
          <a
            v-for="p in PARTNERS"
            :key="p.name"
            :href="p.url"
            target="_blank"
            rel="noopener"
            class="partner"
          >
            <img :src="p.logo" :alt="p.name" />
            <span>{{ p.name }}</span>
          </a>
        </div>
      </section>
      <section>
        <h2>{{ $t("footer.count") }}</h2>
        <ul>
          <li>
            <a href="https://www.trektellen.org/count/view/2422/" target="_blank" rel="noopener">
              {{ $t("footer.countTrektellen") }}
            </a>
          </li>
        </ul>
        <h2 class="mt-4">{{ $t("footer.references") }}</h2>
        <ul>
          <li v-for="r in REFERENCES" :key="r.url" class="ref">
            <a :href="r.url" target="_blank" rel="noopener">{{ r.title }}</a>
            <span class="repo">{{ r.source }}</span>
          </li>
          <li class="ref">
            <a
              href="https://biblio.lpo-aura.org/documents/syntheses-annuelles-du-suivi-de-la-migration-postnuptiale-au-defile-de-lecluse-haute-savoie-et-ain-france/"
              target="_blank"
              rel="noopener"
              >{{ $t("footer.annualReports") }}</a
            >
            <span class="repo">LPO Auvergne-Rhône-Alpes</span>
          </li>
        </ul>
      </section>
      <section>
        <h2>{{ $t("footer.code") }}</h2>
        <ul>
          <li v-for="r in REPOS" :key="r.repo">
            <a :href="`https://github.com/${r.repo}`" target="_blank" rel="noopener">
              <i class="bi bi-github me-1"></i>{{ $t(r.label) }}
            </a>
            <span class="repo">{{ r.repo }}</span>
          </li>
        </ul>
      </section>
    </div>
  </footer>
</template>

<script setup>
const base = import.meta.env.BASE_URL;
const PARTNERS = [
  { name: "Vogelwarte", url: "https://www.vogelwarte.ch/en/", logo: `${base}soi_logo.png` },
  {
    name: "LPO Auvergne-Rhône-Alpes",
    url: "https://auvergne-rhone-alpes.lpo.fr/",
    logo: `${base}lpo_logo.webp`,
  },
  { name: "Trektellen", url: "https://www.trektellen.org/", logo: `${base}trektellen_logo2.png` },
];
// The published syntheses of the count, in French (Nos Oiseaux)
const REFERENCES = [
  {
    title:
      "Évolution annuelle (1993-2017) de la migration postnuptiale des rapaces au défilé de l'Écluse",
    source: "Birot-Colomb et al. 2019, Nos Oiseaux 66: 101",
    url: "https://auvergne-rhone-alpes.lpo.fr/wp-content/uploads/ArticleDE1993-2017NO536Birot-Colombetal2019.pdf",
  },
  {
    title:
      "Évolution annuelle (1993-2019) de la migration postnuptiale au défilé de l'Écluse. II. Pigeons, Grue cendrée, Ciconiiformes, Grand Cormoran, Guêpier d'Europe, corvidés, alouettes et irruptions d'espèces forestières",
    source: "Birot-Colomb et al. 2020, Nos Oiseaux 67: 221",
    url: "https://auvergne-rhone-alpes.lpo.fr/wp-content/uploads/ArticleDE1993-2019N542Birot-Colombetal2020.pdf",
  },
];
const REPOS = [
  { label: "footer.datasetRepo", repo: "Rafnuss/defile-dataset" },
  { label: "footer.modelRepo", repo: "AmedeeRoy/defile-migration-forecast" },
  { label: "footer.exploreRepo", repo: "Rafnuss/defile-explore" },
  { label: "footer.siteRepo", repo: "Rafnuss/defileViz" },
];
</script>

<style scoped>
.site-footer {
  margin-top: 4rem;
  padding: 2rem 0 2.5rem;
  background: var(--dv-surface);
  border-top: 1px solid var(--dv-line);
  font-size: 0.875rem;
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr 1fr;
  gap: 2rem;
}
h2 {
  font-size: 0.75rem;
  font-weight: 650;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--dv-muted);
  margin-bottom: 0.75rem;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0;
}
li {
  margin-bottom: 0.5rem;
}
li a {
  text-decoration: none;
}
li a:hover {
  text-decoration: underline;
}
.repo {
  display: block;
  font-size: 0.75rem;
  color: var(--dv-faint);
}
.ref a {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.partners {
  display: flex;
  flex-wrap: wrap;
  gap: 1.25rem;
}
.partner {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
  color: var(--dv-muted);
  text-decoration: none;
  font-size: 0.75rem;
}
.partner:hover {
  color: var(--dv-ink);
}
.partner img {
  height: 44px;
  width: auto;
}
@media (max-width: 767.98px) {
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}
</style>
