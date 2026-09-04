# Platform support

Current package: 0.3.0-rc.3. Use Node.js 22.18.0 or newer; Node 24 LTS is recommended. Runtime dependencies remain zero.

| Surface | Evidence |
| --- | --- |
| Windows / Node 24.19.0 | Current core, deterministic bundles, responsive browser and local package checks |
| macOS | The exact rc.2 baseline has an accepted external physical-Mac PASS. The rc.3 wrapping/JavaScript-distribution/offline-example delta has Windows verification and no new physical-Mac observation. |
| Hosted Windows/macOS CI, Node 22/24 | The matrix is required before tagging; consult the exact commit's [Actions run](https://github.com/codex-improvement-lab/codex-workprint/actions) for its result. Hosted runners are not physical-device acceptance. |
| Distribution | [GitHub prerelease tarball and portable ZIP](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3); not published to npm |

The prior Mac result has not been revoked. It also has not been relabeled as an exact rc.3 execution. A current-Mac check, if required for a future platform claim, can focus on the packaged example and affected layout rather than repeating the entire Lab validation mission.

[Previous platform ledger](PLATFORM_SUPPORT_0.3.0-rc.2.md) · [Current validation](VALIDATION.md) · [Release preparation](RELEASE_PREPARATION_2026-09-05.md)
