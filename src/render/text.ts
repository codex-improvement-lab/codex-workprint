import type { WorkprintIR } from "../core/types.ts";

export interface PrivacyReceipt {
  schemaVersion: "0.1";
  artifact: "codex-workprint-public-projection";
  shapeSha256: string;
  publicIrSha256: string;
  policy: {
    version: "0.1";
    mode: "default-deny-public-projection";
    itemIds: "pseudonymized-for-sequence-association";
  };
  retainedCategories: string[];
  excludedCategories: string[];
  excludedFieldOccurrences: Record<string, number>;
  explicitPublicFields: string[];
  renderer: {
    workline: string;
    png: string;
  };
  boundaries: {
    rawValuesRetained: false;
    rawInputHashPublished: false;
    shapeIdentityExcludesPublicCopy: true;
    timing: "not-observed";
    telemetry: false;
    thirdPartyRequests: false;
    provesAuthenticity: false;
    provesCorrectness: false;
    provesRecovery: false;
    provesIdentity: false;
  };
  assurance: "receipt-not-guarantee";
}

export function createPrivacyReceipt(workprint: WorkprintIR): PrivacyReceipt {
  return {
    schemaVersion: "0.1",
    artifact: "codex-workprint-public-projection",
    shapeSha256: workprint.source.shapeSha256,
    publicIrSha256: workprint.source.publicIrSha256,
    policy: {
      version: workprint.privacy.policyVersion,
      mode: workprint.privacy.mode,
      itemIds: workprint.privacy.itemIds,
    },
    retainedCategories: [
      "recognized event and item type",
      "ordered observation sequence",
      "pseudonymized item association",
      "explicit status and integer exit code",
      "aggregate public counts",
      "explicit public title, labels, annotations, identity metadata, language, and public URL",
      "shape digest derived only from ordered whitelisted observation structure",
    ],
    excludedCategories: workprint.privacy.excludedCategories,
    excludedFieldOccurrences: workprint.privacy.excludedFieldOccurrences,
    explicitPublicFields: workprint.privacy.explicitPublicFields,
    renderer: {
      workline: workprint.render.rendererVersion,
      png: workprint.render.pngRenderer,
    },
    boundaries: {
      rawValuesRetained: false,
      rawInputHashPublished: false,
      shapeIdentityExcludesPublicCopy: true,
      timing: "not-observed",
      telemetry: false,
      thirdPartyRequests: false,
      provesAuthenticity: false,
      provesCorrectness: false,
      provesRecovery: false,
      provesIdentity: false,
    },
    assurance: "receipt-not-guarantee",
  };
}

export function renderEmbedMarkdown(workprint: WorkprintIR): string {
  const alt = markdownText(`${workprint.run.publicTitle} — Codex Workprint`);
  return `[![${alt}](./workprint.svg)](./workprint.html)\n\nGenerated locally with Codex Workprint: \`codex exec --json "<task>" | codex-workprint build - --title "…" --out ./workprint --open\`. Privacy-safe public receipt; not an attestation.\n`;
}

function markdownText(value: string): string {
  return value.replace(/[\[\]\\]/g, " ").replace(/\s+/g, " ").trim();
}
