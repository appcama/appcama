import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FileCheck, Filter, Plus } from "lucide-react";
import { format } from "date-fns";

interface ColetaData {
  id_coleta: number;
  cod_coleta: string;
  dat_coleta: string;
  vlr_total: number;
  ponto_coleta?: {
    nom_ponto_coleta: string;
  };
  coleta_residuo: Array<{
    qtd_total: number;
    vlr_total: number;
    residuo: {
      nom_residuo: string;
      id_tipo_residuo: number;
      tipo_residuo: {
        des_tipo_residuo: string;
      };
    };
  }>;
}

export function CertificadoEmitir() {
  const { user } = useAuth();
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [coletasSelecionadas, setColetasSelecionadas] = useState<Set<number>>(new Set());
  const [filtroAplicado, setFiltroAplicado] = useState(false);

  const { data: coletas, isLoading: loadingColetas, refetch } = useQuery({
    queryKey: ["coletas-certificado", user?.entityId, periodoInicio, periodoFim],
    queryFn: async () => {
      if (!user?.entityId || !periodoInicio || !periodoFim) return null;

      const dataInicio = `${periodoInicio}T00:00:00`;
      const dataFim = `${periodoFim}T23:59:59`;

      const { data: coletasData, error } = await supabase
        .from("coleta")
        .select(`
          *,
          ponto_coleta:id_ponto_coleta (
            nom_ponto_coleta
          ),
          coleta_residuo (
            qtd_total,
            vlr_total,
            residuo (
              nom_residuo,
              id_tipo_residuo,
              tipo_residuo (
                des_tipo_residuo
              )
            )
          )
        `)
        .eq("id_entidade_geradora", user.entityId)
        .gte("dat_coleta", dataInicio)
        .lte("dat_coleta", dataFim)
        .eq("des_status", "A");

      if (error) {
        console.error('[CertificadoEmitir] Erro ao buscar coletas:', error);
        throw error;
      }

      if (!coletasData || coletasData.length === 0) {
        toast.info("Nenhuma coleta encontrada no período selecionado");
        return [];
      }

      return coletasData as ColetaData[];
    },
    enabled: false,
  });

  // Calcular totais das coletas selecionadas
  const totaisSelecionados = coletas?.reduce(
    (acc, coleta) => {
      if (coletasSelecionadas.has(coleta.id_coleta)) {
        const qtdTotal = coleta.coleta_residuo.reduce((sum, cr) => sum + cr.qtd_total, 0);
        return {
          quantidade: acc.quantidade + qtdTotal,
          valor: acc.valor + coleta.vlr_total,
        };
      }
      return acc;
    },
    { quantidade: 0, valor: 0 }
  ) || { quantidade: 0, valor: 0 };

  // Calcular resumo de resíduos das coletas selecionadas
  const resumoResiduos = coletas
    ?.filter((coleta) => coletasSelecionadas.has(coleta.id_coleta))
    .reduce((acc: any[], coleta) => {
      coleta.coleta_residuo?.forEach((cr) => {
        const existing = acc.find((r) => r.id_tipo_residuo === cr.residuo.id_tipo_residuo);
        if (existing) {
          existing.qtd_total += cr.qtd_total;
          existing.vlr_total += cr.vlr_total;
        } else {
          acc.push({
            id_tipo_residuo: cr.residuo.id_tipo_residuo,
            nom_residuo: cr.residuo.nom_residuo,
            des_tipo: cr.residuo.tipo_residuo.des_tipo_residuo,
            qtd_total: cr.qtd_total,
            vlr_total: cr.vlr_total,
          });
        }
      });
      return acc;
    }, []);

  const handleFiltrar = () => {
    if (!periodoInicio || !periodoFim) {
      toast.error("Preencha as datas de início e fim do período");
      return;
    }

    if (new Date(periodoFim) < new Date(periodoInicio)) {
      toast.error("A data fim deve ser maior ou igual à data início");
      return;
    }

    setColetasSelecionadas(new Set());
    setFiltroAplicado(true);
    refetch();
  };

  const handleToggleColeta = (idColeta: number) => {
    const newSet = new Set(coletasSelecionadas);
    if (newSet.has(idColeta)) {
      newSet.delete(idColeta);
    } else {
      newSet.add(idColeta);
    }
    setColetasSelecionadas(newSet);
  };

  const handleToggleAll = () => {
    if (!coletas) return;

    if (coletasSelecionadas.size === coletas.length) {
      setColetasSelecionadas(new Set());
    } else {
      setColetasSelecionadas(new Set(coletas.map((c) => c.id_coleta)));
    }
  };

  const handleEmitir = async () => {
    if (coletasSelecionadas.size === 0) {
      toast.error("Selecione pelo menos uma coleta para emitir o certificado");
      return;
    }

    try {
      // Buscar dados da entidade
      const { data: entidade } = await supabase
        .from("entidade")
        .select("num_cpf_cnpj")
        .eq("id_entidade", user?.entityId)
        .single();

      const qtdTotal = totaisSelecionados.quantidade;
      const vlrTotal = totaisSelecionados.valor;

      // Gerar código validador único
      const codValidador = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Criar certificado
      const { data: certificado, error: certError } = await supabase
        .from("certificado")
        .insert({
          id_entidade: user?.entityId,
          num_cpf_cnpj_gerador: entidade?.num_cpf_cnpj || "",
          dat_periodo_inicio: periodoInicio,
          dat_periodo_fim: periodoFim,
          cod_validador: codValidador,
          qtd_total_certificado: qtdTotal,
          vlr_total_certificado: vlrTotal,
          observacoes,
          des_status: "A",
          id_usuario_criador: user?.id,
          dat_criacao: new Date().toISOString(),
        })
        .select()
        .single();

      if (certError) throw certError;

      // Criar detalhes dos resíduos
      const residuosInsert = resumoResiduos?.map((r: any) => ({
        id_certificado: certificado.id_certificado,
        id_tipo_residuo: r.id_tipo_residuo,
        nom_residuo: r.nom_residuo,
        qtd_total: r.qtd_total,
        vlr_total: r.vlr_total,
      }));

      if (residuosInsert && residuosInsert.length > 0) {
        const { error: residuosError } = await supabase
          .from("certificado_residuo")
          .insert(residuosInsert);

        if (residuosError) throw residuosError;
      }

      // Registrar log
      await supabase.from("certificado_log").insert({
        id_certificado: certificado.id_certificado,
        des_acao: "EMISSAO",
        des_observacao: `Certificado emitido com ${coletasSelecionadas.size} coleta(s)`,
        id_usuario: user?.id,
      });

      toast.success("Certificado emitido com sucesso!");
      window.location.href = `/certificados/view/${certificado.id_certificado}`;
    } catch (error) {
      console.error("Erro ao emitir certificado:", error);
      toast.error("Erro ao emitir certificado");
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="flex items-center gap-2">
              <FileCheck className="h-5 w-5" />
              Emitir Certificado
            </CardTitle>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Período Início</Label>
                <Input
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
              </div>
              <div>
                <Label>Período Fim</Label>
                <Input
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleFiltrar}
                  className="w-full bg-green-600 hover:bg-green-700"
                  disabled={loadingColetas}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filtrar Coletas
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {!filtroAplicado ? (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um período e clique em "Filtrar Coletas" para visualizar as coletas disponíveis.
            </div>
          ) : loadingColetas ? (
            <div className="text-center py-8 text-muted-foreground">
              Carregando coletas...
            </div>
          ) : !coletas || coletas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma coleta encontrada no período selecionado.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={coletasSelecionadas.size === coletas.length && coletas.length > 0}
                          onCheckedChange={handleToggleAll}
                        />
                      </TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Código</TableHead>
                      <TableHead>Ponto de Coleta</TableHead>
                      <TableHead className="text-right">Quantidade (kg)</TableHead>
                      <TableHead className="text-right">Valor Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coletas.map((coleta) => {
                      const qtdTotal = coleta.coleta_residuo.reduce((sum, cr) => sum + cr.qtd_total, 0);
                      return (
                        <TableRow key={coleta.id_coleta}>
                          <TableCell>
                            <Checkbox
                              checked={coletasSelecionadas.has(coleta.id_coleta)}
                              onCheckedChange={() => handleToggleColeta(coleta.id_coleta)}
                            />
                          </TableCell>
                          <TableCell>
                            {format(new Date(coleta.dat_coleta), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>{coleta.cod_coleta}</TableCell>
                          <TableCell>
                            {coleta.ponto_coleta?.nom_ponto_coleta || "N/A"}
                          </TableCell>
                          <TableCell className="text-right">
                            {qtdTotal.toFixed(3)}
                          </TableCell>
                          <TableCell className="text-right">
                            R$ {coleta.vlr_total.toFixed(2)}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {coletasSelecionadas.size > 0 && (
                <div className="mt-6 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">
                      {coletasSelecionadas.size} coleta(s) selecionada(s)
                    </span>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Quantidade Total</div>
                      <div className="font-bold">{totaisSelecionados.quantidade.toFixed(3)} kg</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Valor Total</div>
                      <div className="font-bold">R$ {totaisSelecionados.valor.toFixed(2)}</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {filtroAplicado && coletas && coletas.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Observações (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Informações adicionais sobre o certificado..."
                rows={4}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              onClick={handleEmitir}
              disabled={coletasSelecionadas.size === 0}
              className="bg-green-600 hover:bg-green-700"
            >
              <FileCheck className="mr-2 h-4 w-4" />
              Emitir Certificado
            </Button>
          </div>
        </>
      )}
    </>
  );
}
