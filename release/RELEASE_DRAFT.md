# Codex Workprint 0.3.0-rc.3

Release type: prerelease. Target: `codex-improvement-lab/codex-workprint`, tag `v0.3.0-rc.3`.

Turn one Codex run into a portable visual receipt. Try a synthetic first run offline, or provide your own explicit JSONL input.

- Generated JavaScript now runs when installed below node_modules.
- Intermediate-width action labels wrap correctly.
- Run and all three Profiles retain deterministic, verifiable output.
- 46 tests and 439 release checks passed locally; actual offline package installation and portable ZIP use were exercised.

Download the portable ZIP below, extract it, and enter its `codex-workprint-0.3.0-rc.3` folder. Requires Node.js 22.18.0 or newer (Node 24 LTS recommended).

```text
node ./bin/codex-workprint.js build ./examples/first-run/input.jsonl --title "Synthetic first run" --out ./first-workprint
node ./bin/codex-workprint.js verify ./first-workprint
```

Open `first-workprint/workprint.html`. The sample is synthetic and requires no account or model call. Use your own explicitly selected JSONL for a real receipt. The TGZ is also available for local package installation. Both archives have SHA-256 sidecars. This package is not published to npm.

The rc.2 physical-Mac baseline stays accepted; rc.3 has no new physical-Mac acceptance. Hosted CI is a separate automated result. No source-authenticity, task-correctness or adoption claim is made.
