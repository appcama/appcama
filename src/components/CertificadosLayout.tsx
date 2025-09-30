import { useLocation } from "react-router-dom";
import { CertificadosList } from "./CertificadosList";
import { CertificadoEmitir } from "./CertificadoEmitir";
import { CertificadoView } from "./CertificadoView";

export function CertificadosLayout() {
  const location = useLocation();
  const pathParts = location.pathname.split('/').filter(Boolean);
  
  // Extract action and id from pathname
  // e.g., /certificados/emitir -> action = "emitir"
  // e.g., /certificados/view/123 -> action = "view", id = "123"
  const action = pathParts[1]; // index 0 is "certificados"
  const id = pathParts[2];

  if (action === "emitir") {
    return <CertificadoEmitir />;
  }

  if (action === "view" && id) {
    return <CertificadoView idCertificado={parseInt(id)} />;
  }

  return <CertificadosList />;
}
