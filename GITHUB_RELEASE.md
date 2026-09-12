# GitHub release preparation

The user authorized completing and publishing `0.3.0-rc.3` on 2026-09-05. The publication target is the public GitHub repository `codex-improvement-lab/codex-workprint` and its prerelease assets, using the established `eliasruntime` maintainer account. npm and plugin-directory publication remain separate.

Completed: [GitHub prerelease](https://github.com/codex-improvement-lab/codex-workprint/releases/tag/v0.3.0-rc.3), tagged commit `b5ea146`, four successful hosted jobs, verified public downloads, social preview and private vulnerability reporting. The [publication record](docs/evidence/github/release-0.3.0-rc.3.json) binds the exact commit, hosted run and asset hashes.

## Local release assets

- Repository description: `Turn Codex runs into privacy-safe, verifiable visual receipts.`
- Suggested topics: `codex`, `coding-agent`, `developer-tools`, `workflow-visualization`, `cli`, `jsonl`, `svg`, `privacy`, `local-first`.
- Social preview image: `docs/assets/github-social-preview.png` (1200×630 indexed PNG, 756798 bytes, strictly below 1,000,000 bytes). It is byte-identical to the primary Run Receipt share card and explains the product without repository text. The three-profile comparison remains at `docs/assets/workprint-profile-triptych.png`.
- Release notes: `RELEASE_NOTES.md`.
- Candidate tag: `v0.3.0-rc.3`.
- Release title: `Codex Workprint 0.3.0-rc.3`.
- Release classification: prerelease.
- Prepared local distributables and checksums: `release/README.md`.

GitHub automatically creates source ZIP and tar archives from the release tag. Do not attach ignored raw JSONL, `._audit`, private receipts, the earlier Mac-review ZIP, or generated dependency directories as release assets.

## Established defaults and final publication choices

Target: the established Lab organization `codex-improvement-lab`, repository `codex-workprint`, public visibility, and the existing maintainer identity. Use GitHub private vulnerability reporting as the security contact; retain the contributor copyright in LICENSE.

## Before the first commit

- [x] Confirm the established owner, repository name, public visibility, and existing contributor copyright.
- [x] Limit this publication to GitHub source, tarball, portable ZIP and SHA-256 sidecars. The npm name has not been reserved.
- [x] Review `SECURITY.md`, `PRIVACY.md`, the public demos, and candidate public files. No Code of Conduct with a placeholder private contact is added.

## First repository sequence

1. Create an empty GitHub repository without another README, license, or `.gitignore`.
2. Review the complete first commit locally, including staged file modes and the absence of ignored/private paths. Record `bin/codex-workprint.js` as executable (`git add --chmod=+x bin/codex-workprint.js`) if direct POSIX invocation is intended. Run `git status --short`, `git diff --cached --check`, and `git diff --cached --stat` before committing; ordinary `git diff` does not inspect untracked files.
3. Add the user-selected remote and push `main`.
4. Wait for every Windows/macOS × Node 22/24 Actions matrix job and `npm pack --dry-run` step. Configuration alone is not a PASS.
5. Keep npm-unpublished status explicit. Include the real `repository`, `homepage`, and `bugs` URLs in `package.json`, rebuild and inspect the archives, and commit that metadata before tagging.

## GitHub settings after the first successful CI run

- Set the repository description, topics, and social preview listed above.
- Enable private vulnerability reporting so `SECURITY.md` has an actionable private route.
- Keep `GITHUB_TOKEN` permissions read-only; the checked-in workflow pins the two official actions by commit SHA.
- Additional repository hardening can be adopted when its effect on the maintainer workflow is reviewed; avoid requirements that prevent the sole active maintainer from shipping.
- Enable Discussions only if the maintainer intends to answer support questions; otherwise keep support routed through the issue forms.

## Draft and publish the release

1. Create tag `v0.3.0-rc.3` from the exact commit whose CI passed.
2. Draft the GitHub Release, paste or adapt `RELEASE_NOTES.md`, and mark it as a prerelease.
3. Verify the displayed tag/commit, source archives, license detection, README images/links, security policy, issue forms, and community profile.
4. Upload and verify the two prepared archives and their SHA-256 sidecars; publish after the exact source commit's four hosted jobs pass and private vulnerability reporting is enabled. Keep evidence wording within `docs/VALIDATION.md`.

## Evidence ceiling after publication

A public repository, green hosted CI, tag, or release establishes distribution and the named automated results. It does not prove source authenticity, task correctness, human comprehension, adoption, or market demand. Record those only after direct evidence exists.
