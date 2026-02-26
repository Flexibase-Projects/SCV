import { LocalShippingOutlined as Truck, PeopleOutlined as Users, DirectionsCarOutlined as Car, BuildOutlined as Wrench } from '@mui/icons-material';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MotoristasTab } from '@/components/cadastros/MotoristasTab';
import { VeiculosTab } from '@/components/cadastros/VeiculosTab';
import { ModuleLayout } from '@/components/layout/ModuleLayout';
import { useMotoristas } from '@/hooks/useMotoristas';
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const Cadastros = () => {
  const { data: motoristas = [] } = useMotoristas(true);
  const montadores = motoristas.filter(m => m.eh_montador && m.ativo);

  return (
    <ModuleLayout>
      <div className="p-8 lg:p-10 space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Cadastros
          </h1>
          <p className="text-slate-500 mt-1">
            Gerenciamento de dados do sistema
          </p>
        </div>

        <Tabs defaultValue="motoristas" className="space-y-6">
          <TabsList className="bg-brand-white border border-slate-200 p-1 shadow-sm">
            <TabsTrigger value="motoristas" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Users className="h-4 w-4" />
              Motoristas / Condutores
            </TabsTrigger>
            <TabsTrigger value="veiculos" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Car className="h-4 w-4" />
              Veículos
            </TabsTrigger>
            <TabsTrigger value="montadores" className="gap-2 data-[state=active]:bg-slate-100 data-[state=active]:text-slate-900">
              <Wrench className="h-4 w-4" />
              Montadores ({montadores.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="motoristas" className="mt-6">
            <MotoristasTab />
          </TabsContent>

          <TabsContent value="veiculos" className="mt-6">
            <VeiculosTab />
          </TabsContent>

          <TabsContent value="montadores" className="mt-6">
            <Card className="bg-brand-white border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Montadores</h3>
                    <Badge variant="outline">{montadores.length} cadastrado(s)</Badge>
                  </div>
                  {montadores.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhum montador cadastrado. Para cadastrar um montador, vá para a aba "Motoristas / Condutores" e marque a opção "Também é montador" ao criar ou editar um cadastro.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {montadores.map((m) => (
                        <div key={m.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="font-medium text-foreground">{m.nome}</span>
                            {m.eh_motorista && (
                              <Badge variant="default">
                                Motorista / Condutor
                              </Badge>
                            )}
                            <Badge variant="outline" className="border-blue-500 text-blue-500">
                              Montador
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ModuleLayout>
  );
};

export default Cadastros;
