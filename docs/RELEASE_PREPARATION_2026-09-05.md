# Release preparation — 2026-09-05

Candidate: **0.3.0-rc.3**. The changes fix wrapping primary-action text and the installed-package TypeScript loader; the Run renderer identity is `workline-0.4.2`. A synthetic offline input is now packaged for a first result without a model call. Earlier review ZIPs, machine receipts and the accepted rc.2 Mac result remain intact.

Publication follow-through completed: [0.3.0-rc.3](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3), commit `b5ea146`, with four passing hosted jobs and verified unauthenticated downloads. See the [publication record](evidence/github/release-0.3.0-rc.3.json). The observations below describe preparation; publication is separately recorded.

## Current checks

- 46/46 core tests passed.
- Three Run and three Profile bundles verified, seven files each.
- Current browser checks cover 1440×900, 1280×720, and 390×844. The primary and Chinese receipt, local copy/download, visible fallback, theme round-trip, station replay and source trace were exercised.
- No page overflow, action-text overflow, console errors/warnings or remote DOM asset references were observed. The browser made a harmless loopback favicon request (404), recorded separately.
- 439/439 release checks passed.
- Offline tarball installation with scripts disabled passed, including the real package bin shim.
- File and stdin produced byte-identical Run bundles; all three installed Profiles and the portable ZIP verified.
- The distribution contains generated JavaScript, avoiding ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING. Its generated BUILD.json records the Node compiler identity and module hashes.
- The installed-layout regression compares all Run/Profile public bytes with source rendering.

## Distribution

The tarball and portable ZIP are identified in [release/README.md](../release/README.md), with adjacent SHA-256 files. The preparation helper itself performs no remote, public package, tag, or announcement action. The user subsequently authorized GitHub publication; the final assets are rebuilt from a clean source clone with the public repository metadata.

## Evidence scope

The rc.2 Mac baseline stays accepted. rc.3 has a new, separately recorded presentation delta and no new physical-Mac acceptance. Initial preparation was local; the later [source baseline CI](https://github.com/codex-improvement-lab/codex-workprint/actions/runs/33917492625) passed all four Windows/macOS × Node 22/24 jobs. The final tag must independently pass the same matrix. The packaged first run is synthetic; retained real demos were rebuilt from their original private input files, not recaptured or replaced by fixtures.

## Reproduce the local distribution

Use Node 24 LTS and an installed pnpm 11.19.0 CLI module for the recorded packaging environment:

```text
python scripts/prepare-release.py --pnpm-js <path-to-pnpm/bin/pnpm.mjs>
```

The helper packs twice, installs offline into a path containing spaces with scripts disabled and a project-local store, runs the package bin shim, verifies file/stdin and all Profiles, builds and checks the portable ZIP, then removes its exact temporary tree. The release directory contains only local distributables and their verification record. No registry login or publication occurs.

[Function and UI analysis](PRODUCT_AND_UI_OPPORTUNITIES_2026-09-05.md) describes the next product opportunities; the larger redesign has not been implemented in this release-preparation patch.
