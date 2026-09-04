# Validation ledger

## Current candidate: 0.3.0-rc.3

| Scope | Current evidence | Boundary |
| --- | --- | --- |
| Run/Profile core | 46/46 tests on Windows, Node 24.19.0 | Local automated |
| Retained real input projections | [Current rebuild receipt](evidence/real-runs-2026-09-05-0.3.0-rc.3.json) | Reused retained original inputs; no new live model run |
| Run browser | [Current receipt](evidence/browser/run-receipt-qa-receipt-2026-09-05-0.3.0-rc.3.json): 2 artifacts, 5 viewport checks, 7 screenshots, 0 overflow/console/remote DOM asset issues | Windows browser; includes new 1280px text-overflow regression |
| Release contract | 439/439 checks passed; see the observed [preparation record](RELEASE_PREPARATION_2026-09-05.md) | Local run and hosted runs are recorded separately |
| Hosted CI | [Source baseline c9e12ab: four jobs passed](https://github.com/codex-improvement-lab/codex-workprint/actions/runs/33917492625), Windows/macOS × Node 22/24, including tests, release checks, JavaScript build and npm pack dry run | Exact source commit; the final tag's CI is linked from its GitHub Release |
| Local package | `pnpm pack`, offline installed-copy/bin-shim smoke, Run/stdin parity, three Profiles and portable ZIP smoke passed | Separate from npm publication; `npm pack --dry-run` was not used locally |
| Physical Mac | [rc.2 acceptance closure](evidence/macos/0.3.0-rc.2-attempt-2/ACCEPTANCE_CLOSURE.json) retained | Exact earlier package PASS; rc.3 presentation delta not rerun on a physical Mac |
| Profile browser | Original 0.2 artifact-bound receipt retained | Current Profile artifacts remain unchanged |
| Public source / release distribution | [Lab source repository](https://github.com/codex-improvement-lab/codex-workprint); tagged archives and final CI are tracked on [Releases](https://github.com/codex-improvement-lab/codex-workprint/releases) | GitHub distribution; no npm publication |
| Independent users / production / market | Not established | A release or passing CI does not establish adoption or demand |

The changes include action-label wrapping, Run renderer identity, package version and a generated JavaScript distribution with a source/installed bootstrap. It does not change the adapter logic, schema contracts, fixed font, PNG rasterizer, Profile core, or source observation semantics. Shape IDs of the two retained real runs remain unchanged. Public IR and generated Run artifact hashes are newly bound to rc.3.

Screenshots retain their actual JPEG dimensions and hashes. The 1280px pre-fix capture is separate diagnostic evidence; it is not counted as current passing evidence. The page asset check observes DOM-referenced resources and is not a packet capture.

## Historical records

- [Previous rc.2 ledger](VALIDATION_0.3.0-rc.2.md) and its original machine receipts remain unchanged.
- The accepted rc.2 Mac screenshot correspondence remains user-confirmed, without equating transformed JPEG bytes to original PNG hashes.
- The 0.2 Profile, 0.3.0-rc.1, and 0.1 rc.1–rc.3 evidence remains bound to its original artifacts.

These observations support a local compiler and presentation contract. They do not establish source authenticity, task correctness, recovery, model influence, causality, authorship, independent-user comprehension, adoption, or demand.
