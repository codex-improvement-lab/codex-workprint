import type { ProfileFinding, ProfileVerdict, WorkprintProfileIR } from "../types.ts";
import { PROFILE_VERDICTS } from "../contract.ts";

const COLOR = {
  carbon: "#11120f",
  carbonSoft: "#1a1c17",
  paper: "#f1ecdf",
  acid: "#c7ff36",
  cobalt: "#2457ff",
  coral: "#ff665c",
  silver: "#aeb4ad",
  ink: "#24251f",
  amber: "#ffb340",
  rule: "#383a32",
} as const;

const VERDICT_COLOR: Record<ProfileVerdict, string> = {
  carried: COLOR.acid,
  lost: COLOR.coral,
  stale: COLOR.amber,
  invented: COLOR.silver,
  added: COLOR.cobalt,
  removed: COLOR.silver,
  changed: COLOR.coral,
  unchanged: COLOR.acid,
  prepared: COLOR.cobalt,
  observed: COLOR.acid,
  excluded: COLOR.silver,
  not_observed: COLOR.coral,
  conflict: COLOR.amber,
};

export function renderProfileSvg(profile: WorkprintProfileIR, interactive = false): string {
  const id = profile.source.profileIrSha256.slice(0, 12).toUpperCase();
  const title = escapeXml(truncate(profile.title, 68));
  const question = escapeXml(profile.question);
  const headline = escapeXml(truncate(profile.summary.headline, 98));
  const titleSize = Math.max(29, Math.min(46, Math.floor(1600 / Math.max(1, [...profile.title].length))));
  const headlineSize = Math.max(16, Math.min(24, Math.floor(1900 / Math.max(1, [...profile.summary.headline].length))));
  const shape = profile.profile === "continuity"
    ? renderContinuity(profile, interactive)
    : profile.profile === "goal-delta"
      ? renderGoalDelta(profile, interactive)
      : renderContextReceipt(profile, interactive);

  return `${interactive ? "" : `<?xml version="1.0" encoding="UTF-8"?>\n`}<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 760" role="img" aria-labelledby="profile-title profile-desc" class="profile-artifact profile-${profile.profile}">
  <title id="profile-title">${title} — Codex Workprint ${escapeXml(profile.profile)}</title>
  <desc id="profile-desc">${question} ${headline} Findings trace only to the source labels and revisions supplied in this public projection.</desc>
  <style>
    .profile-artifact{background:${COLOR.paper};font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}.eyebrow,.profile-tag,.question,.headline-label,.source-label,.verdict,.micro,.footer,.count-label{font-family:"Arial Narrow",Inter,ui-sans-serif,system-ui,sans-serif;font-weight:800;letter-spacing:1.45px}.eyebrow{font-size:11px;fill:${COLOR.ink}}.profile-tag{font-size:10px;fill:${COLOR.silver}}.title{font-family:Georgia,"Times New Roman",serif;font-weight:700;fill:${COLOR.paper}}.question{font-size:14px;fill:${COLOR.acid}}.headline-label{font-size:9px;fill:${COLOR.silver}}.headline{font-family:Georgia,"Times New Roman",serif;font-size:24px;font-weight:700;fill:${COLOR.paper}}.finding-label{font-size:10px;font-weight:700;fill:${COLOR.paper}}.verdict{font-size:8px}.micro{font-size:8px;fill:${COLOR.silver}}.source-label{font-size:8px;fill:${COLOR.paper}}.footer{font-size:9px;fill:${COLOR.ink}}.count{font-size:19px;font-weight:850}.count-label{font-size:7px;fill:${COLOR.silver}}.profile-node:focus{outline:none}.profile-node:focus .focus-ring,.profile-node[aria-pressed="true"] .focus-ring{opacity:1}.profile-node,.profile-source{cursor:pointer}.profile-source.is-traced .source-hit,.profile-node.is-traced .trace-hit{opacity:1}
  </style>
  <rect width="1200" height="760" fill="${COLOR.paper}"/>
  <path d="M0 0H1200V9H0Z" fill="${COLOR.cobalt}"/><path d="M770 0H1000V9H770Z" fill="${COLOR.acid}"/><path d="M1000 0H1200V9H1000Z" fill="${COLOR.coral}"/>
  <text x="34" y="28" class="eyebrow">CODEX WORKPRINT · THREE QUESTIONS. ONE WORKPRINT.</text>
  <text x="1166" y="28" text-anchor="end" class="eyebrow">THE WORK HAS A STATE.</text>
  <rect x="24" y="42" width="1152" height="660" rx="3" fill="${COLOR.carbon}"/>
  <text x="58" y="76" class="profile-tag">${escapeXml(profile.profile.toUpperCase())} / ${escapeXml(profile.visualForm.toUpperCase())} PROFILE</text>
  <text x="1142" y="76" text-anchor="end" class="profile-tag">PROFILE IR ${id}</text>
  <text x="58" y="127" class="title" style="font-size:${titleSize}px">${title}</text>
  <text x="58" y="160" class="question">${question}</text>
  <text x="58" y="198" class="headline-label">PUBLIC SUMMARY / SUPPLIED PROJECTION</text>
  <text x="58" y="226" class="headline" style="font-size:${headlineSize}px">${headline}</text>
  ${renderCounts(profile)}
  <path d="M58 250H1142" stroke="${COLOR.rule}" stroke-width="1"/>
  ${shape}
  ${renderSources(profile, interactive)}
  <text x="34" y="730" class="footer">WORKPRINT IS A DETERMINISTIC DISPLAY · NOT A NEW FACT SOURCE · NOT AN ATTESTATION</text>
  <text x="1166" y="730" text-anchor="end" class="footer">SOURCE REVISION ${escapeXml(truncate(profile.sourceRevision, 78))}</text>
</svg>\n`.replace(/[ \t]+$/gm, "");
}

