# Codex Workprint 0.1.0-rc.2 — Mac review

`MAC_REVIEW_RESULT=PASS`

- Date: `2026-08-30 01:36:56 +0800`
- Mac: `Mac15,6`, macOS `15.5 (24F74)`, Darwin `24.5.0`, arm64
- Node: already-installed `24.19.0` used for validation; the default shell Node `20.20.2` was below the candidate's required floor and was not used
- Archive: 421238 bytes, SHA-256 `185e4bcdf789abd7fb7ab61ab357ee33fa468d6d4fc7195fda787bf4f7792c58`; external sidecar PASS
- Dependencies installed: none, as required

## Required checks

- Tests: **19/19 PASS**
- Release check: **139/139 PASS**
- macOS implementation gate: **PASS**
- LF/CRLF/BOM public IR: **byte-identical**
- Same-input double build: **byte-identical**
- Tamper verification: **tamper rejected; restored bundle accepted**
- PNG: **valid signature, 1200×630**
- Hero bundle: **7/7 verified**
- Alternate bundle: **7/7 verified**

Candidate identities matched rc.2: adapter `0.1.1`, Workline renderer `workline-0.2.0`, PNG renderer `workprint-png-v2/stored-deflate/bitmap-5x7`, hero Shape `21fc1fde4c98…` / public IR `20611506ef39…`, alternate Shape `272932db4351…` / public IR `8da00e8d67db…`.

## Automated browser review

Evidence class: **real Mac, automated Codex In-app Browser observation; not human observation**.

- Desktop 1440×900: no horizontal overflow, Workline within viewport, zero console warnings/errors.
- Narrow 390×844: no horizontal overflow, Workline within viewport, zero console warnings/errors.
- Replay Shape: click PASS; keyboard Enter PASS; reveal animation observed both times.
- Theme: carbon → paper → carbon PASS.
- Copy: normal clipboard path PASS; Shift+click fallback selected the exact public command PASS.
- Station selection: changed from failed observation 5 to completed observation 10 and updated the detail panel PASS.
- Alternate example: distinct Shape `272932DB4351`, no overflow, zero console warnings/errors PASS.
- Resource surface: one inline SVG, zero external assets, zero remote requests observed.
- Screenshot files are real JPEGs with matching extensions and exact 1440×900 / 390×844 dimensions.

## Optional gate and claim ceiling

Fresh real Codex JSONL capture is `PENDING_POLICY`. The candidate's review prompt explicitly marks it optional; the active machine policy does not permit raw CLI model prompts. No fresh live-input claim is made, and this does not invalidate the scoped source/fixture/browser PASS.

This result establishes behavior of the exact shipped source, fixtures, and browser UI on this physical Mac only. It does not establish source authenticity, task correctness, human comprehension, identity, user value, or market demand.

## Cleanup

Both local browser tabs were closed, temporary viewport override was reset, both loopback servers were stopped, ports 4322 and 4323 had no listeners, four generated `.DS_Store` files were removed, and all 88 extracted candidate files matched the ZIP bytes afterward. No source edit, dependency install, commit, publish, or external contact occurred.
