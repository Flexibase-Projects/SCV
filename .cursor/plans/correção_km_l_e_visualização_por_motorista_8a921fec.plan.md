---
name: Correção KM/L e Visualização por Motorista
overview: Corrigir cálculo de KM/L para múltiplos abastecimentos no mesmo dia (ordenando por KM crescente) e adicionar aba "Por Motorista" com filtros de motorista e data para visualização dos abastecimentos.
todos:
  - id: fix-ordering
    content: Corrigir ordenação em getUltimoAbastecimento para usar km_inicial ao invés de apenas data/created_at
    status: completed
  - id: validate-same-km
    content: Adicionar validação para detectar KM igual no mesmo dia e retornar NULL com aviso
    status: completed
    dependencies:
      - fix-ordering
  - id: create-migration
    content: "Criar migration para recalcular KM/L usando ordenação correta. OBRIGATÓRIO: Consultar database-architect e usar MCP Supabase"
    status: completed
    dependencies:
      - fix-ordering
  - id: add-tabs-system
    content: Adicionar sistema de abas na página Abastecimento com 'Todos' e 'Por Motorista'
    status: completed
  - id: add-motorista-filter
    content: Adicionar filtro de motorista (select) na aba Por Motorista
    status: completed
    dependencies:
      - add-tabs-system
  - id: add-date-filter
    content: Adicionar filtro de data específica na aba Por Motorista
    status: pending
    dependencies:
      - add-tabs-system
  - id: implement-filter-logic
    content: Implementar lógica de filtro combinando motorista + data na aba Por Motorista
    status: completed
    dependencies:
      - add-motorista-filter
      - add-date-filter
  - id: add-visual-indicator
    content: Adicionar indicador visual na tabela para KM/L inválido (quando KM igual)
    status: completed
    dependencies:
      - validate-same-km
  - id: test-scenarios
    content: "Testar cenários: múltiplos abastecimentos mesmo dia, KM igual, filtro por motorista"
    status: pending
    dependencies:
      - create-migration
      - implement-filter-logic
  - id: create-performance-indexes
    content: "Criar índices compostos para otimizar queries de getUltimoAbastecimento e filtro por motorista. OBRIGATÓRIO: Consultar database-architect"
    status: completed
    dependencies:
      - fix-ordering
  - id: implement-cascade-recalc
    content: Implementar recálculo em cascata de KM/L quando um abastecimento é atualizado
    status: pending
    dependencies:
      - fix-ordering
  - id: add-cache-ultimo-abastecimento
    content: Adicionar cache em memória para último abastecimento por veículo (com TTL e invalidação)
    status: pending
    dependencies:
      - fix-ordering
  - id: add-motorista-stats
    content: Adicionar cards de estatísticas específicas do motorista na aba Por Motorista
    status: pending
    dependencies:
      - implement-filter-logic
  - id: add-frontend-validation
    content: Adicionar validação em tempo real no formulário de abastecimento (verificar KM antes de salvar)
    status: pending
    dependencies:
      - validate-same-km
  - id: improve-visual-indicators
    content: "Melhorar indicadores visuais na tabela: tooltips para KM/L inválido, destaque para múltiplos abastecimentos mesmo dia"
    status: pending
    dependencies:
      - add-visual-indicator
  - id: add-database-constraints
    content: "Adicionar constraints CHECK no banco para validar km_inicial >= 0 e litros > 0. OBRIGATÓRIO: Consultar database-architect"
    status: pending
---

# Correção de Cálculo KM/L e Visualização por Motorista

## Contexto

O sistema apresenta dois problemas críticos:

1. **Bug de Cálculo KM/L**: Quando um caminhão abastece múltiplas vezes no mesmo dia, o sistema não identifica corretamente a sequência, causando cálculos errados de KM/L (exemplo: placa SCM3B30 teve 4 abastecimentos em 2025-04-03, todos com KM 307.128, resultando em KM/L=0).

2. **Falta de Visualização por Motorista**: Não há forma de filtrar e visualizar abastecimentos de um motorista específico em uma data específica.

## Análise Técnica

### Problema 1: Ordenação Incorreta

A função `getUltimoAbastecimento` em `src/hooks/useAbastecimentos.ts` ordena apenas por `data DESC` e `created_at DESC`, mas quando há múltiplos abastecimentos no mesmo dia, precisa ordenar por `km_inicial ASC` para pegar o abastecimento anterior correto.

**Cenário problemático identificado no banco:**

