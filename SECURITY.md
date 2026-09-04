# Security policy

## Scope

Codex Workprint 0.3.x is a local Node.js CLI that parses a user-selected or stdin-piped Codex JSONL stream, or a supported public Profile JSON, and writes static artifacts. It does not authenticate users, execute commands from the input, contact a service, or validate that an input came from Codex or an incubator. `--open` opens only the generated local HTML path after compilation. The primary security boundary is the explicit public projection described in [PRIVACY.md](PRIVACY.md).

## Supported versions

| Version | Security support |
| --- | --- |
| 0.3.x release candidate | Best-effort review while the release candidate is current |
| 0.2.x release candidates | Historical; no new feature support |
| 0.1.x release candidates | Historical; no new feature support |
| Earlier or modified copies | Not supported |

The release candidate is not a promise of production support or a security certification.

## Threat model

The parser must treat every JSONL record and every string field as untrusted. In particular, it must not execute a command, evaluate input as code, fetch a URL, insert raw HTML, or copy prompt/reply/reasoning/tool-output content into an artifact. Unknown records must be counted and rendered as unknown without guessing their meaning. Rendered HTML must remain self-contained and must not make network requests or load remote assets.

Profile parsing must additionally reject unknown profile/verdict values, unresolved or duplicate source references, mismatched verdict counts, and cross-profile IR fields. Unknown exchange-input extensions must remain inert: they cannot enter the IR, renderer, receipt, digest, or artifact bytes.

The privacy boundary does not protect a user who explicitly publishes a sensitive title, label, project/by/release identity, URL, publishes an unredacted source file, or runs a modified build. It also cannot establish source authenticity, task correctness, or author identity.

## Reporting a vulnerability

Do not post secrets, private JSONL, credentials, or an unredacted exploit in a public issue. Use **[Security → Advisories → Report a vulnerability](https://github.com/codex-improvement-lab/codex-workprint/security/advisories/new)** for private vulnerability reporting. If that route is temporarily unavailable, keep the report private; do not fall back to a public issue.

A useful report contains the affected version/commit, operating system and Node version, the smallest redacted input, the command, expected behavior, observed behavior, and whether a generated artifact contained sensitive data.

Reports are triaged as follows:

1. Stop publication of affected artifacts and preserve the original bytes privately.
2. Reproduce with a sanitized fixture; never add the original secret to the repository.
3. Fix the narrow parser, projection, renderer, or release-check defect and add a regression test.
4. Rebuild the release artifacts and re-run the privacy and determinism gates.
5. Document the user-visible impact in the changelog without repeating sensitive values.

There is currently no claim of a response-time SLA, bounty, CVE, or hosted incident process.

## Hardening expectations for contributors

- Keep source fields allow-listed and output fields explicit.
- Escape all user-controlled text in HTML and SVG contexts.
- Emit no timing until a supported field is explicitly observed; retain only explicit status/exit observations and never derive hidden phases.
- Keep generated files deterministic and offline.
- Add an adversarial fixture whenever a parser or renderer field changes.
- Run `node --test` and `node ./scripts/release-check.mjs` before proposing a release.
- Do not commit raw real-run JSONL, prompts, command output, environment dumps, or credentials.
