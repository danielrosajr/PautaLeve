import { questionnaires, getSections } from './questionnaires.js';
import { answeredEntries, isIncluded, buildReport, createPrintDocument } from './report.js';

const { createApp, ref, reactive, computed, nextTick, onMounted, onUnmounted, watch } = window.Vue;

const sampleAnswers = {
  week_summary: 'Foi uma semana com momentos tranquilos e alguns imprevistos.',
  important_events: 'Tive uma conversa que gostaria de retomar na sessão.',
  top_priority: 'Quero falar sobre como organizar melhor meus próximos dias.',
  only_in_person: 'Este assunto fica somente comigo durante o preenchimento.',
};

const tourSteps = [
  { view: 'home', target: 'home-title', title: 'Um espaço para se preparar', body: 'O Pré-Sessão ajuda a organizar assuntos para conversar com seu psicólogo. Não interpreta o que você escreve.' },
  { view: 'home', target: 'start-options', title: 'Escolha por onde começar', body: 'Você pode preparar sua primeira sessão ou organizar os últimos dias. A versão semanal também tem um modo rápido.' },
  { view: 'form', target: 'question-hint', title: 'Tudo é opcional', body: 'Você pode escrever pouco, muito ou simplesmente pular qualquer pergunta. Suas respostas não são enviadas a ninguém.' },
  { view: 'form', target: 'form-navigation', title: 'Avance no seu ritmo', body: 'Use Voltar e Próximo para percorrer as seções. Você pode editar tudo antes de preparar seu relatório.' },
  { view: 'review', target: 'review-list', title: 'Você controla o conteúdo', body: 'Na revisão, escolha o que entra no documento. O que estiver marcado como privado fica fora do relatório.' },
  { view: 'preview', target: 'preview-area', title: 'Veja antes de salvar', body: 'Aqui aparece somente o conteúdo selecionado. Esta demonstração utiliza textos fictícios, não seus dados.' },
  { view: 'preview', target: 'preview-actions', title: 'Salvar e compartilhar é sua decisão', body: 'Escolha Imprimir / Salvar PDF e, na janela do navegador, selecione Salvar como PDF. Depois você decide com quem compartilhar.' },
];

function todayISO() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function storedTheme() {
  try { const v = localStorage.getItem('pre-sessao-theme'); return ['light','dark','system'].includes(v) ? v : 'system'; } catch { return 'system'; }
}

