import { ref, onMounted, onUnmounted } from "vue";

/**
 * Page from the URL hash: "#explore" or "#explore/<ebird_code>" is the Explore page, anything else
 * (including species anchors) the forecast.
 */
export function parseHash(hash) {
  // eslint-disable-next-line security/detect-unsafe-regex -- linear: single optional group
  const m = hash.match(/^#explore(?:\/([^/]+))?$/);
  return m ? { page: "explore", taxon: m[1] ?? null } : { page: "forecast", taxon: null };
}

export function useHashRoute() {
  const initial = parseHash(window.location.hash);
  const page = ref(initial.page);
  // The Explore taxon: from the URL, or the last one shown when it has none ("#explore")
  const exploreTaxon = ref(initial.taxon);

  const onHashChange = () => {
    const h = parseHash(window.location.hash);
    page.value = h.page;
    if (h.taxon) exploreTaxon.value = h.taxon;
  };
  // A taxon picked on the Explore page is a history entry; one put right (none in the URL, or no
  // page for it) replaces the URL
  const onExploreSelect = (taxon, replace = false) => {
    exploreTaxon.value = taxon;
    const hash = `#explore/${taxon}`;
    if (window.location.hash === hash) return;
    if (replace) history.replaceState(history.state, "", hash);
    else history.pushState(history.state, "", hash);
  };

  onMounted(() => window.addEventListener("hashchange", onHashChange));
  onUnmounted(() => window.removeEventListener("hashchange", onHashChange));

  return { page, exploreTaxon, onExploreSelect };
}
