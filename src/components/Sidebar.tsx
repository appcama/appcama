import { useState } from "react";
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

interface SidebarProps {
  activeItem: string;
  onItemClick: (item: string) => void;
}

const navigationItems = [
  {
    section: "Principal",
    items: [
      { id: "dashboard", label: "Dashboard", icon: Home },
      { id: "entidades", label: "Cooperativas/Catadores", icon: Users },
      { id: "tipos-entidades", label: "Tipos de Entidades", icon: Building2 },
      { id: "centrais-apoio", label: "Centrais de Apoio", icon: MapPin },
      { id: "eventos-coleta", label: "Eventos de Coleta", icon: Calendar },
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

export function Sidebar({ activeItem, onItemClick }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

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
              {section.items.map((item) => {
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
        {bottomItems.map((item) => {
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