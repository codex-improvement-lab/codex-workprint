# Codex Workprint minimal physical-Mac validation report

```text
MACOS_VALIDATION_RESULT=PASS
Date (local): 2026-09-05
macOS version / architecture: 15.5 / arm64
Node version: 24.19.0
Browser / version: Google Chrome 152.0.7977.82 (headless automated)
ZIP SHA-256 sidecar: PASS
Internal package identity: PASS
Automated receipt: attached
Automated result: PASS

Desktop viewport: 1440x1000
Chinese title readable: PASS
Headline arrow readable without replacement glyph: PASS
Replay click / keyboard / reduced-motion: PASS
Share / Download / Copy verify: PASS
Visible fallback / Privacy Receipt: PASS
Desktop screenshot filename / SHA-256: workprint-desktop-chrome-1440x1000.png / 8611fc4140796c09e0193cc3718cc12fa7f664fe258a08e3a63f9cd195bb8c70

Narrow viewport: 390x844
No horizontal overflow: PASS
Narrow screenshot filename / SHA-256: workprint-narrow-chrome-390x844.png / 569ce46cf9d1e80e1e717c5f1d5f56c40113d45ac311f53ca6aae45bddb8139c
Console errors or warnings: 0
Remote network requests: 0

Open gates: None within the requested minimal validation scope. Browser rows were executed automatically in local Google Chrome; this is not a human usability assessment.
Claim ceiling: Physical-Darwin implementation and local-browser behavior for the exact package only; no source-authenticity, task-correctness, human-comprehension, production, user, adoption, or market claim.
```

Method note: The browser checks used a fresh Chrome profile, a loopback-only server at 127.0.0.1, and an explicit block on non-loopback page requests. The two screenshots were also visually inspected for glyph and layout defects.
