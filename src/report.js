import { getQuestion, questionnaires } from './questionnaires.js';

export function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

export function answeredEntries(flow, answers = {}, order = []) {
  const items = Object.entries(answers)
    .filter(([id, value]) => typeof value === 'string' && value.trim() && getQuestion(flow, id))
    .map(([id, value]) => ({ id, value, ...getQuestion(flow, id) }));
  const position = new Map(order.map((id, index) => [id, index]));
  return items.sort((a, b) => (position.has(a.id) ? position.get(a.id) : Number.MAX_SAFE_INTEGER) - (position.has(b.id) ? position.get(b.id) : Number.MAX_SAFE_INTEGER));
}

export function isIncluded(entry, included = {}) {
  return typeof included[entry.id] === 'boolean' ? included[entry.id] : !entry.privateByDefault;
}

export function buildReport({ flow, answers, included = {}, order = [], nickname = '', sessionDate = '', prepDate = '', finalNote = '' }) {
  const questionnaire = questionnaires[flow] || questionnaires.weekly;
  const items = answeredEntries(flow, answers, order).filter(entry => isIncluded(entry, included));
  return {
    title: 'Preparação para Sessão de Psicoterapia', type: questionnaire.title,
    nickname: String(nickname).trim(), sessionDate, prepDate,
    items, finalNote: String(finalNote).trim(),
  };
}

function brazilDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return '';
  const [y, m, d] = value.split('-');
  return `${d}/${m}/${y}`;
}

/** Documento inteiramente local, sem CSS, scripts, imagens ou fontes de terceiros. */
export function createPrintDocument(report) {
  const esc = escapeHtml;
  const meta = [report.nickname && ['Identificação', report.nickname], report.sessionDate && ['Data da sessão', brazilDate(report.sessionDate)], report.prepDate && ['Preparado em', brazilDate(report.prepDate)]].filter(Boolean);
  const entries = report.items.map((entry, index) => `<section class="answer"><div class="eyebrow">${String(index + 1).padStart(2, '0')} · ${esc(entry.sectionTitle)}</div><h2>${esc(entry.label)}</h2><p>${esc(entry.value)}</p></section>`).join('');
  return `<!doctype html><html lang="pt-BR"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>pre-sessao-resumo</title><style>
  @page{size:A4;margin:20mm 18mm}*,*::before,*::after{box-sizing:border-box}html{color:#253a3a;font-family:Arial,Helvetica,sans-serif;font-size:12pt}body{margin:0;background:white}main{max-width:190mm;margin:0 auto}header{border-bottom:2px solid #637e73;padding-bottom:15mm;margin-bottom:9mm}.brand{font-size:10pt;letter-spacing:.17em;text-transform:uppercase;color:#537367;font-weight:700}h1{font-size:22pt;line-height:1.22;margin:8mm 0 3mm;font-weight:700;color:#233c39}.subtitle{font-size:11pt;color:#647675;margin:0}.metadata{display:flex;gap:9mm;flex-wrap:wrap;margin-top:10mm}.metadata div{min-width:42mm}.metadata dt{font-size:9pt;text-transform:uppercase;letter-spacing:.07em;color:#607473}.metadata dd{margin:2mm 0 0;font-weight:600;overflow-wrap:anywhere}.eyebrow{color:#637d75;text-transform:uppercase;font-size:9pt;letter-spacing:.07em;font-weight:700}.answer{margin:0 0 11mm;page-break-inside:auto;break-inside:auto}.answer h2{font-size:13pt;margin:2mm 0 3mm;font-weight:700;break-after:avoid;page-break-after:avoid;color:#2b4742}.answer p,.final p{white-space:pre-wrap;overflow-wrap:anywhere;word-break:normal;line-height:1.58;margin:0}.final{border-top:1px solid #c8d4cc;padding-top:7mm;margin-top:5mm}.final h2{font-size:13pt;margin:0 0 4mm}footer{font-size:9pt;color:#73817e;border-top:1px solid #d9e0dc;margin-top:15mm;padding-top:5mm} @media screen{html{font-size:15px}body{padding:26px;box-sizing:border-box;background:#e8ece8}main{max-width:794px;background:white;min-height:1050px;padding:54px 64px;box-shadow:0 10px 35px #243b381b}.metadata{display:flex}}@media(max-width:650px){body{padding:0}main{padding:26px 22px;min-height:700px;box-shadow:none}.metadata{gap:14px}h1{font-size:26px}}
  </style></head><body><main><header><div class="brand">PRÉ-SESSÃO / DOCUMENTO PESSOAL</div><h1>${esc(report.title)}</h1><p class="subtitle">${esc(report.type)} · Resumo preparado voluntariamente</p>${meta.length ? `<dl class="metadata">${meta.map(([label,value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl>` : ''}</header>${entries}${report.finalNote ? `<section class="final"><h2>Observação final</h2><p>${esc(report.finalNote)}</p></section>` : ''}<footer>Preparado pela própria pessoa. Este documento não é avaliação clínica, diagnóstico ou prontuário. Compartilhamento voluntário.</footer></main></body></html>`;
}
