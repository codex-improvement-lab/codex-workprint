# Windows release-candidate evidence

## Current rc.3 run — 2026-08-30

These receipts use bundled Node.js v24.19.0 on Windows 11 build 26200. They remain distinct from fixture semantics, real-input projection, browser evidence, external CI, physical macOS, npm packaging, and user/market evidence.

| Gate | Result | Evidence |
| --- | --- | --- |
| Core unit/integration | 21/21 PASS, exit 0 | [`node-test-2026-08-30-rc3.txt`](node-test-2026-08-30-rc3.txt) |
| Release/evidence contract | 181/181 PASS, exit 0 | [`release-check-2026-08-30-rc3.txt`](release-check-2026-08-30-rc3.txt) |
| Two strict real-input bundles | both 7/7 verify, exits 0 | [`demo-verify-2026-08-30-rc3.txt`](demo-verify-2026-08-30-rc3.txt) |
| macOS fail-closed behavior on Windows | expected refusal, exit 2; not Mac PASS | [`macos-gate-refusal-2026-08-30-rc3.txt`](macos-gate-refusal-2026-08-30-rc3.txt) |

The machine-readable candidate binding is [`validation-receipt-2026-08-30-rc3.json`](validation-receipt-2026-08-30-rc3.json).

`npm pack --dry-run` remains pending because npm is unavailable in this local bundled PATH. No pnpm substitution was made. External GitHub Actions, physical macOS, public identity, commit/tag/remote/package publication, real users, and market results remain unobserved or user-controlled.

## Historical rc.2 and rc.1 runs

The unsuffixed 2026-08-30 files remain unchanged as rc.2 history (19/19 tests, 139/139 release checks). The dated 2026-08-29 logs and [`validation-receipt-2026-08-29.json`](validation-receipt-2026-08-29.json) remain unchanged as rc.1 history (16/16 tests, 89/89 release checks). Neither set binds the current demo.

The Windows macOS-gate refusals prove only that the implementation rejects a non-Darwin host. Neither is a Mac run or Mac PASS. See [`../../MACOS_HANDOFF.md`](../../MACOS_HANDOFF.md).
