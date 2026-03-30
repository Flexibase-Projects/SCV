export const authModuleBadges = [
  "Projetos",
  "Atividades",
  "Kanban",
  "Indicadores",
  "Conquistas",
  "Colaboracao",
  "Organograma",
  "Custos",
];

export const authSystemModules = [
  {
    title: "Entregas",
    description: "Cadastro completo, status de rota, montagem e historico por operacao.",
  },
  {
    title: "Abastecimento",
    description: "Registro detalhado de consumo, custos e desempenho por veiculo.",
  },
  {
    title: "Manutencao",
    description: "Acompanhamento preventivo e corretivo com custos, datas e quilometragem.",
  },
  {
    title: "Acerto de Viagem",
    description: "Fechamento financeiro da viagem com rateio, despesas e receitas vinculadas.",
  },
  {
    title: "Produtividade",
    description: "Leitura de performance operacional e acompanhamento das entregas com montagem.",
  },
  {
    title: "Cadastros e relatorios",
    description: "Base central de motoristas, veiculos, tipos de servico e indicadores consolidados.",
  },
];

export const authFaqItems = [
  {
    question: "O que eu consigo fazer logo apos entrar?",
    answer:
      "Voce acessa o painel principal do SCV e navega pelos modulos de entregas, abastecimento, manutencao, acerto de viagem, produtividade e cadastros.",
  },
  {
    question: "O sistema salva minha senha no navegador?",
    answer:
      "Nao. O navegador so pode guardar o e-mail por ate 30 dias para agilizar o proximo acesso. A senha nunca e persistida localmente.",
  },
  {
    question: "Como funciona a recuperacao de senha?",
    answer:
      "A tela envia um e-mail pelo Supabase com um link seguro para redefinir a senha diretamente na rota publica de recuperacao do SCV.",
  },
  {
    question: "Quem pode acessar os dados do sistema?",
    answer:
      "Nesta etapa, qualquer usuario autenticado no projeto Supabase podera usar os modulos disponiveis no SCV com o mesmo nivel de acesso funcional do app atual.",
  },
];
