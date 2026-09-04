import { canonicalJson } from "../../core/canonical.ts";
import type { ProfileFinding, ProfileSource, WorkprintProfileIR } from "../types.ts";
import { renderProfileSvg } from "./svg.ts";

export function renderProfileHtml(profile: WorkprintProfileIR): string {
  const embeddedJson = canonicalJson(profile).replaceAll("&", "\\u0026").replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");
  const title = escapeHtml(profile.title);
  const command = "codex-workprint profile build profile.json --out ./workprint";
  const shortId = profile.source.profileIrSha256.slice(0, 12).toUpperCase();
  const initial = primaryFinding(profile);

  return `<!doctype html>
<html lang="en" data-theme="carbon" data-profile="${profile.profile}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src data:; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="color-scheme" content="dark light">
  <title>${title} — Codex Workprint</title>
  <style>
    :root{--carbon:#11120f;--paper:#f1ecdf;--acid:#c7ff36;--cobalt:#2457ff;--coral:#ff665c;--silver:#aeb4ad;--amber:#ffb340;--ink:#24251f;--muted:#858b83;--rule:#35372f;color-scheme:dark}
    html[data-theme="carbon"]{--page:#090a08;--surface:#151612;--text:#f1ecdf;--surface-rule:#33352e;color-scheme:dark}html[data-theme="paper"]{--page:#e7e0d2;--surface:#f6f1e7;--text:#24251f;--surface-rule:#c9c3b7;color-scheme:light}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;overflow-x:hidden}body{background:var(--page);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.45}button{font:inherit}.topline{position:fixed;z-index:5;inset:0 0 auto;height:8px;background:linear-gradient(90deg,var(--cobalt) 0 64%,var(--acid) 64% 84%,var(--coral) 84%)}.page{width:min(1440px,100%);margin:auto;padding:18px clamp(12px,2.5vw,38px) 48px}.masthead{display:flex;justify-content:space-between;align-items:center;gap:18px;padding:16px 0 13px}.brand{font:800 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.16em;text-transform:uppercase}.actions{display:flex;gap:8px}.control{border:1px solid var(--surface-rule);background:var(--surface);color:var(--text);padding:8px 11px;border-radius:2px;cursor:pointer;font-size:11px;font-weight:800;letter-spacing:.04em}.control:hover,.control:focus-visible{border-color:var(--acid);outline:none}.artifact-shell{padding:7px;background:var(--paper);box-shadow:0 22px 75px #0007}.artifact-shell svg{display:block;width:100%;height:auto}.mobile-hero{display:none}.section-tag{margin:0 0 8px;color:var(--muted);font:800 10px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.15em;text-transform:uppercase}
    .trace-plane{display:grid;grid-template-columns:minmax(290px,.82fr) minmax(0,1.18fr);gap:0;margin-top:24px;border-top:1px solid var(--surface-rule);border-bottom:1px solid var(--surface-rule)}.trace-detail{padding:24px clamp(16px,2.2vw,30px);border-right:1px solid var(--surface-rule);min-height:286px}.trace-detail h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,3vw,39px);line-height:1.02;margin:0 0 12px}.trace-verdict{font:850 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.14em;text-transform:uppercase;color:var(--coral)}.trace-subject{font-size:14px;max-width:46rem}.trace-meta{display:flex;flex-wrap:wrap;gap:7px 14px;margin-top:20px;color:var(--muted);font-size:11px}.boundary{margin:22px 0 0;padding-top:14px;border-top:1px solid var(--surface-rule);color:var(--muted);font-size:11px}.ledger{min-width:0}.finding-row,.source-row{width:100%;display:grid;align-items:center;border:0;border-bottom:1px solid var(--surface-rule);background:transparent;color:var(--text);text-align:left;cursor:pointer}.finding-row{grid-template-columns:90px minmax(0,1fr) auto;gap:14px;padding:12px 16px}.finding-row:last-child{border-bottom:0}.finding-row:hover,.finding-row:focus-visible,.finding-row[aria-pressed="true"],.finding-row.is-traced{outline:none;background:color-mix(in srgb,var(--surface) 88%,var(--acid) 12%)}.finding-row[aria-pressed="true"]{box-shadow:inset 4px 0 var(--acid)}.verdict{font:850 9px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:var(--silver)}.finding-row[data-verdict="carried"] .verdict,.finding-row[data-verdict="unchanged"] .verdict,.finding-row[data-verdict="observed"] .verdict{color:var(--acid)}.finding-row[data-verdict="lost"] .verdict,.finding-row[data-verdict="changed"] .verdict,.finding-row[data-verdict="not_observed"] .verdict{color:var(--coral)}.finding-row[data-verdict="added"] .verdict,.finding-row[data-verdict="prepared"] .verdict{color:#6f8cff}.finding-row[data-verdict="stale"] .verdict,.finding-row[data-verdict="conflict"] .verdict{color:var(--amber)}.finding-copy{min-width:0;font-size:12px;overflow-wrap:anywhere}.finding-refs{font:9px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--muted);white-space:nowrap}.sources{margin-top:24px;border-top:4px solid var(--cobalt);background:var(--surface)}.source-head{padding:16px 18px 12px;display:flex;justify-content:space-between;gap:16px;border-bottom:1px solid var(--surface-rule)}.source-head h2{margin:0;font-family:Georgia,"Times New Roman",serif;font-size:25px}.source-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr))}.source-row{grid-template-columns:20px minmax(0,1fr);gap:11px;padding:14px 16px;border-right:1px solid var(--surface-rule)}.source-row:hover,.source-row:focus-visible,.source-row[aria-pressed="true"],.source-row.is-traced{outline:none;background:color-mix(in srgb,var(--surface) 86%,var(--cobalt) 14%)}.source-dot{width:10px;height:10px;border-radius:50%;background:var(--silver)}.source-row.is-traced .source-dot,.source-row[aria-pressed="true"] .source-dot{background:var(--acid);box-shadow:0 0 0 4px color-mix(in srgb,var(--acid) 24%,transparent)}.source-copy strong,.source-copy small{display:block}.source-copy strong{font-size:12px}.source-copy small{font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--muted);overflow-wrap:anywhere}.generate{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;margin-top:24px;padding:20px;border-top:4px solid var(--acid);background:var(--surface)}.generate h2{margin:0 0 4px;font-family:Georgia,"Times New Roman",serif;font-size:25px}.generate p{margin:0;color:var(--muted);font-size:12px}.command{grid-column:1/-1;background:var(--carbon);color:var(--paper);border:1px solid #3c3e36;padding:12px 14px;white-space:pre-wrap;overflow-wrap:anywhere;font:11px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.foot{display:flex;justify-content:space-between;gap:18px;margin-top:23px;color:var(--muted);font-size:10px}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    @media(max-width:760px){.page{padding-top:14px}.masthead{align-items:flex-start;flex-wrap:wrap}.brand{width:100%}.actions{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));width:100%}.artifact-shell{display:none}.mobile-hero{display:block;position:relative;background:var(--carbon);color:var(--paper);padding:20px 17px 18px;border-top:6px solid var(--cobalt);box-shadow:0 18px 55px #0006}.mobile-hero h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(27px,8vw,36px);line-height:1.02;margin:0 0 12px}.mobile-question{margin:0;color:var(--acid);font:850 11px/1.35 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.1em;text-transform:uppercase}.mobile-headline{font-family:Georgia,"Times New Roman",serif;font-size:20px;line-height:1.12;margin:16px 0}.mobile-signature{position:relative;height:62px;margin:12px 0 8px;border-top:1px solid #393b33;border-bottom:1px solid #393b33;overflow:hidden}.mobile-signature::before,.mobile-signature::after{content:"";position:absolute}[data-profile="continuity"] .mobile-signature::before{left:4%;right:4%;top:29px;border-top:3px dashed var(--silver)}[data-profile="continuity"] .mobile-signature::after{width:16px;height:40px;left:62%;top:10px;border-top:4px solid var(--coral);border-bottom:4px solid var(--coral);background:var(--carbon)}[data-profile="goal-delta"] .mobile-signature::before{left:49%;top:4px;width:6px;height:54px;background:var(--coral);transform:skew(-17deg)}[data-profile="goal-delta"] .mobile-signature::after{width:90px;height:42px;left:calc(50% - 45px);top:9px;border:1px solid var(--coral);border-radius:50%}[data-profile="context-receipt"] .mobile-signature::before{width:170px;height:42px;left:calc(50% - 85px);top:8px;border:3px solid var(--cobalt);border-radius:50%}[data-profile="context-receipt"] .mobile-signature::after{width:96px;height:24px;left:calc(50% - 48px);top:17px;border:3px solid var(--acid);border-radius:50%}.mobile-source-count{color:var(--muted);font-size:10px;letter-spacing:.08em;text-transform:uppercase}.trace-plane{grid-template-columns:1fr}.trace-detail{border-right:0;border-bottom:1px solid var(--surface-rule);min-height:0}.finding-row{grid-template-columns:84px minmax(0,1fr);gap:10px}.finding-refs{grid-column:2;white-space:normal}.source-list{grid-template-columns:1fr}.source-row{border-right:0}.generate{grid-template-columns:1fr}.foot{flex-direction:column}.foot span:last-child{text-align:left}}
    @media(max-width:420px){.finding-row{padding:11px 10px;grid-template-columns:76px minmax(0,1fr)}.trace-detail{padding:18px 14px}.source-head{padding-inline:14px}}
  </style>
</head>
<body>
  <div class="topline" aria-hidden="true"></div>
  <main class="page">
    <header class="masthead"><div class="brand">Codex Workprint / ${escapeHtml(profile.profile)} profile / ${escapeHtml(profile.visualForm)}</div><div class="actions"><button id="theme" class="control" type="button">Paper mode</button><button id="copy" class="control" type="button" title="Shift+click selects the command as a clipboard fallback">Copy command</button></div></header>
    <section class="mobile-hero" aria-label="Profile summary"><p class="section-tag">Three questions. One Workprint.</p><h1>${title}</h1><p class="mobile-question">${escapeHtml(profile.question)}</p><p class="mobile-headline">${escapeHtml(profile.summary.headline)}</p><div class="mobile-signature" aria-hidden="true"></div><div class="mobile-source-count">${profile.findings.length} findings · ${profile.sources.length} sources · ${escapeHtml(profile.visualForm)} signature</div></section>
    <section class="artifact-shell" aria-label="Profile Workprint visualization">${renderProfileSvg(profile, true)}</section>
    <section class="trace-plane" aria-label="Interactive finding trace">
      <div class="trace-detail" aria-live="polite"><p class="section-tag">Selected finding / source trace</p><div id="detailVerdict" class="trace-verdict">${escapeHtml(initial.verdict)}</div><h2 id="detailTitle">${escapeHtml(initial.id)}</h2><p id="detailSubject" class="trace-subject">${escapeHtml(initial.subject)}</p><div class="trace-meta"><span id="detailKind">Kind ${escapeHtml(initial.kind)}</span><span id="detailSources">Sources ${escapeHtml(initial.sourceRefs.join(", ") || "none supplied")}</span><span id="detailExtra">${escapeHtml(extraDetail(initial))}</span></div><p class="boundary">This view traces the supplied public finding to supplied source labels and revisions. It does not establish source authenticity, correctness, model influence, or causality.</p></div>
      <div class="ledger" id="findingLedger">${profile.findings.map(renderFindingRow).join("")}</div>
    </section>
    <section class="sources" aria-label="Source evidence rail"><div class="source-head"><div><p class="section-tag">Evidence rail</p><h2>Sources stay attached.</h2></div><span class="section-tag">revision-bound public labels</span></div><div class="source-list">${profile.sources.map(renderSourceRow).join("")}</div></section>
    <section class="generate"><div><p class="section-tag">Compile a public profile</p><h2>The work has a state.</h2><p>Inspect the public projection, then build a deterministic seven-file profile bundle locally.</p></div><button id="copyBottom" class="control" type="button">Copy</button><code id="command" class="command">${command}</code></section>
    <footer class="foot"><span>Made with Codex Workprint · supplied public projection, not attestation</span><span>Profile IR ${shortId} · source revision ${escapeHtml(profile.sourceRevision)}</span></footer>
  </main>
  <script id="profile-data" type="application/json">${embeddedJson}</script>
  <script>
    (() => {
      const data = JSON.parse(document.getElementById('profile-data').textContent);
      const findings = new Map(data.findings.map((finding) => [finding.id, finding]));
      const sources = new Map(data.sources.map((source) => [source.id, source]));
      const detail = { verdict: document.getElementById('detailVerdict'), title: document.getElementById('detailTitle'), subject: document.getElementById('detailSubject'), kind: document.getElementById('detailKind'), sources: document.getElementById('detailSources'), extra: document.getElementById('detailExtra') };
      const extra = (finding) => finding.affectedEvidenceIds ? 'Affected evidence ' + (finding.affectedEvidenceIds.join(', ') || 'none supplied') : finding.reasonCode ? 'Reason ' + finding.reasonCode : 'No profile-specific extension';
      const clearTrace = () => document.querySelectorAll('.is-traced,[aria-pressed="true"]').forEach((element) => { element.classList.remove('is-traced'); element.setAttribute('aria-pressed', 'false'); });
      const selectFinding = (id) => {
        const finding = findings.get(id); if (!finding) return; clearTrace();
        document.querySelectorAll('[data-finding-id="' + CSS.escape(id) + '"]').forEach((element) => { element.classList.add('is-traced'); element.setAttribute('aria-pressed', 'true'); });
        finding.sourceRefs.forEach((sourceId) => document.querySelectorAll('[data-source-id="' + CSS.escape(sourceId) + '"]').forEach((element) => element.classList.add('is-traced')));
        detail.verdict.textContent = finding.verdict.replaceAll('_', ' '); detail.title.textContent = finding.id; detail.subject.textContent = finding.subject; detail.kind.textContent = 'Kind ' + finding.kind; detail.sources.textContent = 'Sources ' + (finding.sourceRefs.join(', ') || 'none supplied'); detail.extra.textContent = extra(finding);
        document.body.dataset.traceType = 'finding'; document.body.dataset.traceId = finding.id; document.body.dataset.traceSourceCount = String(finding.sourceRefs.length);
      };
      const selectSource = (id) => {
        const source = sources.get(id); if (!source) return; clearTrace();
        document.querySelectorAll('[data-source-id="' + CSS.escape(id) + '"]').forEach((element) => { element.classList.add('is-traced'); element.setAttribute('aria-pressed', 'true'); });
        const linked = data.findings.filter((finding) => finding.sourceRefs.includes(id)); linked.forEach((finding) => document.querySelectorAll('[data-finding-id="' + CSS.escape(finding.id) + '"]').forEach((element) => element.classList.add('is-traced')));
        detail.verdict.textContent = 'source revision'; detail.title.textContent = source.label; detail.subject.textContent = 'Revision ' + source.revision; detail.kind.textContent = 'Source ' + source.id; detail.sources.textContent = linked.length + ' linked finding' + (linked.length === 1 ? '' : 's'); detail.extra.textContent = 'No source content is embedded';
        document.body.dataset.traceType = 'source'; document.body.dataset.traceId = source.id; document.body.dataset.traceFindingCount = String(linked.length);
      };
      const bind = (selector, callback, key) => document.querySelectorAll(selector).forEach((element) => { element.addEventListener('click', () => callback(element.dataset[key])); element.addEventListener('keydown', (event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); callback(element.dataset[key]); } }); });
      bind('[data-finding-id]', selectFinding, 'findingId'); bind('[data-source-id]', selectSource, 'sourceId'); selectFinding(${JSON.stringify(initial.id)});
      const theme = document.getElementById('theme'); theme.addEventListener('click', () => { const paper = document.documentElement.dataset.theme === 'paper'; document.documentElement.dataset.theme = paper ? 'carbon' : 'paper'; theme.textContent = paper ? 'Paper mode' : 'Carbon mode'; });
      const command = document.getElementById('command').textContent; const copy = async (button, fallback = false) => { const original = button.textContent; try { if (fallback) throw new Error('fallback'); await navigator.clipboard.writeText(command); button.dataset.copyResult = 'clipboard'; button.textContent = 'Copied'; } catch { const range = document.createRange(); range.selectNodeContents(document.getElementById('command')); const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range); button.dataset.copyResult = 'fallback-selection'; button.textContent = 'Selected'; } window.setTimeout(() => { button.textContent = original; }, 1200); };
      document.getElementById('copy').addEventListener('click', (event) => copy(event.currentTarget, event.shiftKey)); document.getElementById('copyBottom').addEventListener('click', (event) => copy(event.currentTarget, event.shiftKey));
    })();
  </script>
</body>
</html>\n`;
}

