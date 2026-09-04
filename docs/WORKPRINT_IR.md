# Workprint Run IR v0.2 and adapter boundary

Workprint Run IR is the public projection between an evolving `codex exec --json` stream and deterministic renderers. The current contract is [`schema/workprint-ir-v0.2.schema.json`](../schema/workprint-ir-v0.2.schema.json). It adds the explicit `run.publicIdentity` object under a new `$id` and `schemaVersion: "0.2"`.

The published [`schema/workprint-ir-v0.1.schema.json`](../schema/workprint-ir-v0.1.schema.json) remains an immutable historical contract: 4931 bytes, SHA-256 `fceb913482d1046701dd0fb02960978a3e0066d5f705e16562d4335eba4c0299`. It does not contain `publicIdentity`. The current verifier explicitly rejects Run IR 0.1 and directs reviewers to its matching historical CLI; it never interprets both contracts under one schema identity.

## Current upstream evidence

On 2026-08-29, Windows Codex CLI 0.145.0 was directly observed producing UTF-8, LF-delimited JSONL with one object per line. The initial read-only audit observed:

- `thread.started` with `type`, `thread_id`;
- `turn.started` with `type`;
- `item.started` and `item.completed` with `type`, `item`;
- `command_execution` items with `id`, `type`, `command`, `aggregated_output`, `exit_code`, `status`;
- `agent_message` items with `id`, `type`, `text`;
- `turn.completed` with `type`, `usage` and token-count fields.

Two later fresh, no-secret workspace-write runs also observed `file_change` items with `id`, `type`, `changes`, and `status`. `changes` is excluded content. This is current local evidence, not a frozen cross-version schema or macOS result.

OpenAI's current developer-command reference documents `codex exec` as Stable and `--json` as newline-delimited JSON events, but does not freeze every event payload field in that command table. The adapter therefore stays versioned and default-deny.

## Adapter 0.2 whitelist

| Source field | Public treatment |
| --- | --- |
| root `type` | accepted only when it is a fixed supported enum; otherwise public `unknown` |
| `item.id` | used to associate sequence history, then replaced with `item-1`, `item-2`, … |
| `item.type` | accepted only for currently supported fixed enums; otherwise public `unknown` |
| `item.status` | accepted only as `in_progress`, `completed`, or `failed`; otherwise `not-observed` |
| `item.exit_code` | accepted only as a safe integer; otherwise `null` / not observed |

Every other value is excluded. In particular, the IR never contains `thread_id`, usage, timestamps, prompt/reply/reasoning, command, `aggregated_output`, `changes`, paths, environment, model/account/organization, or a raw-input digest.

The current adapter has no supported public timestamp field, so `source.timing` is `not-observed` and `run.durationMs` is `null`. UTF-8 with or without a BOM is accepted, and CRLF is normalized to LF for parsing; those encoding/line-ending changes do not change public IR semantics.

## Observation semantics

Each accepted or unknown source record becomes one ordered observation. `item.started` and `item.completed` remain separate entries and may share one pseudonymized item ID; the completed record never overwrites the started record.

An explicit failed item followed later by another explicit completed item sets `afterObservedFailure: true` on the first such completion. The renderer may draw a coral return arc. This relation means only “completion observed after a failed item.” It does not mean the task recovered, became correct, or passed validation.

`turn.completed` sets `run.turnCompletion` to `observed`. It does not set a task-level success or correctness outcome.

## Public phase annotations

`publicPhase` and `publicLabel` are always `null` unless the user passes `--annotate SEQUENCE:PHASE[:PUBLIC LABEL]` after reviewing `inspect`. Allowed phases are `inspect`, `edit`, `verify`, `recover`, and `deliver`. `run.publicIdentity` contains only normalized explicit `--project`, `--by`, `--release`, `--public-url`, and `--lang` values; identity fields default to `null` and language defaults to `en`. A public URL must be canonical credential-free HTTPS without a query string or fragment. These are explicit public statements, not adapter inference, and their IR paths are listed in the privacy receipt.

## Renderer-only Run Sheet structure

Renderers may deterministically derive four views without extending Run IR v0.2:

- item threads pair an `item.started` observation with the next later `item.completed` observation carrying the same pseudonymized `itemId`; unmatched starts remain open;
- turn ranges pair ordered `turn.started` and `turn.completed` observations;
- turning points choose at most three public observations using fixed priority: explicit failed/nonzero, later completion, unknown, open item, file-change completion, turn completion, then item completion;
- rhythm bars and serpentine folds use public item category and sequence position only. Bar height is categorical and never duration.

These are views of the public IR, not additional evidence. They do not change `shapeSha256`, infer semantic work phases, or claim recovery, correctness, duration, authenticity, or authorship. Explicit public phase labels may appear as overlays but do not move Workline points, segments, stitches, or turn spans.

## Shape identity

`source.shapeSha256` is SHA-256 over one ordered shape projection. Each observation contributes exactly `eventType`, its pseudonymized `itemId` association, `itemType`, explicit `status`, explicit integer `exitCode`, and `afterObservedFailure`. Array order carries sequence; raw IDs and raw values never enter this projection.

`publicTitle`, `publicLabels`, `publicIdentity`, `publicPhase`, `publicLabel`, summaries, privacy counts, renderer identity, and all other copy are excluded from shape identity. Therefore one observation stream rendered with different reviewed copy has the same `shapeSha256` and identical Workline point/line geometry, while `publicIrSha256` can change. A genuinely different ordered observation structure produces a different shape identity under this contract.

The short Shape ID printed on artifacts is a reproducible name for this public structure. It is not proof that the source is authentic, complete, unedited, correct, or attributable to an identity.

## Digest semantics

`source.publicIrSha256` is SHA-256 over the canonical public IR with that digest field omitted. It covers `shapeSha256`, public observations, summary, title/labels/annotations/identity metadata, privacy counts, and renderer identity. It does not hash or reveal the raw JSONL. `MANIFEST.sha256` covers the six public files other than itself.

These hashes make byte drift visible. They do not prove that a Codex run happened, that the input was unedited, that the task was correct, or that a person authored it.
