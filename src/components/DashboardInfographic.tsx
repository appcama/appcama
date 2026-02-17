import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Leaf, Droplet, Zap, Globe, Trash2, Fuel } from "lucide-react";
import { useDashboardData, type DashboardFilters } from "@/hooks/useDashboardData";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface DashboardInfographicProps {
  filters: DashboardFilters;
  entityId?: number;
}

const residueTypeConfig = {
  papel: { color: "bg-blue-500", textColor: "text-white", name: "PAPEL" },
  plastico: { color: "bg-red-500", textColor: "text-white", name: "PLÁSTICO" },
  metal: { color: "bg-yellow-500", textColor: "text-white", name: "METAL" },
  vidro: { color: "bg-green-500", textColor: "text-white", name: "VIDRO" }
};

const mapResiduoType = (tipoResiduoName: string): keyof typeof residueTypeConfig => {
  const name = tipoResiduoName.toLowerCase();
  if (name.includes('papel') || name.includes('papelão') || name.includes('cartão')) return 'papel';
  if (name.includes('plástico') || name.includes('pet') || name.includes('polímero')) return 'plastico';
  if (name.includes('metal') || name.includes('alumínio') || name.includes('ferro') || name.includes('aço')) return 'metal';
  if (name.includes('vidro')) return 'vidro';
  return 'papel';
};

type GroupKey = keyof typeof residueTypeConfig;
type GroupMetrics = { arvores: number; agua: number; energia: number; co2: number; petroleo: number; aterro: number };

const emptyMetrics = (): GroupMetrics => ({ arvores: 0, agua: 0, energia: 0, co2: 0, petroleo: 0, aterro: 0 });

const formatNumber = (value: number) => {
  if (value >= 1000000) {
    return (value / 1000000).toFixed(3).replace('.', ',');
  } else if (value >= 1000) {
    return (value / 1000).toFixed(3).replace('.', ',');
  }
  return value.toFixed(0).replace('.', ',');
};

