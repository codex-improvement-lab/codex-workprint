# Validation ledger

This ledger separates implementation readiness from platform, source, user, and market evidence. Every `observed` row names an inspectable dated receipt without exposing private prompts, output, tokens, absolute paths, or raw-input digests.

## Status vocabulary

- `observed`: the named check ran and retained evidence binds the stated bytes/result.
- `configured / not observed`: implementation or configuration exists, but no external result is claimed.
- `pending`: a future direct action is still required.
- `historical`: valid only for the named earlier candidate and never promoted to current evidence.

## Current candidate: 0.3.0-rc.2

| Gate | Method | Current evidence | Status |
| --- | --- | --- | --- |
| Run + Profile semantics | `node --test` with bundled Node 24.19.0 on Windows | 45/45 pass, including historical schema identity, Run IR 0.2 rejection boundary, shell injection, query-free URLs, open/status-absent semantics, full public glyph coverage, runtime preflight, privacy, Profiles, tamper, and bundle-type isolation | `observed` (local automated) |
| Real-input Run projection | rebuild and verify two retained Codex CLI 0.145.0 JSONL inputs | both seven-file Run IR 0.2 bundles verify; current public IR/artifact hashes are bound by [`real-runs-2026-08-30-0.3.0-rc.2.json`](evidence/real-runs-2026-08-30-0.3.0-rc.2.json); raw JSONL and raw digests remain unpublished | `observed` (local projection) |
| Unicode Run Receipt | rebuild `examples/unicode-run-receipt` | seven files verify; Chinese title has 11/11 fixed Unifont Plane 0 glyphs, zero missing; share card is indexed 1200×630 PNG, 756798 bytes | `observed` (synthetic local) |
| Unified Profiles | rebuild three checked-in public projection inputs | 3 × 7/7 files verify; Profile IR/source refs/verdicts remain separate from Run IR; triptych deterministic and 756798 bytes | `observed` (synthetic local) |
| Release contract | `node ./scripts/release-check.mjs` | 437/437 checks pass on the final tree, including immutable IR 0.1 hash, IR 0.2, glyph fail-closed behavior, shell-injection boundary, query-free URLs, historical evidence, social preview, determinism, tamper, privacy, and browser-receipt binding | `observed` (local automated) |
| Run Receipt browser QA | Codex in-app browser, requested 1440×900 and 390×844 for primary + Chinese HTML | 4 viewport checks and 6 bound JPEG screenshots including visible fallback at both sizes; 0 horizontal-overflow failures, 0 visible outliers, 0 console errors/warnings, 0 remote asset URLs, 0 missing share-card public glyph fields, 0 Unicode replacement characters; share/copy/verify/download/theme/replay/trace paths observed | `observed` (Windows browser) |
| Profile browser QA | retained 0.2 receipt, three unchanged HTML artifacts × two viewports | 6 bound screenshots; 0 overflow/outliers, console/page errors, or remote asset URLs; finding/source trace and theme interactions observed | `historical artifact-bound evidence` |
| Runtime floor | plain-JavaScript bootstrap and direct `.js` test | unsupported Node is rejected before TypeScript import; Node `>=22.18.0` is still the declared floor | `observed` (local automated) |
| Hosted CI | pinned Windows/macOS × Node 22/24 workflow | workflow configured; no hosted run was executed here | `configured / not observed` |
| Physical macOS 0.3 | [46-file exact-candidate minimal package](../expert-review/codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip): identity + automated Darwin gate + loopback desktop/390×844 browser report | external receipt is package/manifest/7-artifact bound and reports PASS on macOS 15.5 arm64; browser report says PASS; delivered JPEG transformations are visually consistent and their correspondence to the named PNG originals is [explicitly user-confirmed](evidence/macos/0.3.0-rc.2-attempt-2/ACCEPTANCE_CLOSURE.json), while unequal hashes remain disclosed | `observed` (external, scoped PASS) |
| npm packaging/publication | `npm pack --dry-run`, name/account/publication | not run; no package name, account, tag, or publication action was taken | `pending` |
| Human / production / market | direct user comprehension, production runs, adoption, demand | no direct evidence in this repository | `pending` |

