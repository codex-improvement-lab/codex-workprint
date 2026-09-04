"""Build and exercise a local distribution; never publish or alter Git state."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import shutil
import stat
import subprocess
import tarfile
import tempfile
import zipfile


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--pnpm-js", required=True, help="Path to an installed pnpm CLI module")
    parser.add_argument("--node", default="node")
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    package = json.loads((root / "package.json").read_text(encoding="utf-8"))
    version = package["version"]
    release = root / "release"
    release.mkdir(exist_ok=True)
    audit = root / "._audit"
    audit.mkdir(exist_ok=True)
    smoke = Path(tempfile.mkdtemp(prefix="Release smoke with spaces ", dir=audit)).resolve()
    env = dict(os.environ)
    env["NO_COLOR"] = "1"
    env.pop("FORCE_COLOR", None)
    steps: list[dict] = []

    def run(argv: list[str], cwd: Path, *, input_text: str | None = None) -> str:
        result = subprocess.run(argv, cwd=cwd, env=env, input=input_text, capture_output=True,
                                text=True, encoding="utf-8", errors="replace", timeout=120)
        with (smoke / "commands.log").open("a", encoding="utf-8") as log:
            log.write(result.stdout + result.stderr + "\n")
        if result.returncode:
            raise RuntimeError(f"Command failed ({result.returncode}): {result.stderr[-1200:]}")
        return result.stdout

    archive = release / f"codex-workprint-{version}.tgz"
    pack = [args.node, str(Path(args.pnpm_js).resolve()), "pack", "--json", "--out", str(archive)]
    run(pack, root)
    first_hash = digest(archive)
    run(pack, root)
    if digest(archive) != first_hash:
        raise RuntimeError("Repeated package builds differ")

    members: list[tuple[str, bytes, int]] = []
    with tarfile.open(archive, "r:gz") as tar:
        for member in tar.getmembers():
            path = PurePosixPath(member.name)
            if path.is_absolute() or ".." in path.parts or not path.parts or path.parts[0] != "package":
                raise RuntimeError("Unsafe package member")
            if member.isdir():
                continue
            if not member.isfile():
                raise RuntimeError("Distribution must contain regular files only")
            relative = path.relative_to("package").as_posix()
            if any(part in {".git", "node_modules", "._audit", ".workprint-private", "expert-review"} for part in path.parts):
                raise RuntimeError("Private or development data entered the package")
            if relative.endswith(".jsonl") and relative != "examples/first-run/input.jsonl":
                raise RuntimeError("Unexpected JSONL in distribution")
            members.append((relative, tar.extractfile(member).read(), member.mode))
    required = {"bin/codex-workprint.js", "assets/fonts/unifont-17.0.05.hex.gz", "examples/first-run/input.jsonl"}
    if not required.issubset({name for name, _, _ in members}):
        raise RuntimeError("Missing runtime or offline example")

    install = smoke / "Installed package"
    install.mkdir()
    (install / "package.json").write_text('{"name":"workprint-release-smoke","private":true}\n', encoding="utf-8")
    run([args.node, str(Path(args.pnpm_js).resolve()), "--dir", str(install), "add", "--offline",
         "--ignore-scripts", "--store-dir", str(smoke / "store"), str(archive)], root)
    installed = (install / "node_modules/codex-workprint").resolve()
    if not installed.is_relative_to(smoke):
        raise RuntimeError("Installed package escaped isolated smoke root")
    if json.loads((installed / "package.json").read_text(encoding="utf-8"))["version"] != version:
        raise RuntimeError("Installed version differs")
    cli = [args.node, str(installed / "bin/codex-workprint.js")]
    shim = run([args.node, str(Path(args.pnpm_js).resolve()), "--dir", str(install), "exec", "codex-workprint", "--help"], root)
    if "workprint" not in shim.lower():
        raise RuntimeError("Installed package bin shim did not run")
    sample = installed / "examples/first-run/input.jsonl"
    for name, source in [("file", str(sample)), ("stdin", "-")]:
        out = smoke / f"Run {name}"
        run([*cli, "build", source, "--title", "Synthetic first run", "--out", str(out)], install,
            input_text=sample.read_text(encoding="utf-8") if source == "-" else None)
        result = json.loads(run([*cli, "verify", str(out), "--json"], install))
        if not result.get("ok"):
            raise RuntimeError("Installed Run verification failed")
        steps.append({"kind": "installed-run", "input": name, "result": "PASS", "files": len(list(out.iterdir()))})
    for file in (smoke / "Run file").iterdir():
        if file.read_bytes() != (smoke / "Run stdin" / file.name).read_bytes():
            raise RuntimeError("Installed stdin and file artifacts differ")
    for name in ["continuity-archive-migration", "goal-delta-offline-release", "context-receipt-observation-gap"]:
        source = installed / "examples/profile" / name / "profile.json"
        out = smoke / name
        run([*cli, "profile", "build", str(source), "--out", str(out)], install)
        result = json.loads(run([*cli, "profile", "verify", str(out), "--json"], install))
        if not result.get("ok"):
            raise RuntimeError("Installed Profile verification failed")
        steps.append({"kind": "installed-profile", "profile": name, "result": "PASS", "files": len(list(out.iterdir()))})

    start = """# Codex Workprint — start here

