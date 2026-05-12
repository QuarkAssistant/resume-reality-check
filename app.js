const weakPhrases = [
  'responsible for', 'helped with', 'worked on', 'assisted with', 'team player',
  'hard worker', 'detail oriented', 'results driven', 'go getter', 'self starter',
  'fast learner', 'duties included', 'excellent communication skills'
];
const verbs = ['achieved','automated','built','created','cut','decreased','delivered','designed','drove','grew','improved','increased','launched','led','managed','optimized','owned','reduced','shipped','streamlined'];
const tools = ['excel','python','sql','salesforce','hubspot','tableau','power bi','javascript','react','node','aws','gcp','azure','figma','google analytics','shopify','wordpress','quickbooks','jira','notion','zapier'];
const stopWords = new Set([
  'about','after','also','and','are','based','been','being','both','business','can','candidate','company','cross','customer','data','day','deliver','each','experience','for','from','have','into','job','new','our','own','role','team','that','the','their','this','through','using','with','will','work','you','your'
]);
const sections = {
  experience: ['experience','employment','work history'],
  skills: ['skills','tools','technologies','technical'],
  education: ['education','degree','university','college'],
  projects: ['projects','portfolio','case studies']
};
const sample = `Jane Candidate
Product Operations Associate
jane@example.com | linkedin.com/in/janecandidate

Experience
Operations Coordinator, ExampleCo
- Responsible for weekly reporting and helped with process improvements for support and sales teams.
- Built Excel dashboards that reduced manual reporting time by 30% for 12 team members.
- Worked on vendor onboarding, documentation, and customer follow-up.

Skills
Excel, SQL, Notion, Jira, Salesforce`;
const sampleJob = `Product Operations Associate
We need someone to improve weekly reporting, maintain Salesforce hygiene, build SQL and Excel dashboards, document operations workflows, and coordinate vendor onboarding. Strong candidates can quantify process improvements and communicate with support, sales, and leadership.`;

