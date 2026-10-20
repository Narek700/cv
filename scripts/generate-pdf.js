// Regenerates cv.pdf from the live content of index.html, but renders it
// through a dedicated resume layout (not a print-stylesheet of the app UI).
// Content (name, contacts, education, experience, skills, languages) is
// scraped straight from the DOM, so editing index.html is enough to keep
// cv.pdf in sync — this script owns only the PDF's visual design.
//
// Run manually after editing index.html: `npm install && npm run build:pdf`,
// then commit the regenerated cv.pdf. Not run by Netlify — its build image
// ships Node 16, too old for puppeteer's ESM-only package.
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const INDEX_URL = 'file://' + path.join(ROOT, 'index.html');
const OUTPUT_PATH = path.join(ROOT, 'cv.pdf');

function extractData() {
  const text = (el) => (el ? el.textContent.trim() : '');

  function extractEntries(article) {
    if (!article) return [];
    const nodes = Array.from(
      article.querySelectorAll(':scope > .specialty, :scope > .uni-comp, :scope > .date, :scope > .desc')
    );
    const entries = [];
    let current = null;
    nodes.forEach((node) => {
      const value = text(node);
      if (node.classList.contains('specialty')) {
        current = { role: value, org: '', date: '', desc: '' };
        entries.push(current);
      } else if (node.classList.contains('uni-comp')) {
        if (!current || current.org) {
          current = { role: '', org: value, date: '', desc: '' };
          entries.push(current);
        } else {
          current.org = value;
        }
      } else if (node.classList.contains('date')) {
        if (current) current.date = value;
      } else if (node.classList.contains('desc')) {
        if (current) current.desc = value;
      }
    });
    return entries.filter((e) => e.role || e.org);
  }

  function extractSkills(container) {
    if (!container) return [];
    return Array.from(container.querySelectorAll(':scope > .skill')).map((skillEl) => {
      const label = text(skillEl.querySelector('span'));
      const line = skillEl.querySelector('.line');
      const percent = line ? parseInt(line.getAttribute('data-p'), 10) || 0 : 0;
      return { label, percent };
    });
  }

  function extractContacts() {
    const rows = Array.from(document.querySelectorAll('aside .info > div'));
    return rows
      .slice(1) // first row is just the name, already shown in the header
      .map((row) => {
        const img = row.querySelector('img');
        const a = row.querySelector('a');
        const span = row.querySelector('span');
        const label = a || span;
        return {
          icon: img ? img.getAttribute('src').split('?')[0] : '',
          text: label ? label.textContent.trim() : '',
          href: a ? a.getAttribute('href') : null,
        };
      })
      .filter((c) => c.text);
  }

  const avatarImg = document.querySelector('aside .avatar img');

  return {
    name: text(document.querySelector('header h1')),
    title: text(document.querySelector('header h2')),
    avatarSrc: avatarImg ? avatarImg.getAttribute('src').split('?')[0] : '',
    contacts: extractContacts(),
    education: extractEntries(document.querySelector('article.education')),
    experience: extractEntries(document.querySelector('article.experience')),
    skills: extractSkills(document.querySelector('.skills')),
    languages: extractSkills(document.querySelector('.languages')),
  };
}