## Current browser evidence

Machine-readable receipt: [`run-receipt-qa-receipt-2026-08-30-0.3.0-rc.2.json`](evidence/browser/run-receipt-qa-receipt-2026-08-30-0.3.0-rc.2.json).

Primary Run Receipt:

- [desktop 1440×900 request](evidence/browser/run-receipt-desktop-1440x900-2026-08-30-0.3.0-rc.2.jpg)
- [narrow 390×844 request](evidence/browser/run-receipt-narrow-390x844-2026-08-30-0.3.0-rc.2.jpg)
- [visible copy fallback, desktop](evidence/browser/copy-fallback-desktop-1440x900-2026-08-30-0.3.0-rc.2.jpg)
- [visible copy fallback, narrow](evidence/browser/copy-fallback-narrow-390x844-2026-08-30-0.3.0-rc.2.jpg)

Unicode Run Receipt:

- [desktop 1440×900 request](evidence/browser/unicode-run-receipt-desktop-1440x900-2026-08-30-0.3.0-rc.2.jpg)
- [narrow 390×844 request](evidence/browser/unicode-run-receipt-narrow-390x844-2026-08-30-0.3.0-rc.2.jpg)

The requested page viewports were 1440×900 and 390×844. The in-app screenshot surface returned 1425×891 and 375×812 JPEG/JFIF bytes; filenames, magic bytes, dimensions, sizes, and hashes agree. The primary narrow hero closes at y=824.23 before the 844px page viewport ends, and the native 12-station route begins at y=842.23. The Chinese narrow hero closes at y=741.88 and its 8-station route begins at y=759.88. Both documents had `scrollWidth === clientWidth`. The visible copy panel fit both viewports and selected the complete 185-character standard caption.

The browser resource surface observed one inline SVG and one loopback favicon per page, with no remote asset URL. CSP and source checks reject connections and page network APIs. This is not a packet capture.

## Historical evidence is candidate-bound

- 0.2 Profile QA remains in [`profile-qa-receipt-2026-08-30-0.2.0-rc.1.json`](evidence/browser/profile-qa-receipt-2026-08-30-0.2.0-rc.1.json) with six screenshots. The Profile artifacts are unchanged, but the receipt is still labeled 0.2.
- 0.3.0-rc.1 Run Receipt QA remains in [`run-receipt-qa-receipt-2026-08-30-0.3.0-rc.1.json`](evidence/browser/run-receipt-qa-receipt-2026-08-30-0.3.0-rc.1.json). It binds the earlier IR/renderer bytes and is not current rc.2 evidence.
- 0.1 rc.3 real-input, Windows, and browser evidence remains in the `*-rc3.*` receipts/logs/screenshots. It binds `workline-0.3.0` and PNG renderer v3, not 0.3.
- The supplied physical-Mac PASS binds the exact rc.2 archive only. It is not a 0.3 physical-Mac result.
- The current 0.3 attempt is a scoped external physical-Mac PASS. Archive/manifest/public-artifact bindings are machine-checked; screenshot correspondence is user-confirmed rather than hash-equal after messaging-service transformation.
- Earlier rc.1/rc.2 receipts remain in place as dated history.

No historical receipt was edited or relabeled during this candidate.

## Claim ceiling

The current evidence supports a deterministic local compiler/presentation contract on the recorded Windows/Node/browser surfaces and a scoped, externally supplied physical-Mac implementation/browser PASS for the exact package. Codex did not witness that execution, and screenshot correspondence is user-confirmed rather than cryptographically equal after transfer transformation. No evidence here establishes source authenticity, task correctness, recovery, causality, model influence, authorship, hosted CI behavior, npm availability, production readiness, human comprehension, independent-user success, adoption, or market demand.
