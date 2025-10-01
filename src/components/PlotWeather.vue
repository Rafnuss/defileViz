<template>
  <h2>{{ $t("weather.title") }}</h2>
  <div class="card mb-4">
    <div class="card-header d-flex flex-wrap gap-3 align-items-center">
      <label class="form-label mb-0 small d-inline-flex align-items-center gap-1">
        <span>{{ $t("weather.variable") }}</span>
        <select v-model="selectedVar" class="form-select form-select-sm w-auto">
          <option v-for="v in variableList" :key="v" :value="v">
            {{ weatherMeta[v]?.label || v }}
          </option>
        </select>
      </label>
      <a
        v-if="currentVarMeta?.docUrl"
        :href="currentVarMeta.docUrl"
        target="_blank"
        rel="noopener"
        class="small text-decoration-none d-inline-flex align-items-center"
        :title="`ERA5 documentation for ${currentVarMeta.label}`"
        :aria-label="`ERA5 documentation for ${currentVarMeta.label}`"
      >
        <i class="bi bi-info-circle fs-6"></i>
      </a>
      <label class="form-label mb-0 small d-inline-flex align-items-center gap-1">
        <span>{{ $t("weather.days") }}</span>
        <input
          type="number"
          class="form-control form-control-sm w-auto"
          v-model.number="durationDays"
          :min="1"
          :max="maxDays"
        />
      </label>
    </div>
    <div class="card-body">
      <div ref="plotEl" class="w-100" style="min-height: 360px"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import Plotly from "plotly.js-dist-min";

const { t } = useI18n();

const props = defineProps({
  weather: { type: Object, required: true },
});

const plotEl = ref(null);
const selectedVar = ref(null);
const durationDays = ref(3);

// ERA5 parameter metadata: label (human-readable), unit (ERA5 native), docUrl (parameter reference)
const weatherMeta = {
  temperature_2m: {
    label: "2m Temperature",
    unit: "K",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=167",
  },
  dewpoint_temperature_2m: {
    label: "2m Dew Point Temperature",
    unit: "K",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=168",
  },
  total_precipitation: {
    label: "Total Precipitation",
    unit: "m",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=228",
  },
  surface_pressure: {
    label: "Surface Pressure",
    unit: "Pa",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=134",
  },
  u_component_of_wind_10m: {
    label: "10m U Wind Component",
    unit: "m s⁻¹",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=165",
  },
  v_component_of_wind_10m: {
    label: "10m V Wind Component",
    unit: "m s⁻¹",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=166",
  },
  u_component_of_wind_100m: {
    label: "100m U Wind Component",
    unit: "m s⁻¹",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=228246",
  },
  v_component_of_wind_100m: {
    label: "100m V Wind Component",
    unit: "m s⁻¹",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=228247",
  },
  instantaneous_10m_wind_gust: {
    label: "10m Wind Gust (Instantaneous)",
    unit: "m s⁻¹",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=49",
  },
  high_cloud_cover: {
    label: "High Cloud Cover",
    unit: "fraction (0–1)",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=188",
  },
  low_cloud_cover: {
    label: "Low Cloud Cover",
    unit: "fraction (0–1)",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=186",
  },
  medium_cloud_cover: {
    label: "Medium Cloud Cover",
    unit: "fraction (0–1)",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=187",
  },
  total_cloud_cover: {
    label: "Total Cloud Cover",
    unit: "fraction (0–1)",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=164",
  },
  surface_solar_radiation_downwards: {
    label: "Surface Solar Radiation Downwards",
    unit: "J m⁻²",
    docUrl: "https://codes.ecmwf.int/grib/param-db/?id=169",
  },
  sun_altitude: {
    label: "Sun Altitude",
    unit: "°",
    docUrl: "",
  }, // derived / custom
  sun_azimuth: {
    label: "Sun Azimuth",
    unit: "°",
    docUrl: "",
  }, // derived / custom
};

const currentVarMeta = computed(() => (selectedVar.value ? weatherMeta[selectedVar.value] : null));

// Variable list derived from weather prop & metadata (exclude dates/time)
const variableList = computed(() =>
  Object.keys(props.weather || {})
    .filter((k) => !["dates", "time"].includes(k))
    .filter((k) => Array.isArray(props.weather[k]))
);

const maxDays = computed(() => props.weather?.dates?.length || 0);

watch(
  () => props.weather,
  (w) => {
    if (!w) return;
    if (!selectedVar.value || !variableList.value.includes(selectedVar.value)) {
      selectedVar.value = variableList.value[0];
    }
    durationDays.value = Math.min(durationDays.value, maxDays.value || 1);
    render();
  },
  { immediate: true }
);

watch([selectedVar, durationDays], () => render());

function buildSeries() {
  const w = props.weather;
  if (!w || !selectedVar.value) return { x: [], y: [] };
  const dates = w.dates || [];
  const time = w.time || [];
  const data2d = w[selectedVar.value] || []; // shape [date][hour]
  const days = Math.min(durationDays.value, data2d.length);

  const x = [];
  const y = [];
  for (let d = 0; d < days; d++) {
    const baseDate = new Date(dates[d]);
    const row = data2d[d] || [];
    for (let h = 0; h < row.length && h < time.length; h++) {
      const val = row[h];
      if (val === null || val === undefined) continue;
      const ts = new Date(baseDate);
      // time[h] assumed hour-of-day; fallback h
      const hourNum = Number.isFinite(time[h]) ? time[h] : h;
      ts.setHours(hourNum, 0, 0, 0);
      x.push(ts);
      y.push(val);
    }
  }
  return { x, y };
}

function render() {
  if (!plotEl.value || !selectedVar.value) return;
  const { x, y } = buildSeries();
  const meta = currentVarMeta.value || {};
  const label = meta.label || selectedVar.value;
  const unitSuffix = meta.unit ? ` (${meta.unit})` : "";
  const trace = {
    x,
    y,
    type: "scatter",
    mode: "lines+markers",
    name: label,
    line: { width: 2 },
    marker: { size: 5 },
    hovertemplate: `%{x|%Y-%m-%d %H:%M}<br>${label}: %{y:.3f}${
      meta.unit ? " " + meta.unit : ""
    }<extra></extra>`,
  };
  const layout = {
    margin: { l: 80, r: 10, t: 20, b: 50 },
    xaxis: { title: { text: "Time" }, automargin: true, type: "date" },
    yaxis: { title: { text: label + unitSuffix }, automargin: true },
    showlegend: false,
  };
  Plotly.react(plotEl.value, [trace], layout, { displaylogo: false, responsive: true });
  requestAnimationFrame(() => {
    if (plotEl.value) Plotly.Plots.resize(plotEl.value);
  });
}

onMounted(() => render());
</script>

<style scoped>
/* Inline controls */
.card-header .form-label {
  font-weight: 500;
  gap: 0.4rem;
}
.card-header .form-label span {
  white-space: nowrap;
}
</style>
