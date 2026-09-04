# Current 0.3.0-rc.3 presentation delta

The current Run renderer is `workline-0.4.2`; PNG renderer remains `workprint-png-v5/indexed-stored-deflate/unifont-17.0.05`. The rc.2 physical-Mac acceptance remains valid for that archived package. This rc.3 fixes action-label wrapping, ships JavaScript for installed packages and adds a synthetic offline first run. Windows browser checks cover 1440, 1280 and 390px. No new physical-Mac execution is claimed. The older handoff and package identities below are retained as history, not instructions to relabel their PASS.

If a future current-Mac check is desired, the packaged offline example and verify command are the narrow affected path; no model call or repetition of the entire Lab mission is required.

## Historical handoff

# Physical macOS validation handoff

This is an independent, fail-closed task for a real Darwin host. It must be executed from a checkout or source bundle selected by the operator, not inferred from Windows, Linux, a responsive browser viewport, POSIX emulation, or a `macos-latest` GitHub Actions job. No result is a macOS PASS until the steps below produce a redacted report.

Run the shell sections in order in one Terminal session so the temporary-path variables remain available. If a section is run separately, repeat its variable setup from the preceding section; an unset variable is a fail-closed condition, not a reason to guess a path.

## Current candidate status: 0.3.0-rc.2 — scoped external physical-Mac PASS

On 2026-09-05 the user supplied an external `AUTOMATED_IMPLEMENTATION_PASS` receipt and browser PASS report for the exact minimal package. Local audit confirms the package archive, internal manifest, candidate versions, Shape/public IR, and all seven public artifact hashes. Codex did not witness the run.

The report names two PNG screenshots and SHA-256 values, while the delivered images are messaging-service-transcoded JPEG files with different hashes. The user explicitly confirmed that the transformed images correspond to the originals and directed that this transfer mismatch not block acceptance. The [closure record](evidence/macos/0.3.0-rc.2-attempt-2/ACCEPTANCE_CLOSURE.json) therefore upgrades the scoped result to `PASS` while preserving the unequal byte identities in the [import audit](evidence/macos/0.3.0-rc.2-attempt-2/IMPORT_AUDIT.json). Do not relabel the JPEG hashes as PNG hashes, the historical 0.1 rc.2 PASS as current evidence, or hosted `macos-latest` configuration as physical-device evidence.

### Current minimal validation package

Use the self-contained [`codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip`](../expert-review/codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip) with its adjacent [SHA-256 sidecar](../expert-review/codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip.sha256) for a new current-candidate run:

```text
SHA-256  98a50a8aca3b3ace7b7eb1c4687bbd5ffa3b0dbf073327e2ef1a5c84044d1091
Bytes    1250055
Files    46 after extraction
```

The package contains the runtime source, pinned font and schemas, one sanitized synthetic fixture, exact expected cross-platform bundle hashes, an identity verifier, a fail-closed Darwin runner, a loopback-only static server, and a two-screenshot report template. It excludes private runs, dependency trees, historical evidence, and unrelated review material. Its `README.md` is the current shortest handoff; the longer material below remains historical and diagnostic reference.

An automated package result is deliberately named `AUTOMATED_IMPLEMENTATION_PASS`, not `MACOS_VALIDATION_RESULT=PASS`. The latter additionally requires the package's desktop and 390×844 local-browser checklist, two screenshots, zero console errors/warnings, and zero remote requests. A fresh live Codex run is not required for this minimum scoped validation.

The exact current public identities are:

| Identity | Expected value |
| --- | --- |
| package | `0.3.0-rc.2` |
| adapter | `0.2.0` |
| Run IR | `0.2` |
| Workline renderer | `workline-0.4.1` |
| PNG renderer | `workprint-png-v5/indexed-stored-deflate/unifont-17.0.05` |
| hero Shape / public IR | `21fc1fde4c98…` / `5bc530cfba59…` |
| alternate Shape / public IR | `272932db4351…` / `9b5a6aadd6ee…` |
| Unicode Shape / public IR | `d8d549d76084…` / `f43edb4c89be…` |

The minimal package automates BOM/LF/CRLF equivalence, repeated build determinism, byte equality with the pinned Windows candidate artifacts, untouched verification, tamper rejection, PNG signature/dimensions/size, fixed Unifont and historical IR 0.1 schema identities, and the Unicode headline build. Its browser checklist exercises Share/Download/Copy verify/visible fallback/Replay/Privacy Receipt. The 0.3 browser receipt already in this repository is Windows browser evidence only.

