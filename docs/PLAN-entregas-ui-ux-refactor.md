# Plano de Refatoração UI/UX - Módulo de Entregas

**Data:** 04/02/2026  
**Status:** Planejado  
**Prioridade:** Alta

---

## 🎯 Objetivo

Refatorar o UI/UX do módulo de Entregas para alinhar com o design moderno e profissional do Dashboard (Hub), mantendo consistência visual e melhorando a experiência do usuário.

---

## 📊 Análise do Estado Atual

### Dashboard (Hub) - Design de Referência
- **Estilo:** Moderno, clean, com cards arredondados (rounded-2xl)
- **Cores:** Fundo `brand-blue` (claro) / `#0f1115` (escuro), cards `brand-white` / `#181b21`
- **Tipografia:** Títulos semibold, textos em tons de gray
- **Componentes:** 
  - KPIs com ícones em containers arredondados
  - Gráficos com recharts
  - Cards com sombras suaves e hover effects
  - Layout em Bento Grid (12 colunas)

### Entregas - Estado Atual
- **Estilo:** Swiss Design (mais rígido, monocromático)
- **Cores:** Zinc (zinc-50, zinc-900, zinc-950)
- **Tipografia:** Font-mono, uppercase, tracking-tighter
- **Problemas:**
  - Design muito diferente do Dashboard
  - Ausência de cards visuais para métricas
  - Tabela sem destaque visual
  - Filtros sem integração visual harmoniosa

---

## 🎨 Design System Alvo

### Estilo Visual: Minimalista Técnico + Energético

Combinação de estética limpa e funcional (minimalista técnico) com toques de energia e vitalidade através da paleta verde. Design que comunica eficiência logística com dinamismo operacional.

### Paleta de Cores: Verde + Slate

```
Fundo Principal:
- Light: bg-slate-50 (#f8fafc)
- Dark: bg-slate-950 (#020617)

Cards / Superfícies:
- Light: bg-white com border-slate-200
- Dark: bg-slate-900 com border-slate-800

Primária (Verde Energético):
- Principal: emerald-500 (#10b981) - ações principais, destaques
- Claro: emerald-400 (#34d399) - hover states
- Escuro: emerald-600 (#059669) - estados ativos
- Suave: emerald-50 (#ecfdf5) / emerald-950 (#022c22) - backgrounds de acento

Secundária (Slate Técnico):
- Títulos: slate-900 (light) / slate-50 (dark)
- Corpo: slate-600 (light) / slate-400 (dark)
- Muted: slate-400 (light) / slate-500 (dark)
- Bordas: slate-200 (light) / slate-800 (dark)

Status Semânticos:
- Sucesso: emerald-500 + emerald-50/emerald-950
- Alerta: amber-500 + amber-50/amber-950  
- Erro: rose-500 + rose-50/rose-950
- Info: slate-500 + slate-50/slate-950
- Pendente: amber-500
- Em Rota: blue-500
- Concluído: emerald-500
- Cancelado: slate-400
```

### Tipografia
- **Fonte:** Inter ou system-ui (clean, técnica)
- **Títulos:** `text-2xl font-bold tracking-tight text-slate-900`
- **Subtítulos:** `text-sm font-medium text-slate-500 uppercase tracking-wide`
- **Valores KPI:** `text-3xl font-bold text-slate-900`
- **Corpo:** `text-sm text-slate-600`
- **Monospace:** Para números de rastreamento, valores (`font-mono`)

### Componentes

#### Cards
```
- Background: bg-white dark:bg-slate-900
- Borda: border border-slate-200 dark:border-slate-800
- Border radius: rounded-xl
- Sombra: shadow-sm hover:shadow-md
- Padding: p-5
- Transição: transition-all duration-200
```

#### Botões Primários (Ação)
```
- Background: bg-emerald-500 hover:bg-emerald-600
- Texto: text-white font-semibold
- Border radius: rounded-lg
- Padding: h-10 px-4
- Sombra: shadow-sm shadow-emerald-500/20
```

#### Botões Secundários
```
- Background: bg-white dark:bg-slate-900
- Borda: border border-slate-200 dark:border-slate-800
- Texto: text-slate-700 dark:text-slate-300
- Hover: hover:bg-slate-50 dark:hover:bg-slate-800
```

#### Inputs
```
- Background: bg-white dark:bg-slate-900
- Borda: border-slate-200 dark:border-slate-800
- Focus: focus:border-emerald-500 focus:ring-emerald-500/20
- Border radius: rounded-lg
```

#### Badges de Status
```
PENDENTE:    bg-amber-50 text-amber-700 border-amber-200
EM ROTA:     bg-blue-50 text-blue-700 border-blue-200
CONCLUÍDO:   bg-emerald-50 text-emerald-700 border-emerald-200
CANCELADO:   bg-slate-100 text-slate-600 border-slate-300
```