function renderCounts(profile: WorkprintProfileIR): string {
  const verdicts = PROFILE_VERDICTS[profile.profile]
    .map((verdict) => [verdict, profile.summary.counts[verdict]] as const)
    .slice(0, 6);
  const startX = 1128 - verdicts.length * 74;
  return verdicts.map(([verdict, count], index) => {
    const x = startX + index * 74;
    const color = VERDICT_COLOR[verdict as ProfileVerdict] ?? COLOR.paper;
    return `<g transform="translate(${x} 174)"><text class="count" fill="${color}">${count}</text><text y="18" class="count-label">${escapeXml(verdict.replaceAll("_", " ").toUpperCase())}</text></g>`;
  }).join("");
}

function renderContinuity(profile: WorkprintProfileIR, interactive: boolean): string {
  const findings = profile.findings.slice(0, 10);
  const slot = 970 / Math.max(1, findings.length);
  const seamY = 407;
  const nodes = findings.map((finding, index) => {
    const x = 115 + slot * (index + 0.5);
    const color = VERDICT_COLOR[finding.verdict];
    const labelAbove = index % 2 === 0;
    const labelY = labelAbove ? 313 : 522;
    const lineTop = labelAbove ? 332 : seamY + 17;
    const lineBottom = labelAbove ? seamY - 17 : 498;
    const seam = finding.verdict === "carried"
      ? `<path d="M${n(x)} ${seamY - 34}V${seamY + 34}" stroke="${color}" stroke-width="5"/><circle cx="${n(x)}" cy="${seamY}" r="8" fill="${color}" stroke="${COLOR.carbon}" stroke-width="4"/>`
      : finding.verdict === "lost"
        ? `<path d="M${n(x)} ${seamY - 34}V${seamY - 10}M${n(x)} ${seamY + 10}V${seamY + 34}" stroke="${color}" stroke-width="5"/><path d="M${n(x - 12)} ${seamY - 8}L${n(x + 12)} ${seamY + 8}M${n(x + 12)} ${seamY - 8}L${n(x - 12)} ${seamY + 8}" stroke="${color}" stroke-width="2"/>`
        : finding.verdict === "stale"
          ? `<path d="M${n(x - 7)} ${seamY - 34}V${seamY - 4}M${n(x + 7)} ${seamY + 4}V${seamY + 34}" stroke="${color}" stroke-width="5"/><path d="M${n(x - 7)} ${seamY - 4}L${n(x + 7)} ${seamY + 4}" stroke="${color}" stroke-width="2" stroke-dasharray="3 3"/>`
          : `<circle cx="${n(x)}" cy="${seamY}" r="13" fill="none" stroke="${color}" stroke-width="2" stroke-dasharray="3 4"/><path d="M${n(x)} ${seamY - 34}V${seamY - 15}M${n(x)} ${seamY + 15}V${seamY + 34}" stroke="${color}" stroke-width="2" stroke-dasharray="3 4"/>`;
    return `<g ${nodeAttributes(finding, interactive)} transform="translate(0 0)">
      <rect class="trace-hit" x="${n(x - slot * 0.42)}" y="${labelAbove ? 277 : 482}" width="${n(slot * 0.84)}" height="62" rx="2" fill="${color}" opacity="0"/>
      <circle class="focus-ring" cx="${n(x)}" cy="${seamY}" r="20" fill="none" stroke="${COLOR.paper}" stroke-width="2" opacity="0"/>
      <path d="M${n(x)} ${lineTop}V${lineBottom}" stroke="${COLOR.rule}" stroke-width="1"/>
      ${seam}
      <text x="${n(x)}" y="${labelY}" text-anchor="middle" class="verdict" fill="${color}">${escapeXml(finding.verdict.toUpperCase())}</text>
      <text x="${n(x)}" y="${labelY + 16}" text-anchor="middle" class="finding-label">${escapeXml(truncate(finding.subject, Math.max(14, Math.floor(slot / 5.7))))}</text>
      <text x="${n(x)}" y="${labelY + 29}" text-anchor="middle" class="micro">${escapeXml(sourceCaption(finding))}</text>
    </g>`;
  }).join("");
  return `<g aria-label="Continuity seam visualization">
    <rect x="64" y="278" width="1072" height="276" rx="2" fill="${COLOR.carbonSoft}" stroke="${COLOR.rule}"/>
    <text x="84" y="301" class="micro">BLACK BOX / HANDOFF BOUNDARY</text><text x="1116" y="301" text-anchor="end" class="micro">${findings.length} PUBLIC FINDINGS</text>
    <path d="M84 ${seamY}H1116" stroke="${COLOR.paper}" stroke-width="18" opacity=".035"/><path d="M84 ${seamY}H1116" stroke="${COLOR.silver}" stroke-width="1" stroke-dasharray="2 7"/>
    ${nodes}
  </g>`;
}

