
import { useState } from "react";
import { 
  Home, 
  Users, 
  Building, 
  Calendar, 
  Trash2,
  BarChart3, 
  Settings, 
  Recycle,
  ChevronDown,
  ChevronRight,
  MapPin,
  UserCheck,
  Shield,
  FileText,
  TrendingUp,
  Package,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { featureByItemId } from "@/lib/featureMap";
import { useBreakpoints } from "@/hooks/use-breakpoints";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  allowedFeatures: string[];
  onMenuClose?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

export function Sidebar({ activeItem, onItemClick, allowedFeatures, onMenuClose }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const { isMobile } = useBreakpoints();
  const { logout } = useAuth();

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const menuGroups = [
    {
      label: "PRINCIPAL",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          icon: Home,
        },
        {
          id: "entidades",
          label: "Entidades",
          icon: Building,
        },
        {
          id: "pontos-coleta",
          label: "Pontos de Coleta",
          icon: MapPin,
        },
        {
          id: "eventos-coleta",
          label: "Eventos de Coleta",
          icon: Calendar,
        },
        {
          id: "coletas",
          label: "Coletas",
          icon: Package,
        },
      ]
    },
    {
      label: "AUXILIARES",
      items: [
        {
          id: "tipos-ponto-coleta",
          label: "Tipos de Ponto de Coleta",
          icon: MapPin,
        },
        {
          id: "tipos-entidades",
          label: "Tipos de Entidades",
          icon: Building,
        },
        {
          id: "tipos-residuos",
          label: "Tipos de Resíduos",
          icon: Trash2,
        },
        {
          id: "residuos",
          label: "Resíduos",
          icon: Package,
        },
        {
          id: "indicadores",
          label: "Indicadores",
          icon: TrendingUp,
        },
      ]
    },
    {
      label: "SEGURANÇA",
      items: [
        {
          id: "perfis",
          label: "Perfis",
          icon: UserCheck,
        },
        {
          id: "usuarios",
          label: "Usuários",
          icon: Users,
        },
        {
          id: "funcionalidades",
          label: "Funcionalidades",
          icon: Shield,
        },
      ]
    },
    {
      label: "DADOS",
      items: []
    },
    {
      label: "RELATÓRIOS",
      items: [
        {
          id: "relatorios-operacionais",
          label: "Relatórios Operacionais",
          icon: FileText,
        },
        {
          id: "relatorios-gerenciais", 
          label: "Relatórios Gerenciais",
          icon: TrendingUp,
        },
        {
          id: "relatorios-ambientais",
          label: "Relatórios Ambientais", 
          icon: Recycle,
        },
        {
          id: "relatorios-comparativos",
          label: "Relatórios Comparativos",
          icon: BarChart3,
        },
      ]
    }
  ];

  const isFeatureAllowed = (featureId: string) => {
    if (!allowedFeatures || allowedFeatures.length === 0) {
      console.log("[Sidebar] No permissions loaded yet, allowing access during loading");
      return true;
    }

    const featureName = featureByItemId(featureId);
    
    if (!featureName) {
      console.log(`[Sidebar] No feature mapping found for: ${featureId}`);
      return false;
    }

    const allowed = allowedFeatures.includes(featureName);
    console.log(`[Sidebar] Feature ${featureName} (${featureId}): ${allowed ? 'ALLOWED' : 'DENIED'}`);
    
    return allowed;
  };

  const handleItemClick = (item: string) => {
    onItemClick(item);
    if (isMobile && onMenuClose) {
      onMenuClose();
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    if (!isFeatureAllowed(item.id)) {
      return null;
    }

    const isActive = activeItem === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-sm font-medium",
          isMobile ? "min-h-[44px]" : "min-h-[36px]",
          isActive 
            ? "bg-recycle-green-light text-recycle-green-dark" 
            : "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        )}
      >
        <Icon className={cn("flex-shrink-0", isMobile ? "w-5 h-5" : "w-4 h-4")} />
        <span className="flex-1 truncate">{item.label}</span>
      </button>
    );
  };

  const renderGroup = (group: any) => {
    const visibleItems = group.items.filter((item: MenuItem) => isFeatureAllowed(item.id));
    
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={group.label} className={cn("mb-6", isMobile && "mb-4")}>
        <div className={cn("px-4 mb-3", isMobile && "mb-2")}>
          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            {group.label}
          </h3>
        </div>
        <div className="space-y-1">
          {visibleItems.map(renderMenuItem)}
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "bg-white flex flex-col h-full",
      !isMobile && "w-64 border-r border-gray-200"
    )}>
      {!isMobile && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <img 
              src="/recyclae-logo.png" 
              alt="ReciclaÊ" 
              className="h-12 w-auto object-contain"
            />
          </div>
        </div>
      )}
      
      <nav className={cn("flex-1 overflow-y-auto", isMobile ? "p-2" : "p-4")}>
        {menuGroups.map(renderGroup)}
      </nav>
      
      {/* Botão de Sair */}
      <div className={cn("border-t border-gray-200", isMobile ? "p-2" : "p-4")}>
        <button
          onClick={logout}
          className={cn(
            "w-full flex items-center gap-3 px-4 py-3 text-left rounded-lg transition-colors text-sm font-medium",
            isMobile ? "min-h-[44px]" : "min-h-[36px]",
            "text-red-600 hover:bg-red-50 active:bg-red-100"
          )}
        >
          <LogOut className={cn("flex-shrink-0", isMobile ? "w-5 h-5" : "w-4 h-4")} />
          <span className="flex-1 truncate">Sair</span>
        </button>
      </div>
    </div>
  );
}