export function DashboardInfographic({ filters, entityId }: DashboardInfographicProps) {
  const { data, isLoading } = useDashboardData(filters);

  // Use RPC to get indicators grouped by tipo_residuo
  const { data: indicadoresPorGrupo, isLoading: loadingGrupos } = useQuery<Record<GroupKey, GroupMetrics>>({
    queryKey: ["indicadores-por-grupo", filters, entityId],
    queryFn: async () => {
      // Get user IDs if filtering by entity (Meus Números)
      let usuarioIds: number[] | null = null;
      if (entityId) {
        const { data: usuariosDaEntidade } = await supabase
          .from("usuario")
          .select("id_usuario")
          .eq("id_entidade", entityId)
          .eq("des_status", "A");
        
        usuarioIds = usuariosDaEntidade?.map(u => u.id_usuario) || [];
        if (usuarioIds.length === 0) {
          return { papel: emptyMetrics(), plastico: emptyMetrics(), metal: emptyMetrics(), vidro: emptyMetrics() };
        }
      }

      const { data: rpcData, error } = await supabase.rpc("get_dashboard_data", {
        p_data_inicial: filters.dataInicial,
        p_data_final: filters.dataFinal,
        p_entidade_id: filters.entidadeId || null,
        p_tipo_entidade_id: filters.tipoEntidadeId || null,
        p_evento_id: filters.eventoId || null,
        p_usuario_ids: usuarioIds,
      });

      if (error) throw error;

      const result = rpcData as any;
      const indicadoresRaw: any[] = result?.indicadores || [];

      const grupos: Record<GroupKey, GroupMetrics> = {
        papel: emptyMetrics(),
        plastico: emptyMetrics(),
        metal: emptyMetrics(),
        vidro: emptyMetrics(),
      };

      indicadoresRaw.forEach((row: any) => {
        const tipoNome: string = row?.des_tipo_residuo || '';
        const grupo: GroupKey = mapResiduoType(tipoNome);
        const name: string = (row?.nom_indicador || '').toLowerCase();
        const total: number = row?.total || 0;

        if (name.includes('árvore') || name.includes('floresta')) {
          grupos[grupo].arvores += total;
        } else if (name.includes('água') || name.includes('hídric')) {
          grupos[grupo].agua += total;
        } else if (name.includes('energia') || name.includes('elétric')) {
          grupos[grupo].energia += total;
        } else if (name.includes('co2') || name.includes('carbono') || name.includes('gee')) {
          grupos[grupo].co2 += total;
        } else if (name.includes('petróleo') || name.includes('petroleo') || name.includes('combustível')) {
          grupos[grupo].petroleo += total;
        } else if (name.includes('aterro') || name.includes('espaço') || name.includes('volume')) {
          grupos[grupo].aterro += total;
        }
      });

      return grupos;
    },
    enabled: !!filters.dataInicial && !!filters.dataFinal,
    refetchInterval: 30000,
  });

  if (isLoading || loadingGrupos) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Infográfico de Ecoindicadores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data?.residuosPorTipo || data.residuosPorTipo.length === 0) {
    return null;
  }

  const residuosAgrupados = data.residuosPorTipo.reduce((acc, residuo) => {
    const tipo = mapResiduoType(residuo.des_tipo_residuo);
    if (!acc[tipo]) {
      acc[tipo] = { quantidade: 0, tipos: [] };
    }
    acc[tipo].quantidade += residuo.total_quantidade;
    acc[tipo].tipos.push(residuo);
    return acc;
  }, {} as Record<string, { quantidade: number; tipos: any[] }>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infográfico de Ecoindicadores</CardTitle>
        <p className="text-sm text-muted-foreground">
          Período: {(() => {
            const [yearInicial, monthInicial, dayInicial] = filters.dataInicial.split('-').map(Number);
            const [yearFinal, monthFinal, dayFinal] = filters.dataFinal.split('-').map(Number);
            const dataInicialLocal = new Date(yearInicial, monthInicial - 1, dayInicial);
            const dataFinalLocal = new Date(yearFinal, monthFinal - 1, dayFinal);
            return `${dataInicialLocal.toLocaleDateString('pt-BR')} - ${dataFinalLocal.toLocaleDateString('pt-BR')}`;
          })()} 
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(residueTypeConfig).map(([key, config]) => {
            const groupKey = key as GroupKey;
            const residuoData = residuosAgrupados[groupKey];
            const indicadores = indicadoresPorGrupo?.[groupKey] || emptyMetrics();

            return (
              <div key={key} className="bg-white rounded-lg overflow-hidden">
                <div className="flex items-center justify-center p-3 border-b border-gray-200 bg-gray-50">
                  <div className={`w-8 h-8 ${config.color} rounded-full flex items-center justify-center mr-3`}>
                    {key === 'papel' && <Leaf className="w-4 h-4 text-white" />}
                    {key === 'plastico' && <Trash2 className="w-4 h-4 text-white" />}
                    {key === 'metal' && <Zap className="w-4 h-4 text-white" />}
                    {key === 'vidro' && <Globe className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800">{config.name}</h3>
                </div>

                <div className={`p-4 rounded-lg ${key === 'papel' ? 'bg-blue-50' :
                  key === 'plastico' ? 'bg-red-50' :
                    key === 'metal' ? 'bg-yellow-50' :
                      key === 'vidro' ? 'bg-green-50' : 'bg-gray-50'
                  }`}>
                  <div className="bg-white p-4 rounded-lg text-center shadow-sm mb-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                        <Fuel className="w-6 h-6 text-orange-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Evitou a extração de</p>
                    <div className="text-3xl font-bold mt-2 text-gray-800">
                      {formatNumber(indicadores.petroleo)}
                    </div>
                    <p className="text-sm text-gray-600">barris de petróleo</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg text-center shadow-sm mb-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Leaf className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Evitou o corte de</p>
                    <div className="text-3xl font-bold mt-2 text-gray-800">
                      {formatNumber(indicadores.arvores)}
                    </div>
                    <p className="text-sm text-gray-600">árvores</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg text-center shadow-sm mb-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                        <Droplet className="w-6 h-6 text-blue-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Economizou</p>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatNumber(indicadores.agua)}
                    </div>
                    <p className="text-sm text-gray-600">m³ de água</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg text-center shadow-sm mb-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <Zap className="w-6 h-6 text-yellow-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Economizou</p>
                    <div className="text-2xl font-bold text-yellow-600">
                      {formatNumber(indicadores.energia)}
                    </div>
                    <p className="text-sm text-gray-600">mWh de energia elétrica</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg text-center shadow-sm">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                        <Globe className="w-6 h-6 text-green-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Evitou a emissão de</p>
                    <div className="text-2xl font-bold text-green-600">
                      {formatNumber(indicadores.co2)}
                    </div>
                    <p className="text-sm text-gray-600">toneladas de CO₂</p>
                  </div>

                  <div className="bg-white p-4 rounded-lg text-center shadow-sm mt-4">
                    <div className="flex justify-center mb-2">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                        <Trash2 className="w-6 h-6 text-gray-600" />
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">Economizou</p>
                    <div className="text-2xl font-bold text-gray-600">
                      {formatNumber(indicadores.aterro)}
                    </div>
                    <p className="text-sm text-gray-600">m³ de espaço em aterro</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
