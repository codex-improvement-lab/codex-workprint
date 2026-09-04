import type { WorkprintIR } from "../core/types.ts";
import { canonicalJson } from "../core/canonical.ts";
import { createRunReceiptStory } from "../core/story.ts";
import { deriveRunSheetStructure } from "./run-sheet.ts";
import { renderWorkprintSvg } from "./svg.ts";

export function renderWorkprintHtml(workprint: WorkprintIR): string {
  const embeddedJson = canonicalJson(workprint)
    .replaceAll("&", "\\u0026")
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e");
  const title = escapeHtml(workprint.run.publicTitle);
  const story = createRunReceiptStory(workprint);
  const command = 'codex exec --json "<your task>" | codex-workprint build - --title "<public title>" --out ./workprint --open';
  const verifyCommand = "codex-workprint verify ./workprint";
  const shapeId = workprint.source.shapeSha256.slice(0, 12).toUpperCase();
  const structure = deriveRunSheetStructure(workprint);
  const identity = workprint.run.publicIdentity;
  const language = identity?.language ?? "en";
  const publicUrl = identity?.publicUrl;
  const socialImage = publicUrl ? new URL("share-card.png", publicUrl).href : null;
  const identityLine = [identity?.project, identity?.release, identity?.by].filter(Boolean).join(" · ");
  const socialMeta = publicUrl ? `
  <link rel="canonical" href="${escapeHtml(publicUrl)}">
  <meta property="og:url" content="${escapeHtml(publicUrl)}">
  <meta property="og:image" content="${escapeHtml(socialImage as string)}">
  <meta name="twitter:image" content="${escapeHtml(socialImage as string)}">` : "";

  return `<!doctype html>
<html lang="${escapeHtml(language)}" data-theme="carbon">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; img-src 'self' data:; font-src 'none'; connect-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
  <meta name="color-scheme" content="dark light">
  <meta name="description" content="${escapeHtml(story.headline)}. ${story.excludedCategoryCount} private categories excluded. Receipt, not attestation.">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title} — Workprint Run Receipt">
  <meta property="og:description" content="${escapeHtml(story.headline)}. No prompts, no code, no uploads.">
  <meta name="twitter:card" content="summary_large_image">${socialMeta}
  <title>${title} — Codex Workprint</title>
  <style>
    :root{--carbon:#11120f;--paper:#f1ecdf;--acid:#c7ff36;--cobalt:#2457ff;--coral:#ff665c;--silver:#aeb4ad;--ink:#24251f;--rule:#35372f;--panel:#171814;--muted:#858b83;color-scheme:dark}
    html[data-theme="paper"]{--page:#e9e2d4;--text:#24251f;--surface:#f6f1e7;--surface-rule:#c9c3b7;color-scheme:light}
    html[data-theme="carbon"]{--page:#0b0c0a;--text:#f1ecdf;--surface:#151612;--surface-rule:#33352e;color-scheme:dark}
    *{box-sizing:border-box}html,body{margin:0;min-height:100%;overflow-x:hidden}body{background:var(--page);color:var(--text);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;line-height:1.5}
    button{font:inherit}.page{width:min(1680px,100%);margin:0 auto;padding:18px clamp(12px,2.4vw,40px) 48px}.topline{height:8px;background:linear-gradient(90deg,var(--cobalt) 0 67%,var(--acid) 67% 83%,var(--coral) 83%);position:fixed;inset:0 0 auto;z-index:4}.masthead{display:flex;justify-content:space-between;align-items:center;gap:20px;padding:20px 0 14px}.brand{font-family:"Arial Narrow",ui-sans-serif,sans-serif;font-weight:800;font-size:12px;letter-spacing:.16em;text-transform:uppercase}.mast-trust{font-size:11px;color:var(--muted);letter-spacing:.08em;text-transform:uppercase}.actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.control{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--surface-rule);background:var(--surface);color:var(--text);padding:8px 11px;border-radius:2px;cursor:pointer;font-size:12px;font-weight:750;letter-spacing:.05em;white-space:nowrap;text-decoration:none}.control:hover,.control:focus-visible{border-color:var(--acid);outline:none}.control.primary{background:var(--acid);border-color:var(--acid);color:var(--carbon)}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}
    .receipt-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(250px,.65fr);gap:clamp(18px,4vw,64px);padding:clamp(20px,3.5vw,50px);margin-bottom:18px;background:var(--surface);border:1px solid var(--surface-rule);border-left:8px solid var(--acid);position:relative;overflow:hidden}.receipt-hero::after{content:"";position:absolute;right:-80px;bottom:-110px;width:360px;height:220px;border:24px solid var(--cobalt);border-radius:50%;opacity:.13;transform:rotate(-11deg)}.receipt-copy{position:relative;z-index:1}.receipt-kicker{margin:0 0 14px;color:var(--cobalt);font:900 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.18em;text-transform:uppercase}.receipt-hero h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(34px,5.2vw,76px);line-height:.96;letter-spacing:-.035em;margin:0;max-width:18ch;overflow-wrap:anywhere}.receipt-headline{font-family:"Arial Narrow",ui-sans-serif,sans-serif;font-size:clamp(20px,2.6vw,39px);line-height:1.02;font-weight:900;text-transform:uppercase;margin:24px 0 8px;color:var(--coral)}.receipt-detail{margin:0;color:var(--muted);font-size:13px}.receipt-side{position:relative;z-index:1;display:flex;flex-direction:column;justify-content:space-between;gap:18px}.privacy-mark{border:1px solid var(--surface-rule);padding:18px;background:color-mix(in srgb,var(--surface) 80%,var(--acid) 4%)}.privacy-mark strong{display:block;color:var(--acid);font:900 clamp(32px,5vw,58px)/.9 "Arial Narrow",ui-sans-serif,sans-serif}.privacy-mark span{display:block;margin-top:10px;font-size:11px;letter-spacing:.11em;text-transform:uppercase}.identity-line{min-height:1.5em;color:var(--muted);font-size:12px;overflow-wrap:anywhere}.shape-name{font:900 13px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--cobalt);letter-spacing:.08em}.hero-actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.hero-secondary{display:flex;gap:8px;flex-wrap:wrap}.hero-status{font-size:11px;color:var(--muted);min-height:1.5em}.caption-box{display:none}.copy-fallback[hidden]{display:none!important}.copy-fallback{position:fixed;z-index:20;inset:0;display:grid;place-items:center;padding:18px;background:#000b}.copy-fallback-panel{width:min(620px,100%);background:var(--surface);border:2px solid var(--acid);padding:20px;box-shadow:0 26px 100px #000}.copy-fallback-panel h2{margin:0 0 6px;font-family:Georgia,"Times New Roman",serif;font-size:26px}.copy-fallback-panel p{margin:0 0 12px;color:var(--muted);font-size:13px}.copy-fallback-panel textarea{display:block;width:100%;min-height:132px;resize:vertical;background:var(--carbon);color:var(--paper);border:1px solid var(--surface-rule);padding:12px;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace}.copy-fallback-actions{display:flex;justify-content:flex-end;margin-top:12px}
    .mobile-lead,.mobile-run-sheet{display:none}.artifact-shell{background:var(--paper);padding:clamp(4px,.7vw,10px);box-shadow:0 24px 90px #0007}.artifact-shell svg{display:block;width:100%;height:auto}
    .storyline{display:grid;grid-template-columns:minmax(200px,.62fr) minmax(0,1.38fr);gap:18px;align-items:stretch;margin-top:18px;border-top:1px solid var(--surface-rule);border-bottom:1px solid var(--surface-rule);padding:14px 0}.story-intro{display:flex;flex-direction:column;justify-content:space-between}.story-intro strong{font-family:Georgia,"Times New Roman",serif;font-size:clamp(22px,2.4vw,34px);line-height:1}.story-intro span{color:var(--muted);font-size:11px;letter-spacing:.08em;text-transform:uppercase}.moment-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.moment{min-height:94px;border:1px solid var(--surface-rule);padding:12px 13px;background:var(--surface)}.moment b{display:block;color:var(--coral);font:800 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.12em}.moment strong{display:block;font-size:13px;margin-top:8px}.moment p{font-size:11px;color:var(--muted);margin:5px 0 0}.moment.empty b{color:var(--silver)}
    .below{display:grid;grid-template-columns:minmax(260px,.72fr) minmax(0,1.28fr);gap:clamp(14px,2.5vw,32px);margin-top:28px}.section-tag{font-family:"Arial Narrow",ui-sans-serif,sans-serif;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--muted);margin:0 0 10px}.detail,.observations,.generate{background:var(--surface);border-top:4px solid var(--surface-rule);padding:clamp(16px,2vw,24px)}.detail{border-color:var(--acid);min-height:238px}.detail h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,3vw,38px);line-height:1.02;margin:0 0 18px}.detail-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.datum span{display:block}.datum .key{font-size:10px;font-weight:800;letter-spacing:.12em;color:var(--muted);text-transform:uppercase}.datum .value{margin-top:3px;font-size:14px;overflow-wrap:anywhere}.boundary{margin:20px 0 0;padding-top:14px;border-top:1px solid var(--surface-rule);font-size:12px;color:var(--muted)}
    .observation-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:7px;max-height:330px;overflow-y:auto;padding-right:4px}.observation{min-width:0;border:1px solid var(--surface-rule);border-left:4px solid var(--silver);background:transparent;color:var(--text);padding:10px;text-align:left;cursor:pointer}.observation[data-status="in_progress"]{border-left-color:var(--cobalt)}.observation[data-status="completed"]{border-left-color:var(--acid)}.observation[data-status="failed"]{border-left-color:var(--coral)}.observation:hover,.observation:focus-visible,.observation[aria-pressed="true"]{background:color-mix(in srgb,var(--surface) 70%,var(--acid) 9%);outline:none;border-color:var(--acid)}.obs-seq{font-size:10px;color:var(--muted);font-weight:800}.obs-type{display:block;margin-top:4px;font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.obs-status{display:block;font-size:10px;margin-top:4px;text-transform:uppercase;color:var(--muted)}
    .privacy-receipt{grid-column:1/-1;background:var(--surface);border-top:4px solid var(--acid);padding:clamp(18px,2.5vw,30px)}.privacy-receipt h2{font-family:Georgia,"Times New Roman",serif;font-size:clamp(28px,3vw,42px);margin:0 0 6px}.privacy-lead{margin:0 0 20px;color:var(--muted)}.privacy-columns{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.privacy-column{border:1px solid var(--surface-rule);padding:16px}.privacy-column h3{margin:0 0 12px;font:900 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.15em;text-transform:uppercase}.privacy-column.excluded h3{color:var(--acid)}.privacy-column.public h3{color:var(--cobalt)}.privacy-column ul{margin:0;padding:0;list-style:none;display:grid;gap:7px}.privacy-column li{font-size:12px;color:var(--muted)}.privacy-column li::before{content:"✓";margin-right:8px;color:var(--acid)}.privacy-column.public li::before{color:var(--cobalt)}
    .generate{grid-column:1/-1;border-color:var(--cobalt);display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center}.generate h2{margin:0 0 5px;font-family:Georgia,"Times New Roman",serif;font-size:26px}.generate p{margin:0;color:var(--muted);font-size:13px}.command{grid-column:1/-1;background:var(--carbon);color:var(--paper);border:1px solid #3c3e36;padding:13px 15px;white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.5 ui-monospace,SFMono-Regular,Consolas,monospace;user-select:all}.copy-state{min-width:5em;text-align:center}
    .foot{display:flex;justify-content:space-between;gap:20px;margin-top:26px;color:var(--muted);font-size:11px;letter-spacing:.04em}.foot span:last-child{text-align:right}.station{cursor:pointer}.mobile-shape{font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--muted);letter-spacing:.08em}
    @media(max-width:760px){.page{padding-top:14px}.masthead{align-items:flex-start}.brand{max-width:55%}.mobile-lead{display:block;border-left:5px solid var(--acid);padding:4px 0 12px 14px;margin:2px 0 14px}.mobile-lead .section-tag{margin-bottom:5px}.mobile-lead h1{font-family:Georgia,"Times New Roman",serif;font-size:clamp(25px,8vw,34px);line-height:1.02;margin:0 0 10px}.mobile-metrics{display:flex;flex-wrap:wrap;gap:6px 14px;font-family:"Arial Narrow",ui-sans-serif,sans-serif;font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.mobile-metrics .started{color:#6f8cff}.mobile-metrics .completed{color:var(--acid)}.mobile-metrics .failed{color:var(--coral)}.mobile-metrics .unknown{color:var(--silver)}.mobile-relation{margin:9px 0 0;font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.mobile-command{display:block;margin-top:8px;color:var(--text);font:10px/1.4 ui-monospace,SFMono-Regular,Consolas,monospace;overflow-wrap:anywhere}.artifact-shell,.storyline{display:none}.mobile-run-sheet{display:block;position:relative;background:var(--carbon);color:var(--paper);border-top:6px solid var(--cobalt);padding:19px 14px 18px;margin:0 -4px 20px;box-shadow:0 18px 55px #0006}.mobile-run-sheet::before{content:"";position:absolute;left:37px;top:70px;bottom:34px;width:3px;background:linear-gradient(var(--cobalt),var(--acid) 72%,var(--coral))}.mobile-sheet-head{display:flex;justify-content:space-between;gap:12px;align-items:end;padding-bottom:16px;border-bottom:1px solid #373930}.mobile-sheet-head b{font:800 11px/1.2 "Arial Narrow",ui-sans-serif,sans-serif;letter-spacing:.14em}.mobile-sheet-head span{font:10px/1.2 ui-monospace,SFMono-Regular,Consolas,monospace;color:var(--silver)}.mobile-route{position:relative;display:grid;gap:7px;padding-top:14px}.mobile-observation{position:relative;display:grid;grid-template-columns:35px minmax(0,1fr) auto;align-items:center;gap:10px;width:100%;min-height:48px;padding:7px 9px 7px 0;border:1px solid transparent;background:transparent;color:var(--paper);text-align:left;cursor:pointer}.mobile-observation:hover,.mobile-observation:focus-visible,.mobile-observation[aria-pressed="true"]{outline:none;border-color:#55584f;background:#ffffff0a}.mobile-node{position:relative;z-index:1;display:grid;place-items:center;width:27px;height:27px;margin-left:10px;border:4px solid var(--carbon);border-radius:50%;background:var(--silver);color:var(--carbon);font-size:9px;font-weight:900}.mobile-observation[data-status="in_progress"] .mobile-node{background:var(--cobalt);color:var(--paper)}.mobile-observation[data-status="completed"] .mobile-node{background:var(--acid)}.mobile-observation[data-status="failed"] .mobile-node{background:var(--coral)}.mobile-observation.is-replay-current .mobile-node{box-shadow:0 0 0 4px #f1ecdf66}.mobile-obs-copy strong,.mobile-obs-copy small{display:block}.mobile-obs-copy strong{font-size:12px;overflow-wrap:anywhere}.mobile-obs-copy small{font-size:9px;color:var(--silver);letter-spacing:.08em;text-transform:uppercase}.mobile-observation em{font:800 9px/1 "Arial Narrow",ui-sans-serif,sans-serif;color:var(--silver);letter-spacing:.08em;text-transform:uppercase}.mobile-observation[data-status="failed"] em{color:var(--coral)}.mobile-observation[data-status="completed"] em{color:var(--acid)}.mobile-run-sheet.replay-running .mobile-observation{opacity:.16}.mobile-run-sheet.replay-running .mobile-observation.is-revealed{opacity:1}.below{grid-template-columns:1fr}.detail-grid{grid-template-columns:1fr 1fr}.generate{grid-template-columns:1fr}.foot{flex-direction:column}.foot span:last-child{text-align:left}.observation-list{display:none}}
    @media(max-width:760px){.receipt-hero{grid-template-columns:1fr;padding:22px 18px;border-left-width:6px}.receipt-hero h1{font-size:clamp(34px,11vw,52px)}.receipt-headline{font-size:clamp(20px,7vw,30px);margin-top:18px}.receipt-side{gap:12px}.privacy-mark{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:14px;padding:13px}.privacy-mark span{margin-top:0}.hero-actions{grid-template-columns:1fr}.privacy-columns{grid-template-columns:1fr}.mast-trust{display:none}}
    @media(max-width:560px){.masthead{flex-wrap:wrap;gap:10px}.brand{max-width:none;width:100%}.actions{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));width:100%}.control{padding:8px 6px;font-size:11px}}
    @media(max-width:410px){.detail-grid{grid-template-columns:1fr}.observation-list{grid-template-columns:1fr}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;animation-iteration-count:1!important}}
    .hero-actions .control{min-width:0;white-space:normal;overflow-wrap:anywhere;text-align:center;line-height:1.3}
  </style>
</head>
<body>
  <div class="topline" aria-hidden="true"></div>
  <main class="page">
    <header class="masthead">
      <div class="brand">Codex Workprint / Run Receipt</div>
      <div class="mast-trust">Generated locally · no prompts · no code · no uploads</div>
      <span id="replayStatus" class="sr-only" aria-live="polite"></span>
    </header>
    <section class="receipt-hero" aria-labelledby="receiptTitle">
      <div class="receipt-copy">
        <p class="receipt-kicker">Every agent run leaves a Workprint</p>
        <h1 id="receiptTitle">${title}</h1>
        <p class="receipt-headline">${escapeHtml(story.headline)}</p>
        <p class="receipt-detail">${escapeHtml(story.detail)}</p>
      </div>
      <div class="receipt-side">
        <div class="privacy-mark"><strong>${story.excludedCategoryCount}</strong><span>private categories excluded by default</span></div>
        <div class="identity-line">${identityLine ? escapeHtml(identityLine) : "No public identity supplied"}${publicUrl ? ` · <a href="${escapeHtml(publicUrl)}">public story</a>` : ""}</div>
        <div class="shape-name">${escapeHtml(story.shapeName)}</div>
        <div class="hero-actions"><button id="shareTop" class="control primary" type="button">Share</button><a id="downloadCard" class="control" href="share-card.png" download>Download card</a><button id="verifyTop" class="control" type="button">Copy verify command</button></div>
        <div class="hero-secondary"><button id="copyCaption" class="control" type="button">Copy caption</button><button id="replay" class="control" type="button" aria-controls="workprintCanvas" aria-describedby="replayStatus">Replay story</button><button id="theme" class="control" type="button">Paper mode</button></div>
        <div class="hero-status" id="heroStatus" aria-live="polite">Receipt, not attestation.</div>
      </div>
      <code class="caption-box" id="caption">${escapeHtml(story.caption)}</code>
      <code class="caption-box" id="nativeShareText">${escapeHtml(story.shareText)}</code>
      <code class="caption-box" id="verifyCommand">${escapeHtml(verifyCommand)}</code>
    </section>
    <div class="copy-fallback" id="copyFallback" role="dialog" aria-modal="true" aria-labelledby="copyFallbackTitle" hidden>
      <div class="copy-fallback-panel">
        <h2 id="copyFallbackTitle">Copy locally</h2>
        <p>Text is selected. Press Ctrl/Cmd+C to copy. On mobile, long-press the text area and choose Copy.</p>
        <textarea id="copyFallbackText" readonly aria-label="Text selected for local copy"></textarea>
        <div class="copy-fallback-actions"><button id="copyFallbackClose" class="control" type="button">Close</button></div>
      </div>
    </div>
    <section class="artifact-shell" id="workprintCanvas" aria-label="Workprint visualization">${renderWorkprintSvg(workprint, true)}</section>
    <section class="mobile-run-sheet" id="mobileRunSheet" aria-label="Mobile Workprint sequence">
      <div class="mobile-sheet-head"><b>RUN SHEET / ORDERED OBSERVATIONS</b><span>${workprint.observations.length} STOPS · ${structure.itemThreads.length} ITEM THREADS</span></div>
      <div class="mobile-route">${workprint.observations.map(renderMobileObservation).join("")}</div>
    </section>
    <section class="storyline" aria-label="Run Sheet turning points">
      <div class="story-intro"><strong>The run is more than one curve.</strong><span>${structure.turnRanges.length} turn range${structure.turnRanges.length === 1 ? "" : "s"} · ${structure.pairedItemCount} paired item${structure.pairedItemCount === 1 ? "" : "s"} · ${structure.openItemCount} open</span></div>
      <div class="moment-strip">${renderMomentCards(structure.moments)}</div>
    </section>
    <div class="below">
      <section class="detail" aria-live="polite">
        <p class="section-tag">Selected observation</p>
        <h2 id="detailTitle">Choose a station</h2>
        <div class="detail-grid">
          <div class="datum"><span class="key">Event</span><span class="value" id="detailEvent">not selected</span></div>
          <div class="datum"><span class="key">Item</span><span class="value" id="detailItem">not selected</span></div>
          <div class="datum"><span class="key">Explicit status</span><span class="value" id="detailStatus">not selected</span></div>
          <div class="datum"><span class="key">Exit code</span><span class="value" id="detailExit">not selected</span></div>
          <div class="datum"><span class="key">Public phase</span><span class="value" id="detailPhase">not annotated</span></div>
          <div class="datum"><span class="key">Observed relation</span><span class="value" id="detailRelation">not selected</span></div>
        </div>
        <p class="boundary">Only whitelisted metadata is shown. A completion event is not proof of correctness; a post-failure completion is not a recovery claim.</p>
      </section>
      <section class="observations">
        <p class="section-tag">Ordered public observations</p>
        <div class="observation-list" id="observationList">${workprint.observations.map(renderObservationButton).join("")}</div>
      </section>
      <section class="privacy-receipt" id="privacyReceipt">
        <p class="section-tag">Privacy receipt</p>
        <h2>Share the work trace. Keep the work private.</h2>
        <p class="privacy-lead">This page publishes a fixed observation projection. It does not publish the transcript and does not attest that the task was correct.</p>
        <div class="privacy-columns">
          <div class="privacy-column excluded"><h3>Excluded by default</h3><ul>${workprint.privacy.excludedCategories.map((entry) => `<li>${escapeHtml(entry)}</li>`).join("")}</ul></div>
          <div class="privacy-column public"><h3>Public in this receipt</h3><ul><li>event categories and source order</li><li>pseudonymized item associations</li><li>explicit status and integer exit category</li><li>user-approved title, labels, annotations, and optional identity</li><li>fixed-template story and shape identity</li></ul></div>
        </div>
      </section>
      <section class="generate">
        <div><p class="section-tag">Build yours</p><h2>One command. Seven verifiable files.</h2><p>Pipe one Codex JSONL run directly into Workprint. No account, upload, or telemetry.</p></div>
        <button id="copyBottom" class="control copy-state" type="button" title="Shift+click opens the visible local copy fallback">Copy</button>
        <code class="command" id="command">${escapeHtml(command)}</code>
      </section>
    </div>
    <footer class="foot"><span>Made with Codex Workprint · public projection, not attestation</span><span>Shape ${shapeId} · IR ${workprint.source.publicIrSha256.slice(0, 12).toUpperCase()} · timing not observed</span></footer>
  </main>
  <script id="workprint-data" type="application/json">${embeddedJson}</script>
  <script>
    (() => {
      const data = JSON.parse(document.getElementById('workprint-data').textContent);
      const bySequence = new Map(data.observations.map((observation) => [String(observation.sequence), observation]));
      const fields = {
        title: document.getElementById('detailTitle'),
        event: document.getElementById('detailEvent'),
        item: document.getElementById('detailItem'),
        status: document.getElementById('detailStatus'),
        exit: document.getElementById('detailExit'),
        phase: document.getElementById('detailPhase'),
        relation: document.getElementById('detailRelation')
      };
      const selectObservation = (sequence) => {
        const observation = bySequence.get(String(sequence));
        if (!observation) return;
        fields.title.textContent = 'Observation ' + observation.sequence;
        fields.event.textContent = observation.eventType;
        fields.item.textContent = observation.itemType || 'not observed';
        fields.status.textContent = observation.status;
        fields.exit.textContent = observation.exitCode === null ? 'not observed' : String(observation.exitCode);
        fields.phase.textContent = observation.publicPhase ? observation.publicPhase + (observation.publicLabel ? ' · ' + observation.publicLabel : '') : 'not annotated';
        fields.relation.textContent = observation.afterObservedFailure ? 'completion observed after a failed item' : 'none encoded';
        document.querySelectorAll('[data-sequence]').forEach((element) => element.setAttribute('aria-pressed', String(element.dataset.sequence === String(sequence))));
      };
      document.querySelectorAll('[data-sequence]').forEach((element) => {
        element.addEventListener('click', () => selectObservation(element.dataset.sequence));
        element.addEventListener('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); selectObservation(element.dataset.sequence); }
        });
      });
      const initialObservation = data.observations.find((observation) => observation.status === 'failed' || (Number.isInteger(observation.exitCode) && observation.exitCode !== 0))
        || data.observations.find((observation) => observation.eventType === 'item.completed')
        || data.observations[0];
      if (initialObservation) selectObservation(initialObservation.sequence);
      const replay = document.getElementById('replay');
      const replayStatus = document.getElementById('replayStatus');
      const workline = document.querySelector('.workprint-artifact');
      const mobileRunSheet = document.getElementById('mobileRunSheet');
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
      let replayGeneration = 0;
      const replayTargets = () => Array.from(document.querySelectorAll('[data-step]'));
      const resetReplay = () => {
        replayTargets().forEach((element) => element.classList.remove('is-revealed', 'is-replay-current'));
        workline?.classList.add('replay-running');
        mobileRunSheet?.classList.add('replay-running');
      };
      const revealStep = (sequence) => {
        replayTargets().forEach((element) => {
          const step = Number(element.dataset.step);
          element.classList.toggle('is-revealed', step <= sequence);
          element.classList.toggle('is-replay-current', step === sequence && element.hasAttribute('data-sequence'));
        });
        selectObservation(sequence);
        replay.dataset.replayStep = String(sequence);
      };
      replay.addEventListener('click', () => {
        const generation = ++replayGeneration;
        const reduced = reducedMotion.matches;
        resetReplay();
        replay.dataset.replayResult = reduced ? 'reduced-motion' : 'station-by-station';
        replay.dataset.replayCompleted = 'false';
        if (reduced) {
          replayTargets().forEach((element) => element.classList.add('is-revealed'));
          workline?.classList.remove('replay-running');
          mobileRunSheet?.classList.remove('replay-running');
          replay.dataset.replayCompleted = 'true';
          replay.textContent = 'Motion reduced';
          replayStatus.textContent = 'All stations are shown without animation because reduced motion is preferred.';
          window.setTimeout(() => { if (generation === replayGeneration) replay.textContent = 'Replay story'; }, 1200);
          return;
        }
        replay.textContent = 'Replaying 0/' + data.observations.length;
        replayStatus.textContent = 'Station-by-station replay started.';
        const delay = Math.max(95, Math.min(230, Math.floor(2100 / Math.max(1, data.observations.length))));
        data.observations.forEach((observation, index) => {
          window.setTimeout(() => {
            if (generation !== replayGeneration) return;
            revealStep(observation.sequence);
            replay.textContent = 'Replaying ' + (index + 1) + '/' + data.observations.length;
            if (index === data.observations.length - 1) {
              replay.dataset.replayCompleted = 'true';
              replayStatus.textContent = 'Station-by-station replay completed at observation ' + observation.sequence + '.';
              window.setTimeout(() => { if (generation === replayGeneration) replay.textContent = 'Replay story'; }, 700);
            }
          }, index * delay);
        });
      });
      replay.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        replay.click();
      });
      const theme = document.getElementById('theme');
      theme.addEventListener('click', () => {
        const paper = document.documentElement.dataset.theme === 'paper';
        document.documentElement.dataset.theme = paper ? 'carbon' : 'paper';
        theme.textContent = paper ? 'Paper mode' : 'Carbon mode';
      });
      const command = document.getElementById('command').textContent;
      const caption = document.getElementById('caption').textContent;
      const nativeShareText = document.getElementById('nativeShareText').textContent;
      const verifyCommand = document.getElementById('verifyCommand').textContent;
      const heroStatus = document.getElementById('heroStatus');
      const copyFallback = document.getElementById('copyFallback');
      const copyFallbackText = document.getElementById('copyFallbackText');
      const showCopyFallback = (text) => {
        copyFallbackText.value = text;
        copyFallback.hidden = false;
        copyFallbackText.focus();
        copyFallbackText.select();
      };
      document.getElementById('copyFallbackClose').addEventListener('click', () => {
        copyFallback.hidden = true;
      });
      const copy = async (button, text, forceFallback = false) => {
        const original = button.textContent;
        try {
          if (forceFallback) throw new Error('fallback requested');
          await navigator.clipboard.writeText(text);
          button.dataset.copyResult = 'clipboard';
          button.textContent = 'Copied';
          heroStatus.textContent = 'Copied locally. Nothing was uploaded.';
        } catch {
          showCopyFallback(text);
          button.dataset.copyResult = 'visible-fallback';
          button.textContent = 'Selected';
          heroStatus.textContent = 'Text selected in a visible local copy panel. Nothing was uploaded.';
        }
        window.setTimeout(() => { button.textContent = original; }, 1400);
      };
      document.getElementById('copyBottom').addEventListener('click', (event) => copy(event.currentTarget, command, event.shiftKey));
      document.getElementById('copyCaption').addEventListener('click', (event) => copy(event.currentTarget, caption, event.shiftKey));
      document.getElementById('verifyTop').addEventListener('click', (event) => copy(event.currentTarget, verifyCommand, event.shiftKey));
      document.getElementById('downloadCard').addEventListener('click', (event) => {
        event.currentTarget.dataset.downloadResult = 'local-file';
        heroStatus.textContent = 'Downloading the deterministic local share card.';
      });
      document.getElementById('shareTop').addEventListener('click', async (event) => {
        const button = event.currentTarget;
        const publicUrl = data.run.publicIdentity?.publicUrl;
        if (publicUrl && typeof navigator.share === 'function') {
          try {
            await navigator.share({ title: data.run.publicTitle + ' — Workprint Run Receipt', text: nativeShareText, url: publicUrl });
            button.dataset.shareResult = 'native';
            heroStatus.textContent = 'System share sheet completed.';
            return;
          } catch (error) {
            if (error && error.name === 'AbortError') {
              button.dataset.shareResult = 'cancelled';
              heroStatus.textContent = 'Share cancelled.';
              return;
            }
          }
        }
        await copy(button, caption, event.shiftKey);
        button.dataset.shareResult = button.dataset.copyResult || 'visible-fallback';
      });
    })();
  </script>
</body>
</html>\n`;
}