This portable prerelease runs locally and is not an installer. It is not published to npm.
Requires Node.js 22.18.0 or newer. Node 24 LTS is recommended.

From this folder:

    node ./bin/codex-workprint.js build ./examples/first-run/input.jsonl --title "Synthetic first run" --out ./first-workprint
    node ./bin/codex-workprint.js verify ./first-workprint

Open first-workprint/workprint.html. This input is explicitly synthetic. No model or account is required.
Use your own explicitly selected JSONL for a real receipt. See RELEASE_NOTES.md for candidate and platform scope.
"""
    portable = release / f"codex-workprint-{version}-portable.zip"
    with zipfile.ZipFile(portable, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as zip:
        for name, data, mode in sorted([*members, ("START_HERE.md", start.encode(), 0o644)]):
            info = zipfile.ZipInfo(f"codex-workprint-{version}/{name}", (1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = (stat.S_IFREG | (mode & 0o777)) << 16
            zip.writestr(info, data)
    portable_root = smoke / "Portable copy"
    portable_root.mkdir()
    with zipfile.ZipFile(portable) as zip:
        for info in zip.infolist():
            target = portable_root / info.filename
            if not target.resolve().is_relative_to(portable_root):
                raise RuntimeError("Unsafe portable member")
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(zip.read(info))
    folder = portable_root / f"codex-workprint-{version}"
    portable_cli = [args.node, str(folder / "bin/codex-workprint.js")]
    output = smoke / "Portable output"
    run([*portable_cli, "build", "examples/first-run/input.jsonl", "--title", "Synthetic first run", "--out", str(output)], folder)
    if not json.loads(run([*portable_cli, "verify", str(output), "--json"], folder)).get("ok"):
        raise RuntimeError("Portable verification failed")
    steps.append({"kind": "portable-run", "result": "PASS", "files": len(list(output.iterdir()))})

    artifacts = []
    for file in [archive, portable]:
        sha = digest(file)
        file.with_name(file.name + ".sha256").write_text(f"{sha}  {file.name}\n", encoding="utf-8")
        artifacts.append({"file": file.name, "bytes": file.stat().st_size, "sha256": sha})
    record = {"candidate": version, "evidenceClass": "Windows local packaging and installed-copy smoke",
              "packager": "pnpm " + run([args.node, str(Path(args.pnpm_js).resolve()), "--version"], root).strip(), "node": run([args.node, "--version"], root).strip(),
              "packageFiles": len(members), "tarballRepeatedBuildIdentical": True,
              "install": "offline, scripts disabled, isolated local store, path with spaces",
              "stdinAndFileByteIdentical": True, "steps": steps, "artifacts": artifacts,
              "publicationPerformed": False, "physicalMacRunPerformed": False}
    (release / "PACKAGE_VERIFICATION.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    # Retain logs separately while removing only this script's exact disposable tree.
    shutil.copyfile(smoke / "commands.log", audit / "release-package-smoke.log")
    if smoke.parent != audit.resolve() or not smoke.name.startswith("Release smoke with spaces "):
        raise RuntimeError("Unsafe smoke cleanup target")
    # The pnpm store layout can exceed MAX_PATH inside this intentionally spaced
    # test root. Prefix only the already-resolved, boundary-checked local path.
    cleanup_path = "\\\\?\\" + str(smoke) if os.name == "nt" else str(smoke)
    shutil.rmtree(cleanup_path)
    print(json.dumps(record, indent=2))


if __name__ == "__main__":
    main()
