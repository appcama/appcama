
import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  BarChart3,
  Building2,
  Calendar,
  ChevronLeft,
  FileText,
  HelpCircle,
  Home,
  Leaf,
  MapPin,
  Recycle,
  Settings,
  Trash2,
  TrendingUp,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { featureByItemId } from "@/lib/featureMap";

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
  allowedFeatures?: string[]; // novas permissões
}

const navigationItems = [
  {
    section: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "entidades", label: "Entidades", icon: Users },    
      { id: "pontos-coleta", label: "Pontos de Coleta", icon: MapPin },
      { id: "eventos-coleta", label: "Eventos de Coleta", icon: Calendar },
      { id: "tipos-entidades", label: "Tipos de Entidades", icon: Building2 },
      { id: "tipos-residuos", label: "Tipos de Resíduos", icon: Trash2 },
    ],
  },
  {
    section: "Segurança",
    items: [
      { id: "perfis", label: "Perfis", icon: Trash2 },
      { id: "usuarios", label: "Usuários", icon: Recycle },
      { id: "funcionalidades", label: "Funcionalidades", icon: Settings }, // novo item
    ],
  },
  {
    section: "Dados",
    items: [
      { id: "geradores", label: "Geradores de Resíduos", icon: Trash2 },
      { id: "recebimentos", label: "Recebimento de Resíduos", icon: Recycle },
      { id: "ecoindicadores", label: "Ecoindicadores", icon: Leaf },
    ],
  },
  {
    section: "Relatórios",
    items: [
      { id: "relatorios", label: "Relatórios", icon: FileText },
      { id: "reciclometro", label: "Reciclômetro", icon: TrendingUp },
    ],
  },
];

const bottomItems = [
  { id: "configuracoes", label: "Configurações", icon: Settings },
  { id: "ajuda", label: "Ajuda", icon: HelpCircle },
];

export function Sidebar({ activeItem, onItemClick, allowedFeatures }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const filterByPermissions = useMemo(() => {
    // Se allowedFeatures for undefined ou null, mostra tudo (ainda carregando)
    if (!allowedFeatures) {
      console.log("[Sidebar] Permissions still loading, showing all items");
      return (id: string) => true;
    }
    
    // Se for array vazio, esconde tudo (sem permissões)
    if (allowedFeatures.length === 0) {
      console.log("[Sidebar] No permissions loaded, hiding all items");
      return (id: string) => false;
    }
    
    return (id: string) => {
      const featureName = featureByItemId(id);
      if (!featureName) {
        console.log(`[Sidebar] No feature mapping for ${id}, keeping visible`);
        return true; // se não mapeado, mantém visível
      }
      
      const allowed = allowedFeatures.includes(featureName);
      console.log(`[Sidebar] Item ${id} (${featureName}): ${allowed ? 'visible' : 'hidden'}`);
      return allowed;
    };
  }, [allowedFeatures]);

  return (
    <div
      className={cn(
        "flex flex-col h-screen bg-background border-r border-border transition-all duration-300",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-recycle-green">
            ReciclaSystem
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          <ChevronLeft
            className={cn(
              "h-4 w-4 transition-transform",
              isCollapsed && "rotate-180"
            )}
          />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        {navigationItems.map((section) => (
          <div key={section.section} className="p-2">
            {!isCollapsed && (
              <h3 className="px-2 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {section.section}
              </h3>
            )}
            <div className="space-y-1">
              {section.items
                .filter((item) => filterByPermissions(item.id))
                .map((item) => {
                  const Icon = item.icon;
                  return (
                    <Button
                      key={item.id}
                      variant={activeItem === item.id ? "secondary" : "ghost"}
                      className={cn(
                        "w-full justify-start",
                        isCollapsed && "px-2",
                        activeItem === item.id && "bg-recycle-green-light border-l-2 border-recycle-green"
                      )}
                      onClick={() => onItemClick(item.id)}
                    >
                      <Icon className="h-4 w-4" />
                      {!isCollapsed && (
                        <span className="ml-2 text-sm">{item.label}</span>
                      )}
                    </Button>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom Section */}
      <div className="p-2 border-t border-border">
        {bottomItems
          .filter((item) => filterByPermissions(item.id))
          .map((item) => {
            const Icon = item.icon;
            return (
              <Button
                key={item.id}
                variant={activeItem === item.id ? "secondary" : "ghost"}
                className={cn(
                  "w-full justify-start mb-1",
                  isCollapsed && "px-2",
                  activeItem === item.id && "bg-recycle-green-light"
                )}
                onClick={() => onItemClick(item.id)}
              >
                <Icon className="h-4 w-4" />
                {!isCollapsed && (
                  <span className="ml-2 text-sm">{item.label}</span>
                )}
              </Button>
            );
          })}
      </div>
    </div>
  );
}
