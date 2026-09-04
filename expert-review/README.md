# Codex Workprint expert review packages

## Current: 0.3.0-rc.2

Deliver these two adjacent files to the reviewer:

- `codex-workprint-0.3.0-rc.2-expert-review.zip`
- `codex-workprint-0.3.0-rc.2-expert-review.zip.sha256`

Package identity:

```text
SHA-256  ef012cff881be0c0093c3f3e5c3c10a815d18b5b86452e585048b38cc9950fd8
Bytes    9925141
Files    214 after extraction
```

The repository had no commit identity at packaging time. The external ZIP SHA-256 plus the internal `REVIEW_MANIFEST.sha256` is the review identity. Extract into a new directory and read `EXPERT_REVIEW_START_HERE.md` before substantive review.

Recorded source-tree expectations:

- `REVIEW_IDENTITY VERIFIED` before review;
- 45/45 tests;
- 3 Run bundles × 7/7 files, including the Chinese title proof;
- 3 Profile bundles × 7/7 files plus deterministic triptych;
- 437/437 release checks;
- four current Run Receipt browser screenshots, two visible clipboard-fallback screenshots, and the current receipt, with historical Profile, 0.1, and 0.3.0-rc.1 evidence retained separately.

The package includes the complete reviewable repository snapshot, schemas, source, tests, generated Run/Profile examples, current and historical evidence, machine-readable inventory, expert report template, and deterministic packaging/identity scripts. It excludes `.git`, `.workprint-private`, `._audit`, `node_modules`, and this `expert-review` output directory.

Rebuild locally from the repository root with:

```text
node ./scripts/build-expert-review-package.mjs
```

## Physical-Mac minimal validation package

For a focused physical-Darwin check of the same candidate, deliver:

- `codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip`
- `codex-workprint-0.3.0-rc.2-macos-minimal-validation.zip.sha256`

```text
SHA-256  98a50a8aca3b3ace7b7eb1c4687bbd5ffa3b0dbf073327e2ef1a5c84044d1091
Bytes    1250055
Files    46 after extraction
```

It needs no dependency installation and contains one synthetic fixture only. The automated runner requires physical Darwin, Node >=22.18.0, and a path containing a space; it leaves full macOS PASS pending until the included two-viewport browser checklist is completed. Rebuild with `node ./scripts/build-macos-validation-package.mjs`.

The returned 2026-09-05 attempt is retained under `docs/evidence/macos/0.3.0-rc.2-attempt-2/`. Its automated receipt is exact-package bound and the browser report records PASS. The user explicitly confirms that the delivered JPEG transformations correspond to the original PNG captures; the scoped external physical-Mac verdict is PASS, while the unequal byte identities remain disclosed in the import audit and closure record.

## Historical package retained

`codex-workprint-0.2.0-rc.1-expert-review.zip` and `codex-workprint-0.3.0-rc.1-expert-review.zip`, with their sidecars, remain unchanged as historical review packages. They are not the current 0.3 product review identity.

No commit, tag, push, publication, package-name reservation, remote creation, or external contact was performed.
