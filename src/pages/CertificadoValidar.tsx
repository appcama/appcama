import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";

export default function CertificadoValidar() {
  const { codigo } = useParams();

  const { data: certificado, isLoading } = useQuery({
    queryKey: ["validar-certificado", codigo],
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
        .eq("cod_validador", codigo)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Validando certificado...</p>
      </div>
    );
  }

  const isValido = certificado && certificado.des_status === "A";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-recycle-green-light/20 to-eco-blue/20">
      <Card className="max-w-2xl w-full">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Validação de Certificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4 py-6">
            {isValido ? (
              <>
                <CheckCircle className="h-20 w-20 text-green-500" />
                <Badge className="text-lg px-6 py-2" variant="default">
                  CERTIFICADO VÁLIDO
                </Badge>
              </>
            ) : (
              <>
                <XCircle className="h-20 w-20 text-red-500" />
                <Badge className="text-lg px-6 py-2" variant="destructive">
                  CERTIFICADO INVÁLIDO
                </Badge>
              </>
            )}
          </div>

          {certificado ? (
            <div className="space-y-4 border-t pt-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Código</p>
                  <p className="font-mono font-semibold">{certificado.cod_validador}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Emissão</p>
                  <p>{format(new Date(certificado.dat_criacao), "dd/MM/yyyy HH:mm")}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Entidade Coletora Responsável</p>
                  <p className="font-semibold">{certificado.entidade?.nom_entidade}</p>
                  <p className="text-sm">{certificado.entidade?.num_cpf_cnpj}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Período do Certificado</p>
                  <p>
                    {format(new Date(certificado.dat_periodo_inicio), "dd/MM/yyyy")} até{" "}
                    {format(new Date(certificado.dat_periodo_fim), "dd/MM/yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Quantidade Total</p>
                  <p className="font-semibold">{certificado.qtd_total_certificado?.toFixed(3)} kg</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Valor Total</p>
                  <p className="font-semibold">R$ {certificado.vlr_total_certificado?.toFixed(2)}</p>
                </div>
              </div>

              {!isValido && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mt-4">
                  <p className="text-sm text-red-800">
                    Este certificado foi <strong>inativado</strong> pela entidade coletora. Para mais informações,
                    entre em contato com {certificado.entidade?.nom_entidade}.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground">Certificado não encontrado no sistema.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