- Veículo SCM3B30 em 2025-04-03: 4 abastecimentos com mesmo KM (307.128)
- Todos calculam KM/L=0 porque o sistema não identifica qual é o "anterior"

**Solução**: Ordenar por `data ASC, km_inicial ASC, created_at ASC` ao buscar último abastecimento.

### Problema 2: Mesmo KM no Mesmo Dia

Quando KM é idêntico no mesmo dia, o sistema deve:

- Permitir o registro (não bloquear)
- Avisar visualmente na UI
- Marcar KM/L como NULL ou avisar que dados podem estar inconsistentes

## Implementação

### Fase 1: Correção do Cálculo KM/L

#### 1.1 Atualizar `getUltimoAbastecimento`

**Arquivo**: `src/hooks/useAbastecimentos.ts`

**Mudança**: Alterar ordenação para considerar KM crescente:

```typescript
// ANTES (linha 34-35):
.order('data', { ascending: false })
.order('created_at', { ascending: false })

// DEPOIS:
.order('data', { ascending: false })
.order('km_inicial', { ascending: false })  // KM decrescente = pegar o maior KM primeiro
.order('created_at', { ascending: false })
```

**Lógica**: Ao buscar o último abastecimento, queremos o que tem o MAIOR KM (mais recente em termos de quilometragem), não necessariamente o mais recente em data.

#### 1.2 Atualizar Migration de Recalculo

**Arquivo**: Criar nova migration `supabase/migrations/YYYYMMDD_fix_km_por_litro_ordenacao.sql`

**Ação**: Recalcular todos os KM/L usando ordenação correta (data ASC, km_inicial ASC):

```sql
WITH ordered_abastecimentos AS (
  SELECT 
    id,
    veiculo_id,
    data,
    km_inicial,
    litros,
    LAG(km_inicial) OVER (
      PARTITION BY veiculo_id 
      ORDER BY data ASC, km_inicial ASC, created_at ASC
    ) as km_anterior
  FROM abastecimentos
),
calculated AS (
  SELECT 
    id,
    CASE 
      WHEN km_anterior IS NULL THEN NULL
      WHEN km_inicial < km_anterior THEN NULL
      WHEN km_inicial = km_anterior THEN NULL  -- KM igual = não calcular
      WHEN litros > 0 THEN ROUND(((km_inicial - km_anterior)::NUMERIC / litros::NUMERIC), 2)
      ELSE NULL
    END as km_por_litro_calc
  FROM ordered_abastecimentos
)
UPDATE abastecimentos a
SET km_por_litro = c.km_por_litro_calc
FROM calculated c
WHERE a.id = c.id;
```

**Processo**: Consultar `database-architect` agent antes de aplicar migration.

#### 1.3 Adicionar Validação de KM Igual

**Arquivo**: `src/hooks/useAbastecimentos.ts`

**Mudança**: Atualizar `calcularKmPorLitro` para detectar KM igual e retornar NULL com aviso:

```typescript
export function calcularKmPorLitro(
  kmAtual: number,
  kmAnterior: number | null,
  litros: number,
  showToast: boolean = true
): number | null {
  if (kmAnterior === null) {
    return null;
  }

  if (kmAtual < kmAnterior) {
    // ... código existente de aviso
    return null;
  }

  // NOVO: Detectar KM igual
  if (kmAtual === kmAnterior) {
    if (showToast) {
      sonnerToast.warning('Atenção: KM Inválido', {
        description: `O KM informado (${kmAtual.toLocaleString('pt-BR')}) é igual ao último registro. Verifique se está correto ou se há múltiplos abastecimentos no mesmo dia.`,
        duration: 6000,
      });
    }
    return null; // Não calcular quando KM é igual
  }

  // ... resto do código
}
```

### Fase 2: Visualização por Motorista

#### 2.1 Adicionar Sistema de Abas

**Arquivo**: `src/pages/Abastecimento.tsx`

**Mudança**: Adicionar componente de abas (Tabs) com duas opções:

- "Todos" (aba atual)
- "Por Motorista" (nova aba)

**Dependência**: Verificar se existe componente Tabs no projeto, caso contrário usar shadcn/ui Tabs.

#### 2.2 Criar Hook para Listar Motoristas

**Arquivo**: `src/hooks/useMotoristas.ts` (criar se não existir) ou verificar se já existe

**Função**: Buscar lista de motoristas para popular o select.

#### 2.3 Adicionar Filtros na Aba "Por Motorista"

