import { useState } from "react";
import { Sidebar } from "@/components/Sidebar";
import { Dashboard } from "@/components/Dashboard";
import { CooperativasCatadores } from "@/components/CooperativasCatadores";
import { EntidadesList } from "@/components/EntidadesList";
import { EntidadeForm } from "@/components/EntidadeForm";
import { TipoEntidadeList } from "@/components/TipoEntidadeList";
import { TipoEntidadeForm } from "@/components/TipoEntidadeForm";
import { TipoResiduoList } from "@/components/TipoResiduoList";
import { TipoResiduoForm } from "@/components/TipoResiduoForm";
import { TipoPontoColetaList } from "@/components/TipoPontoColetaList";
import { TipoPontoColetaForm } from "@/components/TipoPontoColetaForm";
import { PerfilList } from "@/components/PerfilList";
import { PerfilForm } from "@/components/PerfilForm";
import { PerfilFuncionalidades } from "@/components/PerfilFuncionalidades";
import { UsuariosList } from "@/components/UsuariosList";
import { UsuarioForm } from "@/components/UsuarioForm";
import { EventosList } from "@/components/EventosList";
import { EventoForm } from "@/components/EventoForm";
import { usePermissions } from "@/hooks/usePermissions";
import { PontosColetaList } from "@/components/PontosColetaList";
import { PontosColetaForm } from "@/components/PontosColetaForm";

type ViewMode = "list" | "form";

interface FormState {
  mode: ViewMode;
  editingItem?: any;
}

export function ReciclaSystemLayout() {
  const [activeItem, setActiveItem] = useState("dashboard");
  const { allowedFeatures } = usePermissions();
  
  // Estados dos formulários para cada módulo
  const [entidadeForm, setEntidadeForm] = useState<FormState>({ mode: "list" });
  const [tipoEntidadeForm, setTipoEntidadeForm] = useState<FormState>({ mode: "list" });
  const [eventosForm, setEventosForm] = useState<FormState>({ mode: "list" });
  const [pontosColetaForm, setPontosColetaForm] = useState<FormState>({ mode: "list" });
  const [tipoResiduoForm, setTipoResiduoForm] = useState<FormState>({ mode: "list" });
  const [tipoPontoColetaForm, setTipoPontoColetaForm] = useState<FormState>({ mode: "list" });
  const [perfilForm, setPerfilForm] = useState<FormState>({ mode: "list" });
  const [usuarioForm, setUsuarioForm] = useState<FormState>({ mode: "list" });

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard />;
      
      case "cooperativas-catadores":
        return <CooperativasCatadores />;
      
      case "entidades":
        if (entidadeForm.mode === "form") {
          return (
            <EntidadeForm
              editingEntidade={entidadeForm.editingItem}
              onBack={() => setEntidadeForm({ mode: "list" })}
              onSuccess={() => setEntidadeForm({ mode: "list" })}
            />
          );
        }
        return (
          <EntidadesList
            onEdit={(entidade) => setEntidadeForm({ mode: "form", editingItem: entidade })}
            onAddNew={() => setEntidadeForm({ mode: "form" })}
          />
        );
      
      case "pontos-coleta":
        if (pontosColetaForm.mode === "form") {
          return (
            <PontosColetaForm
              editingPontoColeta={pontosColetaForm.editingItem}
              onBack={() => setPontosColetaForm({ mode: "list" })}
              onSuccess={() => setPontosColetaForm({ mode: "list" })}
            />
          );
        }
        return (
          <PontosColetaList
            onEdit={(pontoColeta) => setPontosColetaForm({ mode: "form", editingItem: pontoColeta })}
            onAddNew={() => setPontosColetaForm({ mode: "form" })}
          />
        );
      
      case "tipos-ponto-coleta":
        if (tipoPontoColetaForm.mode === "form") {
          return (
            <TipoPontoColetaForm
              editingTipoPontoColeta={tipoPontoColetaForm.editingItem}
              onBack={() => setTipoPontoColetaForm({ mode: "list" })}
              onSuccess={() => setTipoPontoColetaForm({ mode: "list" })}
            />
          );
        }
        return (
          <TipoPontoColetaList
            onEdit={(tipoPontoColeta) => setTipoPontoColetaForm({ mode: "form", editingItem: tipoPontoColeta })}
            onAddNew={() => setTipoPontoColetaForm({ mode: "form" })}
          />
        );
      
      case "tipos-entidades":
        if (tipoEntidadeForm.mode === "form") {
          return (
            <TipoEntidadeForm
              editingTipoEntidade={tipoEntidadeForm.editingItem}
              onBack={() => setTipoEntidadeForm({ mode: "list" })}
              onSuccess={() => setTipoEntidadeForm({ mode: "list" })}
            />
          );
        }
        return (
          <TipoEntidadeList
            onEdit={(tipoEntidade) => setTipoEntidadeForm({ mode: "form", editingItem: tipoEntidade })}
            onAddNew={() => setTipoEntidadeForm({ mode: "form" })}
          />
        );
      
      case "eventos-coleta":
        if (eventosForm.mode === "form") {
          return (
            <EventoForm
              evento={eventosForm.editingItem}
              onBack={() => setEventosForm({ mode: "list" })}
            />
          );
        }
        return (
          <EventosList
            onEdit={(evento) => setEventosForm({ mode: "form", editingItem: evento })}
            onAddNew={() => setEventosForm({ mode: "form" })}
          />
        );
      
      case "tipos-residuos":
        if (tipoResiduoForm.mode === "form") {
          return (
            <TipoResiduoForm
              editingTipoResiduo={tipoResiduoForm.editingItem}
              onBack={() => setTipoResiduoForm({ mode: "list" })}
              onSuccess={() => setTipoResiduoForm({ mode: "list" })}
            />
          );
        }
        return (
          <TipoResiduoList
            onEdit={(tipoResiduo) => setTipoResiduoForm({ mode: "form", editingItem: tipoResiduo })}
            onAddNew={() => setTipoResiduoForm({ mode: "form" })}
          />
        );
      
      case "perfis":
        if (perfilForm.mode === "form") {
          return (
            <PerfilForm
              editingPerfil={perfilForm.editingItem}
              onBack={() => setPerfilForm({ mode: "list" })}
              onSuccess={() => setPerfilForm({ mode: "list" })}
            />
          );
        }
        return (
          <PerfilList
            onEdit={(perfil) => setPerfilForm({ mode: "form", editingItem: perfil })}
            onAddNew={() => setPerfilForm({ mode: "form" })}
          />
        );
      
      case "funcionalidades":
        return <PerfilFuncionalidades />;
      
      case "usuarios":
        if (usuarioForm.mode === "form") {
          return (
            <UsuarioForm
              editingUsuario={usuarioForm.editingItem}
              onBack={() => setUsuarioForm({ mode: "list" })}
              onSuccess={() => setUsuarioForm({ mode: "list" })}
            />
          );
        }
        return (
          <UsuariosList
            onEdit={(usuario) => setUsuarioForm({ mode: "form", editingItem: usuario })}
            onAddNew={() => setUsuarioForm({ mode: "form" })}
          />
        );
      
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeItem={activeItem} 
        onItemClick={setActiveItem}
        allowedFeatures={allowedFeatures}
      />
      <main className="flex-1 overflow-y-auto p-6">
        {renderContent()}
      </main>
    </div>
  );
}
