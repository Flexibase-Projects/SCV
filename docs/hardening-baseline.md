# Hardening Baseline

Data da rodada: `2026-03-31`

## Estado inicial encontrado

- `npm run test -- --run`: verde.
- `npm run build`: verde, mas com um chunk principal de aproximadamente `2.28 MB` e warning de bundle grande.
- `npm run lint`: vermelho, com concentracao de erros em `any`, imports legados, regexes desnecessariamente escapadas e arquivos utilitarios muito permissivos.
- `npm run typecheck`: inexistente no `package.json` e vermelho quando executado manualmente.
- `npm audit --omit=dev`: vermelho, com destaque para `react-router-dom`, `@remix-run/router` e `xlsx`.
- Advisors e tabelas do Supabase via MCP indisponiveis nesta sessao por erro de transporte; a revisao de banco ficou limitada ao codigo e a `supabase/migrations/`.

## Mudancas aplicadas

- Centralizacao da leitura de ambiente do frontend em `src/integrations/supabase/env.ts`.
- Bloqueio explicito para evitar `service role key` acidental em `VITE_SUPABASE_ANON_KEY`.
- Inicializacao do cliente Supabase endurecida para usar persistencia apenas quando houver `localStorage` disponivel.
- Teste unitario novo cobrindo o guard de chave publica do Supabase.
- Code-splitting por rota em `src/App.tsx` com fallback de carregamento dedicado.
- Separacao de vendors relevantes no `vite.config.ts` para reduzir o peso do chunk inicial e melhorar cache.
- Inclusao dos scripts `typecheck` e `audit:prod`.
- CI minima em `.github/workflows/ci.yml` rodando `test` e `build` em PRs e pushes para `main`.

## Estado apos as mudancas

- `npm run test -- --run`: verde com `53` testes passando.
- `npm run build`: verde, sem warning de chunk acima do limite.
- Chunk principal do app reduzido de aproximadamente `2.28 MB` para `95.58 kB`, com vendors separados em chunks cacheaveis.
- `npm run typecheck`: ainda vermelho, agora formalizado como gate visivel do projeto.

## Riscos residuais

- O projeto ainda tem divida importante de tipagem, especialmente em `src/pages/Ajuda.tsx`, hooks de dados e componentes de dashboard.
- O lint continua com alta incidencia de `no-explicit-any`, o que reduz seguranca de manutencao nas rotinas de importacao.
- `xlsx` segue com vulnerabilidades sem correcao disponivel via `npm audit`, entao o risco permanece enquanto essa dependencia fizer parte do fluxo de importacao.
- A CI ainda nao executa `lint` e `typecheck` porque esses gates nao estao verdes; promover isso agora faria a esteira falhar em toda PR.

## Proximos passos recomendados

1. Resolver o backlog de `typecheck` por dominio, comecando por `Ajuda`, `dashboard` e hooks Supabase.
2. Endurecer os parsers/importadores (`src/utils/importacao/*`, `src/utils/*Parser.ts`) trocando `any` por tipos nomeados e validacao explicita de entrada.
3. Revisar a dependencia `xlsx` e planejar migracao ou isolamento do fluxo de importacao para reduzir risco de seguranca.
4. Quando `lint` e `typecheck` estiverem verdes, promover ambos para a workflow de CI.
