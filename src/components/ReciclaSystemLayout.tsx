
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
import { PerfilList } from "@/components/PerfilList";
import { PerfilForm } from "@/components/PerfilForm";
import { UsuariosList } from "@/components/UsuariosList";
import { UsuarioForm } from "@/components/UsuarioForm";
import { EventosList } from "@/components/EventosList";
import { EventoForm } from "@/components/EventoForm";
import { usePermissions } from "@/hooks/usePermissions";

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
  const [tipoResiduoForm, setTipoResiduoForm] = useState<FormState>({ mode: "list" });
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
              entidade={entidadeForm.editingItem}
              onBack={() => setEntidadeForm({ mode: "list" })}
            />
          );
        }
        return (
          <EntidadesList
            onEdit={(entidade) => setEntidadeForm({ mode: "form", editingItem: entidade })}
            onNew={() => setEntidadeForm({ mode: "form" })}
          />
        );
      
      case "tipos-entidades":
        if (tipoEntidadeForm.mode === "form") {
          return (
            <TipoEntidadeForm
              tipoEntidade={tipoEntidadeForm.editingItem}
              onBack={() => setTipoEntidadeForm({ mode: "list" })}
            />
          );
        }
        return (
          <TipoEntidadeList
            onEdit={(tipoEntidade) => setTipoEntidadeForm({ mode: "form", editingItem: tipoEntidade })}
            onNew={() => setTipoEntidadeForm({ mode: "form" })}
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
            onNew={() => setEventosForm({ mode: "form" })}
          />
        );
      
      case "tipos-residuos":
        if (tipoResiduoForm.mode === "form") {
          return (
            <TipoResiduoForm
              tipoResiduo={tipoResiduoForm.editingItem}
              onBack={() => setTipoResiduoForm({ mode: "list" })}
            />
          );
        }
        return (
          <TipoResiduoList
            onEdit={(tipoResiduo) => setTipoResiduoForm({ mode: "form", editingItem: tipoResiduo })}
            onNew={() => setTipoResiduoForm({ mode: "form" })}
          />
        );
      
      case "perfis":
        if (perfilForm.mode === "form") {
          return (
            <PerfilForm
              perfil={perfilForm.editingItem}
              onBack={() => setPerfilForm({ mode: "list" })}
            />
          );
        }
        return (
          <PerfilList
            onEdit={(perfil) => setPerfilForm({ mode: "form", editingItem: perfil })}
            onNew={() => setPerfilForm({ mode: "form" })}
          />
        );
      
      case "usuarios":
        if (usuarioForm.mode === "form") {
          return (
            <UsuarioForm
              usuario={usuarioForm.editingItem}
              onBack={() => setUsuarioForm({ mode: "list" })}
            />
          );
        }
        return (
          <UsuariosList
            onEdit={(usuario) => setUsuarioForm({ mode: "form", editingItem: usuario })}
            onNew={() => setUsuarioForm({ mode: "form" })}
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