The remainder of this document preserves the 0.1.0-rc.3 protocol and evidence boundary verbatim enough for historical audit. Its rc.3 assertions must not be run and reported as 0.3 PASS.

## Historical candidate binding: 0.1.0-rc.3

This handoff is only for rc.3. Do not reuse the rc.2 physical-Mac PASS, any partial row, screenshot, or receipt from another Workprint candidate or from the earlier five-flagship exercise.

Expected public candidate identities in the current source tree:

| Identity | Expected value |
| --- | --- |
| package | `0.1.0-rc.3` |
| adapter | `0.1.1` |
| Workline renderer | `workline-0.3.0` |
| PNG renderer | `workprint-png-v3/stored-deflate/bitmap-5x7` |
| hero Shape / public IR | `21fc1fde4c98…` / `614080189701…` |
| alternate Shape / public IR | `272932db4351…` / `0afa1b788398…` |

These are public projection identities, not a source-archive identity or authenticity proof. The operator must also record the exact checkout/archive hash supplied for the Mac run. If the package version or renderer identities differ, stop; if the public demo identities differ, run the full deterministic diagnosis and record a new candidate rather than relabeling drift as PASS.

## Historical rc.2 result — not rc.3 PASS

The exact rc.2 review archive (`421238` bytes, SHA-256 `185e4bcdf789abd7fb7ab61ab357ee33fa468d6d4fc7195fda787bf4f7792c58`) has a user-supplied physical-Mac [machine receipt](evidence/macos/REVIEW_EVIDENCE.json) and [report](evidence/macos/MAC_REVIEW_REPORT.md). They record a scoped `PASS` on Mac15,6/arm64 with macOS 15.5, Darwin 24.5.0, and Node 24.19.0. Codex imported the two files byte-for-byte and checked their archive/public-identity bindings, but did not directly witness the run. Because rc.3 changes renderer code and public bytes, that PASS remains historical and cannot satisfy this handoff.

## Preconditions and evidence rule

- Use a physical Mac and record `sw_vers`, architecture, shell, and `node --version`.
- Use Node.js 22.18.0 or newer. The CI matrix exercises 22.x and 24.x, but CI is not physical-Mac evidence.
- Use a project directory whose path deliberately contains spaces, for example `~/Codex Validation/codex-workprint`. Quote every path.
- If extending the review with a fresh real-run check, use only a sanitized, no-secret JSONL input. Do not paste prompts, command output, or personal paths into the report.
- Preserve the source archive/checkout hash, output hashes, screenshots, and browser console result privately. Redact usernames, home paths, task text, tokens, and stdout/stderr in any public summary.

## Fail-closed start

Open Terminal and run:

```sh
set -eu

if [ "$(uname -s)" != "Darwin" ]; then
  echo "MACOS_VALIDATION_RESULT=FAIL: Darwin required"
  exit 2
fi

sw_vers
uname -m
node --version
node -e 'const major=Number(process.versions.node.split(".")[0]); const minor=Number(process.versions.node.split(".")[1]); if (major < 22 || (major === 22 && minor < 18)) process.exit(2);'
```

If any precondition fails, stop and record `MACOS_VALIDATION_RESULT=FAIL` with the redacted failure. Do not repair the source while recording a failed run.

## Source and path-with-spaces setup

Place the candidate in a clean directory with spaces. If a source archive was provided, verify its sidecar hash before extraction and record the resulting source hash. If no pinned sidecar exists, record the archive/checkout hash as an input identity; do not call it a release identity.

```sh
set -eu
PROJECT="$HOME/Codex Validation/codex-workprint"
cd "$PROJECT"
printf 'PROJECT_BASENAME=%s\n' "$(basename "$PWD")"
test -f package.json
test -f AGENTS.md
if [ -d .git ]; then
  git diff --check
fi

node --test
node ./scripts/release-check.mjs
node ./scripts/macos-gate.mjs

node --input-type=module -e '
  import { readFile } from "node:fs/promises";
  const pkg = JSON.parse(await readFile("package.json", "utf8"));
  const hero = JSON.parse(await readFile("demo/workprint.json", "utf8"));
  const alternate = JSON.parse(await readFile("examples/alternate-workprint/workprint.json", "utf8"));
  if (pkg.version !== "0.1.0-rc.3") process.exit(2);
  if (hero.render.rendererVersion !== "workline-0.3.0") process.exit(2);
  if (hero.render.pngRenderer !== "workprint-png-v3/stored-deflate/bitmap-5x7") process.exit(2);
  if (!hero.source.shapeSha256.startsWith("21fc1fde4c98")) process.exit(2);
  if (!hero.source.publicIrSha256.startsWith("614080189701")) process.exit(2);
  if (!alternate.source.shapeSha256.startsWith("272932db4351")) process.exit(2);
  if (!alternate.source.publicIrSha256.startsWith("0afa1b788398")) process.exit(2);
'
```