#### Ícones
```
- Container: h-10 w-10 rounded-lg
- Cores por contexto:
  - Primário: bg-emerald-50 text-emerald-600
  - Secundário: bg-slate-100 text-slate-600
  - Alerta: bg-amber-50 text-amber-600
```

### Espaçamento e Layout
- **Container:** `max-w-[1600px] mx-auto px-4 lg:px-8`
- **Grid KPIs:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
- **Gap seções:** `space-y-6`
- **Gap cards interno:** `gap-4`

---

## 📋 Tarefas de Refatoração

### Fase 1: Estrutura e Layout (Prioridade: Alta)

#### 1.1 Atualizar Container Principal
- [ ] Alterar fundo de `bg-zinc-50/50` para `bg-slate-50 dark:bg-slate-950`
- [ ] Ajustar padding de `p-6 lg:p-12` para `px-4 lg:px-8 py-6`
- [ ] Adicionar `max-w-[1600px] mx-auto` para consistência
- [ ] Remover estilos Swiss Design (bordas grossas, font-mono, uppercase excessivo)

**Arquivos:**
- `src/pages/Entregas.tsx`

#### 1.2 Refatorar Header
- [ ] Transformar header atual (Swiss style) para estilo Minimalista Técnico
- [ ] Título: `text-2xl font-bold text-slate-900` sem uppercase
- [ ] Subtítulo: `text-sm text-slate-500`
- [ ] Botão "Nova Entrega": `bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg shadow-sm shadow-emerald-500/20`

**Componentes afetados:**
- `src/components/dashboard/KPICards.tsx` (atualizar ou criar novo)

### Fase 2: Cards de Métricas/KPIs (Prioridade: Alta)

#### 2.1 Criar Novos KPI Cards (Estilo Minimalista Técnico + Energético)
Criar 4 cards principais com design clean e toques de cor emerald:

**Layout do Card:**
```
bg-white dark:bg-slate-900
border border-slate-200 dark:border-slate-800
rounded-xl p-5
shadow-sm hover:shadow-md transition-all
```

1. **Total de Entregas** (ícone: LocalShipping)
   - Ícone container: `bg-emerald-50 dark:bg-emerald-500/10 rounded-lg`
   - Ícone cor: `text-emerald-600 dark:text-emerald-400`
   - Valor: `text-2xl font-bold text-slate-900 dark:text-slate-50`
   - Label: `text-sm text-slate-500`
   - Sub: "entregas no período"
   
2. **Valor Total em Entregas** (ícone: AttachMoney)
   - Ícone container: `bg-emerald-50 dark:bg-emerald-500/10 rounded-lg`
   - Valor formatado em reais
   - Sub: "valor total"
   
3. **Taxa de Conclusão** (ícone: TrendingUp)
   - Ícone container: `bg-emerald-50 dark:bg-emerald-500/10 rounded-lg`
   - Valor: "XX%"
   - Sub: "X de Y concluídas"
   - Barra de progresso visual opcional
   
4. **Gastos Totais** (ícone: AccountBalanceWallet)
   - Ícone container: `bg-amber-50 dark:bg-amber-500/10 rounded-lg`
   - Ícone cor: `text-amber-600` (alerta para gastos)
   - Valor: soma de gastos_entrega + gastos_montagem
   - Sub: "gastos operacionais"

**Arquivos:**
- Criar: `src/components/dashboard/EntregaKPIs.tsx`
- Atualizar: `src/pages/Entregas.tsx`

### Fase 3: Abas e Filtros (Prioridade: Alta)

#### 3.1 Refatorar Tabs (Estilo Minimalista)
- [ ] Manter estrutura de abas (Todos, Por Motorista, Por Veículo, Por Montagem)
- [ ] Estilizar tabs com:
  - Trigger ativo: `border-b-2 border-emerald-500 text-emerald-600`
  - Trigger inativo: `text-slate-500 hover:text-slate-700`
  - Fonte: `text-sm font-medium`
  - Sem background, apenas border-bottom

#### 3.2 Refatorar Filtros
- [ ] Transformar filtros em card único:
  ```
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  rounded-xl p-4
  shadow-sm
  ```
- [ ] Organizar em grid responsivo: `grid grid-cols-1 md:grid-cols-4 gap-4`
- [ ] Input de busca: ícone Search, placeholder "Buscar entregas..."
- [ ] Date pickers: estilo compacto, ícone CalendarMonth
- [ ] Selects: bordas slate-200, focus emerald-500
- [ ] Botão "Imprimir/PDF": `variant="outline"` com ícone Print

**Arquivos:**
- `src/pages/Entregas.tsx` (seção de filtros)
- `src/components/shared/SharedFilter.tsx` (se necessário)