function escapeHtml(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderEntries(entries) {
  return entries
    .map(
      (e) => `
      <div class="pdfx-entry">
        <div class="pdfx-entry-row">
          <span class="pdfx-entry-role">${escapeHtml(e.role || e.org)}</span>
          ${e.date ? `<span class="pdfx-entry-date">${escapeHtml(e.date)}</span>` : ''}
        </div>
        ${e.role && e.org ? `<div class="pdfx-entry-org">${escapeHtml(e.org)}</div>` : ''}
        ${e.desc ? `<div class="pdfx-entry-desc">${escapeHtml(e.desc)}</div>` : ''}
      </div>`
    )
    .join('');
}

function renderSkills(skills) {
  return skills
    .map(
      (s) => `
      <div class="pdfx-skill">
        <span class="pdfx-skill-label">${escapeHtml(s.label)}</span>
        <div class="pdfx-skill-track"><div class="pdfx-skill-fill" style="width:${s.percent}%"></div></div>
      </div>`
    )
    .join('');
}

function renderContacts(contacts) {
  return contacts
    .map((c) => {
      const inner = `<img src="${escapeHtml(c.icon)}" alt=""><span>${escapeHtml(c.text)}</span>`;
      return `<div>${c.href ? `<a href="${escapeHtml(c.href)}">${inner}</a>` : inner}</div>`;
    })
    .join('');
}

function buildResumeHtml(data) {
  return `
    <div class="pdfx-header">
      ${data.avatarSrc ? `<img class="pdfx-avatar" src="${escapeHtml(data.avatarSrc)}" alt="">` : ''}
      <div class="pdfx-id">
        <h1>${escapeHtml(data.name)}</h1>
        <h2>${escapeHtml(data.title)}</h2>
      </div>
      <div class="pdfx-contacts">${renderContacts(data.contacts)}</div>
    </div>
    <div class="pdfx-body">
      <div class="pdfx-main">
        <div class="pdfx-section">
          <h3 class="pdfx-section-title">Education</h3>
          ${renderEntries(data.education)}
        </div>
        <div class="pdfx-section">
          <h3 class="pdfx-section-title">Work Experience</h3>
          ${renderEntries(data.experience)}
        </div>
      </div>
      <div class="pdfx-side">
        <div class="pdfx-section">
          <h3 class="pdfx-section-title">Skills</h3>
          ${renderSkills(data.skills)}
        </div>
        <div class="pdfx-section">
          <h3 class="pdfx-section-title">Languages</h3>
          ${renderSkills(data.languages)}
        </div>
      </div>
    </div>
  `;
}

const RESUME_CSS = `
  * { box-sizing: border-box; }
  html, body {
    margin: 0;
    padding: 0;
    font-family: 'Roboto', Arial, sans-serif;
    color: #2b2b2b;
    font-size: 13px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  @page { size: A4; margin: 0; }

  .pdfx-header {
    background: #3E495A;
    color: #fff;
    padding: 42px 48px;
    display: flex;
    align-items: center;
    gap: 30px;
  }
  .pdfx-avatar {
    width: 104px;
    height: 104px;
    border-radius: 50%;
    object-fit: cover;
    border: 3px solid #6386B8;
    flex-shrink: 0;
  }
  .pdfx-id { flex: 1; min-width: 0; }
  .pdfx-id h1 {
    margin: 0;
    font-size: 31px;
    letter-spacing: 3px;
    text-transform: uppercase;
    font-weight: 700;
  }
  .pdfx-id h2 {
    margin: 8px 0 0;
    font-size: 14px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #a7c0e3;
    font-weight: 400;
  }
  .pdfx-contacts {
    display: grid;
    grid-template-columns: repeat(2, auto);
    gap: 10px 32px;
    font-size: 12px;
    flex-shrink: 0;
  }
  .pdfx-contacts div, .pdfx-contacts a {
    display: flex;
    align-items: center;
    gap: 8px;
    white-space: nowrap;
  }
  .pdfx-contacts img { width: 14px; height: 14px; filter: brightness(0) invert(1); opacity: .85; }
  .pdfx-contacts a, .pdfx-contacts span { color: #e7edf5; text-decoration: none; }

  .pdfx-body { padding: 40px 48px 48px; overflow: hidden; }
  .pdfx-main { float: left; width: 62%; padding-right: 34px; }
  .pdfx-side { float: left; width: 38%; background: #F4F6F9; border-radius: 12px; padding: 24px 26px; }

  .pdfx-section-title {
    font-size: 15px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    color: #313A3A;
    border-bottom: 2px solid #6386B8;
    padding-bottom: 9px;
    margin: 0 0 20px;
  }
  .pdfx-main .pdfx-section + .pdfx-section { margin-top: 34px; }
  .pdfx-side .pdfx-section + .pdfx-section { margin-top: 30px; }

  .pdfx-entry {
    position: relative;
    padding-left: 18px;
    margin-bottom: 22px;
    border-left: 2px solid #dbe3ee;
    break-inside: avoid;
    page-break-inside: avoid;
  }
  .pdfx-entry:last-child { margin-bottom: 0; }
  .pdfx-entry::before {
    content: '';
    position: absolute;
    left: -6px;
    top: 4px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #6386B8;
  }
  .pdfx-entry-row { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .pdfx-entry-role { font-size: 15px; font-weight: 700; color: #1f2937; }
  .pdfx-entry-date { font-size: 11.5px; color: #6386B8; font-weight: 600; white-space: nowrap; }
  .pdfx-entry-org { font-size: 13px; color: #5b6472; margin-top: 4px; }
  .pdfx-entry-desc { font-size: 12px; color: #6b7280; margin-top: 6px; line-height: 1.5; }

  .pdfx-skill { margin-bottom: 16px; break-inside: avoid; page-break-inside: avoid; }
  .pdfx-skill:last-child { margin-bottom: 0; }
  .pdfx-skill-label { font-size: 12px; color: #374151; margin-bottom: 6px; display: block; }
  .pdfx-skill-track { height: 6px; background: #dde4ee; border-radius: 4px; overflow: hidden; }
  .pdfx-skill-fill { height: 100%; background: #6386B8; border-radius: 4px; }
`;

async function main() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 1600 });
    await page.goto(INDEX_URL, { waitUntil: 'networkidle0' });

    const data = await page.evaluate(extractData);
    const html = buildResumeHtml(data);

    await page.evaluate((bodyHtml) => {
      document.body.innerHTML = bodyHtml;
    }, html);
    await page.addStyleTag({ content: RESUME_CSS });

    await page.pdf({
      path: OUTPUT_PATH,
      format: 'A4',
      printBackground: true,
    });

    console.log('cv.pdf generated at', OUTPUT_PATH);
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error('Failed to generate cv.pdf:', err);
  process.exit(1);
});
