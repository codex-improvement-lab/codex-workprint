# Codex Workprint 0.3.0-rc.3 release candidate

Turn a Codex JSONL run into a local visual receipt: one readable observation story, a distinctive Workprint, and seven deterministic files that can be verified.

This prerelease fixes primary-action text overflowing at intermediate desktop widths, ships JavaScript that runs below node_modules, and adds a packaged synthetic first run. It retains Run IR 0.2, the immutable historical 0.1 schema, all three Unified Profiles, the local fixed font, and the privacy projection.

## Try it offline

Download the [portable ZIP and SHA-256 sidecar](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3), extract it, and enter its package folder. With Node.js 22.18.0 or newer:

```text
node ./bin/codex-workprint.js build ./examples/first-run/input.jsonl --title "Synthetic first run" --out ./first-workprint
node ./bin/codex-workprint.js verify ./first-workprint
```

Open `first-workprint/workprint.html`. The example is synthetic; it is not a live Codex result. Real receipts use an explicitly selected real JSONL input.

## Validation

- 46/46 unit and integration tests pass on Windows / Node 24.19.0.
- Current browser evidence covers two Run artifacts, desktop/narrow views and the 1280px regression: five viewport checks, seven current screenshots, no page overflow, action text overflow, console warning/error, or external DOM asset reference.
- Current Run and retained Profile bundles verify at 7/7 files each.
- 439/439 release checks pass; the observed record is in `docs/RELEASE_PREPARATION_2026-09-05.md`.
- Local tarball installation passed offline with lifecycle scripts disabled, the bin shim worked, stdin/file output was identical, all three Profiles verified, and the portable ZIP built a fresh receipt. Public npm publication is separate.

## Platform and evidence scope

The exact rc.2 baseline retains its accepted external physical-Mac PASS. The rc.3 presentation delta has new Windows browser evidence; it has not been rerun on a physical Mac. Raw inputs, historical receipts, and archived review packages were not replaced or relabeled. No source authenticity, task correctness, recovery, causal influence, authorship, user adoption, or market result is implied.

GitHub source and distributables are the publication scope. Hosted results are available in the repository's [Actions runs](https://github.com/codex-improvement-lab/codex-workprint/actions). This package is not published to npm or a plugin directory.