**Arquivo**: `src/pages/Abastecimento.tsx`

**Componentes**:

- Select de Motorista (dropdown com todos os motoristas)
- DatePicker para Data (filtro opcional de data específica)

**Estado**:

```typescript
const [selectedMotoristaId, setSelectedMotoristaId] = useState<string | null>(null);
const [selectedDate, setSelectedDate] = useState<Date | null>(null);
```

#### 2.4 Implementar Filtro na Aba "Por Motorista"

**Arquivo**: `src/pages/Abastecimento.tsx`

**Lógica**: Quando na aba "Por Motorista":

- Filtrar `filteredAbastecimentos` por `condutor_id === selectedMotoristaId`
- Se `selectedDate` estiver preenchido, filtrar também por data
- Manter mesma tabela `AbastecimentoTable` (reutilizar componente)

**Código**:

```typescript
const filteredAbastecimentos = useMemo(() => {
  let filtered = abastecimentos;

  // Filtro de motorista (se na aba "Por Motorista")
  if (activeTab === 'por-motorista' && selectedMotoristaId) {
    filtered = filtered.filter(a => a.condutor_id === selectedMotoristaId);
  }

  // Filtro de data (se selecionado na aba "Por Motorista")
  if (activeTab === 'por-motorista' && selectedDate) {
    filtered = filtered.filter(a => {
      if (!a.data) return false;
      const date = parseISO(a.data);
      return isSameDay(date, selectedDate);
    });
  }

  // Filtros existentes (busca, período)
  // ... código existente

  return filtered;
}, [abastecimentos, activeTab, selectedMotoristaId, selectedDate, searchTerm, dateFrom, dateTo]);
```

#### 2.5 Atualizar Cards de Resumo

**Arquivo**: `src/pages/Abastecimento.tsx`

**Mudança**: Cards de resumo devem refletir os dados filtrados da aba ativa (já está implementado, apenas garantir que funciona com novo filtro).

### Fase 3: Melhorias de UX

#### 3.1 Indicador Visual para KM/L Inválido

**Arquivo**: `src/components/abastecimento/AbastecimentoTable.tsx`

**Mudança**: Quando `km_por_litro` é NULL e há aviso de KM igual, mostrar badge/ícone de aviso na coluna KM/L.

#### 3.2 Mensagem de Estado Vazio

**Arquivo**: `src/pages/Abastecimento.tsx`

**Mudança**: Quando na aba "Por Motorista" sem motorista selecionado, mostrar mensagem: "Selecione um motorista para visualizar os abastecimentos".

## Arquivos Afetados

### Backend/Hooks

- `src/hooks/useAbastecimentos.ts` - Correção de ordenação e validação KM igual
- `src/hooks/useMotoristas.ts` - Verificar se existe, criar se necessário

### Frontend/Pages

- `src/pages/Abastecimento.tsx` - Adicionar sistema de abas e filtros por motorista

### Frontend/Components

- `src/components/abastecimento/AbastecimentoTable.tsx` - Indicador visual para KM/L inválido

### Database

- `supabase/migrations/YYYYMMDD_fix_km_por_litro_ordenacao.sql` - Migration para recalcular KM/L

## Processo de Implementação (Checklist Banco de Dados)

Antes de aplicar migration:

- [ ] Consultar `database-architect` agent sobre estratégia de ordenação e impacto
- [ ] Verificar estado atual com MCP Supabase (`list_tables`, verificar índices)
- [ ] Analisar impacto com `get_advisors` (performance)
- [ ] Migration revisada pelo database-architect agent
- [ ] Migration aplicada via `mcp_supabase_apply_migration`
- [ ] Advisors verificados após aplicação (`get_advisors`)
- [ ] Testar queries de exemplo com dados reais

## Testes Necessários

1. **Teste de Ordenação**: Criar 3 abastecimentos do mesmo veículo no mesmo dia com KMs diferentes, verificar cálculo correto
2. **Teste KM Igual**: Criar 2 abastecimentos com mesmo KM no mesmo dia, verificar aviso e KM/L=NULL
3. **Teste Filtro Motorista**: Selecionar motorista e data, verificar que apenas abastecimentos corretos aparecem
4. **Teste Abas**: Alternar entre "Todos" e "Por Motorista", verificar que filtros não se misturam

## Riscos e Mitigações

- **Risco**: Migration pode recalcular incorretamente dados históricos
  - **Mitigação**: Fazer backup antes, testar em ambiente de dev primeiro, consultar database-architect

