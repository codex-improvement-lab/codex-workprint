# Changelog

## [0.3.0-rc.3] — release candidate

- Wrap primary action labels inside their grid cells; the previously overflowing 1280px verify button now fits.
- Ship generated JavaScript for installations under node_modules; keep the source TypeScript path for development checkouts and compare installed-layout output against source output.
- Include a clearly labeled synthetic offline first-run input in the package, without requiring a model or account.
- Bump the Run renderer to workline-0.4.2 and retain all earlier receipts and Mac acceptance as historical evidence.
- Prepare a local installable tarball and portable ZIP, with current browser and package smoke evidence.
- Add the established Lab repository URLs, direct prerelease download entry, and private vulnerability-reporting route.

All notable changes to Codex Workprint are recorded here. This project follows the spirit of [Keep a Changelog](https://keepachangelog.com/en/1.1.0/); release-candidate evidence remains separate from the feature list.

## Unreleased

No changes recorded after 0.3.0-rc.3.

## [0.3.0-rc.2] — release candidate — 2026-08-30

### Fixed

- Replaced the share-card headline's unsupported ASCII arrow path with fixed-Unifont `→` rendering. Every visible public share-card field is now checked before rasterization, and an unsupported glyph fails the build instead of becoming a fallback question mark.
- Removed artifact-controlled titles from the “Build yours” shell snippet. The copied command now contains only inert `<your task>` and `<public title>` placeholders, with direct adversarial coverage for command substitution, quotes, backslashes, separators, pipes, and PowerShell interpolation.
- Restored the published Run IR 0.1 schema to its historical 4931-byte identity (`fceb9134…0299`) and introduced a distinct Run IR 0.2 schema for `publicIdentity`. The current verifier explicitly rejects legacy IR 0.1 instead of interpreting two contracts under one version.
- Split `openItemCount` from status-absent observations in the Run Receipt story; renamed Verify to “Copy verify command”; replaced the invisible clipboard fallback with a visible selected textarea; removed duplicate native-share URLs; shortened captions; and rejected public URLs containing query strings.

### Changed

- Advanced the Run renderer to `workline-0.4.1` and the PNG renderer to `workprint-png-v5/indexed-stored-deflate/unifont-17.0.05`; the seven-file Run bundle names and Unified Profile contracts remain unchanged.
- Added candidate-bound Windows browser evidence for both Run Receipts at desktop and 390×844, including the visible copy fallback at both viewports.

### Evidence boundary

This candidate repairs locally reproduced publication blockers. It does not add a browser verifier, hosted demo, PR integration, hook, telemetry, localization, complex-script shaping, physical-device result, public release, or user/adoption evidence. All rc.1 and earlier evidence remains historical and unchanged.

## [0.3.0-rc.1] — release candidate — 2026-08-30

### Added

- Added the Run Receipt product layer: a fixed-template story, readable shape name, privacy mark, local share/download/verify/caption actions, and a visual Privacy Receipt above the retained full Run Sheet.
- Added direct stdin builds (`build -`), `--open`, and explicit opt-in `--project`, `--by`, `--release`, `--public-url`, and `--lang` fields. These fields are public by request, strictly normalized, and excluded from shape identity.
- Added a plain-JavaScript Node preflight so unsupported runtimes fail before loading TypeScript, plus a direct `.js` test that prevents old Node versions from producing a false-green empty suite.
- Added a fixed GNU Unifont 17.0.05 Plane 0 bitmap asset and license for deterministic BMP public-title rendering, including the self-contained Chinese Run Receipt example.
- Added current Windows real-input projection evidence and real-browser desktop/narrow QA for the primary and Chinese Run Receipts.

### Changed

- Advanced the package to `0.3.0-rc.1`, the Run renderer to `workline-0.4.0`, and the PNG renderer to `workprint-png-v4/indexed-stored-deflate/unifont-17.0.05` while preserving the Run IR v0.1 and seven-file bundle contract.
- Reframed the first-run promise as “Every agent run leaves a Workprint.” / “No prompts. No code. No uploads.” Profiles remain the second, distinct product layer under “Three questions. One Workprint.”
- Rebuilt the 1200×630 Run share card and repository social preview as the same deterministic indexed PNG, 756798 bytes and strictly below 1,000,000 bytes.

### Evidence boundary

The story is compiled from whitelisted public counters and relations; it is not model-generated and does not infer recovery, correctness, authenticity, authorship, causality, or impact. Optional public identity is never inferred. Local tests, browser screenshots, and deterministic files do not establish physical-device support, production behavior, human comprehension, adoption, or market demand. All 0.1 and 0.2 evidence remains historical and unchanged.

## [0.2.0-rc.1] — release candidate — 2026-08-30

### Added

- Added the explicit `profile inspect`, `profile build`, and `profile verify` loop for `workprint-profile/0.1` public projections.
- Added a separate `workprint-profile-ir/0.1` contract, digest, seven-file Profile bundle, and verifier that cannot be confused with the existing Run IR/bundle.
- Added fixed Continuity, Goal Delta, and Context Receipt verdict sets with source-reference validation, summary-count binding, and a default-deny public-field whitelist.
- Added three self-contained synthetic-scenario public inputs and Workprint-generated seam, fault, and slice artifacts, plus a deterministic 1200×630 triptych suitable for GitHub social preview.
- Added direct Profile tests for all three incubator inputs, schema/validation, verdict isolation, unresolved references, unknown profiles, ignored extensions, determinism, tamper, bundle-type isolation, interaction hooks, and bitmap text normalization.

### Changed

- Advanced the package to `0.2.0-rc.1` without changing the Codex JSONL adapter, Run IR v0.1, `inspect/build/verify` behavior, Run renderer identities, or existing demo bytes.
- Added explicit bitmap punctuation normalization and deliberate narrow-label abbreviations; new Profile PNGs use a fixed indexed palette and stored DEFLATE for deterministic output below the GitHub social-preview byte ceiling.

### Evidence boundary

The three profile inputs are synthetic-scenario public projections produced by sibling Lab incubators, copied here as self-contained examples, and recompiled by Workprint. Local tests, deterministic bundles, and browser QA do not establish source authenticity, finding correctness, model influence, causality, physical-device support, real-user comprehension, adoption, or market evidence. All 0.1/rc.1–rc.3 evidence remains historical and unchanged.

## [0.1.0-rc.3] — release candidate — 2026-08-30

### Changed

- Expanded the single Workline into a full-width Run Sheet with deterministic serpentine folds for long runs, public item-history stitches, observed turn ranges, bounded turning points, categorical event rhythm, and a dedicated mobile vertical route.
- Replaced the replay restart with a real station-by-station sequence that updates the selected observation and respects `prefers-reduced-motion`.
- Advanced renderer identities to `workline-0.3.0` and `workprint-png-v3/stored-deflate/bitmap-5x7`; the share card now carries the Run Sheet association/rhythm language while retaining its 1200×630 deterministic raster contract.
- Added direct tests for long-run folding and Run Sheet derivations without extending the adapter whitelist or IR schema.

### Repository preparation

- Added GitHub issue forms, a pull-request template, SUPPORT guidance, a GitHub Actions Dependabot policy, and a publication runbook.
- Pinned GitHub-authored Actions to full commit SHAs, disabled checkout credential persistence, retained read-only token permissions, added bounded concurrency/timeout behavior, and removed the unnecessary cross-platform PowerShell dependency from CI steps.
- Clarified that the interactive HTML demo must be opened locally rather than implying a hosted GitHub demo.
- Imported an external physical-Mac acceptance report for five sibling flagship candidates with its original identity, a content-preserving repository copy, and a bounded audit that preserves the 3 PASS / 2 FAIL outcome, corrects the manifest-count wording, and explicitly excludes it from Workprint runtime evidence; added the two-project repair/package receipt without promoting the pending Darwin retest.
- Added a losslessly recompressed 1200×630 GitHub social-preview PNG under the platform's 1 MB upload limit.

### Evidence boundary

The rc.3 Windows/browser receipts bind the changed renderer and regenerated bundles. The supplied physical-Mac PASS remains exact-archive evidence for rc.2 only; rc.3 physical-Mac execution, hosted CI, npm pack, public identity/publication, and real-user/market evidence remain separate gates.

## [0.1.0-rc.2] — release candidate — 2026-08-30

### Changed

- Added `source.shapeSha256`, derived only from ordered whitelisted observation structure, and switched all Workline geometry jitter to that identity so public title/labels/annotations cannot move points or lines.
- Added short Shape IDs to HTML, SVG, PNG, inspection, and privacy receipts with an explicit non-attestation boundary.
- Added a keyboard-native Replay Shape control with reduced-motion behavior and changed the initial detail selection to the first explicit failure/nonzero observation, then first `item.completed`, then first observation.
- Advanced the deterministic PNG renderer to `workprint-png-v2/stored-deflate/bitmap-5x7`; corrected its required `--title` CTA and improved status/CTA legibility.
- Added a two-real-run SVG comparison to the README and UTF-8 BOM/LF/CRLF regression coverage.
- Replaced the broad npm `docs` include with an explicit minimal package allowlist and added honest discovery keywords.

### Evidence boundary

The current rc.2 observed results are recorded in `docs/VALIDATION.md` and dated 2026-08-30 receipts. rc.1 receipts remain unchanged as history. An externally supplied receipt now records a scoped physical-Mac PASS for the exact rc.2 review archive; Codex imported and identity-checked that receipt but did not witness the Darwin run. Fresh Mac live input remains `PENDING_POLICY`. External CI, npm pack, public identity/publication, real-user, and market evidence remain separate gates.

## [0.1.0-rc.1] — release candidate — 2026-08-29

This is a release-candidate snapshot. It is intended to stop at “the user confirms public identity, commits, and publishes.” Cross-platform, browser, real-user, and market claims require the evidence recorded in `docs/VALIDATION.md`.

### Added

- A versioned Codex `codex exec --json` JSONL adapter and stable Workprint IR v0.1.
- Narrow `inspect`, `build`, and `verify` CLI actions.
- Deterministic HTML, README SVG, 1200×630 PNG, embed snippet, IR, privacy receipt, and SHA-256 manifest outputs.
- Default-deny privacy projection with visible unknown-event accounting.
- Fixture, adversarial privacy, determinism, and release-check documentation boundaries.
- Windows/macOS Node 22/24 CI configuration and an independent physical-macOS handoff.

### Evidence boundary

The entries above describe the intended 0.1.0 release-candidate surface. Which gates have actually been observed is recorded in `docs/VALIDATION.md`; a configured workflow is not a CI result, and a Windows or browser run is not a physical-macOS result.
