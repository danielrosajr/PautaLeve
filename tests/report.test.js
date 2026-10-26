import test from 'node:test';
import assert from 'node:assert/strict';
import { questionnaires, getSections } from '../src/questionnaires.js';
import { answeredEntries, buildReport, createPrintDocument, escapeHtml } from '../src/report.js';

test('perguntas opcionais sem campo obrigatório', () => {
  for (const q of Object.values(questionnaires)) {
    for (const section of q.sections) for (const question of section.questions) {
      assert.notEqual(question.required, true);
    }
  }
});
test('modo rápido tem cinco perguntas', () => {
  const sections = getSections('weekly', true);
  assert.equal(sections.flatMap(s => s.questions).length, 5);
});
test('ignora respostas vazias e elimina rascunhos de outro questionário', () => {
  const entries = answeredEntries('first', { called: ' Ana ', routine: '  ', important_events: 'Secreto de outro formulário' });
  assert.equal(entries.length, 1);
  assert.equal(entries[0].value, ' Ana ');
});
test('uma resposta explicitamente privada nunca aparece na prévia', () => {
  const report = buildReport({ flow:'weekly', answers:{ important_events:'público', only_in_person:'NÃO COMPARTILHAR', top_priority:'outro' }, included:{important_events:true, top_priority:false} });
  const html = createPrintDocument(report);
  assert.equal(report.items.length, 1);
  assert.match(html, /público/);
  assert.doesNotMatch(html, /NÃO COMPARTILHAR|outro/);
});
test('conteúdo privado por padrão só entra com inclusão explícita', () => {
  const input = { flow: 'weekly', answers: { only_in_person:'texto reservado' } };
  assert.equal(buildReport(input).items.length, 0);
  assert.equal(buildReport({ ...input, included:{only_in_person:true} }).items.length, 1);
});
test('reordenação e edição aparecem no relatório', () => {
  const report = buildReport({ flow: 'weekly', answers:{ week_summary:'A', top_priority:'B atualizado' }, order:['top_priority','week_summary'] });
  assert.deepEqual(report.items.map(x=>x.id), ['top_priority','week_summary']);
  assert.equal(report.items[0].value, 'B atualizado');
});
test('escape impede injeção no relatório', () => {
  const report = buildReport({ flow:'weekly', answers:{ week_summary:'<script>evil()</script> & olá' } });
  const html = createPrintDocument(report);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;evil\(\)&lt;\/script&gt; &amp; olá/);
  assert.equal(escapeHtml('"\'<>'), '&quot;&#39;&lt;&gt;');
});
test('preserva quebras de linha, acentuação e textos longos', () => {
  const long = 'Terapia, ação e reflexão 🙂\n' + 'revisão '.repeat(1500);
  const html = createPrintDocument(buildReport({ flow: 'weekly', answers: { week_summary:long } }));
  assert.ok(html.includes(long));
  assert.match(html, /white-space:pre-wrap/);
  assert.match(html, /@page\{size:A4/);
  assert.match(html, /overflow-wrap:anywhere/);
});
test('metadados e notas também passam por escape', () => {
  const html = createPrintDocument(buildReport({ flow:'weekly', answers:{ week_summary:'ok' }, nickname:'X<&', finalNote:'<img src=x onerror=alert(1)>' }));
  assert.ok(!html.includes('<img src=x'));
  assert.match(html, /X&lt;&amp;/);
});
