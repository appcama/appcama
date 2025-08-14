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
  EntidadeManagerView
} from "./EntidadeManagerView";
import {
  TipoEntidadeManagerView
} from "./TipoEntidadeManagerView";
import {
  TipoResiduoManagerView
} from "./TipoResiduoManagerView";
import {
  PerfilFuncionalidades
} from "./PerfilFuncionalidades";
import {
  UsuarioManagerView
} from "./UsuarioManagerView";
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
        return <EntidadeManagerView />;
      case "tipos-entidades":
        return <TipoEntidadeManagerView />;
      case "tipos-residuos":
        return <TipoResiduoManagerView />;
      case "perfis":
        return <PerfilFuncionalidades />;
      case "usuarios":
        return <UsuarioManagerView />;
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
