import type { ProfileKind, WorkprintProfileIR } from "../types.ts";

export interface ProfileReceipt {
  schemaVersion: "workprint-profile-receipt/0.1";
  artifact: "codex-workprint-profile-bundle";
  bundleType: "profile";
  profile: ProfileKind;
  profileIrSha256: string;
  sourceRevision: string;
  inputSchemaVersion: "workprint-profile/0.1";
  retainedFields: string[];
  renderer: {
    profile: string;
    png: string;
  };
  boundaries: {
    suppliedPublicProjectionOnly: true;
    unknownExtensionsPublished: false;
    telemetry: false;
    thirdPartyRequests: false;
    provesSourceAuthenticity: false;
    provesCorrectness: false;
    provesModelInfluence: false;
    provesCausality: false;
  };
  assurance: "receipt-not-attestation";
}

const RETAINED_FIELDS = [
  "profile, title, sourceRevision",
  "source id, label, revision",
  "finding id, kind, verdict, subject, sourceRefs",
  "allowlisted profile-specific finding fields",
  "summary headline and allowlisted counts",
];

export function createProfileReceipt(profile: WorkprintProfileIR): ProfileReceipt {
  return {
    schemaVersion: "workprint-profile-receipt/0.1",
    artifact: "codex-workprint-profile-bundle",
    bundleType: "profile",
    profile: profile.profile,
    profileIrSha256: profile.source.profileIrSha256,
    sourceRevision: profile.sourceRevision,
    inputSchemaVersion: profile.source.schemaVersion,
    retainedFields: RETAINED_FIELDS,
    renderer: {
      profile: profile.render.rendererVersion,
      png: profile.render.pngRenderer,
    },
    boundaries: {
      suppliedPublicProjectionOnly: true,
      unknownExtensionsPublished: false,
      telemetry: false,
      thirdPartyRequests: false,
      provesSourceAuthenticity: false,
      provesCorrectness: false,
      provesModelInfluence: false,
      provesCausality: false,
    },
    assurance: "receipt-not-attestation",
  };
}

export function renderProfileEmbedMarkdown(profile: WorkprintProfileIR): string {
  const alt = markdownText(`${profile.title} — ${profile.question} — Codex Workprint`);
  return `[![${alt}](./workprint-profile.svg)](./workprint-profile.html)\n\n` +
    `Generated locally with Codex Workprint: \`codex-workprint profile build profile.json --out ./workprint\`. ` +
    `Supplied public projection only; not an attestation.\n`;
}

function markdownText(value: string): string {
  return value.replace(/[\[\]\\]/g, " ").replace(/\s+/g, " ").trim();
}

