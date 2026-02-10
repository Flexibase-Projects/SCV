<div align="center">
  # 🚛 Sistema de Controle de Veículos (SCV)
  
  **Plataforma completa para gestão de frotas, abastecimentos, manutenções e controle financeiro**

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Material UI](https://img.shields.io/badge/Material%20UI-007FFF?style=for-the-badge&logo=mui&logoColor=white)](https://mui.com/)
  [![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
</div>

---

## 📋 Sobre o Projeto

O **SCV (Sistema de Controle de Veículos)** é uma aplicação web completa desenvolvida para empresas que necessitam gerenciar sua frota de veículos de forma eficiente e profissional. O sistema oferece controle completo de abastecimentos, manutenções, entregas e acertos de viagem, proporcionando visibilidade financeira e operacional em tempo real. Com recursos avançados de importação em massa, relatórios detalhados e interface intuitiva, o SCV é a solução ideal para empresas de logística e transporte que buscam otimizar seus processos operacionais e financeiros.

## ✨ Funcionalidades

### 🏠 Dashboard (Hub)
- Visão geral consolidada de todas as operações em tempo real
- Cards de métricas financeiras (receitas, despesas, saldo)
- KPIs principais do sistema
- Acesso rápido e intuitivo aos módulos principais
- Interface responsiva e moderna

### 📦 Entregas
- Cadastro completo de entregas com informações detalhadas (PV Foco, NF, cliente, UF, etc.)
- Sistema de status (PENDENTE, EM_TRANSITO, ENTREGUE, CANCELADA)
- Filtros avançados por status, motorista e busca textual
- Registro de valores de frete e gastos relacionados
- Controle de necessidade de montagem e montadores associados
- Histórico completo de operações com rastreamento temporal
- Edição e exclusão de entregas

### ⛽ Abastecimento
- Registro detalhado de abastecimentos com data, veículo e quantidade
- Cálculo automático de consumo (km/litro) por veículo
- Controle de preço por litro e valor total
- Filtros avançados por placa, mês/ano ou intervalo de datas
- Histórico completo de abastecimentos com busca e ordenação
- Impressão de relatórios de abastecimento
- Cálculo automático de custos de combustível

### 🔧 Manutenção
- Gestão completa de manutenções preventivas e corretivas
- Categorização por tipo de serviço (revisão, troca de óleo, pneus, etc.)
- Controle de custos de manutenção por veículo
- Registro de data e quilometragem da manutenção
- Histórico completo com filtros e busca
- Controle de status de manutenção preventiva

### 💰 Acerto de Viagem
- Fechamento financeiro completo por viagem
- Cálculo automático de despesas (abastecimento, manutenção, gastos diversos)
- Vinculação automática de entregas à viagem
- Cálculo de receitas totais e saldo líquido
- Controle de período da viagem (data saída/chegada, dias de viagem)
- Geração de relatórios detalhados para impressão com logo da empresa
- Sistema de status (PENDENTE, ACERTADO)
- Visualização de entregas vinculadas e despesas detalhadas

### 📊 Resumo Geral
- Relatórios consolidados por período (mês/ano)
- Múltiplas métricas disponíveis:
  - Valor Expedido x Custo Manutenção
  - KM Rodado por Veículo
  - Entregas por Veículo
  - Entregas por UF
  - Custo Abastecimento por Veículo
  - Custo Manutenção por Veículo
  - Combustível por Estado
  - Controle de Status
- Filtros por mês e ano
- Gráficos e visualizações de dados
- Exportação e impressão de relatórios personalizados
- Seleção de métricas para visualização

### 📁 Cadastros
- **Motoristas/Condutores**: Cadastro unificado de motoristas e condutores
  - Campos completos: nome, CPF, CNH (número, categoria, validade)
  - Controle de ativação/desativação
  - Opção para marcar como montador
- **Montadores**: Gestão de montadores (integrado com motoristas)
  - Visualização de montadores cadastrados
  - Controle de motoristas que também são montadores
- **Veículos**: Gestão completa da frota
  - Cadastro com placa, fabricante, modelo, ano
  - Controle de status ativo/inativo
  - Histórico de veículos da frota
- Interface em abas para organização

### 📥 Importação em Massa
- Sistema unificado e inteligente de importação de dados via Excel/CSV
- Processamento automático com feedback visual detalhado
- Tipos de importação suportados:
  - Veículos
  - Entregas
  - Abastecimentos (Novo importador unificado)
  - Manutenções (Novo importador unificado)
  - Motoristas
  - Montadores
- Validação automática de dados antes da importação
- Preview dos dados antes de confirmar
- Templates disponíveis para download
- Processo guiado passo a passo
- Relatório de resultados da importação (sucessos e erros)
- Controle via feature flag (`VITE_ENABLE_IMPORT`)

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Descrição |
|------------|-----------|
| **React 19** | Biblioteca para construção de interfaces |
| **TypeScript** | Superset JavaScript com tipagem estática |
| **Vite** | Build tool e dev server ultrarrápido |
| **Tailwind CSS** | Framework CSS utility-first |
| **shadcn/ui** | Componentes UI acessíveis e customizáveis |
| **React Hook Form** | Gerenciamento de formulários |
| **Zod** | Validação de schemas |
| **TanStack Query** | Gerenciamento de estado do servidor |
| **Supabase** | Backend as a Service (PostgreSQL + Auth) |
| **Material UI** | Biblioteca de componentes e ícones (@mui/material) |
| **date-fns** | Manipulação de datas |

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# Clone o repositório (substitua pela URL do seu repositório)
git clone https://github.com/SEU_USUARIO/SCV.git
cd SCV

# Instale as dependências
npm install

# Configure as variáveis de ambiente (veja seção Variáveis de Ambiente)
cp .env.example .env
# Edite .env com suas chaves do Supabase

# Execute o projeto em modo de desenvolvimento
npm run dev
```

O projeto estará disponível em `http://localhost:8080`

### Scripts Disponíveis

```bash
npm run dev      # Inicia o servidor de desenvolvimento
npm run build    # Gera a build de produção
npm run preview  # Visualiza a build de produção localmente
npm run lint     # Executa o linter (ESLint)
```

## 📁 Estrutura do Projeto

```
src/
├── components/          # Componentes React reutilizáveis
│   ├── ui/             # Componentes base (shadcn/ui)
│   ├── layout/         # Componentes de layout (Sidebar, ModuleLayout)
│   ├── shared/         # Componentes compartilhados (impressão, modais)
│   ├── abastecimento/  # Componentes do módulo de abastecimento
│   ├── acertoViagem/    # Componentes do módulo de acerto de viagem
│   ├── cadastros/      # Componentes de cadastros (motoristas, veículos)
│   ├── dashboard/      # Componentes do dashboard e entregas
│   ├── importacao/     # Componentes do sistema de importação
│   └── manutencao/     # Componentes do módulo de manutenção
├── hooks/              # Custom hooks (useEntregas, useAbastecimentos, etc.)
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação (rotas)
│   ├── Hub.tsx         # Dashboard principal
│   ├── Entregas.tsx    # Módulo de entregas
│   ├── Abastecimento.tsx
│   ├── Manutencao.tsx
│   ├── AcertoViagem.tsx
│   ├── ResumoGeral.tsx
│   ├── Cadastros.tsx
│   ├── Importacao.tsx
│   └── Ajuda.tsx
├── types/              # Definições de tipos TypeScript
├── utils/              # Utilitários e parsers
│   ├── importacao/     # Sistema de importação (parser, validator, normalizer)
│   ├── excelParser.ts
│   └── featureFlags.ts
└── integrations/       # Integrações externas
    └── supabase/       # Cliente e tipos do Supabase
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto baseado no arquivo `.env.example`:

```env
# Supabase Configuration
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima

# Feature Flags
VITE_ENABLE_IMPORT=true
```

### Descrição das Variáveis

- **VITE_SUPABASE_URL**: URL do seu projeto Supabase
- **VITE_SUPABASE_ANON_KEY**: Chave anônima do Supabase (pública, segura para frontend)
- **VITE_ENABLE_IMPORT**: Habilita/desabilita o módulo de importação em massa (`true` ou `false`)

> ⚠️ **Importante**: Nunca commite o arquivo `.env` com valores reais. Use o arquivo `.env.example` como referência.

## 📤 Preparando para o GitHub – O que pode e o que NÃO pode ser enviado

### ✅ Pode ser enviado (já ignorados ou seguros)

- Código-fonte em `src/`, configurações (`vite.config.ts`, `tailwind.config.ts`, `tsconfig.*.json`, `eslint.config.js`)
- `package.json`, `package-lock.json` (ou `bun.lockb`)
- `.env.example` (template **sem** valores reais – apenas chaves vazias ou placeholders)
- `public/`, `index.html`, `components.json`
- Migrations em `supabase/migrations/`
- `supabase/config.toml.example` (não o `config.toml` com project_id real)
- Documentação: `README.md`, `docs/`, `LICENSE`
- Workflows em `.github/workflows/` (ex.: deploy)

### ❌ NÃO pode ser enviado

| Item | Motivo |
|------|--------|
| `.env` | Contém URL e chave do Supabase – **nunca** commitar |
| `.env.local`, `.env.*.local`, `.env.production` | Variáveis sensíveis por ambiente |
| `node_modules/` | Dependências – instalar com `npm install` |
| `dist/` | Build de produção – gerado com `npm run build` |
| `.agent/` | Configurações de agentes locais |
| `.cursor/plans/` | Planos locais do Cursor |
| `supabase/config.toml` | Pode conter `project_id` e dados do projeto |
| Logs (`*.log`, `logs/`) | Arquivos temporários |
| Arquivos de IDE (`.vscode/` com secrets, `.idea/`) | Preferências locais |
| Chaves, tokens, senhas em qualquer arquivo | Segurança |

### Verificação antes do primeiro push

```bash
# Confirme que .env não será commitado
git status
# .env não deve aparecer na lista de arquivos a commitar

# Se .env foi adicionado por engano, remova do índice (mantém o arquivo local)
git rm --cached .env
```

O `.gitignore` do projeto já está configurado para ignorar os itens da lista “NÃO pode ser enviado”. Antes de fazer push, sempre rode `git status` e confira se nenhum arquivo sensível aparece.

### Deploy no GitHub Actions (GitHub Pages)

O workflow em `.github/workflows/deploy.yml` usa **GitHub Secrets**. Configure no repositório:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret | Obrigatório | Descrição |
|--------|-------------|-----------|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave anônima do Supabase |
| `VITE_ENABLE_IMPORT` | Não (default: `true`) | `true` ou `false` para habilitar importação em massa |

Nunca coloque esses valores no código ou em arquivos commitados. Veja também [SECURITY.md](SECURITY.md), [PRIVACY.md](PRIVACY.md) e o [checklist de deploy](docs/GITHUB-DEPLOY.md).

## 📱 Screenshots

<img width="1904" height="918" alt="front" src="https://github.com/user-attachments/assets/06befa8c-6e65-4b93-9833-92037b50320f" />



## 🤝 Contribuição

Contribuições são bem-vindas! Siga as regras da seção **Preparando para o GitHub** e use boas práticas de commit.

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature` ou `fix/correcao`)
3. **Não commite** `.env`, `node_modules`, `dist` ou arquivos sensíveis
4. Commit com mensagens claras (`git commit -m 'feat: adiciona X'` ou `fix: corrige Y'`)
5. Push para a branch (`git push origin feature/nova-feature`)
6. Abra um Pull Request

## 🔒 Segurança e privacidade

- **[SECURITY.md](SECURITY.md)** — O que não commitar, como reportar vulnerabilidades e boas práticas de deploy.
- **[PRIVACY.md](PRIVACY.md)** — Política de privacidade de dados e tratamento de informações no repositório e na aplicação.

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  SCV – Sistema de Controle de Veículos

  <br/><br/>

  ⭐ Se este projeto te ajudou, considere dar uma estrela!
</div>
