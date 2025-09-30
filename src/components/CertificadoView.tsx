import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, QrCode } from "lucide-react";
import { format } from "date-fns";
import { QRCodeCanvas } from "qrcode.react";

interface CertificadoViewProps {
  idCertificado: number;
}

export function CertificadoView({ idCertificado }: CertificadoViewProps) {
  const { data: certificado, isLoading } = useQuery({
    queryKey: ["certificado", idCertificado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificado")
        .select(`
          *,
          entidade:id_entidade (
            nom_entidade,
            num_cpf_cnpj
          )
        `)
        .eq("id_certificado", idCertificado)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: residuos } = useQuery({
    queryKey: ["certificado-residuos", idCertificado],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("certificado_residuo")
        .select("*")
        .eq("id_certificado", idCertificado);

      if (error) throw error;
      return data;
    },
  });

  const { data: entidadeGeradora } = useQuery({
    queryKey: ["entidade-geradora", certificado?.num_cpf_cnpj_gerador],
    queryFn: async () => {
      if (!certificado?.num_cpf_cnpj_gerador) return null;
      
      const { data, error } = await supabase
        .from("entidade")
        .select("*")
        .eq("num_cpf_cnpj", certificado.num_cpf_cnpj_gerador)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!certificado?.num_cpf_cnpj_gerador,
  });

  if (isLoading) return <div>Carregando...</div>;

  const validationUrl = `${window.location.origin}/certificados/validar/${certificado?.cod_validador}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => (window.location.href = "/certificados")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <h2 className="text-2xl font-bold">Certificado de Coleta</h2>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Baixar PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Informações do Certificado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Código Validador</p>
                <p className="font-mono font-bold">{certificado?.cod_validador}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={certificado?.des_status === "A" ? "default" : "secondary"}>
                  {certificado?.des_status === "A" ? "Ativo" : "Inativo"}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Período</p>
                <p>
                  {certificado?.dat_periodo_inicio && format(new Date(certificado.dat_periodo_inicio), "dd/MM/yyyy")} até{" "}
                  {certificado?.dat_periodo_fim && format(new Date(certificado.dat_periodo_fim), "dd/MM/yyyy")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p>{certificado?.dat_criacao && format(new Date(certificado.dat_criacao), "dd/MM/yyyy HH:mm")}</p>
              </div>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Entidade Coletora</p>
              <p className="font-semibold">{certificado?.entidade?.nom_entidade}</p>
              <p className="text-sm">{certificado?.entidade?.num_cpf_cnpj}</p>
            </div>

            <div className="border-t pt-4">
              <p className="text-sm text-muted-foreground mb-2">Entidade Geradora</p>
              <p className="font-semibold">{entidadeGeradora?.nom_entidade}</p>
              <p className="text-sm">{entidadeGeradora?.num_cpf_cnpj}</p>
            </div>

            {certificado?.observacoes && (
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground mb-2">Observações</p>
                <p className="text-sm">{certificado.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code de Validação
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <QRCodeCanvas value={validationUrl} size={200} />
            <p className="text-xs text-center text-muted-foreground">
              Escaneie para validar a autenticidade deste certificado
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resíduos Coletados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Resíduo</TableHead>
                <TableHead>Quantidade</TableHead>
                <TableHead>Valor</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {residuos?.map((r) => (
                <TableRow key={r.id_certificado_residuo}>
                  <TableCell>{r.nom_residuo}</TableCell>
                  <TableCell>{r.qtd_total.toFixed(3)} kg</TableCell>
                  <TableCell>R$ {r.vlr_total.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              <TableRow className="font-bold">
                <TableCell>TOTAL</TableCell>
                <TableCell>{certificado?.qtd_total_certificado?.toFixed(3)} kg</TableCell>
                <TableCell>R$ {certificado?.vlr_total_certificado?.toFixed(2)}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
