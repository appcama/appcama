import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CheckCircle2, XCircle, FileText, Building2, Calendar, Package, Recycle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface CertificadoData {
  cod_validador: string;
  dat_periodo_inicio: string;
  dat_periodo_fim: string;
  qtd_total_certificado: number;
  vlr_total_certificado: number;
  observacoes: string | null;
  num_cpf_cnpj_gerador: string;
  entidade: {
    nom_entidade: string;
    num_cpf_cnpj: string;
    des_email: string;
  };
  residuos: Array<{
    nom_residuo: string;
    qtd_total: number;
    vlr_total: number;
  }>;
  coletas: Array<{
    cod_coleta: string;
    dat_coleta: string;
  }>;
}

export default function ValidarCertificado() {
  const { codigo } = useParams<{ codigo: string }>();
  const [certificado, setCertificado] = useState<CertificadoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [valido, setValido] = useState(false);

  useEffect(() => {
    loadCertificado();
  }, [codigo]);

  const loadCertificado = async () => {
    if (!codigo) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Buscar certificado
      const { data: certData, error: certError } = await supabase
        .from("certificado")
        .select(`
          cod_validador,
          dat_periodo_inicio,
          dat_periodo_fim,
          qtd_total_certificado,
          vlr_total_certificado,
          observacoes,
          num_cpf_cnpj_gerador,
          id_certificado,
          entidade:id_entidade (
            nom_entidade,
            num_cpf_cnpj,
            des_email
          )
        `)
        .eq("cod_validador", codigo)
        .eq("des_status", "A")
        .eq("des_locked", "D")
        .single();

      if (certError || !certData) {
        setValido(false);
        setLoading(false);
        return;
      }

      // Buscar resíduos
      const { data: residuosData } = await supabase
        .from("certificado_residuo")
        .select("nom_residuo, qtd_total, vlr_total")
        .eq("id_certificado", certData.id_certificado);

      // Buscar coletas
      const { data: coletasData } = await supabase
        .from("coleta")
        .select("cod_coleta, dat_coleta")
        .eq("id_certificado", certData.id_certificado)
        .order("dat_coleta", { ascending: false });

      setCertificado({
        ...certData,
        entidade: Array.isArray(certData.entidade) ? certData.entidade[0] : certData.entidade,
        residuos: residuosData || [],
        coletas: coletasData || [],
      });
      setValido(true);
    } catch (error) {
      console.error("Erro ao validar certificado:", error);
      setValido(false);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const formatCPFCNPJ = (cpfCnpj: string) => {
    const numbers = cpfCnpj.replace(/\D/g, "");
    if (numbers.length === 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
    }
    return numbers.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (!valido || !certificado) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <Alert variant="destructive">
            <XCircle className="h-5 w-5" />
            <AlertTitle>Certificado Inválido</AlertTitle>
            <AlertDescription>
              O código validador <strong>{codigo}</strong> não corresponde a nenhum certificado ativo no sistema.
              Verifique se o código está correto ou entre em contato com o emissor.
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-primary/10 p-4 rounded-full">
                <CheckCircle2 className="h-12 w-12 text-primary" />
              </div>
            </div>
            <CardTitle className="text-3xl">Certificado Válido</CardTitle>
            <CardDescription className="text-lg">
              Este certificado foi emitido pela plataforma ReciclaE e é válido para comprovação de coleta de resíduos.
            </CardDescription>
            <div className="mt-4">
              <Badge variant="default" className="text-lg px-4 py-2">
                <FileText className="h-4 w-4 mr-2" />
                {certificado.cod_validador}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Dados da Entidade */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Dados da Entidade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Nome/Razão Social</p>
                <p className="font-medium">{certificado.entidade.nom_entidade}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CPF/CNPJ</p>
                <p className="font-medium">{formatCPFCNPJ(certificado.entidade.num_cpf_cnpj)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{certificado.entidade.des_email || "Não informado"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Emissor</p>
                <p className="font-medium">{formatCPFCNPJ(certificado.num_cpf_cnpj_gerador)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Período e Totais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Período e Totais
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Data Início</p>
                <p className="text-lg font-bold">{formatDate(certificado.dat_periodo_inicio)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Data Fim</p>
                <p className="text-lg font-bold">{formatDate(certificado.dat_periodo_fim)}</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Quantidade Total</p>
                <p className="text-lg font-bold">{certificado.qtd_total_certificado.toFixed(2)} kg</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground mb-1">Valor Total</p>
                <p className="text-lg font-bold">{formatCurrency(certificado.vlr_total_certificado)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resíduos Coletados */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Recycle className="h-5 w-5" />
              Resíduos Coletados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo de Resíduo</TableHead>
                  <TableHead className="text-right">Quantidade (kg)</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {certificado.residuos.map((residuo, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{residuo.nom_residuo}</TableCell>
                    <TableCell className="text-right">{residuo.qtd_total.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(residuo.vlr_total)}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted">
                  <TableCell>TOTAL</TableCell>
                  <TableCell className="text-right">{certificado.qtd_total_certificado.toFixed(2)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(certificado.vlr_total_certificado)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Coletas Incluídas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Coletas Incluídas ({certificado.coletas.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {certificado.coletas.map((coleta, index) => (
                <Badge key={index} variant="outline">
                  {coleta.cod_coleta} - {formatDate(coleta.dat_coleta)}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        {certificado.observacoes && (
          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{certificado.observacoes}</p>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-sm text-muted-foreground py-4">
          <p>Este certificado foi validado em {new Date().toLocaleString("pt-BR")}</p>
          <p className="mt-2">Para mais informações, entre em contato com o emissor do certificado.</p>
        </div>
      </div>
    </div>
  );
}