- **Risco**: Performance ao buscar último abastecimento com nova ordenação
  - **Mitigação**: Verificar índices existentes, adicionar índice composto se necessário: `(veiculo_id, data, km_inicial, created_at)`

- **Risco**: Usuário confuso com nova aba
  - **Mitigação**: Adicionar tooltip/ajuda explicando a funcionalidade

## Melhorias Adicionais Identificadas

### Fase 4: Otimizações de Performance

#### 4.1 Criar Índice Composto para Performance

**Arquivo**: `supabase/migrations/YYYYMMDD_add_index_abastecimentos_ordenacao.sql`

**Ação**: Criar índice composto para otimizar a query de `getUltimoAbastecimento`:

```sql
-- Índice composto para otimizar busca do último abastecimento por veículo
-- Ordem: veiculo_id (equality) -> data DESC -> km_inicial DESC -> created_at DESC
CREATE INDEX IF NOT EXISTS idx_abastecimentos_veiculo_data_km_created 
ON abastecimentos(veiculo_id, data DESC, km_inicial DESC, created_at DESC);

-- Índice adicional para filtros por condutor + data (usado na aba Por Motorista)
CREATE INDEX IF NOT EXISTS idx_abastecimentos_condutor_data 
ON abastecimentos(condutor_id, data DESC);
```

**Justificativa**:

- Query pattern de `getUltimoAbastecimento` usa `veiculo_id = X ORDER BY data DESC, km_inicial DESC`
- Índice composto permite busca eficiente sem full table scan
- Índice adicional para filtro por motorista na nova aba

**Processo**: Consultar `database-architect` agent para validar estratégia de índices.

#### 4.2 Recálculo em Cascata ao Atualizar

**Arquivo**: `src/hooks/useAbastecimentos.ts`

**Problema**: Quando um abastecimento é atualizado, os abastecimentos seguintes do mesmo veículo podem ter KM/L incorreto.

**Solução**: Adicionar função para recalcular KM/L dos abastecimentos seguintes:

```typescript
// Função para recalcular KM/L dos abastecimentos seguintes após atualização
export async function recalcularAbastecimentosSeguintes(
  veiculoId: string, 
  dataAtualizada: string,
  kmAtualizado: number
): Promise<void> {
  // Buscar abastecimentos do mesmo veículo após a data atualizada
  const { data: abastecimentosSeguintes, error } = await supabase
    .from('abastecimentos')
    .select('id, data, km_inicial, litros')
    .eq('veiculo_id', veiculoId)
    .gt('data', dataAtualizada)
    .order('data', { ascending: true })
    .order('km_inicial', { ascending: true })
    .order('created_at', { ascending: true });

  if (error || !abastecimentosSeguintes || abastecimentosSeguintes.length === 0) {
    return;
  }

  // Recalcular cada abastecimento seguinte
  let kmAnterior = kmAtualizado;
  for (const abastecimento of abastecimentosSeguintes) {
    const kmPorLitro = calcularKmPorLitro(
      abastecimento.km_inicial,
      kmAnterior,
      abastecimento.litros,
      false // Não mostrar toast para cada um
    );

    await supabase
      .from('abastecimentos')
      .update({ km_por_litro: kmPorLitro })
      .eq('id', abastecimento.id);

    kmAnterior = abastecimento.km_inicial;
  }
}
```

**Uso**: Chamar esta função em `useUpdateAbastecimento` após atualizar o abastecimento.

#### 4.3 Cache de Último Abastecimento

**Arquivo**: `src/hooks/useAbastecimentos.ts`

**Melhoria**: Adicionar cache simples em memória para último abastecimento por veículo (invalidar ao criar/atualizar):

```typescript
// Cache simples em memória (Map<veiculoId, { km_inicial, timestamp }>)
const ultimoAbastecimentoCache = new Map<string, { km_inicial: number; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

export async function getUltimoAbastecimento(veiculoId: string, excludeId?: string): Promise<{ km_inicial: number } | null> {
  // Verificar cache (apenas se não há excludeId)
  if (!excludeId) {
    const cached = ultimoAbastecimentoCache.get(veiculoId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { km_inicial: cached.km_inicial };
    }
  }

  // ... query existente ...

  // Atualizar cache
  if (data && data.length > 0 && !excludeId) {
    ultimoAbastecimentoCache.set(veiculoId, {
      km_inicial: data[0].km_inicial,
      timestamp: Date.now()
    });
  }

  return data?.[0] || null;
}

// Função para invalidar cache de um veículo
export function invalidarCacheUltimoAbastecimento(veiculoId: string) {
  ultimoAbastecimentoCache.delete(veiculoId);
}
```

