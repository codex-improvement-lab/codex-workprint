# Codex Workprint 0.3.0-rc.3 — Expert review start here

## Reviewer mandate

Review the narrow claim that Workprint turns Codex JSONL runs into deterministic, privacy-safe, verifiable visual receipts while retaining the 0.2 Unified Profiles layer and every historical evidence boundary.

The requested verdict is about the local compiler/product contract. It is not a request to certify source authenticity, task correctness, recovery, authorship, model influence, causality, production readiness, physical-device support, human comprehension, adoption, or market demand.

## Identity gate — run first

The source repository had no commit identity when this package was produced. Package identity is therefore the external ZIP SHA-256 sidecar plus the internal manifest, not a Git SHA.

1. Verify the ZIP against the adjacent `.sha256` file.
2. Extract into a new directory.
3. Before adding or editing any file, run:

```text
node ./scripts/verify-expert-review.mjs
```

Expected result: `REVIEW_IDENTITY VERIFIED`.

If either identity check fails, stop and report only `IDENTITY_MISMATCH`. Do not review a partially matching tree.

## Product surface under review

Run Receipt — first product:

```text
codex-workprint inspect <run.jsonl> [--json]
codex-workprint build <run.jsonl|-> --title <title> --out <directory> [--open]
codex-workprint verify <directory> [--json]
```

Optional public identity is explicit: `--project`, `--by`, `--release`, `--public-url`, and `--lang`. It must never be inferred, must not affect shape identity, and belongs to Run IR 0.2 rather than the byte-frozen historical IR 0.1 contract.

Unified Profiles — distinct second layer:

```text
codex-workprint profile inspect <profile.json> [--json]
codex-workprint profile build <profile.json> --out <directory>
codex-workprint profile verify <directory> [--json]
```

## Recommended review order

1. Read `AGENTS.md`, `README.md`, `PRIVACY.md`, `SECURITY.md`, and `docs/WORKPRINT_IR.md`.
2. Inspect `bin/codex-workprint.js`, `src/runtime-check.js`, and `src/cli.ts` for old-Node failure, stdin bounds, `--open`, and explicit public identity.
3. Inspect both Run schemas, `src/adapter/codex-jsonl-v0_1.ts`, `src/core/ir.ts`, `src/core/story.ts`, and `src/bundle.ts` for historical identity, whitelist, shape identity, open/status-absent semantics, and deterministic verification.
4. Inspect `src/render/html.ts` and `src/render/png.ts` for the artifact-independent Build yours command, accurately named Copy verify command, visible fallback, URL de-duplication, receipt-first hierarchy, network isolation, fail-closed glyph coverage, and indexed output.
5. Compare `demo`, `examples/alternate-workprint`, and `examples/unicode-run-receipt`; inspect the current real-run and browser receipts under `docs/evidence/`.
6. Review `docs/PROFILE_IR.md`, `src/profile/`, and all three `examples/profile/` inputs/bundles for preserved Profile isolation and seam/fault/slice forms.
7. Run the automated gates below.

## Automated reproduction

Requirements: Node.js 22.18.0 or newer. No dependency installation is required.

```text
node --test
node ./scripts/build-demo.mjs
node ./scripts/build-unicode-example.mjs
node ./scripts/build-profile-examples.mjs
node ./scripts/release-check.mjs
```

Recorded package-time expectations:

- tests: 46 pass, 0 fail;
- release check: 439 pass, 0 fail;
- Run bundles: 3 × 7/7 verify;
- Profile bundles: 3 × 7/7 verify;
- current Run browser evidence: 2 artifacts × 2 viewports plus visible fallback at both sizes, 0 overflow/outliers, console warnings/errors, remote assets, missing share-card public glyph fields, or Unicode replacement characters;
- historical Profile browser evidence: 3 profiles × 2 viewports, bound to unchanged 0.2 artifacts.

Do not regenerate retained browser evidence merely to obtain a PASS. Treat any new run as separate reviewer evidence.

## Core acceptance questions

1. Does unsupported Node fail before TypeScript loads, and can an old runtime still produce a false-green empty suite?
2. Does stdin remain bounded, and does `--open` occur only after a successful local build?
3. Is historical Run IR 0.1 byte-immutable, is identity versioned into IR 0.2, and does the current verifier explicitly reject legacy 0.1?
4. Is the Run story a deterministic fixed-template projection of whitelisted IR rather than a new fact source or model summary?
5. Is Build yours independent of attacker-controlled titles across Bash/zsh/PowerShell syntax, and do query-bearing public URLs fail closed?
6. Do Share, Download, Copy verify, visible fallback, Replay, and Privacy Receipt remain local/offline unless an explicit query-free public HTTPS URL authorizes native sharing?
7. Does the fixed Unicode asset have an exact identity/license, render every fixed headline and checked-in Chinese title without replacement, fail on missing public glyphs, and preserve a stated coverage ceiling?
8. Are Run and Profile IR/bundle types still unambiguous and mutually rejected by the wrong verifier?
9. Do equal inputs yield byte-identical seven-file outputs and does tamper fail verification?
10. Are the primary social preview and every share card valid deterministic 1200×630 PNGs under the documented byte ceiling?
11. Do Continuity, Goal Delta, and Context Receipt remain recognizably seam, fault, and slice with traceable findings/sources?
12. Are rc.1–rc.3, 0.2, and 0.3.0-rc.1 receipts preserved as historical evidence rather than relabeled current PASS?
13. Is any implementation broader than this local compiler/share loop requires?

## Verdict vocabulary

- `PASS`: the narrow 0.3 local compiler/product claim is supported by package evidence.
- `CHANGES_REQUIRED`: concrete implementation or evidence defects are repairable; enumerate them with reproduction.
- `NEEDS_NORMATIVE_SELECTION`: materially different semantics cannot be selected from the package; state the minimal alternatives and semantic cost.
- `IDENTITY_MISMATCH`: ZIP or internal manifest identity failed; stop before substantive review.

Use `EXPERT_REVIEW_REPORT_TEMPLATE.md` and keep the claim ceiling explicit.
