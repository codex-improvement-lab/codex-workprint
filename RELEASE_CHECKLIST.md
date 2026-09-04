# 0.3.0-rc.3 release-candidate checklist

The user authorized completion and GitHub publication on 2026-09-05. This checklist retains the local evidence and tracks the remaining hosted release gates. npm and plugin-directory publication remain separate.

## Run Receipt product loop

- [x] Package/version is `0.3.0-rc.3`; Node remains `>=22.18.0` with zero runtime dependencies.
- [x] `build -` accepts bounded stdin; `--open` opens only the generated local HTML after a successful build.
- [x] `--project`, `--by`, `--release`, `--public-url`, and `--lang` are strict public opt-ins and shape-inert; URL credentials, query strings, and fragments fail closed.
- [x] The first screen carries the task title, fixed-template conclusion, separate open/status-absent counts, privacy boundary, shape name, Share, Download card, Copy verify command, Copy caption, Replay story, and theme actions.
- [x] Share performs no upload or fetch, requires an explicit query-free credential-free HTTPS public URL before native sharing, and does not duplicate that URL inside the native share text.
- [x] The visual Privacy Receipt names both the public whitelist and all eight default-excluded categories.
- [x] The retained full Run Sheet, seven-file bundle names, deterministic verify, and historical rc.1–rc.3 evidence remain intact; historical Run IR 0.1 is byte-frozen and current output is Run IR 0.2.

## Runtime and rendering

- [x] A plain-JavaScript preflight rejects Node older than 22.18 before TypeScript is imported.
- [x] A direct `.js` runtime test prevents unsupported Node from discovering an empty false-green suite.
- [x] The fixed GNU Unifont 17.0.05 Plane 0 asset and OFL identity are release-gated.
- [x] The Chinese public title `修复登录失败并验证发布` has 11/11 fixed-font glyph coverage; every visible public share-card field is coverage-checked and unsupported glyphs reject the build.
- [x] All fixed headline branches, including `1 failed item → 1 later completion`, render without accidental fallback question marks.
- [x] “Build yours” is artifact-independent and covered against Bash/zsh/PowerShell substitution and separator payloads.
- [x] Clipboard fallback is a visible selected textarea on desktop and narrow screens, and Verify is accurately labeled “Copy verify command”.
- [x] Run share cards are deterministic indexed 1200×630 PNGs, 756798 bytes, and strictly below 1,000,000 bytes.
- [x] `docs/assets/github-social-preview.png` is byte-identical to the primary Run share card.

## Unified Profiles preserved

- [x] `profile inspect/build/verify`, `workprint-profile/0.1`, `workprint-profile-ir/0.1`, finite profile-specific verdicts, source-reference validation, and public-field whitelist remain intact.
- [x] Run and Profile bundles are visibly distinct and mutually rejected by the wrong verifier.
- [x] Three representative synthetic-scenario public projections remain self-contained and compile to deterministic seven-file bundles.
- [x] Continuity remains seam / black box, Goal Delta fault / shockwave, and Context Receipt slice / x-ray.
- [x] Profile bitmap punctuation and narrow labels remain free of accidental `?`; the triptych is deterministic, indexed, 1200×630, and below 1,000,000 bytes.

## Automated and browser gates

- [x] `node --test` passes 46/46 current Run and Profile tests on the local Windows checkout.
- [x] Both retained real-input demos, the Chinese Run Receipt, and all three Profile bundles verify at 7/7 files.
- [x] `node ./scripts/release-check.mjs` passes 439/439 checks on the final tree.
- [x] Real-browser QA covers the primary and Chinese Run Receipts at requested 1440×900 and 390×844 page viewports, plus the visible copy fallback at both sizes, with seven current retained screenshots, including a 1280px regression.
- [x] Browser QA records zero horizontal-overflow failures, visible outliers, console errors/warnings, remote asset URLs, missing share-card public glyph fields, and Unicode replacement characters; key local interactions are observed.
- [x] Historical 0.2 Profile browser evidence remains bound to the unchanged three Profile artifacts and six screenshots.
- [ ] Fresh external GitHub Actions are observed for the exact 0.3 bytes.
- [x] The historical 0.3.0-rc.2 physical-macOS receipt/report records a scoped external PASS for its exact package; archive/artifacts are machine-bound and transformed screenshot correspondence is explicitly user-confirmed without relabeling unequal hashes.

## Evidence and external boundaries

- [x] Local deterministic, synthetic, real-input projection, and browser evidence is not described as authenticity, correctness, causality, physical-device, human, production, user, adoption, or market evidence.
- [x] Public source excludes raw real Codex JSONL, credentials, local audits and dependency directories; runtime has no account, database, telemetry or service.
- [x] User authorized GitHub publication using the established Lab organization and maintainer identity. Private security reports use GitHub Advisories.
- [ ] Authorized commit, remote push, passing hosted matrix, tag and prerelease publication complete.

The canonical evidence ledger is [docs/VALIDATION.md](docs/VALIDATION.md). An unchecked item is an explicit external or not-yet-run gate, not an implied implementation result.

## Local release preparation — 2026-09-05

- [x] Wrapped action labels remove the observed 1280px overflow.
- [x] A clearly synthetic offline first-run input is included in the distribution.
- [x] Actual local tarball installation and portable ZIP verification complete; see docs/RELEASE_PREPARATION_2026-09-05.md for the final record.
- [x] Prior Mac acceptance is retained as a baseline; no rc.3 device result is invented.

- [x] Distribution ships JavaScript; an installed-layout regression prevents native TypeScript loading under node_modules and compares source/compiled Run and Profile output.