function renderFindingRow(finding: ProfileFinding): string {
  return `<button class="finding-row" type="button" data-finding-id="${escapeHtml(finding.id)}" data-verdict="${escapeHtml(finding.verdict)}" aria-pressed="false"><span class="verdict">${escapeHtml(finding.verdict.replaceAll("_", " "))}</span><span class="finding-copy">${escapeHtml(finding.subject)}</span><span class="finding-refs">${escapeHtml(finding.sourceRefs.length ? `${finding.sourceRefs.length} source${finding.sourceRefs.length === 1 ? "" : "s"}` : "no source ref")}</span></button>`;
}

function renderSourceRow(source: ProfileSource): string {
  return `<button class="source-row" type="button" data-source-id="${escapeHtml(source.id)}" aria-pressed="false"><span class="source-dot" aria-hidden="true"></span><span class="source-copy"><strong>${escapeHtml(source.label)}</strong><small>${escapeHtml(source.id)} · ${escapeHtml(source.revision)}</small></span></button>`;
}

function primaryFinding(profile: WorkprintProfileIR): ProfileFinding {
  const priority = profile.profile === "continuity"
    ? ["lost", "invented", "stale", "carried"]
    : profile.profile === "goal-delta"
      ? ["changed", "removed", "added", "unchanged"]
      : ["conflict", "stale", "not_observed", "excluded", "prepared", "observed"];
  return priority.flatMap((verdict) => profile.findings.filter((finding) => finding.verdict === verdict))[0] ?? profile.findings[0];
}

function extraDetail(finding: ProfileFinding): string {
  if (finding.affectedEvidenceIds) return `Affected evidence ${finding.affectedEvidenceIds.join(", ") || "none supplied"}`;
  if (finding.reasonCode) return `Reason ${finding.reasonCode}`;
  return "No profile-specific extension";
}

function escapeHtml(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}
