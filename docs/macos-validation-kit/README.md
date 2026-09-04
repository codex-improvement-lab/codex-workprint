# Codex Workprint physical-Mac minimal validation

This package is bound to one candidate and contains only the runtime source, pinned font and schemas, one synthetic JSONL fixture, exact expected public-artifact hashes, and the two validation scripts required for a scoped physical-Mac result. It contains no user run, prompt, command output, historical screenshot, expert-review archive, dependency tree, or network installer.

## Requirements

- A physical Mac. A VM, Windows/Linux POSIX layer, responsive viewport, or `macos-latest` CI job is not equivalent.
- Node.js 22.18.0 or newer. No `npm install` is needed.
- Extract into a new path containing a space, such as `~/Codex Validation/workprint mac check`.
- Keep the ZIP and adjacent `.sha256` file together for the first identity check.

## Run

From the directory containing the ZIP and sidecar:

```sh
shasum -a 256 -c codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip.sha256
mkdir -p "$HOME/Codex Validation/workprint mac check"
ditto -x -k codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip "$HOME/Codex Validation/workprint mac check"
```

Then:

```sh
cd "$HOME/Codex Validation/workprint mac check"
node ./VERIFY_PACKAGE.mjs
node ./RUN_MACOS_VALIDATION.mjs
```

Expected terminal markers:

```text
PACKAGE_IDENTITY_VERIFIED
MACOS_AUTOMATED_RESULT=PASS
BROWSER_RESULT=PENDING_MANUAL
```

`IDENTITY_MISMATCH` or any nonzero exit is fail-closed. Do not edit, install, or repair files and then report the same attempt as PASS; use a fresh extraction.

## Minimum browser observation

In a second Terminal, serve only the generated public bundle on loopback:

```sh
cd "$HOME/Codex Validation/workprint mac check"
node ./SERVE_LOCAL.mjs
```

Open `http://127.0.0.1:4173/` in Safari or Chrome. This loopback origin gives clipboard actions a consistent local secure context; the server has no upload, telemetry, directory listing, or non-loopback listener. If port 4173 is occupied, stop and record it or select an explicit local port such as `node ./SERVE_LOCAL.mjs 4174`.

Using Safari or Chrome, record these six observations in `MACOS_VALIDATION_REPORT.md`:

1. At desktop size, the Chinese title and `1 failed item → 1 later completion` are readable with no replacement `?` or `�`.
2. Replay works by click and keyboard; the complete shape remains visible with reduced motion enabled.
3. Share copies the short caption, Download produces the receipt, and Copy verify copies `codex-workprint verify ./workprint`.
4. Shift+click on a copy action opens the visible fallback textarea and selects the complete text; Privacy Receipt opens.
5. At 390×844, `document.documentElement.scrollWidth <= window.innerWidth`, with no clipped horizontal content.
6. Console errors/warnings are zero and the Network panel contains no remote request. Save one desktop and one narrow screenshot.

Press Ctrl+C in the server Terminal after the checks.

Return only:

- `results/AUTOMATED_RECEIPT.json`;
- the completed `MACOS_VALIDATION_REPORT.md`;
- two public screenshots and their SHA-256 values.

Do not return raw JSONL, Terminal history, usernames, home paths, prompts, commands, stdout/stderr, tokens, or environment values.

## Claim boundary

The automated script records implementation semantics and byte identity on the named Darwin host. A scoped physical-Mac PASS additionally requires the browser observations above. Neither result establishes source authenticity, task correctness, human comprehension, production behavior, user success, adoption, or market demand.
