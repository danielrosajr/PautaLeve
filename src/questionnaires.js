/** Definições públicas: jamais armazenar respostas dos usuários aqui. */
export const questionnaires = {
  first: {
    id: 'first', title: 'Primeira sessão', short: 'Quero contar um pouco sobre mim', subtitle: 'Um ponto de partida para conhecer seu contexto, no seu ritmo.',
    sections: [
      { id: 'about', title: 'Sobre mim', kicker: 'Começando a conversa', description: 'Compartilhe apenas aquilo que fizer sentido para você.', questions: [
        { id: 'called', label: 'Como você gostaria de ser chamado?', placeholder: 'O nome ou apelido que preferir' },
        { id: 'know_about_me', label: 'O que gostaria que seu psicólogo soubesse sobre você?' },
        { id: 'routine', label: 'Como descreveria sua rotina?' },
        { id: 'activities', label: 'Trabalha, estuda ou realiza outras atividades importantes?' },
        { id: 'family', label: 'Existem aspectos da sua vida familiar que gostaria de compartilhar?' },
      ] },
      { id: 'current', title: 'Minha vida atualmente', kicker: 'O momento presente', description: 'Não existe jeito certo de contar sua história.', questions: [
        { id: 'thoughts_now', label: 'Quais assuntos têm ocupado mais seus pensamentos?' },
        { id: 'difficulties', label: 'Existe alguma situação que vem causando dificuldade?' },
        { id: 'changes', label: 'Houve alguma mudança importante recentemente?' },
        { id: 'relations', label: 'Como descreveria seus relacionamentos e sua rede de apoio, se desejar comentar?' },
      ] },
      { id: 'goals', title: 'Objetivos e expectativas', kicker: 'O que você espera', description: 'Suas expectativas podem mudar ao longo do tempo.', questions: [
        { id: 'therapy_reason', label: 'O que motivou você a procurar terapia?' },
        { id: 'what_to_work', label: 'O que espera conseguir compreender ou trabalhar?' },
        { id: 'hard_subject', label: 'Existe algum tema que seja difícil de conversar?' },
        { id: 'respect_pace', label: 'Há algo que gostaria que o profissional respeitasse no ritmo das conversas?' },
      ] },
      { id: 'open', title: 'Espaço livre', kicker: 'Suas palavras', description: 'Um último espaço, sem formato obrigatório.', questions: [
        { id: 'add_anything', label: 'Existe alguma coisa que você gostaria de acrescentar?' },
      ] },
    ],
  },
  weekly: {
    id: 'weekly', title: 'Próxima sessão', short: 'Quero organizar minha semana', subtitle: 'Reúna os acontecimentos e assuntos que você gostaria de conversar.',
    sections: [
      { id: 'week', title: 'Minha semana', kicker: 'O que aconteceu', description: 'Vale escrever em poucas palavras ou contar com mais detalhes.', questions: [
        { id: 'week_summary', label: 'Como você descreveria sua semana?', quick: true },
        { id: 'important_events', label: 'Aconteceu algo importante?', quick: true },
        { id: 'hardest', label: 'O que foi mais difícil?' },
        { id: 'positive', label: 'Aconteceu algo positivo que gostaria de lembrar?' },
      ] },
      { id: 'feelings', title: 'Sentimentos e pensamentos', kicker: 'O que ficou com você', description: 'Use as palavras que fizerem mais sentido.', questions: [
        { id: 'feelings_now', label: 'Quais sentimentos estiveram mais presentes?', quick: true },
        { id: 'recurring_thought', label: 'Existe algum pensamento que vem se repetindo?' },
        { id: 'reaction', label: 'Alguma situação provocou uma reação que você gostaria de compreender melhor?' },
      ] },
      { id: 'people', title: 'Pessoas e acontecimentos', kicker: 'Convivência e relações', description: 'Não é necessário identificar outras pessoas.', questions: [
        { id: 'conversation', label: 'Houve alguma conversa ou interação importante?' },
        { id: 'social', label: 'Algum relacionamento ou situação social merece ser discutido?' },
        { id: 'unresolved', label: 'Existe algo que ficou sem resolução?' },
      ] },
      { id: 'next', title: 'Próxima sessão', kicker: 'O que levar para a conversa', description: 'Você escolhe o que quer trazer e o que prefere guardar.', questions: [
        { id: 'top_priority', label: 'Qual assunto gostaria de conversar primeiro?', quick: true },
        { id: 'ask', label: 'Existe alguma pergunta que gostaria de fazer?' },
        { id: 'dont_forget', label: 'O que você tem receio de esquecer?', quick: true },
        { id: 'only_in_person', label: 'Existe algo que prefere conversar pessoalmente, sem colocar no relatório?', privateByDefault: true, hint: 'Esta resposta ficará fora do relatório, a menos que você escolha incluí-la depois.' },
      ] },
      { id: 'notes', title: 'Observações livres', kicker: 'Se quiser acrescentar', description: 'Você pode deixar este espaço vazio.', questions: [
        { id: 'free_notes', label: 'Há algum outro assunto que gostaria de anotar?' },
      ] },
    ],
  },
};

export function getSections(flow = 'weekly', quick = false) {
  const sections = questionnaires[flow]?.sections || [];
  if (!quick || flow !== 'weekly') return sections;
  return sections.map(section => ({ ...section, questions: section.questions.filter(q => q.quick) })).filter(section => section.questions.length);
}

export function getQuestion(flow, id) {
  for (const section of questionnaires[flow]?.sections || []) {
    const question = section.questions.find(q => q.id === id);
    if (question) return { ...question, sectionTitle: section.title, sectionId: section.id };
  }
  return null;
}
