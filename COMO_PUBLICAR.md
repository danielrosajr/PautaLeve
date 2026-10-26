# Como publicar Pré-Sessão no GitHub Pages — sem Git no terminal

Destino **planejado**: `https://danielrosajr.github.io/pre-sessao/`

**Informações sugeridas para o GitHub**

| Campo | Valor |
|---|---|
| Nome do repositório | `pre-sessao` |
| Description | `A privacy-first web app that helps patients organize thoughts before therapy sessions and create shareable PDF summaries.` |
| Primeiro commit | `feat: initialize privacy-first pre-session questionnaire app` |
| Versão / tag | `v0.1.0-alpha` |
| Release title | `Pré-Sessão v0.1.0-alpha — Organize Your Session` |
| Release notes | Copiar `RELEASE_NOTES.md` (Português e Inglês) |

## 1. Criar o repositório

1. Entre em `https://github.com/new` na sua conta `danielrosajr`.
2. Digite **Repository name**: `pre-sessao`.
3. Cole a **Description** da tabela.
4. Escolha **Public**, requisito comum para GitHub Pages gratuito em contas sem recursos de Pages privados. O código pode ficar público, **nunca** as respostas dos usuários, que não são enviadas ao GitHub.
5. Você pode deixar **Add a README** desmarcado para facilitar o upload inicial. Clique **Create repository**.

## 2. Enviar os arquivos pela interface do navegador

1. Extraia o ZIP recebido em uma pasta.
2. Na página do repositório vazio, clique **uploading an existing file** ou **Add file → Upload files**.
3. Arraste **os arquivos e as pastas internas** de `pre-sessao-project` para a área de upload, mantendo as pastas `src`, `public` e `tests` com seus caminhos originais.
4. Confirme que `src/app.js` e `public/vendor/vue.global.js` aparecem **dentro das pastas**, não soltos na raiz.
5. O arquivo `.github/workflows/pages.yml` começa com ponto e pode não aparecer no seletor de arquivos do sistema. Se não for enviado, crie-o manualmente pelo próprio GitHub:
   - **Add file → Create new file**;
   - digite exatamente `.github/workflows/pages.yml` no nome;
   - cole o conteúdo do arquivo correspondente do ZIP;
   - clique **Commit changes**.
6. Ao finalizar o upload, use a mensagem `feat: initialize privacy-first pre-session questionnaire app` em **Commit changes**.
7. Confira a pasta raiz: `index.html`, `favicon.svg`, `privacy.html`, `src/`, `public/`, `tests/` e `.github/workflows/pages.yml`.

> Se o GitHub não aceitar arrastar uma pasta, abra a pasta e envie seus arquivos usando Upload files; dentro do navegador, navegue até o diretório correspondente do repositório antes de enviar. Nunca achate `src/` e `public/` em um único diretório.

## 3. Configurar o GitHub Pages e GitHub Actions

1. Abra **Settings → Pages** dentro do repositório.
2. Em **Build and deployment → Source**, selecione **GitHub Actions** (não "Deploy from a branch").
3. Em **Actions**, abra a execução **Publicar Pré-Sessão no GitHub Pages**, criada após o commit na branch `main`.
4. Caso a execução anterior tenha falhado por ainda não haver Pages habilitado, abra a execução e escolha **Re-run jobs**. Alternativamente, abra **Actions → Publicar Pré-Sessão no GitHub Pages → Run workflow**.
5. Aguarde os passos de testes, montagem dos arquivos e deploy exibirem sucesso (marcados em verde).
6. Em **Settings → Pages** a URL aparecerá quando estiver pronta. O endereço esperado é `https://danielrosajr.github.io/pre-sessao/`.

**Observação:** o deploy usa os arquivos estáticos reais do projeto e não depende de serviços externos além do GitHub Actions/Pages. O workflow executa `node --test`, prepara `_site/` e publica o resultado. Não existe banco de dados, token, chave de API ou segredo de implantação para configurar.

## 4. Vite: por que não é necessário agora e como configurar no futuro

Nesta **v0.1.0-alpha**, escolhemos Vue 3 **pré-empacotado localmente** em vez de exigir Vite. Assim a aplicação pode ser publicada diretamente pela interface web, **sem `npm install` e sem executar build**. O workflow `pages.yml` publica o site estático diretamente. Portanto não há um `vite.config.js` exigido na alpha.

Se o projeto migrar futuramente para módulos Vue instalados pelo NPM com Vite, a configuração de base será:

```js
// vite.config.js (apenas para uma futura migração)
import { defineConfig } from 'vite';
export default defineConfig({ base: '/pre-sessao/' });
```

Nesse caso será necessário instalar Vite/Vue, migrar o código para imports do pacote `vue`, adequar as URLs do diretório `public/`, criar scripts de `build` e mudar `pages.yml` para fazer upload de `dist/`. **Não cole esse arquivo de configuração agora sem fazer a migração completa**, pois ele não é necessário para a arquitetura estática atual.

## 5. Atualizar pelo navegador

1. Edite arquivos diretamente pelo ícone de lápis no GitHub, ou vá ao diretório correto e use **Add file → Upload files** para substituir.
2. Use uma mensagem de commit descritiva, por exemplo `fix: improve report selection and tutorial accessibility`.
3. Cada commit em `main` dispara automaticamente testes + nova publicação.
4. Veja o progresso na aba **Actions**, e o resultado no endereço do site quando o workflow estiver verde.
5. Se o site parecer antigo, faça atualização forçada da página; o navegador pode estar usando cache estático.

## 6. Criar uma tag e uma release

1. Abra o repositório → **Releases → Create a new release**.
2. Clique em **Choose a tag**, digite `v0.1.0-alpha` e escolha criar a nova tag para `main`.
3. Em **Release title**, cole `Pré-Sessão v0.1.0-alpha — Organize Your Session`.
4. No texto da release, copie as notas em `RELEASE_NOTES.md`.
5. Clique em **Publish release**. A tag identifica o estado do código daquele momento.

## 7. Restaurar uma versão anterior pelo navegador

1. Vá à aba **Commits** ou **Releases**, escolha a versão estável desejada.
2. Para desfazer um commit específico, o GitHub pode oferecer **Revert** na interface de um pull request mesclado; quando essa opção não existir, abra os arquivos na revisão anterior e recopie os conteúdos pela interface web.
3. Para restauração completa mais segura, baixe o ZIP da release/tag anterior, extraia e substitua os arquivos correspondentes via Upload files. Garanta que pastas e arquivos removidos também sejam conciliados; o Upload files não apaga automaticamente arquivos extras.
4. Faça novo commit em `main` (`revert: restore last stable version`) e confirme o deploy verde em **Actions**.
5. Uma tag passada não muda automaticamente o site: o workflow publica a branch `main`. Restaurar uma tag exige trazer seu conteúdo de volta para `main`.

## 8. Checklist final

- [ ] O repositório abre com README, pasta `src/`, `public/`, `tests/` e workflow `.github/workflows/pages.yml`.
- [ ] **Settings → Pages → Source: GitHub Actions**.
- [ ] Workflow executado com sucesso.
- [ ] Página inicial aparece em PC e celular.
- [ ] Os dois questionários e o modo rápido funcionam.
- [ ] Edição, ocultação seletiva e prévia do PDF funcionam.
- [ ] O PDF pode ser salvo via janela de impressão.
- [ ] O texto de uma resposta privada não aparece na prévia nem na impressão.
- [ ] Tutorial, temas e apagar respostas funcionam.
- [ ] Para o piloto, usar **dados fictícios** e solicitar revisão profissional.
