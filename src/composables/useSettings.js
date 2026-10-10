import { ref, watch } from "vue";

const SETTINGS_KEY = "defile-settings";

function loadSaved() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || {};
  } catch {
    return {};
  }
}

/** Forecast-page settings, remembered in localStorage. */
export function useSettings() {
  const saved = loadSaved();
  const plotOptions = ref(
    ["today", "nextDays", "season"].map((name) => ({
      name,
      show: saved.plots?.[name] ?? true,
    })),
  );
  const medianThreshold = ref(saved.medianThreshold ?? 0);
  const nextDaysLength = ref(saved.nextDaysLength ?? 4);
  const sortOption = ref(saved.sortOption ?? "taxonomy");

  watch(
    [plotOptions, medianThreshold, nextDaysLength, sortOption],
    () => {
      const settings = {
        plots: Object.fromEntries(plotOptions.value.map((p) => [p.name, p.show])),
        medianThreshold: medianThreshold.value,
        nextDaysLength: nextDaysLength.value,
        sortOption: sortOption.value,
      };
      try {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      } catch {
        // Storage blocked (private mode): settings just aren't remembered
      }
    },
    { deep: true },
  );

  return { plotOptions, medianThreshold, nextDaysLength, sortOption };
}
