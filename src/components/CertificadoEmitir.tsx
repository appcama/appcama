import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, FileCheck } from "lucide-react";
import { format } from "date-fns";

export function CertificadoEmitir() {
  const { user } = useAuth();
  const [etapa, setEtapa] = useState(1);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [entidadeGeradora, setEntidadeGeradora] = useState<any>(null);

  const { data: coletas, isLoading: loadingColetas } = useQuery({
    queryKey: ["coletas-certificado", cpfCnpj, periodoInicio, periodoFim],
    queryFn: async () => {
      if (!cpfCnpj || !periodoInicio || !periodoFim) return null;

      console.log('[CertificadoEmitir] Buscando entidade com CPF/CNPJ:', cpfCnpj);

      // Buscar entidade pelo CPF/CNPJ formatado ou sem formatação
      const cpfCnpjLimpo = cpfCnpj.replace(/[^\d]/g, '');
      const { data: entidade, error: entidadeError } = await supabase
        .from("entidade")
        .select("*")
        .or(`num_cpf_cnpj.eq.${cpfCnpj},num_cpf_cnpj.eq.${cpfCnpjLimpo}`)
        .single();

      console.log('[CertificadoEmitir] Entidade encontrada:', entidade);
      console.log('[CertificadoEmitir] Erro na busca de entidade:', entidadeError);

      if (!entidade) {
        toast.error("Entidade geradora não encontrada com o CPF/CNPJ informado");
        return null;
      }

      setEntidadeGeradora(entidade);

      // Ajustar as datas para incluir todo o dia
      const dataInicio = `${periodoInicio}T00:00:00`;
      const dataFim = `${periodoFim}T23:59:59`;

      console.log('[CertificadoEmitir] Buscando coletas para:', {
        id_entidade: entidade.id_entidade,
        periodo: { inicio: dataInicio, fim: dataFim }
      });

      const { data: coletasData, error } = await supabase
        .from("coleta")
        .select(`
          *,
          coleta_residuo (
            *,
            residuo (
              *,
              tipo_residuo (*)
            )
          )
        `)
        .eq("id_entidade_geradora", entidade.id_entidade)
        .gte("dat_coleta", dataInicio)
        .lte("dat_coleta", dataFim)
        .eq("des_status", "A");

      console.log('[CertificadoEmitir] Coletas encontradas:', coletasData?.length || 0);
      console.log('[CertificadoEmitir] Coletas data:', coletasData);
      console.log('[CertificadoEmitir] Erro na busca de coletas:', error);

      if (error) {
        console.error('[CertificadoEmitir] Erro ao buscar coletas:', error);
        throw error;
      }

      if (!coletasData || coletasData.length === 0) {
        toast.error("Nenhuma coleta encontrada no período selecionado para esta entidade");
      }

      return coletasData;
    },
    enabled: etapa === 2,
  });

  const resumoResiduos = coletas?.reduce((acc: any[], coleta: any) => {
    coleta.coleta_residuo?.forEach((cr: any) => {
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

  const handleBuscar = () => {
    if (!cpfCnpj || !periodoInicio || !periodoFim) {
      toast.error("Preencha todos os campos");
      return;
    }
    console.log('[CertificadoEmitir] Buscando coletas com:', { cpfCnpj, periodoInicio, periodoFim });
    setEtapa(2);
  };

  const handleEmitir = async () => {
    try {
      const qtdTotal = resumoResiduos?.reduce((sum, r) => sum + r.qtd_total, 0) || 0;
      const vlrTotal = resumoResiduos?.reduce((sum, r) => sum + r.vlr_total, 0) || 0;

      // Gerar código validador único
      const codValidador = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      // Criar certificado
      const { data: certificado, error: certError } = await supabase
        .from("certificado")
        .insert({
          id_entidade: user?.entityId,
          num_cpf_cnpj_gerador: cpfCnpj,
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

      if (residuosInsert) {
        const { error: residuosError } = await supabase
          .from("certificado_residuo")
          .insert(residuosInsert);

        if (residuosError) throw residuosError;
      }

      // Registrar log
      await supabase.from("certificado_log").insert({
        id_certificado: certificado.id_certificado,
        des_acao: "EMISSAO",
        des_observacao: "Certificado emitido",
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
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => (window.location.href = "/certificados")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
        <h2 className="text-2xl font-bold">Emitir Certificado</h2>
      </div>

      {etapa === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Certificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>CPF/CNPJ do Gerador</Label>
              <Input
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                placeholder="Digite o CPF ou CNPJ"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Período Início</Label>
                <Input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} />
              </div>
              <div>
                <Label>Período Fim</Label>
                <Input type="date" value={periodoFim} onChange={(e) => setPeriodoFim(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleBuscar} className="w-full">
              Buscar Coletas
            </Button>
          </CardContent>
        </Card>
      )}

      {etapa === 2 && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entidade Geradora</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{entidadeGeradora?.nom_entidade}</p>
              <p className="text-sm text-muted-foreground">{entidadeGeradora?.num_cpf_cnpj}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Resíduos Entregues no Período</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingColetas ? (
                <p>Carregando...</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Resíduo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resumoResiduos?.map((r: any, idx: number) => (
                      <TableRow key={idx}>
                        <TableCell>{r.nom_residuo}</TableCell>
                        <TableCell>{r.des_tipo}</TableCell>
                        <TableCell>{r.qtd_total.toFixed(3)} kg</TableCell>
                        <TableCell>R$ {r.vlr_total.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow className="font-bold">
                      <TableCell colSpan={2}>TOTAL</TableCell>
                      <TableCell>
                        {resumoResiduos?.reduce((s: number, r: any) => s + r.qtd_total, 0).toFixed(3)} kg
                      </TableCell>
                      <TableCell>
                        R$ {resumoResiduos?.reduce((s: number, r: any) => s + r.vlr_total, 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

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

          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setEtapa(1)} className="flex-1">
              Voltar
            </Button>
            <Button onClick={handleEmitir} className="flex-1">
              <FileCheck className="mr-2 h-4 w-4" />
              Emitir Certificado
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