The output of these commands is private evidence. A nonzero command is a fail-closed result until diagnosed and rerun as a new attempt.

## UTF-8 BOM / LF / CRLF semantic check

Use one checked-in sanitized JSONL fixture. The following selection fails closed if no fixture is present and works with paths containing spaces:

```sh
set -eu
FIXTURE="tests/fixtures/codex-0.145.0-failure-followup.jsonl"
test -f "$FIXTURE"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

mkdir -p "$TMP/line endings/LF" "$TMP/line endings/CRLF" "$TMP/line endings/BOM"
perl -pe 's/\r\n?/\n/g' "$FIXTURE" > "$TMP/line endings/LF/input.jsonl"
perl -pe 's/\r?\n/\r\n/g' "$FIXTURE" > "$TMP/line endings/CRLF/input.jsonl"
{ printf '\357\273\277'; cat "$TMP/line endings/LF/input.jsonl"; } > "$TMP/line endings/BOM/input.jsonl"

node ./bin/codex-workprint.js inspect "$TMP/line endings/LF/input.jsonl"
node ./bin/codex-workprint.js inspect "$TMP/line endings/CRLF/input.jsonl"
node ./bin/codex-workprint.js inspect "$TMP/line endings/BOM/input.jsonl"
node ./bin/codex-workprint.js build "$TMP/line endings/LF/input.jsonl" --title "macOS line-ending check" --out "$TMP/line endings/LF/out"
node ./bin/codex-workprint.js build "$TMP/line endings/CRLF/input.jsonl" --title "macOS line-ending check" --out "$TMP/line endings/CRLF/out"
node ./bin/codex-workprint.js build "$TMP/line endings/BOM/input.jsonl" --title "macOS line-ending check" --out "$TMP/line endings/BOM/out"
```

Use the repository's documented CLI entrypoint if it differs from `./bin/codex-workprint.js`; do not silently substitute a different implementation. Adapter 0.1 publishes no raw-input digest, so the complete public IR and generated public bundles must be byte-identical across LF/CRLF:

```sh
cmp "$TMP/line endings/LF/out/workprint.json" "$TMP/line endings/CRLF/out/workprint.json"
cmp "$TMP/line endings/LF/out/workprint.json" "$TMP/line endings/BOM/out/workprint.json"
diff -ru "$TMP/line endings/LF/out" "$TMP/line endings/CRLF/out"
diff -ru "$TMP/line endings/LF/out" "$TMP/line endings/BOM/out"
rm -rf "$TMP"
trap - EXIT
```

Any semantic drift is `MACOS_VALIDATION_RESULT=FAIL` until the adapter contract is repaired or an explicit versioned decision is recorded.

## Same-input determinism and tamper check

Build the same input twice into separate directories, then compare every output byte. Use a fresh temporary directory created by `mktemp`; remove only that exact directory during cleanup.

```sh
set -eu
TMP_DET="$(mktemp -d)"
trap 'rm -rf "$TMP_DET"' EXIT
node ./bin/codex-workprint.js build "$FIXTURE" --title "macOS determinism check" --out "$TMP_DET/one"
node ./bin/codex-workprint.js build "$FIXTURE" --title "macOS determinism check" --out "$TMP_DET/two"
diff -ru "$TMP_DET/one" "$TMP_DET/two"
node ./bin/codex-workprint.js verify "$TMP_DET/one"
cp "$TMP_DET/one/workprint.svg" "$TMP_DET/original.svg"
printf 'x' >> "$TMP_DET/one/workprint.svg"
if node ./bin/codex-workprint.js verify "$TMP_DET/one"; then
  echo 'verify accepted a tampered output'
  exit 1
fi
cp "$TMP_DET/original.svg" "$TMP_DET/one/workprint.svg"
node ./bin/codex-workprint.js verify "$TMP_DET/one"
```

If the CLI is exposed through another documented entrypoint, substitute that exact entrypoint consistently. A changed PNG renderer/version or a byte drift is a failed determinism gate until explained in the receipt.

## PNG signature and dimensions

Check the generated card directly, not only its filename:

```sh
set -eu
PNG="$TMP_DET/one/share-card.png"
test "$(xxd -p -l 8 "$PNG")" = 89504e470d0a1a0a
sips -g pixelWidth -g pixelHeight "$PNG"
test "$(sips -g pixelWidth "$PNG" | awk '/pixelWidth/{print $2}')" = 1200
test "$(sips -g pixelHeight "$PNG" | awk '/pixelHeight/{print $2}')" = 630
```

