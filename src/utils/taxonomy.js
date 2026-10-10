// Taxonomic (IOC/AviList) order of the species shown on the site.
const TAXONOMIC_ORDER = [
  "Osprey",
  "European Honey Buzzard",
  "Red Kite",
  "Black Kite",
  "Western Marsh Harrier",
  "Hen Harrier",
  "Eurasian Sparrowhawk",
  "Common Buzzard",
  "Common Kestrel",
  "Merlin",
  "Eurasian Hobby",
];

/** Rank of a species in taxonomic order; unknown species go last. */
export function taxonomicRank(species) {
  const i = TAXONOMIC_ORDER.indexOf(species);
  return i === -1 ? TAXONOMIC_ORDER.length : i;
}