### Fase 4: Tabela de Entregas (Prioridade: Alta)

#### 4.1 Refatorar EntregaTable (Estilo Técnico Clean)
- [ ] Container da tabela:
  ```
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  rounded-xl
  shadow-sm
  overflow-hidden
  ```
- [ ] Header da tabela:
  - Background: `bg-slate-50 dark:bg-slate-800/50`
  - Texto: `text-xs font-semibold text-slate-500 uppercase tracking-wider`
  - Padding: `py-3 px-4`
- [ ] Rows:
  - Border-bottom: `border-slate-100 dark:border-slate-800`
  - Hover: `hover:bg-slate-50 dark:hover:bg-slate-800/50`
  - Padding: `py-3 px-4`
- [ ] Células de dados:
  - Texto: `text-sm text-slate-700 dark:text-slate-300`
  - Valores monetários: `font-mono text-slate-900`
- [ ] Badges de status (atualizados):
  ```
  PENDENTE:    bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20
  EM_TRANSITO: bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20
  ENTREGUE:    bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20
  CANCELADA:   bg-slate-100 text-slate-600 border-slate-300 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700
  ```
- [ ] Botões de ação (Editar/Excluir):
  - Ícones em containers circulares pequenos
  - Hover: `hover:bg-slate-100 dark:hover:bg-slate-800`
  - Cores: slate-400 → slate-600 no hover

**Arquivos:**
- `src/components/dashboard/EntregaTable.tsx`

### Fase 5: Modal de Formulário (Prioridade: Média)

#### 5.1 Refatorar EntregaFormModal (Estilo Minimalista Técnico)
- [ ] Container do Dialog:
  ```
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  rounded-xl
  shadow-xl
  ```
- [ ] Header:
  - Background: `bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800`
  - Título: `text-xl font-bold text-slate-900 dark:text-slate-50`
- [ ] Seções do formulário:
  - Título da seção: `text-sm font-semibold text-slate-900 uppercase tracking-wide`
  - Divider: `border-b border-slate-200 dark:border-slate-800 pb-2 mb-4`
- [ ] Inputs:
  - Background: `bg-white dark:bg-slate-900`
  - Borda: `border-slate-200 dark:border-slate-800`
  - Border radius: `rounded-lg`
  - Focus: `focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20`
  - Labels: `text-xs font-medium text-slate-500 uppercase`
- [ ] Selects e Date Pickers:
  - Mesmo estilo dos inputs
  - Dropdown: `bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-lg`
- [ ] Switch (Precisa Montagem):
  - Checked: `bg-emerald-500`
  - Unchecked: `bg-slate-200 dark:bg-slate-700`
- [ ] Botões:
  - Primário (Salvar): `bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg`
  - Secundário (Cancelar): `bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300`
- [ ] Badges de montadores:
  - `bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20`

**Arquivos:**
- `src/components/dashboard/EntregaFormModal.tsx`

### Fase 6: Estados Vazios e Loading (Prioridade: Média)

#### 6.1 Refatorar Estados Vazios (Estilo Minimalista)
- [ ] Container:
  ```
  bg-slate-50 dark:bg-slate-900/50
  border border-dashed border-slate-300 dark:border-slate-700
  rounded-xl
  py-16
  ```
- [ ] Ícone:
  - Container: `h-16 w-16 bg-slate-100 dark:bg-slate-800 rounded-2xl mx-auto mb-4`
  - Ícone: `h-8 w-8 text-slate-400`
  - Opacidade reduzida: `opacity-50`
- [ ] Textos:
  - Título: `text-lg font-semibold text-slate-900 dark:text-slate-100`
  - Subtítulo: `text-sm text-slate-500`

#### 6.2 Refatorar Loading State
- [ ] Criar loading skeleton:
  - Cards de KPI: 4 skeletons com `bg-slate-200 dark:bg-slate-800 animate-pulse rounded-xl h-24`
  - Tabela: header + 5 rows com `bg-slate-200 dark:bg-slate-800 animate-pulse`
  - Efeito shimmer opcional para modernidade

**Arquivos:**
- `src/pages/Entregas.tsx` (estados de loading e vazio)

### Fase 7: Paginação (Prioridade: Média)

#### 7.1 Refatorar PaginationControl (Estilo Minimalista)
- [ ] Container:
  ```
  bg-white dark:bg-slate-900
  border border-slate-200 dark:border-slate-800
  rounded-xl
  px-4 py-3
  flex items-center justify-between
  ```
- [ ] Botões de navegação:
  - `variant="outline"` com `size="sm"`
  - Borda: `border-slate-200 dark:border-slate-800`
  - Hover: `hover:bg-slate-50 dark:hover:bg-slate-800`
  - Disabled: `opacity-50 cursor-not-allowed`
