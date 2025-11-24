
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  ChevronLeft,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  allowedFeatures: string[];
  onMenuClose?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

export function Sidebar({ activeItem, onItemClick, allowedFeatures, onMenuClose, collapsed = false, onToggle }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [autoExpandTimer, setAutoExpandTimer] = useState<NodeJS.Timeout | null>(null);
  const { isMobile } = useBreakpoints();
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (autoExpandTimer) {
        clearTimeout(autoExpandTimer);
      }
    };
  }, [autoExpandTimer]);

  const handleLogoClick = () => {
    navigate('/');
    onItemClick('dashboard');
  };

  const toggleExpanded = (itemId: string) => {
    setExpandedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleMouseEnter = () => {
    if (collapsed && onToggle && !isMobile) {
      const timer = setTimeout(() => {
        onToggle();
      }, 3000);
      setAutoExpandTimer(timer);
    }
  };

  const handleMouseLeave = () => {
    if (autoExpandTimer) {
      clearTimeout(autoExpandTimer);
      setAutoExpandTimer(null);
    }
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
        {
          id: "certificados",
          label: "Certificados",
          icon: FileText,
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

    const buttonContent = (
      <button
        key={item.id}
        onClick={() => handleItemClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 py-3 text-left rounded-lg transition-colors text-sm font-medium",
          isMobile ? "min-h-[44px] px-4" : "min-h-[36px]",
          collapsed && !isMobile ? "justify-center px-2" : "px-4",
          isActive 
            ? "bg-recycle-green-light text-recycle-green-dark" 
            : "text-gray-700 hover:bg-gray-100 active:bg-gray-200",
        )}
      >
        <Icon className={cn("flex-shrink-0", isMobile ? "w-5 h-5" : "w-4 h-4")} />
        {(!collapsed || isMobile) && <span className="flex-1 truncate">{item.label}</span>}
      </button>
    );

    if (collapsed && !isMobile) {
      return (
        <Tooltip key={item.id} delayDuration={300}>
          <TooltipTrigger asChild>
            {buttonContent}
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            {item.label}
          </TooltipContent>
        </Tooltip>
      );
    }

    return buttonContent;
  };

  const renderGroup = (group: any) => {
    const visibleItems = group.items.filter((item: MenuItem) => isFeatureAllowed(item.id));
    
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={group.label} className={cn("mb-6", isMobile && "mb-4")}>
        {(!collapsed || isMobile) && (
          <div className={cn("px-4 mb-3", isMobile && "mb-2")}>
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {group.label}
            </h3>
          </div>
        )}
        {collapsed && !isMobile && (
          <div className="px-2 mb-2">
            <div className="h-px bg-gray-200" />
          </div>
        )}
        <div className="space-y-1">
          {visibleItems.map(renderMenuItem)}
        </div>
      </div>
    );
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div 
        className={cn(
          "bg-white flex flex-col h-full transition-all duration-300 ease-in-out",
          !isMobile && (collapsed ? "w-20" : "w-64"),
          !isMobile && "border-r border-gray-200"
        )}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {!isMobile && (
        <div className="p-4 border-b border-gray-200 relative">
          <div className="flex items-center justify-center">
            <div className="flex items-center justify-center cursor-pointer" onClick={handleLogoClick}>
              <img 
                src="/logo-original.png" 
                alt="ReciclaÊ Logo" 
                className={cn(
                  "object-contain hover:opacity-80 transition-all duration-300",
                  collapsed ? "w-12 h-12" : "w-36 h-36"
                )}
              />
            </div>
          </div>
          
          {/* Botão de toggle */}
          {onToggle && (
            <button
              onClick={onToggle}
              className={cn(
                "absolute top-4 -right-3 bg-white border border-gray-200 rounded-full p-1.5",
                "hover:bg-gray-50 transition-colors shadow-md z-10"
              )}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              )}
            </button>
          )}
        </div>
      )}
      
      <nav className={cn("flex-1 overflow-y-auto", isMobile ? "p-2" : "p-4")}>
        {menuGroups.map(renderGroup)}
      </nav>
      
      {/* Botão de Sair */}
      <div className={cn("border-t border-gray-200", isMobile ? "p-2" : "p-4")}>
        {collapsed && !isMobile ? (
          <Tooltip delayDuration={300}>
            <TooltipTrigger asChild>
              <button
                onClick={logout}
                className={cn(
                  "w-full flex items-center justify-center px-2 py-3 rounded-lg transition-colors",
                  "text-red-600 hover:bg-red-50 active:bg-red-100"
                )}
              >
                <LogOut className="w-4 h-4 flex-shrink-0" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Sair
            </TooltipContent>
          </Tooltip>
        ) : (
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
        )}
      </div>
      </div>
    </TooltipProvider>
  );
}
