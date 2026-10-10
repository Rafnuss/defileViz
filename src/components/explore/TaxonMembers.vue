<template>
  <div v-if="parts.length" class="members small text-center mt-2">
    <p class="text-muted mb-0">
      {{ $t(group ? "explore.members.group" : "explore.members.species") }}
      <template v-for="(m, i) in inline" :key="m.taxon_id"
        >{{ i === 0 ? "" : i === inline.length - 1 ? ` ${$t("explore.members.and")} ` : ", "
        }}<a
          v-if="m.tier === 'full' && m.taxon_id !== taxon.taxon_id"
          href="#"
          :class="{ 'fst-italic': isGroup(m) }"
          @click.prevent="$emit('select', m.taxon_id)"
          >{{ m.label ?? taxonName(m, locale) }}</a
        ><span v-else :class="{ 'fst-italic': isGroup(m) }">{{
          m.label ?? taxonName(m, locale)
        }}</span></template
      >{{ endStop }}
      <button
        type="button"
        class="btn btn-link btn-sm p-0 ms-1 align-baseline"
        @click="open = !open"
      >
        {{ $t(open ? "explore.members.hide" : "explore.members.details")
        }}<i :class="`bi bi-chevron-${open ? 'up' : 'down'} ms-1`"></i>
      </button>
    </p>

    <div v-if="open" class="table-responsive mt-2 text-start">
      <table class="table table-sm align-middle mb-0 members-table">
        <thead>
          <tr>
            <th>{{ $t("explore.members.name") }}</th>
            <th class="text-end" :title="$t('explore.members.daysHelp')">
              {{ $t("explore.members.days") }}
            </th>
            <th class="text-end" :title="$t('explore.members.birdsHelp')">
              {{ $t("explore.members.birds") }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="m in rows" :key="m.taxon_id" :class="{ self: m.taxon_id === taxon.taxon_id }">
            <td>
              <a
                v-if="m.tier === 'full' && m.taxon_id !== taxon.taxon_id"
                href="#"
                @click.prevent="$emit('select', m.taxon_id)"
                >{{ taxonName(m, locale) }}</a
              ><span v-else>{{ taxonName(m, locale) }}</span>
              <span class="sci">{{ m.scientific_name }}</span>
              <span class="badges">
                <a
                  v-for="(url, k) in linksOf(m)"
                  :key="k"
                  :href="url"
                  target="_blank"
                  rel="noopener"
                  class="link-badge"
                  :title="LINKS[k]?.label ?? k"
                  :aria-label="LINKS[k]?.label ?? k"
                  ><i :class="`bi ${LINKS[k]?.icon ?? 'bi-box-arrow-up-right'}`"></i
                ></a>
              </span>
            </td>
            <td class="text-end tnum">{{ m.own_days == null ? "–" : fmt(m.own_days) }}</td>
            <td class="text-end tnum">{{ fmt(m.own_birds ?? 0) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { taxonName, isGroup, linksOf, LINKS } from "../../services/explore";

const { t, locale } = useI18n();

const props = defineProps({
  // The taxon shown (its taxa.json entry) and all of taxa.json
  taxon: { type: Object, required: true },
  taxa: { type: Array, required: true },
});
defineEmits(["select"]);

// Names shown in the line before the rest is folded into "n more"
const INLINE = 12;

const byId = computed(() => new Map(props.taxa.map((tx) => [tx.taxon_id, tx])));
const group = computed(() => isGroup(props.taxon));
const order = (a, b) => (a.taxon_order ?? Infinity) - (b.taxon_order ?? Infinity);

// What the taxon adds up (defile-explore `add_rollups`): a group's species and smaller groups, a
// species's subspecies, in taxonomic order and without the taxon itself
const parts = computed(() =>
  (props.taxon.members ?? [])
    .filter((id) => id !== props.taxon.taxon_id)
    .map((id) => byId.value.get(id))
    .filter(Boolean)
    .sort(order),
);

// Every name in the table with its own records (before the sums), the most counted first
const rows = computed(() =>
  [...parts.value, props.taxon].sort((a, b) => (b.own_birds ?? 0) - (a.own_birds ?? 0)),
);
// The line: the members, then the group itself ("… and curlew sp.")
const inline = computed(() => {
  const shown = parts.value.slice(0, INLINE);
  const rest = parts.value.length - shown.length;
  if (rest) shown.push({ taxon_id: "more", label: t("explore.members.more", { n: rest }) });
  return group.value ? [...shown, props.taxon] : shown;
});
// The closing full stop, unless the line ends on a name ending in one ("curlew sp.")
const endStop = computed(() =>
  group.value && taxonName(props.taxon, locale.value).endsWith(".") ? "" : ".",
);

const open = ref(false);
watch(
  () => props.taxon.taxon_id,
  () => (open.value = false),
);

const fmt = (x) => Math.round(x).toLocaleString(locale.value);
</script>

<style scoped>
.members {
  max-width: 44rem;
  margin-left: auto;
  margin-right: auto;
}
.members-table {
  font-size: 0.85rem;
}
.members-table th {
  font-weight: 600;
  color: var(--bs-secondary-color);
}
.members-table tr.self td {
  color: var(--bs-secondary-color);
}
.sci {
  font-style: italic;
  font-size: 0.9em;
  color: var(--bs-secondary-color);
  margin-left: 0.25rem;
}
.badges {
  white-space: nowrap;
}
.link-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.4rem;
  margin-left: 0.25rem;
  border: 1px solid var(--bs-border-color);
  border-radius: 50%;
  font-size: 0.75rem;
  color: var(--bs-secondary-color);
  text-decoration: none;
  vertical-align: middle;
}
.link-badge:hover {
  color: var(--bs-primary);
  border-color: var(--bs-primary);
}
.tnum {
  font-variant-numeric: tabular-nums;
}
</style>
