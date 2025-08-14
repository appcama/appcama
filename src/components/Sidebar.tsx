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

  const menuItems: MenuItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      id: "cooperativas-catadores",
      label: "Cooperativas/Catadores",
      icon: Users,
    },
    {
      id: "cadastros",
      label: "Cadastros",
      icon: Building2,
      children: [
        { id: "entidades", label: "Entidades", icon: Building2 },
        { id: "pontos-coleta", label: "Pontos de Coleta", icon: MapPin },
        { id: "tipos-ponto-coleta", label: "Tipos Ponto Coleta", icon: MapPin },
        { id: "tipos-entidades", label: "Tipos de Entidades", icon: Building2 },
        { id: "tipos-residuos", label: "Tipos de Resíduos", icon: Trash2 },
      ]
    },
    {
      id: "eventos-coleta",
      label: "Eventos de Coleta",
      icon: Calendar,
    },
    {
      id: "geradores-residuos",
      label: "Geradores de Resíduos",
      icon: Building2,
    },
    {
      id: "recebimento-residuos",
      label: "Recebimento de Resíduos",
      icon: Trash2,
    },
    {
      id: "ecoindicadores",
      label: "Ecoindicadores",
      icon: BarChart3,
    },
    {
      id: "relatorios",
      label: "Relatórios",
      icon: FileText,
    },
    {
      id: "reciclometro",
      label: "Reciclômetro",
      icon: Recycle,
    },
    {
      id: "administracao",
      label: "Administração",
      icon: Shield,
      children: [
        { id: "perfis", label: "Perfis", icon: UserCheck },
        { id: "funcionalidades", label: "Funcionalidades", icon: Shield },
        { id: "usuarios", label: "Usuários", icon: Users },
      ]
    },
    {
      id: "configuracoes",
      label: "Configurações",
      icon: Settings,
    },
  ];

  const isFeatureAllowed = (featureId: string) => {
    return allowedFeatures.includes(featureId);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!isFeatureAllowed(item.id)) {
      return null;
    }

    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const isActive = activeItem === item.id;
    const Icon = item.icon;

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onItemClick(item.id);
            }
          }}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors",
            level > 0 && "ml-4 text-sm",
            isActive 
              ? "bg-green-100 text-green-800 font-medium" 
              : "text-gray-700 hover:bg-gray-100",
          )}
        >
          <Icon className="w-5 h-5 flex-shrink-0" />
          <span className="flex-1">{item.label}</span>
          {hasChildren && (
            isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )
          )}
        </button>
        
        {hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
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
      
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
}