function renderGoalDelta(profile: WorkprintProfileIR, interactive: boolean): string {
  const findings = profile.findings.slice(0, 10);
  const centerX = 600;
  const nodes = findings.map((finding, index) => {
    const left = index % 2 === 0;
    const row = Math.floor(index / 2);
    const y = 308 + row * 62;
    const x = left ? 145 : 1055;
    const anchorX = left ? 548 - row * 7 : 652 + row * 7;
    const color = VERDICT_COLOR[finding.verdict];
    const affected = finding.affectedEvidenceIds?.length ?? 0;
    return `<g ${nodeAttributes(finding, interactive)}>
      <rect class="trace-hit" x="${left ? 80 : 752}" y="${y - 22}" width="368" height="45" rx="2" fill="${color}" opacity="0"/>
      <circle class="focus-ring" cx="${x}" cy="${y}" r="18" fill="none" stroke="${COLOR.paper}" stroke-width="2" opacity="0"/>
      <path d="M${x} ${y}L${anchorX} ${y + (left ? 8 : -8)}" stroke="${color}" stroke-width="${finding.verdict === "changed" || finding.verdict === "removed" ? 3 : 1.5}" ${finding.verdict === "removed" ? 'stroke-dasharray="6 6"' : ""}/>
      <circle cx="${x}" cy="${y}" r="9" fill="${color}" stroke="${COLOR.carbon}" stroke-width="4"/>
      <text x="${left ? x + 20 : x - 20}" y="${y - 3}" text-anchor="${left ? "start" : "end"}" class="verdict" fill="${color}">${escapeXml(finding.verdict.toUpperCase())}${affected ? ` · ${affected} EVIDENCE` : ""}</text>
      <text x="${left ? x + 20 : x - 20}" y="${y + 13}" text-anchor="${left ? "start" : "end"}" class="finding-label">${escapeXml(truncate(finding.subject, 46))}</text>
    </g>`;
  }).join("");
  return `<g aria-label="Goal Delta fault and shockwave visualization">
    <rect x="64" y="278" width="1072" height="276" rx="2" fill="${COLOR.carbonSoft}" stroke="${COLOR.rule}"/>
    <text x="84" y="301" class="micro">CONTRACT REVISION / FAULT LINE</text><text x="1116" y="301" text-anchor="end" class="micro">ONLY EXPLICIT DEPENDENCY IMPACT IS SHOWN</text>
    <ellipse cx="${centerX}" cy="417" rx="116" ry="104" fill="none" stroke="${COLOR.coral}" stroke-width="1" opacity=".42"/>
    <ellipse cx="${centerX}" cy="417" rx="74" ry="68" fill="none" stroke="${COLOR.coral}" stroke-width="1" opacity=".66"/>
    <path d="M612 292L580 337L617 365L584 403L626 435L582 469L610 538" fill="none" stroke="${COLOR.coral}" stroke-width="7"/>
    <path d="M592 292L620 337L588 365L616 403L579 435L619 469L596 538" fill="none" stroke="${COLOR.paper}" stroke-width="1" opacity=".36"/>
    ${nodes}
  </g>`;
}

