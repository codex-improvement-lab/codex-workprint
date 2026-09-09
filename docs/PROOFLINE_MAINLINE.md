# Proofline mainline compatibility candidate

The 2026-09-09 simplification adds an upstream atomic review/direct-input path and a second conformance fixture, `tests/fixtures/proofline-intake-simplified.json`. The complete synthetic loop uses 14 CLI calls; the separate maintenance comparison remains negative against its strong baseline (14/22 operations, original 14/29 retained). Private recheck executable/argv/cwd details stay upstream. This verification requires no Workprint runtime/schema change, version bump or republishing of the existing 0.3.0-rc.3 package.

The next Lab mainline uses Intake for explicitly reviewed requirements and Proofline for evidence. Workprint continues to accept the existing `workprint-profile/0.1` public Goal Delta projection. It does not import Intake source snapshots, requirements, commands, input fingerprints or ledger bindings, and does not recalculate Proofline's five evidence states.

```text
node bin/codex-workprint.js profile build selected-goal-delta-profile.json --out reviewed-workprint
node bin/codex-workprint.js profile verify reviewed-workprint
```

The public producer input must already be reviewed. An Intake-derived Proofline profile uses scoped requirement IDs and generic requirement labels; private acceptance text and source pointers stay in the local upstream files. Inspect counts unsupported extension fields; projection ignores those fields and keeps the same deterministic artifacts.

`tests/fixtures/proofline-intake-mainline.json` was captured from the synthetic 17-operation CLI loop implemented by Proofline's `scripts/mainline-loop.mjs`. One requirement changed, was explicitly reviewed again, and received a new bound observation; the unrelated requirement kept its old receipt. The resulting supplied summary has two usable evidence lines and zero newly stale lines. This is local interoperability evidence, not human review, adoption, statistical cost savings, task correctness or source authenticity.

This candidate adds a producer/consumer conformance and privacy regression plus documentation; the runtime, public Profile schema and renderer remain at the existing version. Packaging/installed-layout checks are reported separately for the final candidate. Historical physical-Mac and hosted CI results do not automatically cover this candidate.
