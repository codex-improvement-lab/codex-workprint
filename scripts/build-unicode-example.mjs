import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { adaptCodexJsonl } from "../src/adapter/codex-jsonl-v0_1.ts";
import { PUBLIC_BUNDLE_FILES, renderPublicBundle, verifyPublicBundle } from "../src/bundle.ts";
import { codePointCompare } from "../src/core/canonical.ts";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const refresh = process.argv.includes("--refresh");
const source = join(root, "tests", "fixtures", "codex-0.145.0-failure-followup.jsonl");
const target = join(root, "examples", "unicode-run-receipt", "workprint");
const { workprint } = adaptCodexJsonl(await readFile(source, "utf8"), {
  title: "修复登录失败并验证发布",
  project: "Workprint 示例",
  release: "0.3.0-rc.3",
  language: "zh-Hans",
});

if (refresh) {
  await mkdir(target, { recursive: true });
  const existing = (await readdir(target)).sort(codePointCompare);
  const expected = [...PUBLIC_BUNDLE_FILES].sort(codePointCompare);
  const unexpected = existing.filter((name) => !expected.includes(name));
  if (unexpected.length) throw new Error(`Refusing to refresh Unicode example with unexpected entries: ${unexpected.join(", ")}.`);
  for (const [name, bytes] of renderPublicBundle(workprint)) await writeFile(join(target, name), bytes);
}

const report = await verifyPublicBundle(target);
if (!report.ok) throw new Error(`Unicode Run Receipt is invalid: ${report.errors.join(" ")}`);
process.stdout.write(`VERIFIED examples/unicode-run-receipt/workprint · ${report.checkedFiles.length} files · zh-Hans title\n`);
