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

O **SCV (Sistema de Controle de Veículos)** é uma aplicação web desenvolvida para empresas que necessitam gerenciar sua frota de veículos de forma eficiente. O sistema permite o controle completo de abastecimentos, manutenções, entregas e acertos de viagem, proporcionando visibilidade financeira e operacional em tempo real.

## ✨ Funcionalidades

### 🏠 Dashboard (Hub)
- Visão geral consolidada de todas as operações
- Cards de métricas financeiras (receitas, despesas, saldo)
- Acesso rápido aos módulos principais

### 📦 Entregas
- Cadastro e acompanhamento de entregas
- Registro de valores de frete
- Histórico completo de operações

### ⛽ Abastecimento
- Registro de abastecimentos com cálculo automático
- Controle de consumo por veículo
- Histórico de preços por litro

### 🔧 Manutenção
- Gestão de manutenções preventivas e corretivas
- Categorização por tipo de serviço
- Controle de custos de manutenção

### 💰 Acerto de Viagem
- Fechamento financeiro por viagem
- Cálculo automático de despesas e receitas
- Geração de relatórios para impressão com logo da empresa

### 📊 Resumo Geral
- Relatórios consolidados por período
- Filtros por mês/ano
- Exportação e impressão de relatórios

### 📁 Cadastros
- Gestão de veículos da frota
- Cadastro de condutores
- Configurações do sistema

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
git clone https://github.com/seu-usuario/lovable-logistics-hub.git

# Acesse a pasta do projeto
cd lovable-logistics-hub

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
│   ├── layout/         # Componentes de layout (Sidebar, Header)
│   ├── shared/         # Componentes compartilhados
│   ├── abastecimento/  # Componentes do módulo de abastecimento
│   ├── acertoViagem/   # Componentes do módulo de acerto
│   ├── dashboard/      # Componentes do dashboard
│   └── manutencao/     # Componentes do módulo de manutenção
├── hooks/              # Custom hooks
├── lib/                # Utilitários e configurações
├── pages/              # Páginas da aplicação
├── types/              # Definições de tipos TypeScript
└── integrations/       # Integrações externas (Supabase)
```

## 🔐 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

## 📱 Screenshots

<div align="center">
  <i>Em breve...</i>
</div>

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
