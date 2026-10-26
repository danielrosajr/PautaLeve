# Política de privacidade — Pré-Sessão v0.1.0-alpha

Data: 26 de outubro de 2026.

## O que é processado

Ao digitar uma resposta, o texto fica no **estado de execução da página** no navegador. Não há conta, banco de dados remoto, sincronização, análise de uso, publicidade ou APIs de interpretação psicológica. Não inserimos textos em URLs, cookies ou sistemas de análise.

O **único item persistido pela aplicação** é a configuração visual `pre-sessao-theme` (`system`, `light` ou `dark`) em `localStorage`.

## Relatórios

A montagem do relatório acontece no navegador, a partir das respostas escolhidas. Um item marcado como privado não integra o documento gerado. A pergunta “prefere conversar pessoalmente” fica de fora por padrão. O HTML utilizado para a prévia e impressão trata os textos dos campos como texto literal, evitando execução de HTML.

A impressão e a função “Salvar como PDF” são fornecidas pelo navegador/sistema operacional, que também determina onde o PDF é salvo. **Não existe envio automático de arquivos**. Usuários escolhem se e como compartilhar um PDF salvo.

## Limites reais de segurança

- Sem servidores de respostas **não significa** anonimato absoluto.
- Hospedagem e navegador podem tratar dados técnicos como IP e horários de acesso ao site, segundo suas próprias políticas.
- Outras pessoas com acesso ao dispositivo podem ver o conteúdo da tela, arquivos salvos, histórico de impressão ou cópias.
- O formulário pode continuar presente na memória da aba até a página ser descarregada. Ao recarregar, o rascunho não é restaurado.
- Não há criptografia de rascunhos persistentes porque **não existem rascunhos persistentes** nesta versão.
- A aplicação pode exibir uma confirmação padrão do navegador antes de sair caso haja um rascunho não salvo.

## Excluir dados

O botão **Apagar e recomeçar** remove as respostas e metadados do estado da aplicação. Fechar/recarregar também elimina o preenchimento atual. Arquivos PDF já salvos precisam ser apagados separadamente pelo próprio usuário.

Para limpar a preferência de tema, apague os dados do site no seu navegador; não é necessário para apagar respostas.

## Serviços de terceiros

Vue 3 está empacotado localmente (ver `THIRD_PARTY_NOTICES.md`). Não existem scripts ou fontes remotas de terceiros no aplicativo. O GitHub Pages processa a entrega de arquivos estáticos e pode produzir logs técnicos de acesso.

## Finalidade e limites profissionais

Pré-Sessão apoia organização e comunicação, **não** avaliação psicológica, diagnóstico, prontuário, recomendações de tratamento ou emergência. A publicação desta alpha é voltada para testes com dados fictícios e avaliação voluntária por profissional.
