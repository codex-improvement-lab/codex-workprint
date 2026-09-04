# Contributing to Codex Workprint

Contributions should keep the first release narrow: one Codex JSONL adapter, one stable IR, deterministic static renderers, and the three CLI actions `inspect`, `build`, and `verify`. Do not add a transcript viewer, live dashboard, agent score, account, cloud service, or generic adapter platform as an incidental change.

## Local setup

Use Node.js 22.18.0 or newer (the CI matrix exercises 22.x and 24.x). From the project directory, install dependencies using the lockfile when one is present. The core checks are:

```text
node --test
node ./scripts/release-check.mjs
```

The release check is a repository gate, not a substitute for a real Codex input or physical-device validation.

## Code and data boundaries

- Treat JSONL records as untrusted data. Parse, classify, and escape; never execute or evaluate them.
- Keep adapter, IR, privacy projection, derivation, and renderer responsibilities explicit.
- Keep unknown events visible and counted. Use `not observed` for missing evidence.
- Do not add prompts, replies, reasoning, command bodies, stdout/stderr, tool responses, absolute paths, environment variables, or implicit identity to public artifacts.
- Keep HTML/SVG/PNG generation offline, deterministic, and free of telemetry or remote assets.
- Never add a raw real-run JSONL file, secret, token, home path, or private log to a commit.

## Tests and evidence

Changes to parsing or rendering need focused fixtures, an adversarial privacy case, a determinism assertion, and a release-check update where appropriate. Keep fixture/synthetic, Windows local, browser automation, real Codex input, CI, physical macOS, and real-user evidence distinct. A screenshot or responsive viewport is not a physical-device result.

When a change affects platform behavior, exercise a path containing spaces and both LF and CRLF input semantics. Record the exact command, Node version, commit/source identity, output hashes, and result in `docs/VALIDATION.md`; redact prompts, command output, tokens, and personal paths.

## Pull requests

Explain the concrete workflow pain, the narrow product promise, the files changed, and the evidence actually observed. Include privacy and determinism impact. Mark configured-but-unobserved CI and pending macOS or user gates as pending. Do not claim authenticity, task correctness, production readiness, market adoption, or public identity from local artifacts or hashes.

Public author identity, commits, tags, package publication, and external release announcements remain user-controlled. Do not create a remote repository, reserve a package name, or publish on behalf of the project.

