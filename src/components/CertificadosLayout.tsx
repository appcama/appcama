import { useParams } from "react-router-dom";
import { CertificadosList } from "./CertificadosList";
import { CertificadoEmitir } from "./CertificadoEmitir";
import { CertificadoView } from "./CertificadoView";

export function CertificadosLayout() {
  const { action, id } = useParams();

  if (action === "emitir") {
    return <CertificadoEmitir />;
  }

  if (action === "view" && id) {
    return <CertificadoView idCertificado={parseInt(id)} />;
  }

  return <CertificadosList />;
}
