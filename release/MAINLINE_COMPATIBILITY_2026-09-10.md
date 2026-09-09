# Proofline mainline compatibility

The public Proofline 0.2.0-rc.1 and Intake 0.3.0-rc.1 releases work with the existing
[Workprint 0.3.0-rc.3 package](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3).
No Workprint runtime/schema update or new release tag was required.

The owner downloaded that already-public TGZ (SHA-256
`ca741ef06bbcdffffe74e0e0ee903f80f88f937bbb4a6aaefda9be486a5078cd`) and installed it
in an isolated directory. A public Goal Delta projection from the actual new Proofline
package successfully built and verified a Workprint. The synthetic example had one
changed requirement, one stale proof line and one retained proof line; private acceptance
text, execution arguments and local paths were excluded from the projection.

The conformance/documentation source is `532e5330578ab707b5e764514605f226889e1d09`.
[Its hosted CI](https://github.com/codex-improvement-lab/codex-workprint/actions/runs/34380866668)
completed successfully. Developer checks recorded 47 tests and 439 release checks in
clean source. Main adds compatibility tests/documentation and package inclusion of the
guide; runtime and bin sources remain unchanged from the previous public main.

This establishes the tested interchange and installed-package path, not authenticity
of source evidence, business correctness, physical-Mac validation or user-time savings.
