# Codex Workprint minimal physical-Mac validation report

Do not paste usernames, home paths, raw JSONL, prompts, commands, stdout/stderr, tokens, or environment values into this report.

```text
MACOS_VALIDATION_RESULT=PASS | FAIL | PENDING
Date (local):
macOS version / architecture:
Node version:
Browser / version:
ZIP SHA-256 sidecar: PASS | FAIL
Internal package identity: PASS | FAIL
Automated receipt: attached | missing
Automated result: PASS | FAIL

Desktop viewport:
Chinese title readable: PASS | FAIL
Headline arrow readable without replacement glyph: PASS | FAIL
Replay click / keyboard / reduced-motion: PASS | FAIL
Share / Download / Copy verify: PASS | FAIL
Visible fallback / Privacy Receipt: PASS | FAIL
Desktop screenshot filename / SHA-256:

Narrow viewport: 390x844
No horizontal overflow: PASS | FAIL
Narrow screenshot filename / SHA-256:
Console errors or warnings: 0 | nonzero
Remote network requests: 0 | nonzero

Open gates:
Claim ceiling: Physical-Darwin implementation and local-browser behavior for the exact package only; no source-authenticity, task-correctness, human-comprehension, production, user, adoption, or market claim.
```

Set `MACOS_VALIDATION_RESULT=PASS` only when the package identities, automated result, and every required browser row pass. Otherwise use `FAIL` or `PENDING` and name the first unmet row.
