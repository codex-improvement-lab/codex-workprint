# Offline first run

`input.jsonl` is hand-authored synthetic data. It is not a captured Codex task or evidence of a successful repair.

From a source checkout or unpacked release with Node.js 22.18.0 or newer:

```text
node ./bin/codex-workprint.js build ./examples/first-run/input.jsonl --title "Synthetic first run" --out ./first-workprint
node ./bin/codex-workprint.js verify ./first-workprint
```

Open `first-workprint/workprint.html`. The sequence includes a failed check and a later completion; the receipt does not claim that the failure was recovered. No model, account, API key, or network is needed for this example. A real receipt starts from a separately selected real JSONL input.