function renderObservationButton(observation: WorkprintIR["observations"][number]): string {
  const item = observation.itemType ?? "event";
  return `<button class="observation" type="button" data-sequence="${observation.sequence}" data-status="${observation.status}" aria-pressed="false"><span class="obs-seq">#${observation.sequence}</span><span class="obs-type">${escapeHtml(item)}</span><span class="obs-status">${escapeHtml(observation.status)}</span></button>`;
}

function renderMobileObservation(observation: WorkprintIR["observations"][number]): string {
  const item = observation.itemType ?? "event";
  const event = observation.eventType.replace("item.", "");
  const relation = observation.afterObservedFailure ? "later completion" : observation.publicPhase ?? observation.status;
  return `<button class="mobile-observation" type="button" data-sequence="${observation.sequence}" data-step="${observation.sequence}" data-status="${observation.status}" aria-pressed="false"><span class="mobile-node">${observation.sequence}</span><span class="mobile-obs-copy"><strong>${escapeHtml(item)}</strong><small>${escapeHtml(event)}${observation.publicLabel ? ` · ${escapeHtml(observation.publicLabel)}` : ""}</small></span><em>${escapeHtml(relation)}</em></button>`;
}

function renderMomentCards(moments: ReturnType<typeof deriveRunSheetStructure>["moments"]): string {
  const cards = moments.map((moment) => `<article class="moment"><b>#${moment.sequence} · ${escapeHtml(moment.label)}</b><strong>${escapeHtml(moment.kind.replaceAll("-", " "))}</strong><p>${escapeHtml(moment.detail)}</p></article>`);
  while (cards.length < 3) cards.push(`<article class="moment empty"><b>NOT OBSERVED</b><strong>No invented milestone</strong><p>The Run Sheet leaves absent structure absent.</p></article>`);
  return cards.join("");
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
