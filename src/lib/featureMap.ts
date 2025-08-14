import {
  Home,
  Users,
  Building2,
  Settings,
  ListChecks,
  LucideIcon,
  Scale,
  Recycle,
  PackageCheck,
  MapPin,
} from "lucide-react";

export type FeatureConfig = {
  component: string;
  icon: LucideIcon;
  label: string;
};

export const featureMap: Record<string, FeatureConfig> = {
  Dashboard: {
    component: "Dashboard",
    icon: Home,
    label: "Dashboard",
  },
  Entidades: {
    component: "Entidades",
    icon: Building2,
    label: "Entidades",
  },
  "Tipos de Entidades": {
    component: "TiposDeEntidades",
    icon: ListChecks,
    label: "Tipos de Entidades",
  },
  "Tipos de Resíduos": {
    component: "TiposDeResiduos",
    icon: Recycle,
    label: "Tipos de Resíduos",
  },
  Perfis: {
    component: "Perfis",
    icon: Settings,
    label: "Perfis",
  },
  Usuários: {
    component: "Usuarios",
    icon: Users,
    label: "Usuários",
  },
  "Unidades de Medida": {
    component: "UnidadesDeMedida",
    icon: Scale,
    label: "Unidades de Medida",
  },
  "Status de Coleta": {
    component: "StatusDeColeta",
    icon: PackageCheck,
    label: "Status de Coleta",
  },
  "Tipos de Ponto de Coleta": {
    component: "TipoPontosColeta",
    icon: MapPin,
    label: "Tipos de Ponto de Coleta"
  },
};
