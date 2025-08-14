
import { useState } from "react";
import { 
  Home, 
  Users, 
  Building2, 
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
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { featureByItemId } from "@/lib/featureMap";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  allowedFeatures: string[];
}

interface MenuItem {
  id: string;
  label: string;
  icon: any;
  children?: MenuItem[];
}

export function Sidebar({ activeItem, onItemClick, allowedFeatures }: SidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
          icon: Building2,
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
          icon: Building2,
        },
        {
          id: "tipos-residuos",
          label: "Tipos de Resíduos",
          icon: Trash2,
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
      items: []
    }
  ];

  const isFeatureAllowed = (featureId: string) => {
    // Se não há permissões carregadas ainda, permitir temporariamente (carregando)
    if (!allowedFeatures || allowedFeatures.length === 0) {
      console.log("[Sidebar] No permissions loaded yet, allowing access during loading");
      return true;
    }

    // Mapear o ID do item para o nome da funcionalidade
    const featureName = featureByItemId(featureId);
    
    if (!featureName) {
      console.log(`[Sidebar] No feature mapping found for: ${featureId}`);
      return false;
    }

    const allowed = allowedFeatures.includes(featureName);
    console.log(`[Sidebar] Feature ${featureName} (${featureId}): ${allowed ? 'ALLOWED' : 'DENIED'}`);
    
    return allowed;
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
        onClick={() => onItemClick(item.id)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors text-sm",
          isActive 
            ? "bg-green-100 text-green-800 font-medium" 
            : "text-gray-700 hover:bg-gray-100",
        )}
      >
        <Icon className="w-4 h-4 flex-shrink-0" />
        <span className="flex-1">{item.label}</span>
      </button>
    );
  };

  const renderGroup = (group: any) => {
    const visibleItems = group.items.filter((item: MenuItem) => isFeatureAllowed(item.id));
    
    if (visibleItems.length === 0) {
      return null;
    }

    return (
      <div key={group.label} className="mb-6">
        <div className="px-3 mb-2">
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
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center">
            <Recycle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">ReciclaÊ</h1>
            <p className="text-xs text-gray-500">Sistema de Gestão</p>
          </div>
        </div>
      </div>
      
      <nav className="flex-1 p-4 overflow-y-auto">
        {menuGroups.map(renderGroup)}
      </nav>
    </div>
  );
}
