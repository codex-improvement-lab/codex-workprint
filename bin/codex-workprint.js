#!/usr/bin/env node

import { isSupportedNodeVersion, unsupportedNodeMessage } from "../src/runtime-check.js";
import { existsSync } from "node:fs";

if (!isSupportedNodeVersion(process.versions.node)) {
  process.stderr.write(`${unsupportedNodeMessage(process.versions.node)}\n`);
  process.exitCode = 1;
} else {
  // Source checkouts use their current source. Published/portable packages ship
  // JavaScript because Node refuses type stripping below node_modules.
  const source = new URL("../src/cli.ts", import.meta.url);
  const runtime = existsSync(source) ? source : new URL("../dist/cli.js", import.meta.url);
  const { runCli } = await import(runtime.href);
  const exitCode = await runCli(process.argv.slice(2), {
    stdout: process.stdout,
    stderr: process.stderr,
    stdin: process.stdin,
  });
  process.exitCode = exitCode;
}
