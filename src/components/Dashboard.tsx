import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  Calendar,
  Droplet,
  Factory,
  Leaf,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const statsCards = [
  {
    title: "Cooperativas Ativas",
    value: "45",
    description: "Cadastradas no sistema",
    change: "+8.2%",
    period: "este mês",
    icon: Building2,
    color: "text-recycle-green",
  },
  {
    title: "Catadores/as",
    value: "1,287",
    description: "Total de catadores",
    change: "+5.1%",
    period: "este mês",
    icon: Users,
    color: "text-eco-blue",
  },
  {
    title: "Eventos de Coleta",
    value: "23",
    description: "Eventos este mês",
    change: "+15.3%",
    period: "este mês",
    icon: Calendar,
    color: "text-eco-orange",
  },
  {
    title: "Geradores de Resíduo",
    value: "156",
    description: "Empresas cadastradas",
    change: "+3.8%",
    period: "este mês",
    icon: Factory,
    color: "text-earth-brown",
  },
];

const recentActivities = [
  {
    title: "Evento de Coleta - Zona Norte",
    description: "Agendado para amanhã",
    icon: Calendar,
    color: "text-eco-orange",
  },
  {
    title: "5 novos catadores cadastrados",
    description: "Esta semana",
    icon: Users,
    color: "text-eco-blue",
  },
  {
    title: "Nova cooperativa registrada",
    description: "Cooperativa Verde Vida",
    icon: Building2,
    color: "text-recycle-green",
  },
];

const environmentalImpact = [
  {
    value: "285",
    label: "Árvores preservadas",
    icon: Leaf,
    color: "bg-recycle-green-light text-recycle-green",
  },
  {
    value: "142,500L",
    label: "Água economizada",
    icon: Droplet,
    color: "bg-blue-100 text-eco-blue",
  },
  {
    value: "38.2t",
    label: "CO₂ não emitido",
    icon: Zap,
    color: "bg-orange-100 text-eco-orange",
  },
];

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema de controle de reciclagem
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <div className="flex items-center mt-2">
                  <Badge
                    variant="secondary"
                    className="text-xs bg-recycle-green-light text-recycle-green"
                  >
                    {stat.change} {stat.period}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Reciclômetro */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-recycle-green" />
              <CardTitle>Reciclômetro - Meta Mensal</CardTitle>
            </div>
            <CardDescription>
              Acompanhe o progresso da meta de reciclagem
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Progresso atual</span>
                <span className="text-2xl font-bold text-recycle-green">79%</span>
              </div>
              <Progress value={79} className="h-3" />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>47.5 toneladas</span>
                <span>Meta: 60 toneladas</span>
              </div>
              <div className="text-center p-4 bg-recycle-green-light rounded-lg">
                <p className="text-sm font-medium text-recycle-green">
                  Restam 12.5 toneladas
                </p>
                <p className="text-xs text-muted-foreground">
                  para atingir a meta mensal
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activities */}
        <Card>
          <CardHeader>
            <CardTitle>Resumo de Atividades</CardTitle>
            <CardDescription>Principais atividades recentes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => {
                const Icon = activity.icon;
                return (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <Icon className={`h-5 w-5 ${activity.color}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Environmental Impact */}
      <Card>
        <CardHeader>
          <CardTitle>Impacto Ambiental</CardTitle>
          <CardDescription>
            Ecoindicadores principais do mês atual
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {environmentalImpact.map((impact, index) => {
              const Icon = impact.icon;
              return (
                <div key={index} className={`p-6 rounded-lg ${impact.color}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-2xl font-bold">{impact.value}</p>
                      <p className="text-sm font-medium">{impact.label}</p>
                    </div>
                    <Icon className="h-8 w-8" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}