
import {
  useEffect,
  useState,
  useCallback
} from "react";
import {
  useNavigate,
  useLocation
} from "react-router-dom";
import {
  Sidebar
} from "./Sidebar";
import {
  useAuth
} from "@/hooks/useAuth";
import {
  usePermissions
} from "@/hooks/usePermissions";
import {
  Dashboard
} from "./Dashboard";
import {
  EntidadesList
} from "./EntidadesList";
import {
  EntidadeForm
} from "./EntidadeForm";
import {
  TipoEntidadeList
} from "./TipoEntidadeList";
import {
  TipoEntidadeForm
} from "./TipoEntidadeForm";
import {
  TipoResiduoList
} from "./TipoResiduoList";
import {
  TipoResiduoForm
} from "./TipoResiduoForm";
import {
  PerfilFuncionalidades
} from "./PerfilFuncionalidades";
import {
  UsuariosList
} from "./UsuariosList";
import {
  UsuarioForm
} from "./UsuarioForm";
import {
  TipoPontoColetaManagerView
} from './TipoPontoColetaManagerView';

export function ReciclaSystemLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    logout
  } = useAuth();
  const {
    isAllowed
  } = usePermissions();
  const [activeItem, setActiveItem] = useState("dashboard");

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  useEffect(() => {
    const path = location.pathname.split("/").pop() || "dashboard";
    setActiveItem(path);
  }, [location]);

  const handleItemClick = (item: string) => {
    setActiveItem(item);
    navigate(`/${item}`);
  };

  const renderContent = () => {
    const path = location.pathname.split("/").pop();

    switch (path) {
      case "dashboard":
        return <Dashboard />;
      case "entidades":
        return (
          <div className="space-y-6">
            <EntidadeForm />
            <EntidadesList onAddNew={() => {}} onEdit={() => {}} />
          </div>
        );
      case "tipos-entidades":
        return (
          <div className="space-y-6">
            <TipoEntidadeForm />
            <TipoEntidadeList />
          </div>
        );
      case "tipos-residuos":
        return (
          <div className="space-y-6">
            <TipoResiduoForm />
            <TipoResiduoList />
          </div>
        );
      case "perfis":
        return <PerfilFuncionalidades />;
      case "usuarios":
        return (
          <div className="space-y-6">
            <UsuarioForm />
            <UsuariosList onAddNew={() => {}} onEdit={() => {}} />
          </div>
        );
      case "tipos-ponto-coleta":
        return <TipoPontoColetaManagerView />;
      default:
        return <div>Conteúdo não encontrado</div>;
    }
  };

  if (!user) {
    return <div>Redirecionando para o login...</div>;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <Sidebar 
        activeItem={activeItem}
        onItemClick={handleItemClick}
        allowedFeatures={[]} // This will be populated by permissions
      />

      {/* Content area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Main content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                {location.pathname.split("/").pop()}
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Replace with your content */}
              <div className="py-4">
                <div className="h-full">
                  {renderContent()}
                </div>
              </div>
              {/* /End replace */}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
