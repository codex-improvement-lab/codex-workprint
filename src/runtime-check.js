export const MINIMUM_NODE_VERSION = "22.18.0";

export function isSupportedNodeVersion(version) {
  const current = parseVersion(version);
  const minimum = parseVersion(MINIMUM_NODE_VERSION);
  if (!current || !minimum) return false;
  for (let index = 0; index < 3; index += 1) {
    if (current[index] > minimum[index]) return true;
    if (current[index] < minimum[index]) return false;
  }
  return true;
}

export function unsupportedNodeMessage(version) {
  return `Codex Workprint requires Node.js ${MINIMUM_NODE_VERSION} or newer; current runtime is ${version || "unknown"}. Upgrade Node before running the CLI or tests.`;
}

function parseVersion(value) {
  const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)/);
  return match ? match.slice(1, 4).map(Number) : null;
}
