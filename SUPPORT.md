# Support

Codex Workprint is a release candidate maintained on a best-effort basis. Before asking for help, confirm that you are using Node.js 22.18.0 or newer and run:

```text
node --test
node ./scripts/release-check.mjs
```

## Where to ask

- Use the repository's Discussions area, when enabled, for usage questions and ideas.
- Use the GitHub bug-report form for a reproducible product defect.
- Use the feature-request form for a concrete workflow gap that fits the project's narrow scope.
- Follow [SECURITY.md](SECURITY.md) for security or privacy vulnerabilities. Never put a secret or unredacted JSONL in a public issue or discussion.

Include the Workprint version, operating system, `node --version`, the CLI action (`inspect`, `build`, or `verify`), and the smallest sanitized reproducer. Do not include prompts, replies, reasoning, command text, stdout/stderr, tokens, usernames, absolute paths, or private receipts.

There is no response-time SLA, paid support, hosted service, or guarantee that an upstream Codex JSONL shape will remain unchanged across CLI versions.
