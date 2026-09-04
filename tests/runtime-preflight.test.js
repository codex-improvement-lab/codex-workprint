import assert from "node:assert/strict";
import test from "node:test";
import {
  MINIMUM_NODE_VERSION,
  isSupportedNodeVersion,
  unsupportedNodeMessage,
} from "../src/runtime-check.js";

test("the JavaScript preflight fails old Node before TypeScript is imported", () => {
  assert.equal(MINIMUM_NODE_VERSION, "22.18.0");
  assert.equal(isSupportedNodeVersion("22.17.9"), false);
  assert.equal(isSupportedNodeVersion("22.18.0"), true);
  assert.equal(isSupportedNodeVersion("24.0.0"), true);
  assert.match(unsupportedNodeMessage("22.16.0"), /requires Node\.js 22\.18\.0 or newer; current runtime is 22\.16\.0/);
  assert.equal(isSupportedNodeVersion(process.versions.node), true, unsupportedNodeMessage(process.versions.node));
});