const app = createApp({
  setup() {
    const screen = ref('home');
    const flow = ref('weekly');
    const quick = ref(false);
    const sectionIndex = ref(0);
    const answers = reactive({});
    const included = reactive({});
    const order = ref([]);
    const nickname = ref('');
    const sessionDate = ref('');
    const prepDate = ref(todayISO());
    const finalNote = ref('');
    const theme = ref(storedTheme());
    const isDark = ref(false);
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const statusText = ref('');
    const promptVisible = ref(false);
    const promptTitle = ref('');
    const promptBody = ref('');
    let pendingAction = null;
    const editingId = ref(null);
    const editValue = ref('');
    const iframe = ref(null);
    const inTour = ref(false);
    const tourStep = ref(0);
    const tourRect = ref(null);
    const tourCard = ref({ left: 20, top: 20 });
    let tourSnapshot = null;

    const sections = computed(() => getSections(flow.value, quick.value));
    const currentSection = computed(() => sections.value[Math.min(sectionIndex.value, Math.max(0, sections.value.length - 1))]);
    const formProgress = computed(() => Math.round(((sectionIndex.value + 1) / Math.max(1, sections.value.length)) * 100));
    const entries = computed(() => answeredEntries(flow.value, answers, order.value));
    const reviewEntries = computed(() => inTour.value ? answeredEntries('weekly', sampleAnswers) : entries.value);
    const displayedReport = computed(() => inTour.value
      ? buildReport({ flow: 'weekly', answers: sampleAnswers, included: { only_in_person: false }, prepDate: todayISO() })
      : buildReport({ flow: flow.value, answers, included, order: order.value, nickname: nickname.value, sessionDate: sessionDate.value, prepDate: prepDate.value, finalNote: finalNote.value }));
    const reportHtml = computed(() => createPrintDocument(displayedReport.value));
    const selectedCount = computed(() => displayedReport.value.items.length);
    const totalFilled = computed(() => entries.value.length);
    const privateCount = computed(() => entries.value.filter(entry => !isIncluded(entry, included)).length);
    const hasDraft = computed(() => totalFilled.value > 0 || nickname.value.trim() || finalNote.value.trim() || sessionDate.value);
    const activeTour = computed(() => tourSteps[tourStep.value] || tourSteps[0]);
    const tourIsLast = computed(() => tourStep.value === tourSteps.length - 1);

    function setTheme(next) {
      theme.value = next;
      try { localStorage.setItem('pre-sessao-theme', next); } catch { /* armazenamento desabilitado */ }
      updateTheme();
    }
    function updateTheme() {
      isDark.value = theme.value === 'dark' || (theme.value === 'system' && mediaQuery.matches);
      document.documentElement.dataset.theme = isDark.value ? 'dark' : 'light';
    }
    function toast(message) {
      statusText.value = message;
    }
    function requestConfirm(title, body, action) {
      promptTitle.value = title;
      promptBody.value = body;
      pendingAction = action;
      promptVisible.value = true;
      nextTick(() => document.querySelector('#confirm-cancel')?.focus());
    }
    function cancelPrompt() { promptVisible.value = false; pendingAction = null; }
    function confirmPrompt() {
      const action = pendingAction;
      promptVisible.value = false; pendingAction = null;
      action?.();
    }
    function clearAnswers() {
      for (const key of Object.keys(answers)) delete answers[key];
      for (const key of Object.keys(included)) delete included[key];
      order.value = []; nickname.value = ''; sessionDate.value = ''; prepDate.value = todayISO(); finalNote.value = '';
      editingId.value = null;
    }
    function resetApp() {
      requestConfirm('Apagar todas as respostas?', 'Os textos e as escolhas desta sessão serão apagados deste navegador e não poderão ser recuperados.', () => {
        clearAnswers(); screen.value = 'home'; sectionIndex.value = 0; toast('As respostas desta sessão foram apagadas.');
      });
    }
    function start(flowChoice, quickChoice = false) {
      const action = () => {
        clearAnswers(); flow.value = flowChoice; quick.value = quickChoice; sectionIndex.value = 0;
        screen.value = 'form'; toast('Você pode pular qualquer pergunta.'); focusMain();
      };
      if (hasDraft.value) requestConfirm('Começar outro questionário?', 'As respostas atuais serão apagadas antes de começar.', action);
      else action();
    }
    function goHome() {
      screen.value = 'home'; focusMain();
    }
    function resumeDraft() {
      screen.value = 'form'; focusMain(); toast('Seu rascunho continua aberto nesta aba.');
    }
    function focusMain() {
      nextTick(() => { document.getElementById('main-content')?.focus({ preventScroll: true }); window.scrollTo({ top: 0, behavior: 'instant' }); });
    }
    function setAnswer(id, value) {
      answers[id] = value;
      const q = currentSection.value?.questions.find(question => question.id === id);
      if (q && q.privateByDefault && !Object.hasOwn(included, id)) included[id] = false;
    }
    function goStep(delta) {
      sectionIndex.value = Math.max(0, Math.min(sections.value.length - 1, sectionIndex.value + delta));
      focusMain();
    }
    function review() { screen.value = 'review'; focusMain(); }
    function startEditing(entry) { editingId.value = entry.id; editValue.value = entry.value; nextTick(() => document.getElementById(`edit-${entry.id}`)?.focus()); }
    function saveEdit() { if (editingId.value) { answers[editingId.value] = editValue.value; toast('Resposta atualizada.'); } editingId.value = null; }
    function deleteAnswer(entry) {
      requestConfirm('Remover esta resposta?', 'A resposta será apagada do preenchimento e do relatório.', () => {
        delete answers[entry.id]; delete included[entry.id]; order.value = order.value.filter(id => id !== entry.id);
        editingId.value = null; toast('Resposta removida.');
      });
    }
    function switchIncluded(entry) {
      included[entry.id] = !isIncluded(entry, included);
      toast(included[entry.id] ? 'A resposta foi incluída no relatório.' : 'A resposta será mantida apenas nesta sessão.');
    }
    function shiftEntry(id, amount) {
      const ids = entries.value.map(e => e.id);
      const index = ids.indexOf(id), next = index + amount;
      if (index < 0 || next < 0 || next >= ids.length) return;
      [ids[index], ids[next]] = [ids[next], ids[index]]; order.value = ids;
    }
    function preview() {
      if (!selectedCount.value && !inTour.value) { toast('Selecione pelo menos uma resposta para gerar um relatório.'); return; }
      screen.value = 'preview'; focusMain();
    }
    function printReport() {
      if (selectedCount.value === 0) { toast('Selecione pelo menos uma resposta antes de imprimir.'); return; }
      // A impressão nativa preserva caracteres Unicode, parágrafos longos e várias páginas.
      const contents = reportHtml.value;
      let win = null;
      try { win = window.open('', '_blank'); } catch { /* navegador bloqueou */ }
      if (win) {
        win.document.open(); win.document.write(contents); win.document.close();
        // Dispara a impressão apenas uma vez, independentemente de como o navegador carregue a aba.
        let printed = false;
        const doPrint = () => {
          if (printed || win.closed) return;
          printed = true;
          win.focus();
          win.print();
        };
        win.addEventListener('load', doPrint, { once: true });
        window.setTimeout(doPrint, 500);
        toast('Na janela de impressão, escolha “Salvar como PDF” ou uma impressora.');
      } else if (iframe.value?.contentWindow) {
        iframe.value.contentWindow.focus(); iframe.value.contentWindow.print();
        toast('Na janela de impressão, escolha “Salvar como PDF”.');
      } else toast('O navegador bloqueou a impressão. Permita pop-ups ou tente novamente.');
    }
    function shareHelp() {
      toast('Salve o PDF e compartilhe o arquivo pelo aplicativo de sua preferência. Nada é enviado automaticamente.');
    }
    function onBeforeLeave(event) {
      if (!hasDraft.value) return;
      event.preventDefault(); event.returnValue = '';
    }
    function keyHandler(event) {
      if (promptVisible.value && event.key === 'Escape') { cancelPrompt(); return; }
      if (!inTour.value) return;
      if (event.key === 'Escape') { event.preventDefault(); endTour(); }
      else if (event.key === 'ArrowRight') { event.preventDefault(); nextTour(); }
      else if (event.key === 'ArrowLeft') { event.preventDefault(); prevTour(); }
    }
    function startTour() {
      if (inTour.value) return;
      tourSnapshot = { screen: screen.value, flow: flow.value, quick: quick.value, sectionIndex: sectionIndex.value };
      inTour.value = true; tourStep.value = 0; applyTourStep();
    }
    function endTour() {
      inTour.value = false; tourRect.value = null;
      if (tourSnapshot) {
        screen.value = tourSnapshot.screen; flow.value = tourSnapshot.flow;
        quick.value = tourSnapshot.quick; sectionIndex.value = tourSnapshot.sectionIndex;
      }
      tourSnapshot = null; focusMain();
    }
    function nextTour() { if (tourIsLast.value) endTour(); else { tourStep.value++; applyTourStep(); } }
    function prevTour() { if (tourStep.value > 0) { tourStep.value--; applyTourStep(); } }
    async function applyTourStep() {
      const stage = activeTour.value;
      screen.value = stage.view;
      if (stage.view === 'form' || stage.view === 'review') { flow.value = 'weekly'; quick.value = false; sectionIndex.value = 0; }
      await nextTick();
      const element = document.getElementById(stage.target);
      element?.scrollIntoView({ block: 'center', behavior: 'instant' });
      requestAnimationFrame(() => requestAnimationFrame(positionTour));
    }
    function positionTour() {
      if (!inTour.value) return;
      const element = document.getElementById(activeTour.value.target);
      if (!element) return;
      const r = element.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight;
      const left = Math.max(12, r.left - 6), top = Math.max(8, r.top - 6);
      const width = Math.min(r.width + 12, vw - left - 12), height = Math.min(r.height + 12, vh - top - 8);
      tourRect.value = { left, top, width, height };
      const cardWidth = Math.min(350, vw - 24), cardHeight = 220;
      const below = top + height + 15;
      tourCard.value = { left: Math.min(Math.max(12, left), vw - cardWidth - 12), top: below + cardHeight < vh ? below : Math.max(12, top - cardHeight - 16) };
    }
    function resizeTour() { if (inTour.value) positionTour(); }

    onMounted(() => {
      updateTheme(); mediaQuery.addEventListener?.('change', updateTheme);
      window.addEventListener('beforeunload', onBeforeLeave);
      window.addEventListener('keydown', keyHandler);
      window.addEventListener('resize', resizeTour);
      window.addEventListener('scroll', resizeTour, true);
    });
    onUnmounted(() => {
      mediaQuery.removeEventListener?.('change', updateTheme);
      window.removeEventListener('beforeunload', onBeforeLeave);
      window.removeEventListener('keydown', keyHandler);
      window.removeEventListener('resize', resizeTour);
      window.removeEventListener('scroll', resizeTour, true);
    });
    watch([screen, tourStep], () => { if (inTour.value) nextTick(positionTour); });

    return { screen, flow, quick, sectionIndex, answers, included, order, nickname, sessionDate, prepDate, finalNote, theme, isDark,
      questionnaires, sections, currentSection, formProgress, entries, reviewEntries, reportHtml, selectedCount, totalFilled, privateCount, hasDraft,
      editingId, editValue, iframe, statusText, promptVisible, promptTitle, promptBody, inTour, tourStep, activeTour, tourIsLast, tourRect, tourCard, tourSteps,
      setTheme, start, goHome, resumeDraft, resetApp, setAnswer, goStep, review, startEditing, saveEdit, deleteAnswer, switchIncluded, shiftEntry, isIncluded,
      preview, printReport, shareHelp, startTour, nextTour, prevTour, endTour, cancelPrompt, confirmPrompt };
  },
  template: `
    <div class="page-shell">
      <a class="skip-link" href="#main-content">Pular para o conteúdo</a>
      <header class="site-header"><div class="header-content">
        <button class="brand" type="button" @click="goHome" aria-label="Pré-Sessão: ir ao início"><span class="brand-mark" aria-hidden="true"><span class="brand-mark-line"></span><span class="brand-mark-dot"></span></span><span class="brand-words"><strong>pré-sessão</strong><small>um lugar para organizar</small></span></button>
        <div class="header-actions"><span class="privacy-mini"><span aria-hidden="true">●</span> Sem conta. Sem envio de respostas.</span>
          <label class="theme-label"><span class="sr-only">Tema visual</span><select :value="theme" @change="setTheme($event.target.value)" aria-label="Tema visual"><option value="system">◐ Sistema</option><option value="light">☀ Claro</option><option value="dark">☾ Escuro</option></select></label>
          <button class="icon-button" type="button" @click="startTour" title="Abrir tutorial guiado" aria-label="Abrir tutorial guiado">?</button>
        </div>
      </div></header>
      <main id="main-content" tabindex="-1">
        <template v-if="screen === 'home'">
          <section class="hero container" aria-labelledby="home-title"><div class="eyebrow"><span class="eyebrow-line"></span> UM PEQUENO ESPAÇO PARA VOCÊ</div>
            <div class="hero-layout"><div><h1 id="home-title">O que você gostaria de <em>conversar</em> na sua próxima sessão?</h1>
              <p class="lead">Às vezes é difícil lembrar de tudo ou encontrar as palavras certas. Organize seus pensamentos com calma e prepare um resumo para compartilhar, se desejar.</p>
              <div class="hero-note"><span aria-hidden="true">✳</span><span>Não existe resposta certa, nem quantidade mínima de texto. Este espaço é seu.</span></div></div>
              <aside class="hero-illustration" aria-hidden="true"><div class="paper-back"></div><div class="paper-front"><div class="paper-symbol">✳</div><div class="paper-row long"></div><div class="paper-row medium"></div><div class="paper-row short"></div><div class="paper-squiggle">〰</div></div><span class="orbit-dot dot-one"></span><span class="orbit-dot dot-two"></span><span class="orbit-circle"></span></aside>
            </div>
          </section>
          <section v-if="hasDraft && !inTour" class="container resume-notice" aria-label="Rascunho temporário"><div><strong>✳ Você tem um rascunho nesta aba.</strong><p>Suas respostas continuam aqui enquanto você não recarregar ou fechar a página.</p></div><button type="button" class="btn btn-secondary" @click="resumeDraft">Continuar preenchimento →</button></section>
          <section class="choice-section container" aria-labelledby="choice-title"><div class="section-heading"><div><p class="micro-label">POR ONDE COMEÇAR</p><h2 id="choice-title">Escolha o que faz sentido hoje.</h2></div><p>Você pode mudar de ideia depois.</p></div>
            <div id="start-options" class="choice-grid">
              <article class="choice-card"><div class="choice-top"><span class="card-icon coral">✺</span><span class="card-index">01 / CONHECER</span></div><h3>Primeira sessão</h3><p class="card-subtitle">Quero contar um pouco sobre mim.</p><p>Organize seu contexto, sua rotina e suas expectativas, do seu jeito.</p><button type="button" class="btn btn-dark card-action" @click="start('first')">Começar primeira sessão <span aria-hidden="true">↗</span></button></article>
              <article class="choice-card highlighted"><div class="choice-top"><span class="card-icon green">↝</span><span class="card-index">02 / CONTINUAR</span></div><h3>Próxima sessão</h3><p class="card-subtitle">Quero organizar minha semana.</p><p>Relembre acontecimentos, sentimentos e o que deseja conversar.</p><button type="button" class="btn btn-dark card-action" @click="start('weekly')">Preparar minha semana <span aria-hidden="true">↗</span></button><button type="button" class="btn-link" @click="start('weekly', true)">Ou usar o modo rápido (5 perguntas) <span aria-hidden="true">→</span></button></article>
            </div>
          </section>
          <section class="how-section container"><div><p class="micro-label">SIMPLES ASSIM</p><h2>Você decide o que fica<br>e o que vai.</h2><p>Nenhuma resposta é enviada automaticamente ao psicólogo.</p></div>
            <ol class="how-steps"><li><span>01</span> Responda somente o que desejar.</li><li><span>02</span> Revise e edite suas respostas.</li><li><span>03</span> Escolha o que entra no relatório.</li><li><span>04</span> Salve como PDF ou imprima.</li><li><span>05</span> Compartilhe apenas se quiser.</li></ol>
          </section>
          <section class="container privacy-panel"><div class="privacy-panel-icon" aria-hidden="true">◈</div><div><h2>Seus pensamentos merecem privacidade.</h2><p>Suas respostas são preparadas no seu dispositivo. Você escolhe o que incluir no relatório e com quem compartilhar. Tenha cuidado ao salvar ou enviar informações pessoais.</p><p class="subtle">Sem conta, sem armazenamento remoto e sem salvamento automático dos textos. Fechar ou recarregar a página faz perder as respostas.</p></div><a class="text-link" href="./privacy.html" target="_blank" rel="noopener">Ver política de privacidade ↗</a></section>
        </template>

        <template v-else-if="screen === 'form'">
          <section class="container flow-layout"><div class="flow-top"><button type="button" class="backlink" @click="goHome">← Voltar ao início</button><span class="flow-chip">{{ quick ? 'MODO RÁPIDO' : 'PREENCHIMENTO LIVRE' }}</span></div>
            <div class="flow-heading"><div><p class="micro-label">{{ flow === 'first' ? 'PRIMEIRA SESSÃO' : 'PRÓXIMA SESSÃO' }}</p><h1>{{ flow === 'first' ? 'Vamos começar por você.' : 'Como foram seus últimos dias?' }}</h1><p>{{ questionnaires[flow].subtitle }}</p></div><div class="progress-box"><strong>{{ String(sectionIndex + 1).padStart(2,'0') }} <span>/ {{ String(sections.length).padStart(2,'0') }}</span></strong><small>etapas</small></div></div>
            <div class="progress-track" role="progressbar" :aria-valuenow="sectionIndex + 1" :aria-valuemax="sections.length" aria-valuemin="1" :aria-label="'Etapa ' + (sectionIndex + 1) + ' de ' + sections.length"><div :style="{width: formProgress + '%'}"></div></div>
            <div class="form-layout"><aside class="form-sidebar"><p class="micro-label">NESTE QUESTIONÁRIO</p><ol class="step-list"><li v-for="(section,index) in sections" :key="section.id"><button type="button" :class="{ current: index === sectionIndex }" @click="sectionIndex=index"><span>{{ String(index+1).padStart(2,'0') }}</span>{{ section.title }}</button></li></ol><div class="sidebar-message">✳ <span>Você pode deixar qualquer pergunta em branco.</span></div></aside>
              <div class="form-card" v-if="currentSection"><div class="step-kicker">{{ currentSection.kicker }}</div><h2>{{ currentSection.title }}</h2><p class="form-description">{{ currentSection.description }}</p>
                <div id="question-hint" class="optional-hint"><span aria-hidden="true">✓</span> Todas as perguntas são opcionais. Responda apenas o que desejar.</div>
                <div id="answer-field" class="question-stack"><div v-for="question in currentSection.questions" :key="question.id" class="question"><label :for="'question-'+question.id">{{ question.label }}</label><p v-if="question.hint" class="question-hint">{{ question.hint }}</p><textarea :id="'question-'+question.id" rows="3" :value="answers[question.id] || ''" @input="setAnswer(question.id,$event.target.value)" :placeholder="question.placeholder || 'Escreva aqui, se quiser…'" :aria-describedby="question.privateByDefault ? 'private-info-'+question.id : undefined"></textarea><div v-if="question.privateByDefault" :id="'private-info-'+question.id" class="private-marker">◈ Fora do relatório por padrão</div></div></div>
                <div id="form-navigation" class="form-navigation"><button type="button" class="btn btn-secondary" @click="sectionIndex === 0 ? goHome() : goStep(-1)">← {{ sectionIndex === 0 ? 'Início' : 'Voltar' }}</button><span class="navigation-counter">{{ sectionIndex + 1 }} de {{ sections.length }}</span><button v-if="sectionIndex < sections.length - 1" type="button" class="btn btn-dark" @click="goStep(1)">Próximo →</button><button v-else type="button" class="btn btn-dark" @click="review">Revisar respostas →</button></div>
              </div>
            </div><div class="bottom-actions"><button type="button" class="text-button danger-text" @click="resetApp">Apagar e recomeçar</button><span>O preenchimento não é salvo automaticamente.</span></div>
          </section>
        </template>

        <template v-else-if="screen === 'review'">
          <section class="container review-layout"><button type="button" class="backlink" @click="screen='form'">← Voltar ao questionário</button><div class="review-header"><div><p class="micro-label">ANTES DE GERAR O DOCUMENTO</p><h1>O que você quer <em>compartilhar?</em></h1><p>Revise suas palavras. Ajuste a ordem e mantenha fora do PDF qualquer conteúdo que prefira guardar.</p></div><div class="review-metric"><strong>{{ inTour ? 4 : totalFilled }}</strong><span>respostas preenchidas</span></div></div>
            <div class="review-grid"><div><div class="review-subheading"><div><h2>Suas respostas</h2><p>O primeiro item da lista aparece primeiro no relatório.</p></div><span class="count-tag">{{ inTour ? 'Exemplo fictício' : totalFilled + ' preenchidas' }}</span></div>
              <div id="review-list" class="review-list"><template v-if="reviewEntries.length"><article v-for="(entry, index) in reviewEntries" :key="entry.id" class="review-item" :class="{ 'not-included': !isIncluded(entry, inTour ? {only_in_person:false}:included) }"><div class="review-item-top"><span class="review-number">{{ String(index+1).padStart(2,'0') }}</span><span class="review-category">{{ entry.sectionTitle }}</span><div class="reorder-actions"><button type="button" :disabled="index === 0 || inTour" @click="shiftEntry(entry.id, -1)" :aria-label="'Mover '+ entry.label +' para cima'" title="Mover para cima">↑</button><button type="button" :disabled="index === reviewEntries.length - 1 || inTour" @click="shiftEntry(entry.id, 1)" :aria-label="'Mover '+ entry.label +' para baixo'" title="Mover para baixo">↓</button></div></div>
                  <h3>{{ entry.label }}</h3><template v-if="editingId === entry.id && !inTour"><label class="sr-only" :for="'edit-'+entry.id">Editar resposta</label><textarea :id="'edit-'+entry.id" v-model="editValue" rows="4"></textarea><div class="item-actions"><button type="button" class="small-action" @click="saveEdit">Salvar edição</button><button type="button" class="small-action muted-action" @click="editingId=null">Cancelar</button></div></template>
                  <template v-else><p class="answer-text">{{ entry.value }}</p><div class="item-actions"><button type="button" class="small-action" :disabled="inTour" @click="startEditing(entry)">✎ Editar</button><button type="button" class="small-action muted-action" :disabled="inTour" @click="deleteAnswer(entry)">Remover</button></div></template>
                  <div class="include-row"><label class="check-label"><input type="checkbox" :checked="isIncluded(entry, inTour ? {only_in_person:false}:included)" :disabled="inTour" @change="switchIncluded(entry)" /><span>{{ isIncluded(entry, inTour ? {only_in_person:false}:included) ? 'Incluir no PDF' : 'Guardar apenas para mim nesta sessão' }}</span></label><span class="include-status" :class="{private:!isIncluded(entry, inTour ? {only_in_person:false}:included)}">{{ isIncluded(entry, inTour ? {only_in_person:false}:included) ? 'Vai para o PDF' : 'Não será compartilhado' }}</span></div>
                </article></template><div v-else class="empty-state"><span aria-hidden="true">✳</span><h3>Ainda não há respostas.</h3><p>Volte ao questionário para anotar ao menos um assunto antes de gerar o PDF.</p><button class="btn btn-secondary" type="button" @click="screen='form'">Voltar às perguntas</button></div></div></div>
              <aside class="review-aside"><div class="aside-card"><h2>Dados do relatório</h2><p>Todos são opcionais. Não coloque informações que prefira não compartilhar.</p><label for="meta-name">Nome ou apelido</label><input id="meta-name" v-model="nickname" type="text" autocomplete="off" placeholder="Como deseja se identificar" /><label for="meta-date">Data da sessão</label><input id="meta-date" v-model="sessionDate" type="date" /><label for="meta-prep">Data de preparação</label><input id="meta-prep" v-model="prepDate" type="date" /><label for="meta-note">Observação final</label><textarea id="meta-note" v-model="finalNote" placeholder="Um lembrete opcional para o relatório…" rows="4"></textarea></div><div class="aside-card summary-card"><p class="micro-label">SEU DOCUMENTO</p><div class="summary-line"><span>Assuntos selecionados</span><strong>{{ selectedCount }}</strong></div><div class="summary-line"><span>Guardados apenas aqui</span><strong>{{ inTour ? 1 : privateCount }}</strong></div><p class="fine-print">Somente os assuntos selecionados aparecerão na prévia e no PDF.</p><button class="btn btn-dark full" type="button" :disabled="selectedCount===0 && !inTour" @click="preview">Visualizar relatório →</button></div><button type="button" class="text-button danger-text" @click="resetApp">Apagar todas as respostas</button></aside>
            </div>
          </section>
        </template>

        <template v-else-if="screen === 'preview'">
          <section class="container preview-layout"><button type="button" class="backlink" @click="screen='review'">← Voltar à revisão</button><div class="preview-heading"><div><p class="micro-label">DOCUMENTO PRONTO PARA CONFERIR</p><h1>O seu resumo, <em>do seu jeito.</em></h1><p>Leia antes de salvar. O documento contém apenas as respostas selecionadas.</p></div><div class="preview-count">{{ selectedCount }} {{ selectedCount === 1 ? 'assunto' : 'assuntos' }} no relatório</div></div>
            <div class="preview-grid"><div id="preview-area" class="preview-frame-shell"><div class="preview-frame-title"><span>◈ PRÉVIA DO DOCUMENTO</span><span>A4 · impressão</span></div><iframe ref="iframe" :srcdoc="reportHtml" title="Prévia do relatório para impressão" class="pdf-preview"></iframe></div><aside class="preview-side"><div id="preview-actions" class="preview-instructions"><h2>Salvar ou imprimir</h2><p>O PDF é preparado pelo navegador no seu próprio dispositivo.</p><ol><li>Clique em <strong>Imprimir / Salvar PDF</strong>.</li><li>Na janela de impressão, escolha <strong>Salvar como PDF</strong> como destino.</li><li>Salve preferencialmente com o nome <code>pre-sessao-resumo.pdf</code>.</li></ol><button class="btn btn-dark full" type="button" @click="printReport">↗ Imprimir / Salvar PDF</button><button class="btn btn-secondary full" type="button" @click="screen='review'">← Ajustar meu relatório</button><hr /><h3>Compartilhar, se desejar</h3><p>Depois de salvar, utilize o compartilhamento do seu celular ou envie o arquivo pelo canal combinado com seu psicólogo.</p><button type="button" class="btn-link" @click="shareHelp">Como compartilhar com segurança? →</button></div><div class="safety-note"><strong>◈ Importante</strong><p>O documento não é enviado automaticamente. Depois de salvo, cuide do arquivo no seu dispositivo.</p></div></aside></div>
          </section>
        </template>
      </main>
      <footer class="site-footer"><div class="container footer-inner"><div><span class="footer-brand">✳ pré-sessão</span><p>Organize seus pensamentos. Converse sobre o que importa.</p></div><div class="footer-right"><span>v0.1.0-alpha · feito para organizar, não diagnosticar</span><button type="button" class="footer-link" @click="startTour">Como usar?</button></div></div></footer>
      <div v-if="statusText" class="toast" role="status" aria-live="polite"><span aria-hidden="true">✳</span>{{ statusText }}<button type="button" @click="statusText=''" aria-label="Fechar aviso">×</button></div>
      <div v-if="promptVisible" class="modal-overlay" @click.self="cancelPrompt"><div class="modal-card" role="dialog" aria-modal="true" :aria-labelledby="'confirm-title'"><div class="modal-symbol">!</div><h2 id="confirm-title">{{ promptTitle }}</h2><p>{{ promptBody }}</p><div class="modal-actions"><button type="button" id="confirm-cancel" class="btn btn-secondary" @click="cancelPrompt">Manter respostas</button><button type="button" class="btn btn-danger" @click="confirmPrompt">Sim, apagar</button></div></div></div>
      <div v-if="inTour" class="tour-root" role="dialog" aria-modal="true" aria-labelledby="tour-title"><template v-if="tourRect"><div class="tour-mask" :style="{left:'0px',top:'0px',width:'100%',height:tourRect.top+'px'}"></div><div class="tour-mask" :style="{left:'0px',top:tourRect.top+'px',width:tourRect.left+'px',height:tourRect.height+'px'}"></div><div class="tour-mask" :style="{left:(tourRect.left+tourRect.width)+'px',top:tourRect.top+'px',right:'0px',height:tourRect.height+'px'}"></div><div class="tour-mask" :style="{left:'0px',top:(tourRect.top+tourRect.height)+'px',width:'100%',bottom:'0px'}"></div><div class="tour-highlight" :style="{left:tourRect.left+'px',top:tourRect.top+'px',width:tourRect.width+'px',height:tourRect.height+'px'}"></div></template><div v-else class="tour-mask full-mask"></div>
        <div class="tour-card" :style="{left:tourCard.left+'px',top:tourCard.top+'px'}"><div class="tour-meta"><span>TUTORIAL GUIADO</span><span>{{ tourStep+1 }} / {{ tourSteps.length }}</span></div><h2 id="tour-title">{{ activeTour.title }}</h2><p>{{ activeTour.body }}</p><div class="tour-actions"><button type="button" class="tour-skip" @click="endTour">Pular tutorial</button><div><button type="button" class="tour-arrow" :disabled="tourStep===0" @click="prevTour" aria-label="Passo anterior">←</button><button type="button" class="tour-next" @click="nextTour">{{ tourIsLast ? 'Concluir' : 'Próximo →' }}</button></div></div><p class="tour-shortcuts">← → para navegar · Esc para sair</p></div>
      </div>
    </div>
  `,
});

app.mount('#app');