### Fase 5: Melhorias de UX na Aba Por Motorista

#### 5.1 Cards de Estatísticas Específicas

**Arquivo**: `src/pages/Abastecimento.tsx`

**Melhoria**: Quando na aba "Por Motorista" com motorista selecionado, mostrar cards adicionais:

- Total de Abastecimentos do Motorista (no período)
- Média de KM/L do Motorista
- Total de Litros Abastecidos
- Valor Total Gasto
- Comparação com média geral (opcional)

**Implementação**: Criar `useMemo` para calcular estatísticas do motorista selecionado.

#### 5.2 Validação no Frontend Antes de Salvar

**Arquivo**: `src/components/abastecimento/AbastecimentoFormModal.tsx`

**Melhoria**: Adicionar validação em tempo real no formulário:

- Verificar se KM é maior que o último abastecimento do veículo
- Avisar se KM é igual ao último
- Mostrar preview do KM/L calculado antes de salvar

**Implementação**: Usar `useEffect` para buscar último abastecimento e validar ao mudar KM.

#### 5.3 Exportação de Relatório por Motorista

**Arquivo**: `src/pages/Abastecimento.tsx`

**Melhoria**: Adicionar botão "Exportar Relatório" na aba "Por Motorista" que gera PDF/Excel com:

- Lista de abastecimentos do motorista
- Estatísticas consolidadas
- Gráfico de consumo ao longo do tempo (opcional)

**Dependência**: Verificar se existe biblioteca de exportação (ex: `xlsx`, `jspdf`) no projeto.

### Fase 6: Melhorias Visuais

#### 6.1 Badge de Aviso para KM/L Inválido

**Arquivo**: `src/components/abastecimento/AbastecimentoTable.tsx`

**Melhoria**: Melhorar indicador visual quando KM/L é NULL:

```typescript
<TableCell className="text-foreground">
  {abastecimento.km_por_litro != null ? (
    <Badge variant="outline" className="gap-1 font-medium whitespace-nowrap">
      <Gauge className="h-3 w-3 flex-shrink-0" />
      <span className="whitespace-nowrap">
        {abastecimento.km_por_litro.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })} km/l
      </span>
    </Badge>
  ) : (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="border-amber-500 text-amber-600 gap-1">
            <AlertTriangle className="h-3 w-3" />
            N/A
          </Badge>
        </TooltipTrigger>
        <TooltipContent>
          <p>KM/L não pode ser calculado. Verifique se:</p>
          <ul className="list-disc list-inside text-xs mt-1">
            <li>É o primeiro abastecimento do veículo</li>
            <li>KM é igual ou menor que o anterior</li>
            <li>Há múltiplos abastecimentos no mesmo dia</li>
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )}
</TableCell>
```

#### 6.2 Destaque Visual para Múltiplos Abastecimentos no Mesmo Dia

**Arquivo**: `src/components/abastecimento/AbastecimentoTable.tsx`

**Melhoria**: Adicionar cor de fundo sutil para linhas que têm mesmo veículo e data (agrupamento visual).

### Fase 7: Validações e Segurança

#### 7.1 Validação de Dados no Backend

**Arquivo**: Criar função de validação ou adicionar constraints no banco

**Melhoria**: Adicionar CHECK constraint para garantir que `km_inicial >= 0` e `litros > 0`:

```sql
ALTER TABLE abastecimentos 
ADD CONSTRAINT check_km_inicial_positivo 
CHECK (km_inicial >= 0);

ALTER TABLE abastecimentos 
ADD CONSTRAINT check_litros_positivo 
CHECK (litros > 0);
```

#### 7.2 Logging de Cálculos Inválidos

**Arquivo**: `src/hooks/useAbastecimentos.ts`

**Melhoria**: Adicionar log estruturado quando KM/L não pode ser calculado (para análise futura):

```typescript
if (kmAtual === kmAnterior) {
  // Log para análise (não exibir ao usuário)
  console.warn('[KM/L] KM igual detectado', {
    veiculoId,
    kmAtual,
    data: abastecimento.data
  });
  // ... resto do código
}
```

## Arquivos Afetados (Atualizado)

### Backend/Hooks