function renderContextReceipt(profile: WorkprintProfileIR, interactive: boolean): string {
  const findings = profile.findings.slice(0, 10);
  const centerX = 600;
  const centerY = 414;
  const nodes = findings.map((finding, index) => {
    const angle = -Math.PI * 0.9 + (Math.PI * 1.8 * (index + 0.5)) / Math.max(1, findings.length);
    const x = centerX + Math.cos(angle) * 420;
    const y = centerY + Math.sin(angle) * 116;
    const innerX = centerX + Math.cos(angle) * 244;
    const innerY = centerY + Math.sin(angle) * 74;
    const color = VERDICT_COLOR[finding.verdict];
    const nearLeft = x < 300;
    const nearRight = x > 900;
    const align = nearLeft ? "start" : nearRight ? "end" : x < centerX ? "end" : "start";
    const labelX = nearLeft ? x + 16 : nearRight ? x - 16 : x + (x < centerX ? -16 : 16);
    const traceX = Math.max(80, Math.min(876, x < centerX ? x - 244 : x));
    return `<g ${nodeAttributes(finding, interactive)}>
      <rect class="trace-hit" x="${n(traceX)}" y="${n(y - 23)}" width="244" height="47" rx="2" fill="${color}" opacity="0"/>
      <circle class="focus-ring" cx="${n(x)}" cy="${n(y)}" r="18" fill="none" stroke="${COLOR.paper}" stroke-width="2" opacity="0"/>
      <path d="M${n(innerX)} ${n(innerY)}L${n(x)} ${n(y)}" stroke="${color}" stroke-width="2" ${finding.verdict === "not_observed" || finding.verdict === "excluded" ? 'stroke-dasharray="4 6"' : ""}/>
      <circle cx="${n(x)}" cy="${n(y)}" r="9" fill="${color}" stroke="${COLOR.carbon}" stroke-width="4"/>
      <text x="${n(labelX)}" y="${n(y - 3)}" text-anchor="${align}" class="verdict" fill="${color}">${escapeXml(finding.verdict.replaceAll("_", " ").toUpperCase())}</text>
      <text x="${n(labelX)}" y="${n(y + 13)}" text-anchor="${align}" class="finding-label">${escapeXml(truncate(finding.subject, nearLeft || nearRight ? 30 : 38))}</text>
    </g>`;
  }).join("");
  return `<g aria-label="Context Receipt x-ray slice visualization">
    <rect x="64" y="278" width="1072" height="276" rx="2" fill="${COLOR.carbonSoft}" stroke="${COLOR.rule}"/>
    <text x="84" y="301" class="micro">OBSERVATION BOUNDARY / X-RAY SLICE</text><text x="1116" y="301" text-anchor="end" class="micro">PREPARED IS NOT OBSERVED · ABSENCE REMAINS VISIBLE</text>
    <ellipse cx="${centerX}" cy="${centerY}" rx="255" ry="82" fill="#22251e" stroke="${COLOR.silver}" stroke-width="1"/>
    <ellipse cx="${centerX}" cy="${centerY}" rx="198" ry="62" fill="${COLOR.carbon}" stroke="${COLOR.cobalt}" stroke-width="3" opacity=".95"/>
    <ellipse cx="${centerX}" cy="${centerY}" rx="130" ry="40" fill="#171914" stroke="${COLOR.acid}" stroke-width="3"/>
    <path d="M350 ${centerY}H850" stroke="${COLOR.paper}" stroke-width="1" opacity=".25"/><path d="M${centerX} 334V494" stroke="${COLOR.paper}" stroke-width="1" opacity=".25"/>
    <text x="${centerX}" y="${centerY + 4}" text-anchor="middle" class="profile-tag">OBSERVED CORE</text>
    ${nodes}
  </g>`;
}

