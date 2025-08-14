
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
  EntidadesForm
} from "./EntidadesForm";
import {
  TiposEntidadesList
} from "./TiposEntidadesList";
import {
  TiposEntidadesForm
} from "./TiposEntidadesForm";
import {
  TiposResiduosList
} from "./TiposResiduosList";
import {
  TiposResiduosForm
} from "./TiposResiduosForm";
import {
  PerfilFuncionalidades
} from "./PerfilFuncionalidades";
import {
  UsuariosList
} from "./UsuariosList";
import {
  UsuariosForm
} from "./UsuariosForm";
import {
  TipoPontoColetaManagerView
} from './TipoPontoColetaManagerView';

export function ReciclaSystemLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    user,
    signOut
  } = useAuth();
  const {
    isAllowed
  } = usePermissions();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  const renderContent = () => {
    const path = location.pathname.split("/").pop();

    switch (path) {
      case "dashboard":
        return <Dashboard />;
      case "entidades":
        return (
          <div className="space-y-6">
            <EntidadesForm />
            <EntidadesList />
          </div>
        );
      case "tipos-entidades":
        return (
          <div className="space-y-6">
            <TiposEntidadesForm />
            <TiposEntidadesList />
          </div>
        );
      case "tipos-residuos":
        return (
          <div className="space-y-6">
            <TiposResiduosForm />
            <TiposResiduosList />
          </div>
        );
      case "perfis":
        return <PerfilFuncionalidades />;
      case "usuarios":
        return (
          <div className="space-y-6">
            <UsuariosForm />
            <UsuariosList />
          </div>
        );
      case "tipo-pontos-coleta":
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
        isSidebarOpen={isSidebarOpen}
        toggleSidebar={toggleSidebar}
        signOut={signOut}
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
