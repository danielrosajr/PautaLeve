# Testes e checklist de validação — v0.1.0-alpha

## Automatizados

Execute `node --test tests/*.test.js` (Node 18+). O GitHub Actions executará estes testes em cada commit da branch `main`.

Casos cobertos: perguntas não obrigatórias, modo rápido de 5 perguntas, filtros de questionários, exclusão seletiva, proteção da resposta privada por padrão, reordenação, edição no relatório, escape de HTML, Unicode e quebras de linha, metadados opcionais.

## Verificações de navegador feitas no desenvolvimento

O fluxo da interface foi verificado com Chromium em desktop e viewport de celular, por meio de um teste de montagem do Vue com os mesmos módulos JavaScript e CSS do pacote:

- Inicialização da interface com duas escolhas.
- Fluxo rápido com perguntas, revisão, edição, exclusão, ocultação seletiva e prévia em iframe.
- Limpeza dos dados com confirmação.
- Tutorial contextual de 7 passos e restauração da tela original.
- Tema escuro e viewport móvel sem rolagem horizontal inesperada.
- Nenhum erro de JavaScript detectado nas interações exercitadas.

A geração de PDF foi verificada em Chromium com um texto fictício longo: **4 páginas A4**, com extração de acentos e verificação visual da primeira e última página. Isso confirma esse cenário de teste, **não todos os dispositivos possíveis**.

### O que não foi validado em ambiente de produção

- Publicação efetiva no GitHub Pages (repositório de destino não foi criado por esta entrega).
- Diálogos de impressão de Safari/iOS, Firefox e Android, especialmente permissões de pop-up.
- Testes com leitores de tela e grupos de pacientes voluntários.
- Auditoria formal de acessibilidade WCAG e avaliação ética por psicólogos.

## Testes manuais antes de liberar a outras pessoas

- [ ] Abrir no celular e no desktop, em pelo menos dois navegadores.
- [ ] Primeira sessão: preencher um campo de cada seção, voltar e editar.
- [ ] Próxima sessão: testar modo completo e modo rápido.
- [ ] Responder a pergunta “prefiro conversar pessoalmente” e verificar que **não aparece** no PDF até marcar a inclusão.
- [ ] Desmarcar uma resposta e conferir o desaparecimento imediato na prévia.
- [ ] Mover assuntos ↑ e ↓ e conferir a ordem na prévia.
- [ ] Digitar um texto muito longo, com emojis, linhas em branco, pontuação e acentos.
- [ ] Salvar como PDF, abrir o arquivo e conferir conteúdo e quebras de página.
- [ ] Garantir que nenhuma frase do campo privado apareça na prévia nem no arquivo salvo.
- [ ] Trocar para tema escuro, recarregar, verificar que só o tema permanece (e que as respostas desaparecem).
- [ ] Abrir o tutorial e percorrer com os botões e as teclas ←, → e Esc.
- [ ] Testar a restauração de uma sessão em andamento depois de abrir a página inicial.
- [ ] Apagar todas as respostas e conferir que o formulário fica limpo.
- [ ] Usar DevTools → Network e observar que digitar respostas não gera POST/requests com conteúdo dos campos.
- [ ] Confirmar que nenhum usuário real está sendo solicitado a inserir informações clínicas durante o piloto inicial.
