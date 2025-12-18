<div align="center">
  <img src="public/logo-flexibase.svg" alt="Flexibase Logo" width="200"/>
  
  # 🚛 Sistema de Controle de Veículos (SCV)
  
  **Plataforma completa para gestão de frotas, abastecimentos, manutenções e controle financeiro**

  [![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
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
- Sistema completo de importação de dados via Excel/CSV
- Tipos de importação suportados:
  - Veículos
  - Entregas
  - Abastecimentos
  - Manutenções
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
| **Lucide React** | Biblioteca de ícones |
| **date-fns** | Manipulação de datas |

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn

### Instalação

```bash
# Clone o repositório
git clone https://github.com/gustavorochaC/Controle-Frotas

# Acesse a pasta do projeto
cd Controle-Frotas

# Instale as dependências
npm install

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

## 📱 Screenshots

<img width="1909" height="916" alt="image" src="https://github.com/user-attachments/assets/3e730425-2660-4fdf-a5ff-e177ff4bfb15" />


## 🤝 Contribuição

Contribuições são bem-vindas! Sinta-se à vontade para abrir issues e pull requests.

1. Faça um Fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

<div align="center">
  Desenvolvido com ❤️ por <b>Flexibase</b>
  
  <br/><br/>
  
  ⭐ Se este projeto te ajudou, considere dar uma estrela!
</div>