function esc(s) {
  return String(s).replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
}
function uniq(arr) { return [...new Set(arr)].filter(Boolean); }
function preview(arr, n = 5) { return arr.slice(0, n).join(', '); }
function extractKeywords(text, limit = 12) {
  const counts = new Map();
  const phrases = (text.toLowerCase().match(/\b(?:power bi|google analytics|customer success|project management|product operations|data analysis|process improvement|vendor onboarding|salesforce hygiene)\b/g) || []);
  for (const phrase of phrases) counts.set(phrase, (counts.get(phrase) || 0) + 3);
  const words = text.toLowerCase().match(/[a-z][a-z+#.-]{2,}/g) || [];
  for (const word of words) {
    if (stopWords.has(word) || word.length < 4) continue;
    counts.set(word, (counts.get(word) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([word]) => word);
}
function keywordGap(resumeText, jobText) {
  const required = extractKeywords(jobText);
  const resumeLower = resumeText.toLowerCase();
  const present = required.filter(k => resumeLower.includes(k));
  const missing = required.filter(k => !resumeLower.includes(k));
  return { required, present, missing };
}
function analyze(text) {
  const lower = text.toLowerCase();
  const words = (text.match(/[A-Za-z][A-Za-z+.#-]*/g) || []);
  const metrics = uniq(text.match(/(?:\$\s?\d[\d,]*(?:\.\d+)?[kKmMbB]?|\d+(?:\.\d+)?\s?%|\d+[xX]|\b\d{2,}[\w,.-]*\b)/g) || []);
  const foundWeak = weakPhrases.filter(p => lower.includes(p));
  const foundVerbs = verbs.filter(v => new RegExp(`\\b${v}\\b`).test(lower));
  const foundTools = tools.filter(t => new RegExp(`\\b${t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(lower));
  const foundSections = Object.entries(sections).filter(([, vars]) => vars.some(v => lower.includes(v))).map(([k]) => k);
  const lines = text.split(/\n+/).map(l => l.trim().replace(/^[-•\s]+/, '')).filter(Boolean);
  const bullets = lines.filter(l => l.split(/\s+/).length >= 5);
  const longBullets = bullets.filter(l => l.split(/\s+/).length > 32);
  const proofLinks = /(linkedin\.com|github\.com|https?:\/\/|\S+@\S+\.\S+)/i.test(text);
  return { words, metrics, foundWeak, foundVerbs, foundTools, foundSections, bullets, longBullets, proofLinks, lower };
}

function buildFitSnapshot(a, gap) {
  const keywordRate = gap && gap.required.length ? gap.present.length / gap.required.length : null;
  let score = 34;
  const checks = [];
  const priorityFixes = [];

  if (keywordRate === null) {
    checks.push({ label: 'Keyword overlap', status: 'Needs job post', detail: 'Paste a job post to score role-language overlap instead of guessing.' });
    priorityFixes.push('Paste the exact job post, then rerun the check so the rewrite targets real hiring language.');
  } else if (keywordRate >= 0.55) {
    score += 28;
    checks.push({ label: 'Keyword overlap', status: 'Strong', detail: `${gap.present.length}/${gap.required.length} top job-post terms are visible.` });
  } else if (keywordRate >= 0.3) {
    score += 16;
    checks.push({ label: 'Keyword overlap', status: 'Partial', detail: `${gap.present.length}/${gap.required.length} top terms match; add honest missing terms with proof.` });
    priorityFixes.push(`Lift the missing job language into proof bullets: ${preview(gap.missing, 5) || 'none'}.`);
  } else {
    score += 5;
    checks.push({ label: 'Keyword overlap', status: 'Weak', detail: `${gap.present.length}/${gap.required.length} top terms match; the resume may read off-target.` });
    priorityFixes.push(`Rewrite the top summary and first two bullets around the role terms: ${preview(gap.missing, 5) || 'top job keywords'}.`);
  }

  if (a.metrics.length >= 3) {
    score += 20;
    checks.push({ label: 'Metrics proof', status: 'Strong', detail: `${a.metrics.length} measurable results found.` });
  } else if (a.metrics.length) {
    score += 12;
    checks.push({ label: 'Metrics proof', status: 'Partial', detail: `${a.metrics.length} measurable result${a.metrics.length === 1 ? '' : 's'} found; add more scope and outcomes.` });
    priorityFixes.push('Add 2-3 numbers: volume, time saved, revenue, cost, SLA, users, or before/after rate.');
  } else {
    checks.push({ label: 'Metrics proof', status: 'Missing', detail: 'No obvious numbers; duties need evidence.' });
    priorityFixes.push('Convert duty bullets into outcomes with numbers before sending applications.');
  }

  if (a.foundVerbs.length >= 4) {
    score += 12;
    checks.push({ label: 'Action verbs', status: 'Strong', detail: `${a.foundVerbs.length} strong verbs found.` });
  } else if (a.foundVerbs.length >= 2) {
    score += 7;
    checks.push({ label: 'Action verbs', status: 'Partial', detail: 'Some bullets start with outcomes, but passive lines remain.' });
  } else {
    checks.push({ label: 'Action verbs', status: 'Weak', detail: 'Too many lines may read like responsibilities.' });
    priorityFixes.push('Start the most important bullets with built, reduced, led, shipped, improved, or automated.');
  }

  if (a.foundWeak.length) {
    score -= Math.min(12, a.foundWeak.length * 4);
    checks.push({ label: 'Weak filler', status: 'Found', detail: `${a.foundWeak.length} generic phrase${a.foundWeak.length === 1 ? '' : 's'} should be replaced.` });
    priorityFixes.push(`Replace vague phrases such as ${preview(a.foundWeak, 4)} with specific actions and outcomes.`);
  } else {
    score += 6;
    checks.push({ label: 'Weak filler', status: 'Clean', detail: 'No obvious generic filler from the built-in list.' });
  }

  if (a.foundTools.length >= 3) score += 6;
  if (a.foundSections.includes('experience') || a.foundSections.includes('projects')) score += 6;
  if (a.words.length < 120) score -= 8;
  if (a.words.length > 900) score -= 6;
  if (a.longBullets.length) score -= 5;

  score = Math.max(0, Math.min(100, Math.round(score)));
  const verdict = score >= 76 ? 'Likely worth applying after a polish pass' : score >= 55 ? 'Promising but needs targeted rewrites first' : 'Not ready yet: fix proof and targeting before applying';
  const dedupedFixes = uniq(priorityFixes).slice(0, 4);
  if (!dedupedFixes.length) dedupedFixes.push('Polish the top third, keep the strongest metric first, and remove anything that does not support this target role.');

  return { score, verdict, checks, priorityFixes: dedupedFixes };
}
const productUrl = 'https://quarkassistant.github.io/resume-reality-check/';
const kofiUrl = 'https://ko-fi.com/quarkassistant';
const tipCta = `
  <p class="result-tip">
    Helpful? <a href="https://ko-fi.com/quarkassistant" target="_blank" rel="noopener noreferrer">Tip $5 via Ko-fi</a>
  </p>
`;
let latestReportText = '';
let lastActionPlanText = '';

function showReportActions(show, statusText = '') {
  const panel = document.getElementById('report-actions');
  const status = document.getElementById('report-status');
  if (!panel || !status) return;
  panel.hidden = !show;
  if (statusText) status.textContent = statusText;
}

function plainList(title, items) {
  return `${title}\n${items.map(item => `- ${item.replace(/<[^>]+>/g, '')}`).join('\n')}`;
}

function buildPlainReport({ target, snapshot, hits, kills, gap, rewrites, actionPlan = [] }) {
  const lines = [
    'AI Resume Reality Check',
    productUrl,
    '',
    target ? `Target: ${target}` : 'Target: not specified',
    '',
    'Applicant fit snapshot',
    `- Score: ${snapshot.score}/100 — ${snapshot.verdict}`,
    ...snapshot.checks.map(check => `- ${check.label}: ${check.status} — ${check.detail}`),
    '',
    plainList('Priority fixes', snapshot.priorityFixes),
    '',
    plainList('What hits', hits),
    '',
    plainList('What kills it', kills),
  ];
  if (gap) {
    lines.push(
      '',
      'Keyword gap from the job post',
      `- Matched: ${gap.present.length ? preview(gap.present, 10) : 'No clear overlap detected yet.'}`,
      `- Missing or buried: ${gap.missing.length ? preview(gap.missing, 10) : 'No major keyword gaps in the top extracted terms.'}`,
      '- Use this as a rewrite checklist, not as permission to keyword-stuff. Every added term needs a proof bullet.'
    );
  }
  lines.push(
    '',
    plainList("The rewrite they'd actually read", rewrites),
    '',
    plainList('5-minute apply plan', actionPlan),
    '',
    `If this helped, tip $5 via Ko-fi: ${kofiUrl}`,
    'Disclosure: Built by Quark Assistant, an autonomous AI agent operating under owner supervision. Feedback is generated by an AI-authored rules engine and is not legal, career, or hiring advice.',
    'Privacy: the tool runs in your browser. Your resume text is not sent to a server, saved, logged, or used for training.'
  );
  return `${lines.join('\n')}\n`;
}

async function copyReport() {
  if (!latestReportText) return;
  const status = document.getElementById('report-status');
  try {
    await navigator.clipboard.writeText(latestReportText);
    status.textContent = 'Report copied. Paste it into notes, email, or your rewrite doc.';
  } catch (err) {
    status.textContent = 'Copy failed. Use Download .txt instead.';
  }
}

function downloadReport() {
  if (!latestReportText) return;
  const status = document.getElementById('report-status');
  const blob = new Blob([latestReportText], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'resume-reality-check.txt';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  status.textContent = 'Report downloaded as a local text file.';
}

function buildActionPlan(target, analysis, gap, rewrites) {
  const role = target || 'this role';
  const topProof = analysis.metrics.length ? preview(analysis.metrics, 3) : '[add one measurable result]';
  const keywordLine = gap && gap.missing.length
    ? `Add honest proof for these job-post terms: ${preview(gap.missing, 6)}.`
    : 'No obvious keyword gap from the pasted job post; spend time sharpening proof instead of stuffing terms.';
  const weakLine = analysis.foundWeak.length
    ? `Replace weak phrases: ${preview(analysis.foundWeak, 5)}.`
    : 'Keep the active language; avoid adding vague claims like hard worker or team player.';
  const recruiterNote = `Pasteable recruiter note: Hi — I am applying for ${role}. The strongest fit is ${topProof}; I would point you first to the bullets showing measurable outcomes and the tools named in the posting.`;
  return [
    `Aim the headline at ${role}, not a generic professional summary.`,
    keywordLine,
    weakLine,
    `Move this proof into the top half page: ${topProof}.`,
    `Rewrite one bullet with this pattern: ${rewrites[1] || 'Improved [result] by [action], measured by [number].'}`,
    recruiterNote,
  ];
}

function renderActionPlan(actionPlan) {
  lastActionPlanText = `AI Resume Reality Check — 5-minute apply plan\n\n${actionPlan.map((item, idx) => `${idx + 1}. ${item}`).join('\n')}`;
  return `
    <h3 class="packet">5-minute apply plan</h3>
    <ol class="action-plan">${actionPlan.map(x => `<li>${esc(x)}</li>`).join('')}</ol>
    <button id="copy-plan" class="secondary copy-plan" type="button">Copy action plan</button>
    <span id="copy-status" class="small" role="status" aria-live="polite"></span>
  `;
}

async function copyActionPlan() {
  const status = document.getElementById('copy-status');
  if (!lastActionPlanText || !status) return;
  try {
    await navigator.clipboard.writeText(lastActionPlanText);
    status.textContent = 'Copied. Paste it into your rewrite checklist or job tracker.';
  } catch (err) {
    status.textContent = 'Copy failed. Select the apply plan text manually.';
  }
}

async function shareProduct() {
  const status = document.getElementById('share-status');
  const payload = {
    title: 'AI Resume Reality Check',
    text: 'Free browser-only resume critique: no upload, no storage.',
    url: productUrl,
  };
  try {
    if (navigator.share) {
      await navigator.share(payload);
      status.textContent = 'Shared. Thanks for helping the experiment reach more job seekers.';
      return;
    }
    await navigator.clipboard.writeText(productUrl);
    status.textContent = 'Link copied. Thanks for sharing it with someone applying for jobs.';
  } catch (err) {
    status.textContent = `Copy this link: ${productUrl}`;
  }
}

function critique() {
  const text = document.getElementById('resume').value.trim();
  const target = document.getElementById('target').value.trim();
  const jobPost = document.getElementById('job-post').value.trim();
  const out = document.getElementById('result');
  if (!text) {
    latestReportText = '';
    lastActionPlanText = '';
    showReportActions(false);
    out.className = 'result';
    out.innerHTML = `<h3>What hits</h3><ul><li>Nothing yet. Paste a resume first.</li></ul><h3>What kills it</h3><ul><li>An empty resume has a 0% interview conversion rate, which is impressive in the wrong direction.</li></ul><h3>The rewrite they'd actually read</h3><ul><li>Paste real resume text, remove sensitive details if needed, and run the check again.</li></ul>${tipCta}`;
    return;
  }
  const a = analyze(text);
  const hits = [];
  const kills = [];
  const rewrites = [];
  const gap = jobPost ? keywordGap(text, jobPost) : null;
  const snapshot = buildFitSnapshot(a, gap);
  if (gap && gap.present.length) hits.push(`Job-post overlap is visible: ${esc(preview(gap.present, 6))}. Keep those exact words where they are honest.`);
  if (gap && gap.missing.length) kills.push(`Keyword gap from the pasted job post: ${esc(preview(gap.missing, 8))}. Add only the ones you can defend with real experience.`);
  if (a.metrics.length) hits.push(`You included measurable proof (${esc(preview(a.metrics))}). Keep those numbers close to the top.`);
  if (a.foundVerbs.length) hits.push(`Some action language is already there (${esc(preview(a.foundVerbs, 6))}). Good. Make it more consistent.`);
  if (a.foundTools.length) hits.push(`Concrete tools/keywords appear (${esc(preview(a.foundTools, 8))}), which helps recruiters and ATS filters skim faster.`);
  if (a.foundSections.length >= 3) hits.push(`The structure is recognizable: ${esc(a.foundSections.join(', '))}.`);
  if (a.proofLinks) hits.push('You included contact/proof links, so a recruiter has somewhere to go next.');
  if (target) hits.push(`You named a target: ${esc(target)}. That makes the resume easier to aim.`);
  if (!hits.length) hits.push('There is raw material here, but the value proposition is buried. Lead with role, proof, and outcomes.');

  if (a.words.length < 120) kills.push('It is too thin to trust. Add recent roles/projects, scope, tools, and quantified outcomes.');
  if (a.words.length > 900) kills.push('It is probably too long for a first skim. Cut older detail and keep only proof that supports the target role.');
  if (!a.metrics.length) kills.push('No obvious metrics found. Without numbers, it reads like duties instead of evidence.');
  if (a.foundWeak.length) kills.push(`Generic filler weakens credibility: ${esc(preview(a.foundWeak, 7))}. Replace it with specific outcomes.`);
  if (a.foundVerbs.length < 3) kills.push('Too many lines may be passive. Start bullets with verbs like built, reduced, led, shipped, improved.');
  if (a.longBullets.length) kills.push('Several bullets are dense. Split long bullets so each one sells one result fast.');
  if (!a.foundSections.includes('experience') && !a.foundSections.includes('projects')) kills.push('The proof section is not obvious. Add a clear Experience or Projects section with result-first bullets.');
  if (target && !a.lower.includes(target.toLowerCase())) kills.push('The target role is not mirrored in the resume language. Add role-relevant keywords honestly where they fit.');
  if (!kills.length) kills.push('The main risk is positioning. Make the top third impossible to misunderstand in a 10-second skim.');

  const metric = a.metrics.length ? preview(a.metrics, 2) : '[specific metric]';
  const toolPhrase = a.foundTools.length ? ` using ${preview(a.foundTools, 4)}` : ' using tools/processes named in the job post';
  const weakBullet = a.bullets.find(b => weakPhrases.some(p => b.toLowerCase().includes(p)));
  rewrites.push(`Top summary: ${target || 'Target-role'} candidate who turns messy work into measurable outcomes. Strongest proof: ${metric}.`);
  rewrites.push(`Bullet formula: Improved [business result] by [specific action]${toolPhrase}; measured by ${metric}.`);
  if (weakBullet) rewrites.push(`Replace: "${esc(weakBullet.slice(0, 140))}" with "Owned [specific problem], took [specific action], and delivered [number/result]."`);
  rewrites.push('Final pass: cut adjectives you cannot prove, move the best metric into the first half page, and align headings to the role being pursued.');

  const gapHtml = gap ? `
    <h3 class="gap">Keyword gap from the job post</h3>
    <ul>
      <li><strong>Matched:</strong> ${gap.present.length ? esc(preview(gap.present, 10)) : 'No clear overlap detected yet.'}</li>
      <li><strong>Missing or buried:</strong> ${gap.missing.length ? esc(preview(gap.missing, 10)) : 'No major keyword gaps in the top extracted terms.'}</li>
      <li>Use this as a rewrite checklist, not as permission to keyword-stuff. Every added term needs a proof bullet.</li>
    </ul>
  ` : '';
  const actionPlan = buildActionPlan(target, a, gap, rewrites);

  const snapshotHtml = `
    <section class="fit-snapshot" aria-label="Applicant fit snapshot">
      <div>
        <p class="snapshot-label">Applicant fit snapshot</p>
        <p class="fit-score">${snapshot.score}<span>/100</span></p>
      </div>
      <div>
        <p class="snapshot-verdict">${esc(snapshot.verdict)}</p>
        <ul class="fit-checks">
          ${snapshot.checks.map(check => `<li><strong>${esc(check.label)}:</strong> ${esc(check.status)} — ${esc(check.detail)}</li>`).join('')}
        </ul>
      </div>
    </section>
  `;

  out.className = 'result';
  out.innerHTML = `
    ${snapshotHtml}
    <h3 class="priority">Priority fixes</h3><ul>${snapshot.priorityFixes.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
    <h3 class="good">What hits</h3><ul>${hits.map(x => `<li>${x}</li>`).join('')}</ul>
    <h3 class="bad">What kills it</h3><ul>${kills.map(x => `<li>${x}</li>`).join('')}</ul>
    ${gapHtml}
    <h3 class="rewrite">The rewrite they'd actually read</h3><ul>${rewrites.map(x => `<li>${x}</li>`).join('')}</ul>
    ${renderActionPlan(actionPlan)}
    ${tipCta}
  `;
  latestReportText = buildPlainReport({ target, snapshot, hits, kills, gap, rewrites, actionPlan });
  showReportActions(true, 'Report ready: copy it, download it, then rewrite while the notes are fresh.');
}
document.getElementById('run').addEventListener('click', critique);
document.getElementById('share').addEventListener('click', shareProduct);
document.getElementById('copy-report').addEventListener('click', copyReport);
document.getElementById('download-report').addEventListener('click', downloadReport);
document.getElementById('result').addEventListener('click', event => {
  if (event.target && event.target.id === 'copy-plan') copyActionPlan();
});
document.getElementById('sample').addEventListener('click', () => {
  document.getElementById('resume').value = sample;
  document.getElementById('job-post').value = sampleJob;
  document.getElementById('target').value = 'Product operations associate';
  critique();
});
document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('resume').value = '';
  document.getElementById('job-post').value = '';
  document.getElementById('target').value = '';
  latestReportText = '';
  lastActionPlanText = '';
  showReportActions(false);
  document.getElementById('result').className = 'placeholder';
  document.getElementById('result').textContent = 'Your critique will appear here.';
});
