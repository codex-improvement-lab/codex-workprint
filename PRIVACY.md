# Privacy and public projection

Codex Workprint 0.2 is a local compiler for either a user-supplied `codex exec --json` JSONL file or a supported `workprint-profile/0.1` public projection. It produces deterministic public artifacts. It is not a transcript export, an authenticity service, a new fact source, or a guarantee that a task or supplied finding was correct.

## Default-deny contract

The adapter starts with no source field in the public projection. Only fields required by the Workprint IR are copied or derived:

- event category, stable sequence, and a relative offset only when that timing is explicitly observed by the versioned adapter (otherwise `not observed`);
- explicit observed status/exit category (or `not observed` when the input does not provide one);
- aggregate counts and whether a turn-completion event was observed;
- a user-provided public title, labels, annotations, and optional `--project`, `--by`, `--release`, `--public-url`, and `--lang` values passed explicitly to the CLI;
- a shape digest derived only from ordered whitelisted observation fields, plus a digest of the complete normalized public IR;
- hashes of generated outputs where the receipt calls for them; the raw JSONL digest is private by default.

The default projection excludes:

- prompts, assistant replies, hidden reasoning, and message text;
- command text, tool arguments, tool responses, stdout, and stderr;
- source file contents and diffs;
- absolute paths, usernames, hostnames, home directories, environment variables, tokens, and credentials;
- model, account, organization, or other implicit identity information. The only identity fields Workprint can publish are the explicit opt-in CLI values listed above.

Unknown upstream events remain visible as an `unknown` event/count. Their raw payload and unrecognized strings are not copied into public artifacts. Missing evidence is represented as `not observed`; the renderer must not invent a phase, success, failure, or recovery.

## Unified Profile whitelist

Profile input is already intended to be public, but Workprint still normalizes it through an explicit whitelist. It retains the selected profile, title, source revision, source id/label/revision, finding id/kind/verdict/subject/source references, summary headline/allowlisted counts, Goal Delta `affectedEvidenceIds`, and bounded Context Receipt revision/reason/resolution fields. Unknown extensions are ignored without publishing their names or values and cannot change Profile IR or bundle bytes.

Every source reference must resolve to a declared public source. A source label/revision is a trace handle supplied by the input, not proof that the source exists, is authentic, or supports the finding. A Context Receipt verdict does not prove model influence; a Goal Delta relation does not prove real-world causality; a Continuity verdict does not prove a handoff was complete.

`source.shapeSha256` uses only ordered `eventType`, pseudonymized item association, `itemType`, explicit `status`/integer `exitCode`, and `afterObservedFailure`. Public title, labels, annotations, project/by/release identity, language, URL, and other copy cannot change Workline geometry. The printed short Shape ID and deterministic shape name are reproducible labels for that public structure, not authenticity, authorship, or correctness proof.

The Run Sheet adds no source whitelist fields. Item stitches are derived from repeated pseudonymized `itemId` observations; turn ranges come from ordered `turn.started`/`turn.completed` categories; turning points select at most three already-public observations by fixed priority; rhythm height comes from the fixed public item category; folds come from sequence length. None of these layers reads raw IDs, command/message text, output, paths, tokens, timestamps, or private receipts. A stitch or bracket means only that the corresponding public records were observed in that order.

## What is written where

The input is read locally. The CLI has no account, server, network request, telemetry, or remote-font requirement. The share-card renderer reads a pinned local GNU Unifont bitmap asset under its reproduced OFL-1.1 license; it does not contact the font source at runtime. An explicit `--public-url` is written as metadata/link text and is never fetched during generation. Output is written only to the user-selected output directory:

```text
workprint.html       self-contained interactive projection
workprint.svg        README-safe visual projection
share-card.png       1200 x 630 social card
embed.md             shortest embed snippet
workprint.json       stable Workprint IR
privacy-receipt.json categories excluded and labels explicitly supplied
MANIFEST.sha256      output hashes
```

Profile output uses distinct names: `workprint-profile.html`, `workprint-profile.svg`, `share-card.png`, `embed.md`, `workprint-profile.json`, `profile-receipt.json`, and `MANIFEST.sha256`. The separate bundle type prevents either verifier from silently interpreting the other contract.

The receipt is an audit aid, not a proof of zero leakage. A receipt should identify the adapter/IR and renderer versions, excluded categories, explicit labels, the shape/public-IR digests, and output hashes without retaining excluded values or publishing a raw JSONL digest. Avoid adding wall-clock generation timestamps to deterministic artifacts.

## Safe generation review

Before publishing a Workprint:

1. Run `codex-workprint inspect run.jsonl` and review the retained, aggregated, excluded, and unknown categories.
2. Pass only the title, labels, identity, language, and URL you intend to make public; do not assume anything inferred from a prompt is public.
3. Run `codex-workprint build ...` into a new directory.
4. Read `privacy-receipt.json`, then inspect the HTML/SVG/JSON and the embed snippet as a human would see them.
5. Run `codex-workprint verify ./workprint` and inspect `MANIFEST.sha256` before copying anything to a README or social post.

For a local preflight, search generated text for likely secrets and machine data, for example `sk-`, `ghp_`, `token`, `Bearer`, drive-letter paths, `/Users/`, `/home/`, and `\\Users\\`. A match is a stop-and-review condition, not an assertion that the search is complete.

## Residual risk and claim ceiling

The input is explicitly supplied by the user and can be incomplete, edited, or fabricated. The shape digest, public-IR digest, and output manifest establish consistency for their named public projections/bytes; they do not publish a raw-input digest and do not prove that a Codex run occurred, that a task was correct, that an outcome was independently verified, or that a public title identifies its author. Workprint language must therefore say “observed in this input” and “generated from this projection,” never “proven authentic” or “proof of correctness.”

Do not place raw JSONL, prompts, command output, or private receipt details in an issue, pull request, README, or social post. Keep any unredacted source and local logs outside the repository and delete them when no longer needed.

## Disclosure and deletion

There is no hosted data store to delete. Remove the local input and output directory using the normal operating-system recovery path after confirming that no README or release package still references it. If a privacy defect is found, stop publication, preserve a minimal redacted reproducer, and report the defect privately through the repository's configured security channel once a public channel exists. Do not include secrets in an issue.
