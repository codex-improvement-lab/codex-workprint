# Platform support and evidence boundary

Codex Workprint is a local Node.js CLI plus static output. Platform support means that the same adapter/IR semantics and renderer contract are available; it does not mean that every platform gate has been observed in this release candidate.

## Intended runtime

| Layer | Intended support | Current evidence rule |
| --- | --- | --- |
| Node.js | 22.18.0 or newer; a plain-JavaScript preflight runs before TypeScript import, and CI exercises 22.x and 24.x | Record the exact `node --version`; an older runtime must fail explicitly rather than report zero tests |
| Windows | Windows host with Node 22/24 | A local command receipt can establish Windows behavior only |
| macOS | Darwin host with Node 22/24 | the current 0.3 external receipt/report is exact-package bound and records a scoped PASS; screenshot correspondence after transfer transformation is user-confirmed, and Windows/Linux/emulation/CI cannot substitute |
| Linux | Useful for development and CI-like checks | Not a release claim unless directly tested and recorded |
| Browser | Desktop and narrow viewport using a real browser | Browser automation or a responsive viewport is browser evidence, not physical-device evidence |

The project does not read Codex Desktop internals or hidden rollout/session files. Supported inputs are an explicitly saved `codex exec --json` JSONL stream and an explicitly supplied `workprint-profile/0.1` public projection. Neither input type is discovered from a private session store.

Run JSONL may also be supplied as stdin with the literal input path `-`. `--open` launches only the generated local `workprint.html`. The deterministic share-card renderer covers printable Unicode Plane 0 through the pinned Unifont 17.0.05 bitmap source, including CJK; it does not claim OpenType shaping for complex scripts or supplementary-plane glyph coverage.

## Evidence matrix at release-candidate handoff

| Evidence class | What it can show | What it cannot show | Status convention |
| --- | --- | --- | --- |
| Windows local | CLI, parser, renderer, output, and release-check behavior on that host | macOS behavior, real users, market adoption | `observed` only with command receipt |
| Fixture/synthetic | Stable IR and privacy contract for checked-in shapes | A real Codex journey or authenticity | `observed` with fixture/test receipt |
| Real Codex input | Projection of the exact captured input and differences between inputs | That the input was authentic or the task was correct | `observed` with sanitized capture/hash |
| Browser automation | DOM, visual layout, viewport, and console behavior in the named browser | Physical device, human comprehension, OS-native behavior | `observed` with browser/version/viewport evidence |
| GitHub Actions | A workflow run on its named hosted image | A user-owned physical Mac or market evidence | `configured / not observed` until run URL/log |
| Physical macOS | Darwin filesystem, shell, Node, and browser behavior on that Mac | Fresh live Codex input, human comprehension, real-user adoption, or market demand | current 0.3 is `observed` as an external scoped PASS; archive/artifacts are machine-bound and transformed screenshot correspondence is user-confirmed; historical 0.1 rc.2 remains archive-bound only |
| Fresh Codex input on macOS | Projection of a new no-secret CLI capture on that host | Authenticity or task correctness | `pending policy`; not part of the scoped implementation/browser PASS |
| Real user/market | Installation, comprehension, reuse, sharing, or adoption | Universal product quality | `pending` until direct participant/market evidence |

## Cross-platform semantic checks

The adapter and renderer should operate on parsed records and normalized values rather than host-specific path or newline conventions. The macOS handoff must exercise:

- a project path containing spaces;
- LF and CRLF JSONL with the same semantic records;
- repeated builds from the same normalized input;
- PNG signature and exact 1200×630 dimensions;
- HTML desktop and narrow viewport behavior with a zero-console-error record.

These checks belong in `docs/MACOS_HANDOFF.md`. If a line-ending difference changes the IR semantic fields, the result is a fail-closed finding requiring repair or an explicit versioned contract decision.

## Unsupported or out of scope

- Codex Desktop private internals, hidden reasoning, and unexported session stores;
- automatic command execution based on JSONL contents;
- cloud hosting, accounts, telemetry, remote assets, or a general multi-agent adapter platform;
- claims that hashes, receipts, CI, or screenshots prove authenticity, correctness, authorship, production readiness, or market adoption.
