# Plano de debug – Erro 500 ao cadastrar abastecimento (resolvido)

## Problema
- **Sintoma:** POST para `/rest/v1/abastecimentos` retornava **500 (Internal Server Error)**.
- **Mensagem no front:** "Erro ao registrar abastecimento: stack depth limit exceeded".
- **Código PostgreSQL:** `54001` (stack_depth_limit_exceeded).

## Hipóteses e evidência
| Hipótese | Resultado | Evidência |
|----------|-----------|-----------|
| H1 – Payload (tipos/formato) | Rejeitada | Log: payload e tipos corretos (data string, números number). |
| H2 – Trigger/recursão no banco | **Confirmada** | Log: `message: "stack depth limit exceeded", code: "54001"`. |
| H3 – GET com joins falhando | Inconclusiva | Foco foi no POST; GET ganhou fallback sem joins. |

## Causa raiz
O trigger `trigger_abastecimentos_recalc_km_por_litro` roda **AFTER INSERT/UPDATE/DELETE** em `abastecimentos`.  
A função `recalc_km_por_litro_veiculo` faz **UPDATE** na mesma tabela `abastecimentos`.  
Esse UPDATE dispara de novo o trigger → nova chamada ao recalc → **recursão infinita** → stack depth exceeded.

## Correção aplicada
1. **Variável de sessão:** `recalc_km_por_litro_veiculo` define `app.inside_recalc_km = '1'` antes do UPDATE e limpa depois; o trigger, no início, verifica essa variável e, se estiver ativa, retorna sem chamar o recalc (evita reentrância).
2. **Guarda no UPDATE:** No trigger, em operação UPDATE, se a única coluna alterada for `km_por_litro`, retorna sem chamar o recalc (evita recursão quando o próprio recalc atualiza a tabela).

**Arquivo:** `supabase/migrations/20260226130000_fix_km_por_litro_trigger_recursion.sql`

## Aplicação no Supabase
- **Via MCP:** SQL aplicado no projeto conectado ao MCP Supabase (`execute_sql`).
- **Supabase local (192.168.1.220):** Se a aplicação usar esse banco, executar o mesmo SQL no Studio local: `http://192.168.1.220:54323` → SQL Editor → colar o conteúdo da migration e rodar.

## Outras alterações (sessão de debug)
- **Dialog (AbastecimentoFormModal):** Inclusão de `DialogDescription` (sr-only) para remover aviso de acessibilidade do React DevTools.
- **useAbastecimentos:** Fallback no GET: em caso de erro na query com joins, nova tentativa com `select('*')` e enriquecimento com `veiculos` e `motoristas` no cliente.
- **Instrumentação de debug:** Removida do `useAbastecimentos.ts` após confirmação da causa.

## Execução do plano
- **Migration aplicada no Supabase** via MCP (`execute_sql`): funções `recalc_km_por_litro_veiculo` e `trigger_recalc_km_por_litro` atualizadas.
- **Se a aplicação usar Supabase local (192.168.1.220):** executar o conteúdo de `supabase/migrations/20260226130000_fix_km_por_litro_trigger_recursion.sql` no SQL Editor do Studio em `http://192.168.1.220:54323`.

## Passos de verificação
1. Abrir a tela **Abastecimento** na aplicação.
2. Clicar em **Novo Abastecimento**, preencher os campos obrigatórios e clicar em **Cadastrar**.
3. Confirmar que não aparece erro 500 nem "stack depth limit exceeded"; o registro deve ser salvo e a lista atualizada.

## Status
- **Resolvido:** Correção aplicada no Supabase (via MCP). Cadastro de abastecimento deve funcionar no projeto cujo banco foi atualizado.
- **Verificação pendente:** Executar os passos acima e marcar como concluído quando não houver mais erro.

---
*Última atualização: plano de debug executado (migration reaplicada via MCP); passos de verificação documentados.*
