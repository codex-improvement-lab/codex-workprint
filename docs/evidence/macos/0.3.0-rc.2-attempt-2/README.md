# 0.3.0-rc.2 physical-Mac attempt 2 — scoped PASS

The supplied automated receipt is exactly bound to the current minimal validation ZIP: package version, internal manifest, adapter/IR/renderers, Shape, public IR, and all seven artifact hashes match. It reports `AUTOMATED_IMPLEMENTATION_PASS` on macOS 15.5 / Darwin 24.5.0 / arm64 with Node 24.19.0.

The supplied report records a scoped Chrome browser `PASS`. The two delivered images visibly show a readable Chinese title, a correct `→` headline, and coherent desktop/narrow layouts. However, they are messaging-service-transcoded JPEG files and do not match the PNG filenames or SHA-256 values named in the report.

The initial import verdict was `PENDING_SCREENSHOT_IDENTITY`; that pre-closure state remains preserved in [`IMPORT_AUDIT.json`](IMPORT_AUDIT.json). The user subsequently confirmed that the transformed screenshots correspond to the originals and explicitly directed that the transfer mismatch not block acceptance. [`ACCEPTANCE_CLOSURE.json`](ACCEPTANCE_CLOSURE.json) therefore records a scoped external physical-Mac `PASS`.

## Screenshot boundary

The report still names these original bytes:

- `workprint-desktop-chrome-1440x1000.png` — `8611fc4140796c09e0193cc3718cc12fa7f664fe258a08e3a63f9cd195bb8c70`
- `workprint-narrow-chrome-390x844.png` — `569ce46cf9d1e80e1e717c5f1d5f56c40113d45ac311f53ca6aae45bddb8139c`

Those PNG bytes were not received, and their hashes are not attributed to the transformed JPEGs. Screenshot correspondence is accepted through explicit user confirmation rather than cryptographic equality. This does not weaken the exact archive, manifest, receipt, Shape, public IR, or seven-artifact bindings.

## Imported bytes

- [`AUTOMATED_RECEIPT.json`](AUTOMATED_RECEIPT.json) — external machine receipt, copied byte-for-byte.
- [`MACOS_VALIDATION_REPORT.md`](MACOS_VALIDATION_REPORT.md) — external report, copied byte-for-byte.
- [`workprint-desktop-wechat-transcoded.jpg`](workprint-desktop-wechat-transcoded.jpg) — delivered JPEG, 1280×2403.
- [`workprint-narrow-wechat-transcoded.jpg`](workprint-narrow-wechat-transcoded.jpg) — delivered JPEG, 390×3096.

Codex did not witness the Darwin or browser execution. The scoped PASS establishes no fresh live Codex input, source-authenticity, task-correctness, human-comprehension, production, independent-user, adoption, or market claim.
