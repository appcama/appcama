import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Download, XCircle, Award } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export function CertificadosList() {
  const { user } = useAuth();
  const [searchCpfCnpj, setSearchCpfCnpj] = useState("");
  const [periodoInicio, setPeriodoInicio] = useState("");
  const [periodoFim, setPeriodoFim] = useState("");

  const { data: certificados, isLoading, refetch } = useQuery({
    queryKey: ["certificados", user?.entityId, searchCpfCnpj, periodoInicio, periodoFim],
    queryFn: async () => {
      let query = supabase
        .from("certificado")
        .select("*")
        .eq("id_entidade", user?.entityId)
        .order("dat_criacao", { ascending: false });

      if (searchCpfCnpj) {
        query = query.ilike("num_cpf_cnpj_gerador", `%${searchCpfCnpj}%`);
      }

      if (periodoInicio) {
        query = query.gte("dat_periodo_inicio", periodoInicio);
      }

      if (periodoFim) {
        query = query.lte("dat_periodo_fim", periodoFim);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
    enabled: !!user?.entityId,
  });

  const handleInativar = async (idCertificado: number) => {
    try {
      const { error } = await supabase
        .from("certificado")
        .update({ des_status: "I" })
        .eq("id_certificado", idCertificado);

      if (error) throw error;

      // Registrar log
      await supabase.from("certificado_log").insert({
        id_certificado: idCertificado,
        des_acao: "INATIVACAO",
        des_observacao: "Certificado inativado pelo usuário",
        id_usuario: user?.id,
      });

      toast.success("Certificado inativado com sucesso");
      refetch();
    } catch (error) {
      console.error("Erro ao inativar certificado:", error);
      toast.error("Erro ao inativar certificado");
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-row items-center justify-between space-y-0 pb-6">
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certificados Emitidos
          </CardTitle>
          <Button 
            onClick={() => (window.location.href = "/certificados/emitir")}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            Emitir Certificado
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="CPF/CNPJ do Gerador"
              value={searchCpfCnpj}
              onChange={(e) => setSearchCpfCnpj(e.target.value)}
              className="pl-10"
            />
          </div>
          <Input
            type="date"
            placeholder="Período Início"
            value={periodoInicio}
            onChange={(e) => setPeriodoInicio(e.target.value)}
          />
          <Input
            type="date"
            placeholder="Período Fim"
            value={periodoFim}
            onChange={(e) => setPeriodoFim(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Carregando...</div>
        ) : certificados && certificados.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum certificado encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>CPF/CNPJ Gerador</TableHead>
                  <TableHead>Período</TableHead>
                  <TableHead>Qtd Total</TableHead>
                  <TableHead>Vlr Total</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificados?.map((cert) => (
                  <TableRow key={cert.id_certificado}>
                    <TableCell className="font-mono text-sm">{cert.cod_validador}</TableCell>
                    <TableCell>{cert.num_cpf_cnpj_gerador}</TableCell>
                    <TableCell>
                      {format(new Date(cert.dat_periodo_inicio), "dd/MM/yyyy")} até{" "}
                      {format(new Date(cert.dat_periodo_fim), "dd/MM/yyyy")}
                    </TableCell>
                    <TableCell>{cert.qtd_total_certificado?.toFixed(3)} kg</TableCell>
                    <TableCell>R$ {cert.vlr_total_certificado?.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          cert.des_status === "A"
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {cert.des_status === "A" ? "Ativo" : "Inativo"}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => (window.location.href = `/certificados/view/${cert.id_certificado}`)}
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {cert.des_status === "A" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleInativar(cert.id_certificado)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
