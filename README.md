# Pré-Sessão 🌿

**Organize seus pensamentos. Converse sobre o que importa.**

Aplicativo web estático, mobile-first, acolhedor e privado para preparar a **primeira sessão de psicoterapia** ou organizar assuntos para a **próxima sessão**, com revisão seletiva e relatório pronto para impressão / salvamento como PDF.

> **Versão:** `v0.1.0-alpha` · **Status:** piloto com dados fictícios · **Demo planejada:** `https://danielrosajr.github.io/pre-sessao/` (não significa que já esteja publicada)

## O que você pode fazer

- Escolher **Primeira sessão** ou **Próxima sessão**; a segunda tem **modo rápido (5 perguntas)**.
- Preencher apenas os campos que desejar, sem login e sem salvar em servidor.
- Navegar por etapas, voltar, editar e apagar respostas.
- Revisar todas as respostas e reordenar os tópicos com os botões ↑/↓.
- Marcar cada resposta como **incluir no PDF** ou **guardar apenas nesta sessão**.
- Manter a pergunta “prefere conversar pessoalmente” **fora do relatório por padrão**.
- Acrescentar identificação, datas e nota final opcionais.
- Visualizar o documento com quebras de linha e caracteres acentuados preservados.
- Usar **Imprimir / Salvar PDF** no navegador; salvar manualmente e compartilhar apenas se desejar.
- Utilizar tema claro/escuro/sistema e tutorial contextual de 7 etapas com ←/→ e Esc.
- Apagar os dados de preenchimento em um único comando, com confirmação.

## Privacidade e limites

Os textos ficam apenas no estado temporário da página, sem `localStorage`, `IndexedDB`, backend ou API externa de processamento. **Apenas a preferência de tema** é guardada em `localStorage`, usando a chave `pre-sessao-theme`. Nenhum formulário envia conteúdo para servidores; nenhum PDF é enviado automaticamente. Recarregar ou fechar a página faz perder o rascunho.

O navegador, o sistema operacional e o GitHub Pages ainda podem tratar dados técnicos de acesso ou de arquivos salvos. Não se deve descrever a ferramenta como anônima ou infalivelmente segura. Não se trata de diagnóstico, triagem de crise, prontuário ou terapia. Consulte [PRIVACY.md](./PRIVACY.md).

## Como funciona o PDF

O documento HTML A4 é **criado localmente** a partir **somente** das respostas escolhidas, com CSS de impressão, quebras de páginas, texto longo e caracteres Unicode. A prévia aparece dentro da aplicação. O botão **Imprimir / Salvar PDF** abre a impressão do navegador; selecione **Salvar como PDF**. O nome sugerido é `pre-sessao-resumo.pdf`. Não há *download direto* nem envio nativo automático do arquivo na v0.1 — depois de salvar, use o menu Compartilhar do dispositivo.

**Motivo da escolha:** utilizar impressão nativa elimina a necessidade de enviar dados a serviços remotos ou carregar bibliotecas de PDF/fontes; mantém compatibilidade com acentos e textos longos. O nome do arquivo final pode variar conforme o navegador. Em uso real, teste o diálogo de impressão do dispositivo escolhido.

## Tecnologia e arquitetura

- **Vue 3.5.13**, distribuição global empacotada localmente em `public/vendor/vue.global.js` (MIT); **nenhuma dependência de rede em tempo de execução**.
- **JavaScript com módulos ES**, CSS responsivo, sem backend nem ferramentas de telemetria.
- **Sem Vite no build desta alpha:** não é necessário instalar pacotes para servir ou publicar. A escolha intencional facilita uso pelo GitHub no navegador. O roteiro opcional de migração para Vite está no [COMO_PUBLICAR.md](./COMO_PUBLICAR.md).
- **GitHub Actions** executa testes sem dependências, prepara a pasta estática e publica no Pages.

### Estrutura

```text
pre-sessao/
├── .github/workflows/pages.yml      # testes e deploy automatizado
├── public/vendor/vue.global.js      # Vue 3 incluído localmente (MIT)
├── src/
│   ├── app.js                        # interface, estado temporário, tutorial
│   ├── questionnaires.js             # perguntas configuráveis
│   ├── report.js                     # filtros, privacidade e HTML do relatório
│   └── styles.css                    # layout e temas
├── tests/report.test.js              # testes da lógica de exportação
├── index.html                        # aplicativo
├── privacy.html                      # política legível no site
├── favicon.svg
├── README.md
├── CHANGELOG.md
├── ROADMAP.md
├── PRIVACY.md
├── COMO_PUBLICAR.md
└── RELEASE_NOTES.md
```

### Teste local sem instalar nada

1. Extraia o ZIP.
2. Abra a pasta em um terminal **somente para servir localmente** e execute `python3 -m http.server 8080`.
3. Acesse `http://localhost:8080/`.
4. Para testes automatizados de lógica: `node --test tests/*.test.js` (Node 18+).

> Abrir `index.html` com duplo clique pode falhar devido às regras de módulos JavaScript em arquivos locais. Use um servidor HTTP local ou o GitHub Pages. **Não é necessário Git no terminal.**

## Antes de apresentar a profissionais

Teste com **dados fictícios** primeiro, revise a clareza das perguntas com profissionais de psicologia, avalie acessibilidade com usuários reais e verifique a geração de PDF em diferentes navegadores. Evite inserir dados clínicos reais até que o projeto tenha passado por revisão apropriada.

## Publicar no GitHub

Passo a passo com interface web, Actions, tags, releases e restauração: [COMO_PUBLICAR.md](./COMO_PUBLICAR.md).

## Licença

Código próprio disponibilizado sob MIT. Vue.js é um projeto de terceiros sob licença MIT; avisos em [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
