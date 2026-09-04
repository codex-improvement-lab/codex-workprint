# Unified Profile input, IR, and bundle contract

Workprint 0.2 adds one narrow compiler entry for public work-state projections. It does not change the Codex JSONL adapter, Run IR v0.1, Run renderers, or legacy seven-file bundle.

## Input boundary

The accepted exchange input has `schemaVersion: "workprint-profile/0.1"` and exactly one of three profiles:

| Profile | Question | Verdicts | Visual form |
| --- | --- | --- | --- |
| `continuity` | What still holds after handoff? | `carried`, `lost`, `stale`, `invented` | seam / black box |
| `goal-delta` | What evidence stops carrying when the goal changes? | `added`, `removed`, `changed`, `unchanged` | fault / shockwave |
| `context-receipt` | What context was prepared, observed, or absent? | `prepared`, `observed`, `excluded`, `not_observed`, `stale`, `conflict` | slice / x-ray |

The common public fields are `title`, `sourceRevision`, `sources`, `findings`, and `summary`. Every `finding.sourceRefs` value must resolve to a declared source. Verdict counts in `summary.counts` must match the findings.

The normalizer copies only an explicit whitelist. Goal Delta may additionally retain `affectedEvidenceIds`; Context Receipt may retain `reasonCode`, `currentRevision`, `expectedRevision`, and `resolved`. Unknown root, source, finding, summary, or count extensions are ignored. Adding only unknown extensions produces the same Profile IR digest and the same bundle bytes.

This behavior permits incubators to retain local extensions without letting Workprint silently elevate those fields into public facts. It is not a general adapter platform.

## Profile IR boundary

Compiled JSON uses:

- `schemaVersion: "workprint-profile-ir/0.1"`;
- `artifact: "codex-workprint-profile"`;
- a fixed question and visual form bound to the selected profile;
- only normalized public sources, findings, summary fields, and profile-specific whitelist fields;
- `source.profileIrSha256`, calculated over canonical Profile IR with that digest field omitted;
- fixed renderer identities `profile-print-0.1.0` and `workprint-profile-png-v1/stored-deflate/bitmap-5x7`.

The IR validator rejects extra IR fields, cross-profile finding fields, invalid verdicts, duplicate identifiers/references, unresolved references, inconsistent verdict counts, renderer drift, and digest drift.

Profile input JSON Schema is [workprint-profile-v0.1.schema.json](../schema/workprint-profile-v0.1.schema.json). The normalized output schema is [workprint-profile-ir-v0.1.schema.json](../schema/workprint-profile-ir-v0.1.schema.json). Runtime validation remains authoritative for cross-field references and count equality.

## Bundle type isolation

`profile build` writes exactly:

```text
workprint-profile.html
workprint-profile.svg
share-card.png
embed.md
workprint-profile.json
profile-receipt.json
MANIFEST.sha256
```

These names intentionally differ from the Run bundle's `workprint.html`, `workprint.svg`, `workprint.json`, and `privacy-receipt.json`. Legacy `verify` rejects a Profile bundle; `profile verify` rejects a Run bundle. Both verifiers regenerate every file, compare bytes, validate the manifest, and reject missing, changed, symlinked, or unexpected entries.

## Rendering and text rules

HTML and SVG escape all public text and contain no external resources, network APIs, telemetry, remote fonts, or third-party assets. Findings and sources are keyboard-interactive in HTML: selecting a finding traces its declared source references; selecting a source traces the findings that cite it.

The deterministic bitmap renderer uses a fixed 5×7 alphabet and fixed indexed palette. Supported typographic punctuation is normalized explicitly before rasterization: en/em dashes become `-`, the middle dot becomes `/`, and curly quotes become their ASCII forms. Narrow continuity labels use the deliberate `CARRY` and `INVENT` abbreviations rather than accidental truncation markers. The renderer never changes the source IR text stored in JSON, HTML, or SVG.

## Claim ceiling

A Profile Workprint is a deterministic display of the supplied public projection. Its hashes show internal consistency for the named public IR and artifact bytes. They do not establish that sources are authentic, that findings are correct, that context influenced a model, that a goal revision caused a real-world outcome, or that a task belongs to an identity.

