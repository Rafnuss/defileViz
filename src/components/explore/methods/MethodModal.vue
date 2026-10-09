<template>
  <div
    id="exploreMethod"
    ref="modalEl"
    class="modal fade"
    tabindex="-1"
    aria-labelledby="exploreMethodTitle"
    aria-hidden="true"
  >
    <div class="modal-dialog modal-xl modal-dialog-scrollable">
      <div class="modal-content">
        <div class="modal-header">
          <div>
            <h4 id="exploreMethodTitle" class="modal-title mb-0">
              {{ $t(`explore.method.${topic}`) }}
            </h4>
            <div class="small text-muted">
              Illustrated with <strong>{{ name }}</strong
              >, the species selected on the page.
            </div>
          </div>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>

        <div ref="bodyEl" class="modal-body method">
          <!-- The model page draws the fit: a species without one gets a note instead -->
          <div v-if="shown && topic === 'model' && !data.trend" class="callout callout-info">
            <strong>{{ name }} has no trend model</strong>: it was not counted on enough days for
            one. Its page is read from the counts, each divided by its coverage (<a
              href="#"
              @click.prevent="open('coverage', 'm-rate')"
              >Time of day and coverage</a
            >). Pick a species counted every season, such as a common raptor, to see the model.
          </div>
          <component
            :is="COMPONENTS[topic]"
            v-else-if="shown"
            :key="topic"
            :name="name"
            :data="data"
            :effort="effort"
            @method="(t, s) => open(t, s)"
          />
        </div>

        <div class="modal-footer justify-content-start small">
          <span class="text-muted me-1">{{ $t("explore.method.title") }}:</span>
          <template v-for="(k, i) in TOPICS" :key="k">
            <span v-if="i" class="text-muted">·</span>
            <strong v-if="k === topic">{{ $t(`explore.method.${k}`) }}</strong>
            <a v-else href="#" @click.prevent="open(k)">{{ $t(`explore.method.${k}`) }}</a>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted, onBeforeUnmount } from "vue";
import { Modal } from "bootstrap";
import MethodCounts from "./MethodCounts.vue";
import MethodCoverage from "./MethodCoverage.vue";
import MethodModel from "./MethodModel.vue";
import MethodReliability from "./MethodReliability.vue";
import MethodShown from "./MethodShown.vue";
import MethodDemography from "./MethodDemography.vue";
import "./method.css";

// One modal per method of the Explore page, in the order of the page's "How it's made" strip.
// English only for now (titles are translated in i18n/explore.js). Numbers quoted in the text
// come from defile-explore DECISIONS.md: update them there first.

defineProps({
  name: { type: String, required: true },
  // the species file
  data: { type: Object, required: true },
  // effort.json `annual`: days and hours counted per year
  effort: { type: Array, default: null },
});

// In the order of the build (defile-explore README -> How it's made)
const TOPICS = ["counts", "coverage", "model", "reliability", "shown", "demography"];
const COMPONENTS = {
  counts: MethodCounts,
  coverage: MethodCoverage,
  model: MethodModel,
  reliability: MethodReliability,
  shown: MethodShown,
  demography: MethodDemography,
};

const modalEl = ref(null);
const bodyEl = ref(null);
const topic = ref("counts");
const shown = ref(false);
let modal;
let pendingSection = null;

function scrollTo(id, behavior = "smooth") {
  const body = bodyEl.value;
  const el = body?.querySelector(`#${id}`);
  if (!el) return;
  const top = el.getBoundingClientRect().top - body.getBoundingClientRect().top + body.scrollTop;
  body.scrollTo({ top: top - 12, behavior });
}
function onShown() {
  shown.value = true;
  const section = pendingSection;
  pendingSection = null;
  // Instantly: Bootstrap's focus on show cuts a smooth scroll (plots have a fixed min-height)
  if (section) nextTick(() => scrollTo(section, "instant"));
}

/** Open the modal on a method (one of TOPICS), at a section of it (an element id) if given. */
async function open(t, section = null) {
  const switching = shown.value && t !== topic.value;
  topic.value = t;
  await nextTick();
  if (modalEl.value.classList.contains("show")) {
    if (section) scrollTo(section, switching ? "instant" : "smooth");
    else bodyEl.value?.scrollTo({ top: 0 });
    return;
  }
  pendingSection = section;
  bodyEl.value?.scrollTo({ top: 0 });
  modal.show();
}
defineExpose({ open });

onMounted(() => {
  modal = Modal.getOrCreateInstance(modalEl.value);
  modalEl.value.addEventListener("shown.bs.modal", onShown);
});
onBeforeUnmount(() => {
  modalEl.value?.removeEventListener("shown.bs.modal", onShown);
  modal?.dispose();
});
</script>
