import { Link } from 'react-router-dom';
import {
  ArrowBack as ArrowLeft,
  MenuBook as BookOpen,
  LocalShipping as Truck,
  LocalGasStation as Fuel,
  Build as Wrench,
  Description as FileText,
  Settings,
  TrendingUp,
  CheckCircle as CheckCircle2,
  ErrorOutline as AlertCircle,
  Lightbulb,
  HelpOutline as HelpCircle,
  People as Users,
  DirectionsCar as Car,
  AccessTime as Clock,
  WarningAmber as AlertTriangle,
  ToggleOff as ToggleLeft,
  Search,
  Print as Printer,
  Edit,
  Delete as Trash2,
  Calculate as Calculator,
  FactCheck as FileCheck,
  Route,
  ManageAccounts as UserCog,
  Shield,
  CloudUpload as Upload
} from '@mui/icons-material';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { isImportEnabled } from '@/utils/featureFlags';

export default function Ajuda() {
  return (
    <div className="min-h-screen bg-brand-blue dark:bg-[#0f1115]">
      {/* Header */}
      <header className="border-b border-border/60 bg-brand-white/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold">Central de Ajuda</h1>
                  <p className="text-sm text-muted-foreground">SCV - Sistema de Controle de Veículos</p>
                </div>
              </div>
            </div>
            <Badge variant="outline" className="hidden sm:flex gap-1">
              <Clock className="h-3 w-3" />
              Atualizado em Jan/2025
            </Badge>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        {/* Introdução */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-r from-primary/5 via-primary/3 to-transparent">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 shrink-0">
                <HelpCircle className="h-7 w-7 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">Bem-vindo ao SCV!</h2>
                <p className="text-muted-foreground mb-3">
                  Este guia completo vai te ajudar a utilizar todas as funcionalidades do sistema.
                  Navegue pelas abas abaixo para aprender sobre cada módulo.
                </p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="gap-1">
                    <Settings className="h-3 w-3" /> Cadastros
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Truck className="h-3 w-3" /> Entregas
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Fuel className="h-3 w-3" /> Abastecimento
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <Wrench className="h-3 w-3" /> Manutenção
                  </Badge>
                  <Badge variant="secondary" className="gap-1">
                    <FileText className="h-3 w-3" /> Acerto de Viagem
                  </Badge>
                  {isImportEnabled() && (
                    <Badge variant="secondary" className="gap-1">
                      <Upload className="h-3 w-3" /> Importação
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs de Conteúdo */}
        <Tabs defaultValue="inicio" className="space-y-6">
          <TabsList className={`grid w-full grid-cols-2 md:grid-cols-4 ${isImportEnabled() ? 'lg:grid-cols-8' : 'lg:grid-cols-7'} h-auto gap-1 bg-brand-white/50 p-1`}>
            <TabsTrigger value="inicio" className="gap-1 text-xs sm:text-sm">
              <HelpCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Início</span>
            </TabsTrigger>
            <TabsTrigger value="cadastros" className="gap-1 text-xs sm:text-sm">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Cadastros</span>
            </TabsTrigger>
            <TabsTrigger value="entregas" className="gap-1 text-xs sm:text-sm">
              <Truck className="h-4 w-4" />
              <span className="hidden sm:inline">Entregas</span>
            </TabsTrigger>
            <TabsTrigger value="abastecimento" className="gap-1 text-xs sm:text-sm">
              <Fuel className="h-4 w-4" />
              <span className="hidden sm:inline">Abastec.</span>
            </TabsTrigger>
            <TabsTrigger value="manutencao" className="gap-1 text-xs sm:text-sm">
              <Wrench className="h-4 w-4" />
              <span className="hidden sm:inline">Manut.</span>
            </TabsTrigger>
            <TabsTrigger value="acerto" className="gap-1 text-xs sm:text-sm">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Acerto</span>
            </TabsTrigger>
            {isImportEnabled() && (
              <TabsTrigger value="importacao" className="gap-1 text-xs sm:text-sm">
                <Upload className="h-4 w-4" />
                <span className="hidden sm:inline">Importação</span>
              </TabsTrigger>
            )}
            <TabsTrigger value="faq" className="gap-1 text-xs sm:text-sm">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">FAQ</span>
            </TabsTrigger>
          </TabsList>

          {/* Tab: Início */}
          <TabsContent value="inicio" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="h-5 w-5 text-primary" />
                  Ordem Recomendada de Configuração
                </CardTitle>
                <CardDescription>
                  Siga estes passos na primeira vez que usar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { step: 1, title: 'Cadastrar Veículos', desc: 'Adicione os veículos da frota', icon: Car, color: 'text-blue-600 bg-blue-100' },
                    { step: 2, title: 'Cadastrar Motoristas', desc: 'Registre motoristas com CNH', icon: Users, color: 'text-emerald-600 bg-emerald-100' },
                    { step: 3, title: 'Cadastrar Condutores', desc: 'Para abastecimentos', icon: UserCog, color: 'text-violet-600 bg-violet-100' },
                    { step: 4, title: 'Cadastrar Montadores', desc: 'Equipe de montagem', icon: Wrench, color: 'text-amber-600 bg-amber-100' },
                    { step: 5, title: 'Registrar Entregas', desc: 'Comece a controlar entregas', icon: Truck, color: 'text-slate-600 bg-slate-100' },
                    { step: 6, title: 'Usar os Módulos', desc: 'Abastecimento, Manutenção...', icon: TrendingUp, color: 'text-primary bg-primary/10' },
                  ].map((item) => (
                    <div key={item.step} className="flex items-start gap-3 p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold shrink-0">
                        {item.step}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <item.icon className={`h-4 w-4 ${item.color.split(' ')[0]}`} />
                          <p className="font-medium text-sm">{item.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Dicas Rápidas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-500" />
                  Dicas Rápidas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Edit className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Editar</p>
                      <p className="text-xs text-muted-foreground">Clique no ícone de lápis na tabela</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Trash2 className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Excluir</p>
                      <p className="text-xs text-muted-foreground">Clique no ícone de lixeira</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Search className="h-5 w-5 text-violet-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Filtrar</p>
                      <p className="text-xs text-muted-foreground">Use os filtros no topo</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                    <Printer className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm">Imprimir</p>
                      <p className="text-xs text-muted-foreground">Ícone de impressora</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                  <div className="flex items-start gap-3">
                    <ToggleLeft className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-sm text-amber-800 dark:text-amber-200">Desativar/Reativar Cadastros</p>
                      <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                        Cadastros não são excluídos permanentemente - são desativados e podem ser reativados a qualquer momento. Isso preserva o histórico de dados vinculados.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Cadastros */}
          <TabsContent value="cadastros" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-violet-600" />
                  Cadastros - Configuração Inicial
                </CardTitle>
                <CardDescription>
                  Configure veículos, motoristas, condutores e montadores antes de usar os outros módulos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-amber-800 dark:text-amber-200">Importante: Motorista vs Condutor</p>
                      <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                        <strong>Motorista:</strong> Faz entregas - aparece no módulo de Entregas e Acerto de Viagem<br />
                        <strong>Condutor:</strong> Abastece veículos - aparece no módulo de Abastecimento
                      </p>
                    </div>
                  </div>
                </div>

                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="veiculos" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Car className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Cadastrar Veículos</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                        <li>Acesse <strong>Cadastros</strong> → aba <strong>Veículos</strong></li>
                        <li>Clique em <strong>"Novo Veículo"</strong></li>
                        <li>Preencha: <strong>Placa</strong> (obrigatório), Modelo, Fabricante</li>
                        <li>Selecione o <strong>Tipo</strong>: Caminhão, Van, Carro, Moto ou Outro</li>
                        <li>Clique em <strong>Salvar</strong></li>
                      </ol>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="motoristas" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 text-emerald-600" />
                        <span className="font-medium">Cadastrar Motoristas</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                        <li>Acesse <strong>Cadastros</strong> → aba <strong>Motoristas</strong></li>
                        <li>Clique em <strong>"Novo Motorista"</strong></li>
                        <li>Selecione a função: <strong>Motorista</strong></li>
                        <li>Preencha: Nome, CNH, Telefone</li>
                        <li>Informe as datas de validade:
                          <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                            <li><strong>Validade CNH</strong> - Sistema alerta quando próximo do vencimento</li>
                            <li><strong>Exame Toxicológico</strong> - Validade de 2 anos e 6 meses</li>
                          </ul>
                        </li>
                        <li>Clique em <strong>Salvar</strong></li>
                      </ol>
                      <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3 mt-3">
                        <div className="flex items-start gap-2">
                          <Shield className="h-4 w-4 text-rose-600 mt-0.5" />
                          <p className="text-sm text-rose-700 dark:text-rose-300">
                            <strong>Alertas automáticos:</strong> O Hub exibe alertas quando CNH ou Toxicológico estão vencidos ou próximos do vencimento (30 dias).
                          </p>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="condutores" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <UserCog className="h-5 w-5 text-violet-600" />
                        <span className="font-medium">Cadastrar Condutores</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                        <li>Acesse <strong>Cadastros</strong> → aba <strong>Condutores</strong></li>
                        <li>Clique em <strong>"Novo Condutor"</strong></li>
                        <li>A função já vem como <strong>Condutor</strong></li>
                        <li>Preencha: Nome, CNH, Telefone, datas de validade</li>
                        <li>Clique em <strong>Salvar</strong></li>
                      </ol>
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mt-3">
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                          <strong>Dica:</strong> Condutores aparecem apenas no módulo de <strong>Abastecimento</strong>. Use para funcionários que abastecem mas não fazem entregas.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="montadores" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3">
                        <Wrench className="h-5 w-5 text-amber-600" />
                        <span className="font-medium">Cadastrar Montadores</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4">
                      <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                        <li>Acesse <strong>Cadastros</strong> → aba <strong>Montadores</strong></li>
                        <li>Clique em <strong>"Novo Montador"</strong></li>
                        <li>Preencha: Nome e Telefone</li>
                        <li>Clique em <strong>Salvar</strong></li>
                      </ol>
                      <p className="text-sm text-muted-foreground mt-3">
                        Montadores aparecem em <strong>Entregas</strong> (montagem) e <strong>Acerto de Viagem</strong>.
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Entregas */}
          <TabsContent value="entregas" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5 text-slate-600" />
                  Controle de Entregas
                </CardTitle>
                <CardDescription>
                  Gerencie as entregas de pedidos e acompanhe o status em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Como criar uma nova entrega:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Clique no card <strong>"Entregas"</strong> no Hub ou acesse pelo menu</li>
                    <li>Clique em <strong>"Nova Entrega"</strong></li>
                    <li>Preencha os dados:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                        <li><strong>PV Foco / NF</strong> - Identificadores do pedido</li>
                        <li><strong>Cliente e UF</strong> - Destino da entrega</li>
                        <li><strong>Valor</strong> - Valor do frete</li>
                        <li><strong>Veículo e Motorista</strong> - Responsáveis</li>
                      </ul>
                    </li>
                    <li>Se precisar de montagem, marque a opção e selecione os montadores</li>
                    <li>Defina o <strong>Status inicial</strong> (geralmente "Pendente")</li>
                    <li>Clique em <strong>Salvar</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Filtros Avançados - Tabs de Visualização:</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A página de Entregas possui 3 formas de visualizar e filtrar os dados:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <p className="font-medium text-blue-800 dark:text-blue-200">Tab "Todos"</p>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Visualização geral de todas as entregas. Use a busca para filtrar por cliente, PV Foco, NF ou motorista, e o filtro de data para definir um período específico.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Tab "Por Motorista"</p>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-700 dark:text-emerald-300 ml-2">
                        <li>Selecione um <strong>motorista</strong> no dropdown</li>
                        <li>Opcionalmente, escolha uma <strong>data específica</strong> usando o calendário</li>
                        <li>As entregas são exibidas automaticamente ordenadas por data (mais recente primeiro)</li>
                        <li>Use o botão <strong>"Limpar Filtros"</strong> para resetar a seleção</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-5 w-5 text-violet-600" />
                        <p className="font-medium text-violet-800 dark:text-violet-200">Tab "Por Veículo"</p>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-violet-700 dark:text-violet-300 ml-2">
                        <li>Selecione um <strong>veículo</strong> no dropdown</li>
                        <li>Opcionalmente, escolha uma <strong>data específica</strong> usando o calendário</li>
                        <li>As entregas são exibidas automaticamente ordenadas por data (mais recente primeiro)</li>
                        <li>Use o botão <strong>"Limpar Filtros"</strong> para resetar a seleção</li>
                      </ol>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Dica:</strong> Ao mudar de tab, os filtros são automaticamente limpos para melhorar a experiência de uso.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Status das entregas:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-center">
                      <Badge className="bg-amber-500 mb-2">PENDENTE</Badge>
                      <p className="text-xs text-muted-foreground">Aguardando saída</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 text-center">
                      <Badge className="bg-blue-500 mb-2">EM ROTA</Badge>
                      <p className="text-xs text-muted-foreground">Em trânsito</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-center">
                      <Badge className="bg-emerald-500 mb-2">CONCLUÍDO</Badge>
                      <p className="text-xs text-muted-foreground">Entrega finalizada</p>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200 text-center">
                      <Badge className="bg-rose-500 mb-2">CANCELADO</Badge>
                      <p className="text-xs text-muted-foreground">Entrega cancelada</p>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Dica:</strong> Use as tabs de filtros para visualizar entregas de forma mais específica. A tab "Todos" é ideal para buscas gerais, enquanto "Por Motorista" e "Por Veículo" facilitam análises focadas.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Abastecimento */}
          <TabsContent value="abastecimento" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Fuel className="h-5 w-5 text-orange-600" />
                  Controle de Abastecimento
                </CardTitle>
                <CardDescription>
                  Registre abastecimentos e acompanhe o consumo da frota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Como registrar um abastecimento:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Acesse o módulo <strong>"Abastecimento"</strong></li>
                    <li>Clique em <strong>"Novo Abastecimento"</strong></li>
                    <li>Selecione a <strong>Data</strong> e o <strong>Veículo</strong></li>
                    <li>Escolha o <strong>Condutor</strong> responsável pelo abastecimento</li>
                    <li>Informe o <strong>Posto</strong> e a <strong>Cidade/UF</strong></li>
                    <li>Registre o <strong>Km atual</strong> do hodômetro</li>
                    <li>Informe <strong>Valor Total</strong> e <strong>Valor por Litro</strong></li>
                    <li>Selecione o <strong>Produto</strong>: Diesel S-10 ou Arla-32</li>
                    <li>Clique em <strong>Salvar</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Filtros Avançados - Tabs de Visualização:</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    A página de Abastecimento possui 3 formas de visualizar e filtrar os dados:
                  </p>
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="h-5 w-5 text-blue-600" />
                        <p className="font-medium text-blue-800 dark:text-blue-200">Tab "Todos"</p>
                      </div>
                      <p className="text-sm text-blue-700 dark:text-blue-300">
                        Visualização geral de todos os abastecimentos. Use a busca para filtrar por placa, condutor ou posto, e o filtro de data para definir um período específico.
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                      <div className="flex items-center gap-2 mb-2">
                        <User className="h-5 w-5 text-emerald-600" />
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Tab "Por Motorista"</p>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-emerald-700 dark:text-emerald-300 ml-2">
                        <li>Selecione um <strong>motorista</strong> no dropdown</li>
                        <li>Opcionalmente, escolha uma <strong>data específica</strong> usando o calendário</li>
                        <li>Os abastecimentos são exibidos automaticamente ordenados por data (mais recente primeiro)</li>
                        <li>Use o botão <strong>"Limpar Filtros"</strong> para resetar a seleção</li>
                      </ol>
                    </div>

                    <div className="p-4 rounded-lg bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800">
                      <div className="flex items-center gap-2 mb-2">
                        <Car className="h-5 w-5 text-violet-600" />
                        <p className="font-medium text-violet-800 dark:text-violet-200">Tab "Por Veículo"</p>
                      </div>
                      <ol className="list-decimal list-inside space-y-1 text-sm text-violet-700 dark:text-violet-300 ml-2">
                        <li>Selecione um <strong>veículo</strong> no dropdown</li>
                        <li>Opcionalmente, escolha uma <strong>data específica</strong> usando o calendário</li>
                        <li>Os abastecimentos são exibidos automaticamente ordenados por data (mais recente primeiro)</li>
                        <li>Use o botão <strong>"Limpar Filtros"</strong> para resetar a seleção</li>
                      </ol>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-4">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Dica:</strong> Ao mudar de tab, os filtros são automaticamente limpos para melhorar a experiência de uso.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Calculator className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Cálculo Automático de Litros</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          O sistema calcula automaticamente:<br />
                          <code className="bg-emerald-100 dark:bg-emerald-800 px-1 rounded">Litros = Valor Total ÷ Valor/Litro</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Cálculo de Km/Litro</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Mantenha o Km sempre atualizado para o sistema calcular o consumo médio de cada veículo.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="h-5 w-5 text-amber-600 mt-0.5" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      <strong>Dica:</strong> Use as tabs de filtros para visualizar abastecimentos de forma mais específica. A tab "Por Veículo" é ideal para acompanhar o histórico de consumo de um veículo específico.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Manutenção */}
          <TabsContent value="manutencao" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-green-600" />
                  Controle de Manutenção
                </CardTitle>
                <CardDescription>
                  Gerencie manutenções preventivas e corretivas da frota
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Como registrar uma manutenção:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Acesse o módulo <strong>"Manutenção"</strong></li>
                    <li>Clique em <strong>"Nova Manutenção"</strong></li>
                    <li>Selecione o <strong>Tipo</strong>: Preventiva ou Corretiva</li>
                    <li>Escolha o <strong>Veículo</strong></li>
                    <li>Descreva o <strong>Serviço realizado</strong></li>
                    <li>Informe o <strong>Km atual</strong> e o <strong>Custo Total</strong></li>
                    <li>Registre a <strong>Data</strong> da manutenção</li>
                    <li>Clique em <strong>Salvar</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Tipos de manutenção:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        <p className="font-medium text-blue-700 dark:text-blue-300">Preventiva</p>
                      </div>
                      <p className="text-sm text-blue-600 dark:text-blue-400">
                        Manutenções programadas: troca de óleo, filtros, revisões, alinhamento, etc.
                      </p>
                    </div>
                    <div className="p-4 rounded-lg bg-rose-50 dark:bg-rose-900/20 border border-rose-200">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-rose-600" />
                        <p className="font-medium text-rose-700 dark:text-rose-300">Corretiva</p>
                      </div>
                      <p className="text-sm text-rose-600 dark:text-rose-400">
                        Reparos de emergência: quebras, defeitos, substituição de peças, etc.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <FileCheck className="h-5 w-5 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">Manutenção Preventiva Programada</p>
                      <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                        Configure alertas por <strong>Km</strong> ou <strong>tempo</strong> para cada veículo.
                        O sistema avisa quando estiver próximo da próxima manutenção.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Acerto de Viagem */}
          <TabsContent value="acerto" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-cyan-600" />
                  Acerto de Viagem
                </CardTitle>
                <CardDescription>
                  Controle adiantamentos e faça o acerto de despesas das viagens
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="font-semibold mb-3">Como criar um acerto de viagem:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground ml-2">
                    <li>Acesse o módulo <strong>"Acerto de Viagem"</strong></li>
                    <li>Clique em <strong>"Novo Acerto"</strong></li>
                    <li>Selecione o <strong>Motorista</strong> (ou Montador)</li>
                    <li>Informe a <strong>Data da viagem</strong></li>
                    <li>Registre o <strong>Valor adiantado</strong></li>
                    <li>Adicione as <strong>Despesas</strong>:
                      <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-xs">
                        <li><strong>Combustível</strong> - Pode ser preenchido manualmente ou vinculando abastecimentos (veja abaixo)</li>
                        <li>Veículo, Material de montagem</li>
                        <li>Ajudante, Passagem de ônibus, Cartão telefônico</li>
                        <li>Hotel, Alimentação, Lavanderia</li>
                        <li>Diária motorista/montador, Táxi/Transporte, Outros</li>
                      </ul>
                    </li>
                    <li>Vincule as <strong>Entregas relacionadas</strong> à viagem</li>
                    <li>Clique em <strong>Salvar</strong></li>
                  </ol>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Vincular Abastecimentos ao Acerto:</h4>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2 mb-3">
                      <Fuel className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Como funciona:</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          Em vez de digitar manualmente o valor de combustível, você pode vincular abastecimentos reais que foram feitos durante a viagem. O sistema calcula automaticamente o total.
                        </p>
                      </div>
                    </div>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-emerald-700 dark:text-emerald-300 ml-2">
                      <li>Selecione primeiro o <strong>Motorista</strong> no formulário</li>
                      <li>Localize o campo <strong>"Despesa de Combustível"</strong></li>
                      <li>Clique no botão <strong>"Vincular"</strong> ao lado do campo</li>
                      <li>Uma janela será aberta mostrando apenas os abastecimentos do motorista selecionado</li>
                      <li>Selecione os abastecimentos que foram feitos durante a viagem</li>
                      <li>O sistema calcula automaticamente o total e preenche o campo de combustível</li>
                      <li>O campo fica <strong>desabilitado</strong> quando há abastecimentos vinculados (para evitar erros)</li>
                    </ol>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Vantagens da Vinculação:</p>
                        <ul className="list-disc list-inside space-y-1 text-sm text-blue-700 dark:text-blue-300 mt-1 ml-2">
                          <li><strong>Precisão:</strong> Usa valores reais dos abastecimentos registrados</li>
                          <li><strong>Rastreabilidade:</strong> Você sabe exatamente quais abastecimentos foram usados na viagem</li>
                          <li><strong>Automação:</strong> Não precisa calcular manualmente o total</li>
                          <li><strong>Validação:</strong> Evita erros de digitação</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mt-3">
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      <strong>Importante:</strong> Se você mudar o motorista após vincular abastecimentos, os vínculos serão automaticamente removidos, pois os abastecimentos são filtrados pelo motorista selecionado.
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Status do acerto:</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 text-center">
                      <Badge className="bg-amber-500 mb-2">PENDENTE</Badge>
                      <p className="text-xs text-muted-foreground">Aguardando conferência</p>
                    </div>
                    <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 text-center">
                      <Badge className="bg-emerald-500 mb-2">ACERTADO</Badge>
                      <p className="text-xs text-muted-foreground">Valores conferidos</p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Printer className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800 dark:text-blue-200">Imprimir Relatório</p>
                      <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        Clique no ícone de impressora 🖨️ para gerar um relatório completo do acerto com todas as despesas e entregas vinculadas.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Calculator className="h-5 w-5 text-emerald-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-emerald-800 dark:text-emerald-200">Cálculo Automático de Saldo</p>
                        <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                          O sistema calcula automaticamente:<br />
                          <code className="bg-emerald-100 dark:bg-emerald-800 px-1 rounded">Saldo = Adiantamento - Total de Despesas</code>
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Fuel className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Cálculo Automático de Combustível</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          Ao vincular abastecimentos, o sistema soma automaticamente os valores dos abastecimentos selecionados e preenche o campo de despesa de combustível.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tab: Importação */}
          {isImportEnabled() && (
            <TabsContent value="importacao" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5 text-indigo-600" />
                    Importação de Dados
                  </CardTitle>
                  <CardDescription>
                    Importe dados em massa através de planilhas Excel para agilizar o cadastro
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div>
                        <p className="font-medium text-blue-800 dark:text-blue-200">Dois Modos de Importação</p>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                          O sistema oferece <strong>importação padrão</strong> para veículos, motoristas, abastecimentos e manutenções,
                          e <strong>importação avançada</strong> para entregas com parser inteligente que trata colunas aglutinadas e faz match automático de veículos.
                        </p>
                      </div>
                    </div>
                  </div>

                  <Accordion type="single" collapsible className="space-y-2">
                    <AccordionItem value="padrao" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-green-600" />
                          <span className="font-medium">Importação Padrão</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Tipos de dados suportados:</h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              <li><strong>Veículos</strong> - Placa, modelo, fabricante, tipo, ano</li>
                              <li><strong>Motoristas</strong> - Nome, CNH, categoria, validades</li>
                              <li><strong>Abastecimentos</strong> - Data, veículo, condutor, valores, km</li>
                              <li><strong>Manutenções</strong> - Tipo, veículo, serviço, custo, km</li>
                              <li><strong>Montadores</strong> - Nome e telefone</li>
                            </ul>
                          </div>
                          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                            <p className="text-sm text-emerald-700 dark:text-emerald-300">
                              <strong>Dica:</strong> Baixe os templates de exemplo na página de Importação para ver o formato correto de cada tipo de dado.
                            </p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="avancada" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <FileCheck className="h-5 w-5 text-indigo-600" />
                          <span className="font-medium">Importação Avançada de Entregas</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold mb-3 text-sm">Formato da Planilha Excel</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              A planilha deve conter as seguintes colunas (algumas são opcionais):
                            </p>
                            <div className="bg-muted/50 rounded-lg p-3 text-xs font-mono space-y-1">
                              <div><strong>Obrigatórias:</strong> PV FOCO | NF | VALOR | CLIENTE | UF | DATA DE SAÍDA | MOTORISTA</div>
                              <div><strong>Opcionais:</strong> CARRO | TIPO TRANSPORTE | STATUS | PRECISA DE MONTAGEM? | DATA DA MONTAGEM</div>
                              <div><strong>Montadores:</strong> MONTADOR 1 até MONTADOR 7</div>
                              <div><strong>Financeiro:</strong> GASTOS COM ENTREGA | GASTOS COM MONTAGEM | PRODUTIVIDADE | % GASTOS</div>
                              <div><strong>Observações:</strong> ERROS | DESCRIÇÃO DOS ERROS</div>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Coluna Aglutinada (PV FOCO + NF)</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Se a primeira coluna contiver "PV FOCO" e "NF" juntos, o sistema separa automaticamente:
                            </p>
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                              <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>Exemplo:</strong> Se a coluna contiver <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">"5134 DECLARAÇÃO"</code>,
                                o sistema extrai automaticamente:
                              </p>
                              <ul className="list-disc list-inside mt-2 text-sm text-blue-600 dark:text-blue-400 ml-2">
                                <li>PV FOCO: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">5134</code></li>
                                <li>NF: <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">DECLARAÇÃO</code></li>
                              </ul>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Processamento de Montadores</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              O sistema suporta até 7 montadores na planilha:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              <li>Os <strong>primeiros 2 montadores</strong> são salvos nos campos específicos (Montador 1 e Montador 2)</li>
                              <li>Os <strong>montadores excedentes</strong> (3, 4, 5, 6, 7) são concatenados e adicionados ao campo "Descrição de Erros"</li>
                              <li>Exemplo: Se houver 4 montadores, os 2 primeiros vão para os campos específicos e os outros 2 aparecem como "Montadores adicionais: Nome3, Nome4"</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Match Automático de Veículos</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              O sistema faz match inteligente de veículos durante a importação:
                            </p>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-3">
                              <ol className="list-decimal list-inside space-y-1 text-sm text-indigo-700 dark:text-indigo-300 ml-2">
                                <li>A planilha pode conter apenas o <strong>fabricante</strong> do veículo (ex: "FORD", "FIAT")</li>
                                <li>O sistema busca veículos cadastrados pelo fabricante</li>
                                <li>Se encontrar exatamente 1 veículo, converte para formato <code className="bg-indigo-100 dark:bg-indigo-800 px-1 rounded">"Modelo - Placa"</code></li>
                                <li>Se encontrar múltiplos, usa o primeiro encontrado</li>
                                <li>Se não encontrar, mantém o valor original da planilha (para não perder informação)</li>
                              </ol>
                              <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                                <strong>Importante:</strong> Certifique-se de que os veículos estão cadastrados antes de importar para garantir o match correto.
                              </p>
                            </div>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Preview e Validação</h4>
                            <p className="text-sm text-muted-foreground mb-2">
                              Antes de confirmar a importação, o sistema mostra um preview completo:
                            </p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                              <li>Visualize todos os dados que serão importados</li>
                              <li>Erros de parsing são destacados em <span className="text-rose-600 font-medium">vermelho</span></li>
                              <li>Corrija problemas na planilha antes de prosseguir</li>
                              <li>Confirme apenas quando todos os dados estiverem corretos</li>
                            </ul>
                          </div>

                          <div>
                            <h4 className="font-semibold mb-2 text-sm">Cálculos Automáticos</h4>
                            <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
                              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                                <strong>% Gastos:</strong> Se a coluna "% GASTOS" estiver vazia, o sistema calcula automaticamente:
                              </p>
                              <code className="block bg-emerald-100 dark:bg-emerald-800 px-2 py-1 rounded mt-2 text-xs">
                                % Gastos = ((Gastos Entrega + Gastos Montagem) / Valor) × 100
                              </code>
                            </div>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>

                    <AccordionItem value="dicas" className="border rounded-lg px-4">
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3">
                          <Lightbulb className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">Dicas e Boas Práticas</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground ml-2">
                          <li><strong>Sempre revise o preview</strong> antes de confirmar a importação</li>
                          <li><strong>Verifique se veículos estão cadastrados</strong> antes de importar entregas (para garantir match correto)</li>
                          <li><strong>Formato de datas:</strong> O sistema aceita DD/MM/YYYY, DD-MM-YYYY, DD.MM.YY ou datas do Excel</li>
                          <li><strong>Valores monetários:</strong> Use números ou formato "R$ 1.234,56" - o sistema converte automaticamente</li>
                          <li><strong>UF:</strong> Use sigla de 2 letras (ex: SP, RJ, MG)</li>
                          <li><strong>Status:</strong> Use PENDENTE, EM ROTA, CONCLUIDO ou CANCELADO</li>
                          <li><strong>Precisa de Montagem:</strong> Use "Sim", "Não", "S", "N", "true", "false" ou 1/0</li>
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* Tab: FAQ */}
          <TabsContent value="faq" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-rose-600" />
                  Perguntas Frequentes (FAQ)
                </CardTitle>
                <CardDescription>
                  Soluções para problemas comuns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="space-y-2">
                  <AccordionItem value="q1" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Não consigo selecionar veículo/motorista no formulário</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Verifique se o cadastro está <strong>ativo</strong>. Vá em Cadastros e confirme que o item não está desativado. Cadastros desativados não aparecem nas listas de seleção.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q2" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ CNH aparece com alerta vermelho no Hub</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O alerta indica que a CNH está <strong>vencida</strong> ou próxima do vencimento (30 dias). Atualize a data de validade em Cadastros → Motoristas.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q3" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Valores não aparecem no Resumo Geral</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O Resumo considera apenas entregas com status <strong>"Concluído"</strong> e registros do <strong>mês atual</strong>. Verifique se as entregas estão finalizadas.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q4" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Qual a diferença entre Motorista e Condutor?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p><strong>Motorista:</strong> Aparece em Entregas e Acerto de Viagem. Use para quem faz entregas.</p>
                      <p className="mt-2"><strong>Condutor:</strong> Aparece apenas em Abastecimento. Use para funcionários que só abastecem veículos.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q5" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como excluir um cadastro permanentemente?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O sistema usa <strong>exclusão lógica</strong> (soft delete). Cadastros são desativados, não excluídos. Isso preserva o histórico de entregas, abastecimentos e manutenções vinculados.</p>
                      <p className="mt-2">Para reativar, use o botão de ativar/desativar na tabela de cadastros.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q6" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como funciona o alerta do Exame Toxicológico?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O exame toxicológico tem validade de <strong>2 anos e 6 meses</strong>. O sistema calcula automaticamente a data de vencimento e alerta quando estiver:</p>
                      <ul className="list-disc list-inside mt-2 ml-2">
                        <li><span className="text-amber-600 font-medium">Amarelo:</span> Próximo do vencimento (30 dias)</li>
                        <li><span className="text-rose-600 font-medium">Vermelho:</span> Vencido</li>
                      </ul>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q7" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Posso vincular várias entregas a um acerto?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Sim! Ao criar ou editar um Acerto de Viagem, você pode selecionar múltiplas entregas que fizeram parte daquela viagem. Apenas entregas <strong>não vinculadas</strong> a outros acertos aparecem disponíveis.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q8" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como formatar a planilha de entregas para importação?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>A planilha deve ter as colunas na primeira linha. A primeira coluna pode conter "PV FOCO" e "NF" juntos (ex: "5134 DECLARAÇÃO") ou separados. Colunas obrigatórias: PV FOCO, NF, VALOR, CLIENTE, UF, DATA DE SAÍDA, MOTORISTA. Veja a aba <strong>Importação</strong> para a lista completa de colunas suportadas.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q9" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ O que acontece se o veículo não for encontrado na importação?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Se o sistema não encontrar um veículo cadastrado pelo fabricante informado na planilha, ele mantém o valor original da planilha (ex: "FORD"). Isso preserva a informação. Para garantir o match correto, cadastre os veículos antes de importar entregas.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q10" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como funciona o match de veículos na importação?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O sistema busca veículos cadastrados pelo <strong>fabricante</strong> informado na planilha. Se encontrar exatamente 1 veículo, converte automaticamente para o formato "Modelo - Placa" (ex: "Ranger - ABC1234"). Se houver múltiplos veículos do mesmo fabricante, usa o primeiro encontrado. Se não encontrar, mantém o valor original.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q11" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ O que acontece com montadores além de 2 na importação?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>O sistema suporta até 7 montadores na planilha. Os <strong>primeiros 2</strong> são salvos nos campos específicos (Montador 1 e Montador 2). Os <strong>montadores excedentes</strong> (3, 4, 5, 6, 7) são concatenados e adicionados ao campo "Descrição de Erros" no formato "Montadores adicionais: Nome3, Nome4, ..." para não perder a informação.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q12" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como usar os filtros por motorista e veículo em Entregas?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Na página de Entregas, você encontrará 3 tabs no topo:</p>
                      <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                        <li><strong>"Todos"</strong> - Visualização geral com busca e filtro de período</li>
                        <li><strong>"Por Motorista"</strong> - Selecione um motorista e opcionalmente uma data específica para ver apenas as entregas daquele motorista</li>
                        <li><strong>"Por Veículo"</strong> - Selecione um veículo e opcionalmente uma data específica para ver apenas as entregas daquele veículo</li>
                      </ul>
                      <p className="mt-2">As entregas são automaticamente ordenadas por data (mais recente primeiro) nas tabs específicas. Ao mudar de tab, os filtros são limpos automaticamente.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q13" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como usar os filtros por motorista e veículo em Abastecimento?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Na página de Abastecimento, você encontrará 3 tabs no topo:</p>
                      <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                        <li><strong>"Todos"</strong> - Visualização geral com busca e filtro de período</li>
                        <li><strong>"Por Motorista"</strong> - Selecione um motorista e opcionalmente uma data específica para ver apenas os abastecimentos daquele motorista</li>
                        <li><strong>"Por Veículo"</strong> - Selecione um veículo e opcionalmente uma data específica para ver apenas os abastecimentos daquele veículo</li>
                      </ul>
                      <p className="mt-2">Os abastecimentos são automaticamente ordenados por data (mais recente primeiro) nas tabs específicas. Use o botão "Limpar Filtros" para resetar a seleção. Ao mudar de tab, os filtros são limpos automaticamente.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q14" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ Como vincular abastecimentos no Acerto de Viagem?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Para vincular abastecimentos ao acerto de viagem:</p>
                      <ol className="list-decimal list-inside mt-2 ml-2 space-y-1">
                        <li>Primeiro, selecione o <strong>Motorista</strong> no formulário</li>
                        <li>Localize o campo <strong>"Despesa de Combustível"</strong></li>
                        <li>Clique no botão <strong>"Vincular"</strong> ao lado do campo</li>
                        <li>Uma janela será aberta mostrando apenas os abastecimentos do motorista selecionado</li>
                        <li>Selecione os abastecimentos que foram feitos durante a viagem</li>
                        <li>O sistema calcula automaticamente o total e preenche o campo</li>
                      </ol>
                      <p className="mt-2"><strong>Importante:</strong> O campo de combustível fica desabilitado quando há abastecimentos vinculados. Se você mudar o motorista, os vínculos serão removidos automaticamente.</p>
                    </AccordionContent>
                  </AccordionItem>

                  <AccordionItem value="q15" className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline text-left">
                      <span className="text-sm">❓ O cálculo de combustível no Acerto de Viagem é automático?</span>
                    </AccordionTrigger>
                    <AccordionContent className="pb-4 text-sm text-muted-foreground">
                      <p>Sim! Quando você vincula abastecimentos ao acerto de viagem, o sistema <strong>calcula automaticamente</strong> o total somando os valores de todos os abastecimentos selecionados.</p>
                      <p className="mt-2">Você também pode preencher manualmente o campo de despesa de combustível, mas ao vincular abastecimentos, o valor é calculado automaticamente e o campo fica desabilitado para evitar erros.</p>
                      <p className="mt-2"><strong>Vantagem:</strong> Isso garante precisão e rastreabilidade, pois você sabe exatamente quais abastecimentos foram usados na viagem.</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Botão voltar */}
        <div className="mt-8 flex justify-center">
          <Link to="/">
            <Button size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar ao Hub
            </Button>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground">
            SCV - Sistema de Controle de Veículos
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Versão 1.0 • Jan/2025
          </p>
        </div>
      </footer>
    </div>
  );
}
