import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, renderPublicBundle, verifyPublicBundle } from "../src/bundle.ts";
import { codePointCompare } from "../src/core/canonical.ts";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const refresh = process.argv.includes("--refresh");
const demos = [
  {
    source: join(projectRoot, ".workprint-private", "real-runs", "run-b-v1.jsonl"),
    target: join(projectRoot, "demo"),
    options: {
      title: "Create a marker after an expected failed check",
      project: "Codex Workprint",
      release: "0.3.0-rc.3",
      labels: ["Real Codex CLI 0.145.0 / Windows", "Public projection / no transcript"],
      annotations: [
        { sequence: 5, phase: "verify", label: "Expected marker check" },
        { sequence: 7, phase: "edit", label: "Create marker" },
        { sequence: 10, phase: "verify", label: "Follow-up marker check" },
        { sequence: 11, phase: "deliver", label: "Concise public report" },
      ],
    },
  },
  {
    source: join(projectRoot, ".workprint-private", "real-runs", "run-a-v2.jsonl"),
    target: join(projectRoot, "examples", "alternate-workprint"),
    options: {
      title: "Change one tiny status and observe the check",
      project: "Codex Workprint",
      release: "0.3.0-rc.3",
      labels: ["Real Codex CLI 0.145.0 / Windows", "Alternate public Workline"],
      annotations: [
        { sequence: 4, phase: "inspect", label: "Read status" },
        { sequence: 6, phase: "edit", label: "Update status" },
        { sequence: 9, phase: "verify", label: "Diff check" },
        { sequence: 10, phase: "deliver", label: "Concise public report" },
      ],
    },
  },
];

for (const demo of demos) {
  if (refresh) {
    const input = await readFile(demo.source, "utf8").catch(() => {
      throw new Error("Private real-run source is unavailable. Refresh is maintainer-local and never falls back to a fixture.");
    });
    const { workprint } = adaptCodexJsonl(input, demo.options);
    await refreshKnownBundle(demo.target, renderPublicBundle(workprint));
  }
  const report = await verifyPublicBundle(demo.target);
  if (!report.ok) throw new Error(`${relative(demo.target)} is not a valid deterministic public bundle: ${report.errors.join(" ")}`);
  process.stdout.write(`VERIFIED ${relative(demo.target)} · ${report.checkedFiles.length} files\n`);
}

const heroCard = await readFile(join(projectRoot, "demo", "share-card.png"));
const socialPreviewPath = join(projectRoot, "docs", "assets", "github-social-preview.png");
if (refresh) await writeFile(socialPreviewPath, heroCard);
const socialPreview = await readFile(socialPreviewPath).catch(() => null);
if (!socialPreview?.equals(heroCard)) throw new Error(`${relative(socialPreviewPath)} must be byte-identical to the current Run Receipt share card; run with --refresh.`);
process.stdout.write(`VERIFIED ${relative(socialPreviewPath)} · byte-identical Run Receipt social preview\n`);

async function refreshKnownBundle(target, files) {
  await mkdir(target, { recursive: true });
  const existing = (await readdir(target)).sort(codePointCompare);
  const expected = [...PUBLIC_BUNDLE_FILES].sort(codePointCompare);
  const unexpected = existing.filter((name) => !expected.includes(name));
  if (unexpected.length) throw new Error(`Refusing to refresh ${relative(target)} with unexpected entries: ${unexpected.join(", ")}.`);
  for (const [name, bytes] of files) await writeFile(join(target, name), bytes);
}

function relative(path) {
  return path.slice(projectRoot.length + 1).replaceAll("\\", "/");
}