Record the PNG renderer identity/version from the privacy receipt or release metadata. A valid signature and dimensions do not prove visual quality.

## Optional real Codex input extension

With a fresh, small, no-secret task in a temporary directory, save the exact current CLI stream without hand-editing events:

```sh
set -eu
command -v codex >/dev/null || { echo 'MACOS_VALIDATION_RESULT=PENDING: Codex CLI unavailable'; exit 3; }
mkdir -p "$TMP_DET/real input/workspace"
git -C "$TMP_DET/real input/workspace" init --initial-branch=main
codex --ask-for-approval never exec --ephemeral --sandbox workspace-write --color never --json -C "$TMP_DET/real input/workspace" "<small no-secret task selected by the operator>" > "$TMP_DET/real input/run.jsonl" 2> "$TMP_DET/real input/codex.stderr.log"
node ./bin/codex-workprint.js inspect "$TMP_DET/real input/run.jsonl"
node ./bin/codex-workprint.js build "$TMP_DET/real input/run.jsonl" --title "macOS real input check" --out "$TMP_DET/real input/workprint"
node ./bin/codex-workprint.js verify "$TMP_DET/real input/workprint"
```

Replace the angle-bracket task locally; never copy a private prompt into an evidence report. If policy and CLI availability permit, run a second different fresh task and build a second output. Preserve private input hashes and public screenshots, not raw prompts. The Worklines must be visually distinguishable; do not claim authenticity or correctness. If policy or CLI availability prevents this extension, record `PENDING_POLICY` or `PENDING_TOOLING`; it does not downgrade a completed source/fixture/browser review and creates no fresh Mac live-input claim.

## Browser desktop and narrow QA

Open the generated `workprint.html` in a real installed browser (Safari or Chrome) using an absolute local path. In DevTools:

1. Select a desktop viewport such as 1440×900. Confirm the title, dominant Workline, explicit observation counts, post-failure completion relation, generation command, and `Made with Codex Workprint` source entry are visible in the first screen.
2. Click Replay Shape and activate it with the keyboard; confirm the reveal restarts. Enable reduced motion at the OS/browser level, reload, and confirm the shape remains fully visible without the reveal animation.
3. Toggle paper/carbon, exercise normal Clipboard copy and the Shift+click fallback selection, and select the explicit failed station plus one later completion station. Record only public UI state.
4. Confirm the console has zero errors and the Network panel shows no request to a remote host, font, image, script, or telemetry endpoint.
5. Select a narrow 390×844 viewport. Confirm no horizontal overflow (`document.documentElement.scrollWidth <= window.innerWidth`), no clipped Workline, and no console errors.
6. Save desktop and narrow screenshots with browser/version/viewport metadata. Inspect each screenshot's magic bytes and use an extension matching the actual JPEG/PNG format returned by the browser. These are browser observations, not human comprehension or physical-device evidence.

If an automated browser check exists in the repository, run it in addition to (not instead of) this real-browser inspection and retain its report. A clean HTTP response or screenshot without console inspection does not close the browser gate.

## Cleanup and redacted report

After evidence is captured, close the browser, remove only the temporary directory created by `mktemp`, and keep any real input outside the repository. Do not delete the source checkout or unrelated user data.

Complete this template in a private or redacted report:

```text
MACOS_VALIDATION_RESULT=PASS | FAIL | PENDING
Date (local):
macOS version / architecture:
Node version:
Shell:
Source checkout/archive hash:
Candidate package / adapter / Workline / PNG identities:
Hero and alternate Shape IDs / public IR IDs:
Path-with-spaces used (redacted parent, basename retained):
UTF-8 BOM/LF/CRLF semantic result:
Same-input deterministic result:
Tamper verify result:
PNG signature / dimensions:
Browser/version:
Replay click/keyboard/reduced-motion result:
Theme/clipboard/fallback/station result:
Desktop viewport + screenshot:
Narrow viewport + screenshot:
Console errors: 0 | nonzero (redacted detail)
Network requests: none | unexpected (redacted detail)
Optional real Codex input hashes/status (not prompts):
Optional different-input Workline result:
Cleanup completed:
Open gates / claim ceiling:
```

Only direct Darwin evidence can change the physical-macOS row in `docs/VALIDATION.md` from `pending` to `observed`. The source/fixture/bundle/browser checks are required for that scoped result; the fresh Codex-input extension is tracked separately and may remain pending without being silently claimed.
