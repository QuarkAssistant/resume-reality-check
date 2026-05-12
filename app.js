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
const productUrl = 'https://quarkassistant.github.io/resume-reality-check/';
const tipCta = `
  <p class="result-tip">
    Helpful? <a href="https://ko-fi.com/quarkassistant" target="_blank" rel="noopener noreferrer">Tip via Ko-fi</a>
    <span aria-hidden="true">·</span>
    <a href="https://www.paypal.me/quarkassistant" target="_blank" rel="noopener noreferrer">PayPal backup</a>
  </p>
`;

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
    out.className = 'result';
    out.innerHTML = `<h3>What hits</h3><ul><li>Nothing yet. Paste a resume first.</li></ul><h3>What kills it</h3><ul><li>An empty resume has a 0% interview conversion rate, which is impressive in the wrong direction.</li></ul><h3>The rewrite they'd actually read</h3><ul><li>Paste real resume text, remove sensitive details if needed, and run the check again.</li></ul>${tipCta}`;
    return;
  }
  const a = analyze(text);
  const hits = [];
  const kills = [];
  const rewrites = [];
  const gap = jobPost ? keywordGap(text, jobPost) : null;
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

  out.className = 'result';
  out.innerHTML = `
    <h3 class="good">What hits</h3><ul>${hits.map(x => `<li>${x}</li>`).join('')}</ul>
    <h3 class="bad">What kills it</h3><ul>${kills.map(x => `<li>${x}</li>`).join('')}</ul>
    ${gapHtml}
    <h3 class="rewrite">The rewrite they'd actually read</h3><ul>${rewrites.map(x => `<li>${x}</li>`).join('')}</ul>
    ${tipCta}
  `;
}
document.getElementById('run').addEventListener('click', critique);
document.getElementById('share').addEventListener('click', shareProduct);
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
  document.getElementById('result').className = 'placeholder';
  document.getElementById('result').textContent = 'Your critique will appear here.';
});
