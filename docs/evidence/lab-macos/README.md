# External Lab physical-Mac acceptance case

This directory retains a content-preserving repository copy of the user-supplied 2026-08-30 report for the five-project Codex Improvement Lab candidate archive and a bounded local import audit. The original attachment's identity is retained separately because the repository copy removes one redundant final LF.

| File | SHA-256 | Meaning |
| --- | --- | --- |
| Original attachment (identity recorded in audit) | `81016253adc83f9ecba887f7b5be7670e9510b0f8df1b1d1c218d8249fc32cc0` | 4,249-byte external operator report from a physical Apple Silicon Mac |
| [Repository copy](ACCEPTANCE_REPORT_2026-08-30.md) | `8b0214280235ca95fbefa8a30646f842233ec520774ee0633516c9f47dbb559c` | Same 80 content lines; one redundant terminal LF removed |
| [Import audit](IMPORT_AUDIT.json) | generated locally | Original/copy identities, count correction, per-project verdicts, and claim ceiling |
| [Remediation receipt](REMEDIATION_2026-08-30.json) | generated locally | Exact two-project fixes, local regression results, and targeted retest package identity |
| Original targeted retest attachment (identity recorded in audit) | `a3354a21d8df44255966bce9bd68980528337fbbff635fe2c00efccf84f60770` | 3,292-byte external report for the Intake + Proofline rerun |
| [Targeted retest repository copy](TARGETED_RETEST_REPORT_2026-08-30.md) | `acda2fcfbdfc3f6e534dbf63f98c3f984770471ae3018b3155a7bdd6b3cb13b4` | Same 46 content lines; four trailing Markdown spaces removed for the public-text contract |
| [Targeted retest audit](TARGETED_RETEST_AUDIT_2026-08-30.json) | generated locally | Exact candidate verdicts, claim ceiling, and the successor Intake-only package identity |
| Original Intake final-v2 report attachment (identity recorded in audit) | `27a008e94bd2a2dd1659c53ea4d555348baa47c78f532af81671113f913986e6` | 3,347-byte external report for the exact Intake-only v2 archive |
| [Intake final-v2 repository copy](INTAKE_FINAL_RETEST_REPORT_V2_2026-08-30.md) | `645e851bccee95c5fe4e97d8ca359b5e136130367703e41cef552b9eba59258b` | Same 62 content lines; four trailing Markdown spaces removed for the public-text contract |
| [Intake final-v2 audit](INTAKE_FINAL_RETEST_V2_AUDIT_2026-08-30.json) | generated locally | Exact archive/candidate binding, final 5/5 verdict, missing environment metadata, and claim ceiling |

The archive as a whole is `FAIL`: Matchup, Tabs, and Decision Inbox are scoped `PASS`; Intake and Proofline are `FAIL`; all five signature interactions were reported working. Independent Windows-side inspection confirmed the named ZIP hash and found 299 ZIP files, while its manifest correctly contains 298 lines for all files other than the manifest itself. The report's “299 manifest entries” wording therefore conflates total archive files with manifest lines.

Codex Workprint was not in that archive. These files are a portfolio acceptance case, not Workprint runtime or platform evidence. Workprint's own physical-Mac result remains separately bound to the exact archive described under [`../macos/`](../macos/).

The targeted Darwin report closes Proofline in the lab acceptance scope for exact candidate `codex-proofline-macos-rc-9bdf7995a611f15e`: 34 tests passed, one Windows-only test skipped, and the 28-file release gate passed. It does not show Proofline's separate full plugin-lifecycle gate v2.

Intake's two platform repairs passed 15/15 on the reported Mac, but the delivered archive omitted `.agents/plugins/marketplace.json`, so its release check failed and the project remains the sole portfolio blocker. A new Intake-only archive fixes the selector and also prevents default E2E validation from rewriting content-hashed public screenshots. Its Windows clean-copy gate and candidate-stability checks pass; the exact archive remains `pending` until one final physical-Mac result returns.

That final Intake-only result has now returned. It binds archive `198a45ee111b…` and candidate content SHA `74883da55dae…`, reports release-check exit 0, 15/15 Vitest, 5/5 Playwright, stable second candidate preparation, and 65/65 manifest entries before and after the gate. The Lab portfolio is therefore **5 PASS / 0 FAIL** in its automated macOS acceptance scope. The report does not repeat hardware, architecture, macOS, Node, or pnpm versions, so no hardware- or version-specific claim is promoted from it.