- `src/hooks/useAbastecimentos.ts` - Correção de ordenação, validação KM igual, recálculo em cascata, cache
- `src/hooks/useMotoristas.ts` - **JÁ EXISTE**, apenas usar

### Frontend/Pages

- `src/pages/Abastecimento.tsx` - Sistema de abas, filtros, estatísticas por motorista, exportação

### Frontend/Components

- `src/components/abastecimento/AbastecimentoTable.tsx` - Indicadores visuais melhorados, tooltips
- `src/components/abastecimento/AbastecimentoFormModal.tsx` - Validação em tempo real

### Database

- `supabase/migrations/YYYYMMDD_fix_km_por_litro_ordenacao.sql` - Migration para recalcular KM/L
- `supabase/migrations/YYYYMMDD_add_index_abastecimentos_ordenacao.sql` - **NOVO** - Índices compostos
- `supabase/migrations/YYYYMMDD_add_constraints_abastecimentos.sql` - **NOVO** - Constraints de validação

## Processo de Implementação (Checklist Banco de Dados - Atualizado)

Antes de aplicar migrations:

- [ ] Consultar `database-architect` agent sobre estratégia de ordenação, índices e constraints
- [ ] Verificar estado atual com MCP Supabase (`list_tables`, verificar índices existentes)
- [ ] Analisar impacto com `get_advisors` (security e performance)
- [ ] Testar queries de exemplo com `EXPLAIN ANALYZE` para validar uso de índices
- [ ] Migration de recalculo revisada pelo database-architect agent
- [ ] Migration de índices revisada pelo database-architect agent
- [ ] Migration de constraints revisada pelo database-architect agent
- [ ] Aplicar migrations via `mcp_supabase_apply_migration` (uma por vez)
- [ ] Advisors verificados após cada migration (`get_advisors`)
- [ ] Testar queries de exemplo com dados reais após cada migration
- [ ] Verificar performance com `get_logs` (service: postgres) se necessário

## Testes Necessários (Atualizado)

1. **Teste de Ordenação**: Criar 3 abastecimentos do mesmo veículo no mesmo dia com KMs diferentes, verificar cálculo correto
2. **Teste KM Igual**: Criar 2 abastecimentos com mesmo KM no mesmo dia, verificar aviso e KM/L=NULL
3. **Teste Filtro Motorista**: Selecionar motorista e data, verificar que apenas abastecimentos corretos aparecem
4. **Teste Abas**: Alternar entre "Todos" e "Por Motorista", verificar que filtros não se misturam
5. **Teste Recálculo em Cascata**: Atualizar um abastecimento e verificar que os seguintes são recalculados
6. **Teste Performance**: Verificar que queries usam índices (EXPLAIN ANALYZE)
7. **Teste Cache**: Verificar que cache funciona e é invalidado corretamente
8. **Teste Validação Frontend**: Verificar que avisos aparecem antes de salvar

## Riscos e Mitigações (Atualizado)

- **Risco**: Migration pode recalcular incorretamente dados históricos
  - **Mitigação**: Fazer backup antes, testar em ambiente de dev primeiro, consultar database-architect

- **Risco**: Performance ao buscar último abastecimento com nova ordenação
  - **Mitigação**: Criar índice composto `(veiculo_id, data DESC, km_inicial DESC, created_at DESC)`, validar com EXPLAIN ANALYZE

- **Risco**: Índices compostos podem aumentar tempo de INSERT
  - **Mitigação**: Criar índices CONCURRENTLY se possível, monitorar performance após criação

- **Risco**: Recálculo em cascata pode ser lento para muitos abastecimentos
  - **Mitigação**: Limitar recálculo a abastecimentos do mesmo veículo após data atualizada, adicionar loading state

- **Risco**: Cache pode ficar desatualizado
  - **Mitigação**: Invalidar cache ao criar/atualizar/deletar abastecimentos, TTL de 5 minutos

- **Risco**: Usuário confuso com nova aba
  - **Mitigação**: Adicionar tooltip/ajuda explicando a funcionalidade, mensagens de estado vazio claras

## Próximos Passos (Opcional - Futuro)

- Adicionar gráfico de consumo por motorista (Chart.js ou similar)
- Comparativo de consumo entre motoristas (ranking)
- Exportação de relatório por motorista em PDF/Excel
- Filtro adicional por veículo na aba "Por Motorista"
- Histórico de consumo do motorista ao longo do tempo
- Alertas quando consumo do motorista está abaixo da média