- [ ] Info de página:
  - Texto: `text-sm text-slate-600 dark:text-slate-400`
  - Destaque: `font-medium text-slate-900 dark:text-slate-100`
- [ ] Select de itens por página (se houver):
  - Estilo compacto, bordas slate-200

**Arquivos:**
- `src/components/shared/PaginationControl.tsx`

---

## 🔧 Dependências Técnicas

### Verificar/Criar:
1. **Cores no Tailwind:** Verificar se `brand-blue` e `brand-white` estão definidos
2. **Ícones:** Usar `@mui/icons-material` (já instalado)
3. **Componentes shadcn:** Tabs, Select, Button, Calendar (já instalados)

### Instalação (se necessário):
```bash
# Verificar se todos os componentes shadcn estão disponíveis
# Cores brand-* devem estar no tailwind.config.ts
```

---

## 📁 Estrutura de Arquivos

```
src/
├── components/
│   └── dashboard/
│       ├── EntregaKPIs.tsx          # NOVO - Cards de métricas
│       ├── EntregaTable.tsx         # MODIFICAR - Estilo da tabela
│       ├── EntregaFormModal.tsx     # MODIFICAR - Estilo do modal
│       └── EntregaFilters.tsx       # OPCIONAL - Componente de filtros
├── pages/
│   └── Entregas.tsx                 # MODIFICAR - Layout principal
└── components/ui/                   # Já existentes
    └── ...
```

---

## ✅ Critérios de Aceitação

### Visual
- [ ] Design Minimalista Técnico + Energético aplicado
- [ ] Paleta Verde (emerald) + Slate implementada corretamente
- [ ] Modo claro: fundo slate-50, cards white, textos slate-900/600
- [ ] Modo escuro: fundo slate-950, cards slate-900, textos slate-50/400
- [ ] Cards com sombras suaves (`shadow-sm`) e hover effects (`hover:shadow-md`)
- [ ] Tipografia Inter/system-ui, hierarquia clara
- [ ] Sem estilos Swiss Design (bordas grossas, font-mono, uppercase excessivo)

### Funcional
- [ ] Todas as funcionalidades atuais preservadas
- [ ] Filtros funcionando corretamente
- [ ] Paginação operacional
- [ ] Modal de formulário funcional
- [ ] Impressão/PDF funcionando

### Performance
- [ ] Sem regressões de performance
- [ ] Animações suaves (transitions)
- [ ] Responsividade mantida

---

## 🚀 Ordem de Execução Recomendada

1. **Fase 1** → Estrutura base (container, layout)
2. **Fase 2** → KPI Cards (visão de métricas)
3. **Fase 3** → Tabs e Filtros (navegação)
4. **Fase 4** → Tabela (conteúdo principal)
5. **Fase 5** → Modal (formulário)
6. **Fase 6** → Estados e Loading
7. **Fase 7** → Paginação

---

## 📝 Notas

### Decisões de Design
- **Estilo Minimalista Técnico:** Design limpo, funcional, sem excessos visuais
- **Toque Energético:** Paleta Verde (emerald) como cor primária para transmitir dinamismo e eficiência
- **Base Slate:** Tons de cinza azulado (slate) para fundos, textos e elementos secundários
- **Manter Tabs:** A navegação por abas é funcional e será mantida com estilo minimalista
- **KPIs no topo:** Cards de métricas aparecem primeiro, com ícones em containers coloridos
- **Filtros em card:** Consolidar todos os filtros em um card único para organização visual
- **Cores de Status:** 
  - Verde (emerald) = Concluído
  - Âmbar (amber) = Pendente  
  - Azul (blue) = Em Rota/Em Trânsito
  - Cinza (slate) = Cancelado
- **Tipografia:** Inter/system-ui, sem font-mono excessivo, sem uppercase excessivo
- **Bordas:** Finas (1px) e sutis, sem bordas grossas de estilo Swiss
- **Animações:** Transições suaves (200ms) para hover e focus states

### Possíveis Desafios
1. **Diferença de dados:** Dashboard usa hooks diferentes (useEntregas) vs Entregas (useEntregasPaginated)
2. **Filtros complexos:** Múltiplas abas com filtros específicos precisam ser reorganizados visualmente
3. **Manter funcionalidade:** Garantir que todas as features atuais continuem funcionando

---

## 🎯 Próximos Passos

1. Revisar e aprovar este plano
2. Executar Fase 1 (estrutura base)
3. Iterar conforme feedback
4. Completar todas as fases
5. Testar e validar

---

**Arquivo criado:** `docs/PLAN-entregas-ui-ux-refactor.md`  
**Workflow usado:** `@.agent/workflows/plan.md`  
**Agents envolvidos:** `backend-specialist`, `ui-ux-pro-max`
