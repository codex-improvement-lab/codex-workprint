# Codex Workprint project guide

## Product promise

Turn one user-supplied `codex exec --json` run into a deterministic, privacy-safe, verifiable Run Receipt. Keep supported public work-state Profiles as a second product layer.

Keep the product narrow: one versioned Codex JSONL adapter and Run IR, plus one explicit `workprint-profile/0.1` input and Profile IR for `continuity`, `goal-delta`, and `context-receipt`. Preserve the isolated Run (`inspect`, `build`, `verify`) and Profile (`profile inspect`, `profile build`, `profile verify`) loops. The first-run path may pipe stdin and open the generated local Story; it must not capture commands or operate Codex on the user's behalf. Do not turn this repository into a transcript viewer, live dashboard, generic adapter platform, agent scorer, hosted service, or multi-agent platform.

## Repository boundary

- This directory is an independent Git repository. Run Git, Node, test, packaging, and release commands from this directory.
- Write only inside this repository. Treat parent and sibling projects as read-only context.
- External publication and account-level changes require explicit user authorization. The user authorized completing and publishing the GitHub `0.3.0-rc.3` prerelease on 2026-09-05 under `codex-improvement-lab/codex-workprint`, using the established maintainer identity. npm and plugin-directory publication remain separate.
- Preserve user work and avoid destructive Git commands.

## Evidence boundary

- A generated Workprint is a public projection of observed JSONL metadata, not proof that the source was authentic, the task was correct, or an author identity is genuine.
- A Profile Workprint compiles supplied public findings, sources, and revisions; it does not establish their authenticity, correctness, model influence, or causal meaning.
- Unknown upstream events stay visible and counted. Missing evidence is `not observed`; never infer hidden phases or outcomes.
- Keep Windows automation, browser automation, synthetic fixtures, real Codex runs, external CI, physical macOS, and real-user evidence distinct.
- Never label a Windows, responsive viewport, POSIX semantic check, or configured CI workflow as a macOS PASS.

## Privacy and determinism

- Default-deny source fields. Never emit prompts, assistant replies, reasoning, command text, stdout/stderr, tool responses, absolute paths, environment variables, or implicit identity fields.
- Public title, labels, project/by/release identity, language, and public URL enter output only through explicit CLI options. Identity remains optional and absent by default.
- Renderers must have no network requests, telemetry, or remote fonts. A pinned local font asset must retain its own license, byte identity, deterministic parser, and documented coverage ceiling.
- Stable normalized input plus the same Workprint version must produce byte-identical public artifacts. Record the fixed PNG renderer identity and version.

## Engineering bar

- Use Node.js 22.18.0 or newer with a JavaScript version preflight before native TypeScript type stripping, and no runtime framework, database, account, or cloud dependency.
- Source checkouts may use native type stripping; installed distributions must ship generated JavaScript because Node does not strip TypeScript inside node_modules. Run the distribution build and installed-layout test before packing.
- Keep adapter, IR, privacy projection, derived summary, and renderers separated only as far as the current loop requires.
- Use fixtures for supported and unknown event shapes, an adversarial privacy fixture, integration tests, and a release check.
- Generated demo artifacts must be rebuilt maintainer-locally from ignored, no-secret, explicitly captured Codex JSONL inputs; publish only the default-deny projections and redacted receipts, and never fall back to a fixture while claiming a real demo.
- Update README, changelog, privacy/security guidance, platform claims, and release checklist when behavior changes.
