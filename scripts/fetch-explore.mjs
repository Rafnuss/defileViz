// Puts the Explore export (defile-explore) in public/data/explore/, which git ignores: downloaded
// from a defile-explore release (deploy.yml), or copied from a local build to try it before it
// is published.
//   node scripts/fetch-explore.mjs                                       # release EXPLORE_RELEASE
//   node scripts/fetch-explore.mjs --from ../defile-explore/data/explore # a local build
import { execFileSync } from "node:child_process";
import { cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// The defile-explore release the site is built with: the rolling `dev` pre-release
// (scripts/publish_explore.py there) until the first versioned one.
const EXPLORE_RELEASE = process.env.EXPLORE_RELEASE ?? "dev";
const EXPLORE_URL = `https://github.com/Rafnuss/defile-explore/releases/download/${EXPLORE_RELEASE}/explore.zip`;
const OUT = "public/data/explore";

const from = process.argv.indexOf("--from");
rmSync(OUT, { recursive: true, force: true });
if (from > 0) {
  cpSync(process.argv[from + 1], OUT, { recursive: true });
} else {
  const r = await fetch(EXPLORE_URL);
  if (!r.ok) throw new Error(`${EXPLORE_URL}: HTTP ${r.status}`);
  const zip = join(mkdtempSync(join(tmpdir(), "explore-")), "explore.zip");
  writeFileSync(zip, Buffer.from(await r.arrayBuffer()));
  execFileSync("unzip", ["-q", zip, "-d", OUT]);
}
const m = JSON.parse(readFileSync(join(OUT, "manifest.json"), "utf8"));
console.log(
  `Explore export ${m.git_sha} (dataset ${m.dataset_git_sha.slice(0, 7)}), built ${m.built_at} -> ${OUT}`,
);