function renderSources(profile: WorkprintProfileIR, interactive: boolean): string {
  const slot = 1040 / profile.sources.length;
  return `<g transform="translate(80 578)" aria-label="Source evidence rail">
    <text y="0" class="micro">SOURCE EVIDENCE RAIL / CLICK A FINDING OR SOURCE IN HTML TO TRACE</text>
    <path d="M0 25H1040" stroke="${COLOR.silver}" stroke-width="2"/>
    ${profile.sources.map((source, index) => {
      const x = slot * (index + 0.5);
      const attributes = interactive
        ? `class="profile-source" data-source-id="${escapeXml(source.id)}" tabindex="0" role="button" aria-pressed="false" aria-label="Source ${escapeXml(source.label)}, revision ${escapeXml(source.revision)}"`
        : `class="profile-source"`;
      return `<g ${attributes} transform="translate(${n(x)} 25)"><circle class="source-hit" r="15" fill="${COLOR.acid}" opacity="0"/><circle r="6" fill="${COLOR.paper}" stroke="${COLOR.carbon}" stroke-width="3"/><text y="23" text-anchor="middle" class="source-label">${escapeXml(truncate(source.label, Math.max(12, Math.floor(slot / 7))))}</text><text y="36" text-anchor="middle" class="micro">${escapeXml(truncate(source.revision, Math.max(12, Math.floor(slot / 7))))}</text></g>`;
    }).join("")}
  </g>`;
}

function nodeAttributes(finding: ProfileFinding, interactive: boolean): string {
  const refs = escapeXml(finding.sourceRefs.join(" "));
  return interactive
    ? `class="profile-node" data-finding-id="${escapeXml(finding.id)}" data-source-refs="${refs}" tabindex="0" role="button" aria-pressed="false" aria-label="${escapeXml(finding.verdict)}: ${escapeXml(finding.subject)}"`
    : `class="profile-node" data-finding-id="${escapeXml(finding.id)}" data-source-refs="${refs}"`;
}

function sourceCaption(finding: ProfileFinding): string {
  return finding.sourceRefs.length ? `${finding.sourceRefs.length} SOURCE${finding.sourceRefs.length === 1 ? "" : "S"}` : "NO SOURCE REF";
}

function truncate(value: string, max: number): string {
  const chars = [...value];
  return chars.length <= max ? value : `${chars.slice(0, Math.max(1, max - 1)).join("")}…`;
}

function escapeXml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

function n(value: number): string {
  return Number(value.toFixed(2)).toString();
}
