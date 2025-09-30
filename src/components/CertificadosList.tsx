import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Eye, Download, XCircle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";
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

      toast({
        title: "Sucesso",
        description: "Certificado inativado com sucesso",
      });

      refetch();
    } catch (error) {
      console.error("Erro ao inativar certificado:", error);
      toast({
        title: "Erro",
        description: "Erro ao inativar certificado",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Certificados Emitidos</h2>
        <Button onClick={() => (window.location.href = "/certificados/emitir")}>
          <Plus className="mr-2 h-4 w-4" />
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

      {isLoading ? (
        <div className="text-center py-8">Carregando...</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>CPF/CNPJ Gerador</TableHead>
              <TableHead>Período</TableHead>
              <TableHead>Qtd Total</TableHead>
              <TableHead>Vlr Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certificados?.map((cert) => (
              <TableRow key={cert.id_certificado}>
                <TableCell className="font-mono">{cert.cod_validador}</TableCell>
                <TableCell>{cert.num_cpf_cnpj_gerador}</TableCell>
                <TableCell>
                  {format(new Date(cert.dat_periodo_inicio), "dd/MM/yyyy")} até{" "}
                  {format(new Date(cert.dat_periodo_fim), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{cert.qtd_total_certificado?.toFixed(3)} kg</TableCell>
                <TableCell>R$ {cert.vlr_total_certificado?.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant={cert.des_status === "A" ? "default" : "secondary"}>
                    {cert.des_status === "A" ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => (window.location.href = `/certificados/${cert.id_certificado}`)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4" />
                    </Button>
                    {cert.des_status === "A" && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleInativar(cert.id_certificado)}
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
      )}
    </div>
  );
}
