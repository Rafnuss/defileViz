import { ref, onMounted, onUnmounted } from "vue";

/**
 * Page from the URL hash: "#explore" or "#explore/<taxon_id>" is the Explore page, anything else
 * (including species anchors) the forecast.
 */
export function parseHash(hash) {
  // eslint-disable-next-line security/detect-unsafe-regex -- linear: single optional group
  const m = hash.match(/^#explore(?:\/(.+))?$/);
  return m
    ? { page: "explore", taxon: m[1] ? decodeURIComponent(m[1]) : null }
    : { page: "forecast", taxon: null };
}

export function useHashRoute() {
  const initial = parseHash(window.location.hash);
  const page = ref(initial.page);
  const exploreTaxon = ref(initial.taxon);

  const onHashChange = () => {
    const h = parseHash(window.location.hash);
    page.value = h.page;
    if (h.taxon) exploreTaxon.value = h.taxon;
  };
  // Keep the URL in step with the species picked on the Explore page, without a history entry
  const onExploreSelect = (id) => {
    const hash = `#explore/${encodeURIComponent(id)}`;
    if (window.location.hash !== hash) history.replaceState(null, "", hash);
  };

  onMounted(() => window.addEventListener("hashchange", onHashChange));
  onUnmounted(() => window.removeEventListener("hashchange", onHashChange));

  return { page, exploreTaxon, onExploreSelect };
}
