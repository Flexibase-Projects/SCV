# SCV - Sistema de Controle de Veiculos

Plataforma web para operacao de frota com foco em entregas, abastecimentos, manutencoes, acerto de viagem, produtividade e leitura financeira da operacao.

## Visao geral

O SCV centraliza a rotina operacional e financeira da frota em uma unica interface. O projeto foi construido com `React + Vite + TypeScript`, usa `Supabase` como backend e conta com autenticacao por e-mail e senha, rotas protegidas e controle de acesso no banco.

## Principais modulos

- Dashboard operacional
- Entregas
- Abastecimento
- Manutencao
- Acerto de Viagem
- Produtividade
- Cadastros
- Relatorios
- Importacao em massa via feature flag

## Autenticacao e acesso

O projeto agora possui fluxo real de autenticacao com Supabase:

- rota publica de login em `/login`
- rota publica de redefinicao em `/redefinir-senha`
- rotas internas protegidas por sessao autenticada
- logout real integrado ao app
- remember-me de e-mail por 30 dias, salvando apenas `{ email, expiresAt }`
- toggle de tema funcional na tela de login e na area autenticada

No banco, o acesso aos dados operacionais foi endurecido com RLS para exigir usuarios autenticados nas tabelas consumidas pelo frontend.

## Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Material UI Icons
- TanStack Query
- React Router
- Supabase
- Vitest

## Como executar

### Pre-requisitos

- Node.js 18+
- npm

### Instalacao

```bash
git clone https://github.com/Flexibase-Projects/SCV.git
cd SCV
npm install
```

### Ambiente

Crie um `.env` local a partir de `.env.example`:

```bash
copy .env.example .env
```

Variaveis principais de frontend:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
VITE_ENABLE_IMPORT=false
```

Variaveis publicas opcionais para integracoes compartilhadas:

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

Variaveis opcionais de uso servidor/admin:

```env
SUPABASE_URL=sua_url_do_supabase
SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

Importante:

- `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` sao obrigatorias para o frontend.
- o frontend rejeita `service role key` acidental em `VITE_SUPABASE_ANON_KEY`.
- `SUPABASE_SERVICE_ROLE_KEY` nunca deve ser exposta no cliente.
- nunca commite `.env` com valores reais.

### Desenvolvimento

```bash
npm run dev
```

Abra a URL exibida pelo Vite no terminal. Em ambiente local, normalmente sera `http://localhost:8080/`.

### Scripts

```bash
npm run dev
npm run build
npm run preview
npm run lint
npm run typecheck
npm run test
npm run test:ui
npm run test:coverage
npm run audit:prod
```

## Qualidade continua

O projeto agora possui uma workflow dedicada em `.github/workflows/ci.yml` para validar `test` e `build` em PRs e pushes para `main`, usando variaveis publicas placeholder para nao depender de segredos.

Para acompanhar a rodada atual de hardening e os riscos remanescentes, consulte:

- [docs/hardening-baseline.md](docs/hardening-baseline.md)

## Validacao

Antes de abrir PR ou enviar para `main`, valide pelo menos:

```bash
npm run test
npm run build
```

Se voce estiver atacando backlog tecnico ou endurecendo o app, rode tambem:

```bash
npm run typecheck
npm run audit:prod
```

Fluxos criticos para validar manualmente:

- login com credenciais validas
- erro de credencial invalida
- logout
- remember-me
- recuperacao e redefinicao de senha
- troca entre tema claro e escuro

## Estrutura do projeto

```text
src/
  components/
    auth/
    layout/
    ui/
  contexts/
  hooks/
  integrations/
    supabase/
  pages/
  test/
  utils/
public/
supabase/
  migrations/
docs/
```

## Skill versionada no repo

A copia rastreavel da skill interna de login agora vive em:

```text
.codex/skills/login-screen/
```

Esse caminho passa a ser a referencia versionada do projeto para a skill. A copia em `C:\Users\Flexibase\.codex\skills\login-screen` pode continuar existindo localmente, mas o historico confiavel de mudancas fica no repositorio.

## Seguranca de arquivos

Arquivos que nao devem ir para o repositorio:

- `.env`
- `.env.local`
- `.env.*.local`
- `.env.production`
- `SUPABASE_SERVICE_ROLE_KEY` em qualquer arquivo commitado
- `supabase/config.toml` com dados reais do projeto
- chaves privadas, tokens e senhas
- `node_modules/`
- `dist/`
- logs temporarios

Checklist rapido antes do push:

```bash
git status
```

Confirme que nenhum arquivo sensivel apareceu no stage. Se algo entrou por engano:

```bash
git rm --cached .env
```

Consulte tambem:

- [SECURITY.md](SECURITY.md)
- [PRIVACY.md](PRIVACY.md)
- [docs/GITHUB-DEPLOY.md](docs/GITHUB-DEPLOY.md)

## Deploy

O workflow de deploy em `.github/workflows/deploy.yml` depende de GitHub Secrets. Nunca coloque valores reais no repositorio. Prefira configurar:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_ENABLE_IMPORT`

## Licenca

Este projeto esta sob a licenca MIT. Veja [LICENSE](LICENSE).
