# Physical Mac evidence

## Current 0.3.0-rc.2 attempt

The externally supplied [`0.3.0-rc.2-attempt-2`](0.3.0-rc.2-attempt-2/) receipt is exactly bound to the current minimal validation package manifest and all seven pinned public artifacts. Its report records an automated local-Chrome PASS. The delivered screenshots were transformed into JPEG files and do not match the original PNG hashes named by that report.

Current verdict: scoped external physical-Mac `PASS`. The user explicitly confirmed that the transformed screenshots correspond to the originals and directed that the transfer mismatch not block acceptance; the independent [closure record](0.3.0-rc.2-attempt-2/ACCEPTANCE_CLOSURE.json) preserves that authority. The JPEG/PNG hashes remain distinct and are not relabeled. This is external operator evidence; Codex did not witness the run.

## Historical 0.1.0-rc.2 evidence

These files record an external review of the exact `0.1.0-rc.2` Mac-review archive. They were supplied by the user after the review and imported byte-for-byte; Codex did not witness the Darwin commands directly.

| Evidence | Imported file SHA-256 | Scope |
| --- | --- | --- |
| [Machine-readable receipt](REVIEW_EVIDENCE.json) | `c03160f42dc256a0a935834103e6d9b14323d9a6f0cf840f18b14d330e945bf8` | Physical Mac source/fixture gates and automated local-browser observations |
| [Narrative report](MAC_REVIEW_REPORT.md) | `d09f46acf264732c883efa41fbd0f10f8b21e4661ef89cf89d27615ac9de3914` | Human-readable result and claim ceiling |
| [Local import audit](IMPORT_AUDIT.json) | generated after import | Attachment hashes, 16 binding checks, archive delta, and acceptance ceiling |

The receipt binds candidate version `0.1.0-rc.2`, archive size `421238`, and archive SHA-256 `185e4bcdf789abd7fb7ab61ab357ee33fa468d6d4fc7195fda787bf4f7792c58`. That archive hash matches the local review package retained outside the public tree. Its Shape, public-IR, adapter, and renderer identities match the current demo artifacts.

A post-preparation byte comparison found the reviewed adapter, IR, CLI, renderers, tests, fixtures, schemas, package metadata, demos, and release scripts unchanged. Of 88 archive files, 78 remain byte-identical; nine documentation/repository files changed to record the Mac result and prepare GitHub publication (`README.md`, `CHANGELOG.md`, `RELEASE_CHECKLIST.md`, `RELEASE_NOTES.md`, `SECURITY.md`, `docs/MACOS_HANDOFF.md`, `docs/PLATFORM_SUPPORT.md`, `docs/VALIDATION.md`, and `.github/workflows/ci.yml`). The workflow-only delta pins Actions and improves least-authority/cross-platform behavior; it is configured but not externally observed. The archive-only review prompt was not copied into the repository, and the Mac evidence/GitHub community files were added afterward.

The scoped result is `PASS` for the reviewed archive on a physical `arm64` Mac running macOS 15.5/Darwin 24.5.0 with Node 24.19.0: 19/19 tests, 139/139 release checks, the Darwin implementation gate, both seven-file bundles, and automated in-app-browser interactions passed. The default shell Node 20.20.2 was below the supported floor and was not used; no dependency install occurred.

The referenced desktop and narrow JPEG files were not included in the supplied attachments, so this repository preserves their reported names, dimensions, formats, and SHA-256 values but does not claim to have independently rehashed their bytes. Fresh live Codex JSONL capture on the Mac remains `PENDING_POLICY`. The receipt is not source-authenticity, task-correctness, human-comprehension, identity, user, or market evidence.
