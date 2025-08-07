import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { EntidadesList } from "./EntidadesList";
import { EntidadeForm } from "./EntidadeForm";
import { TipoEntidadeList } from "./TipoEntidadeList";
import { TipoEntidadeForm } from "./TipoEntidadeForm";
import { PerfilList } from "./PerfilList";
import { PerfilForm } from "./PerfilForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CooperativasCatadores } from './CooperativasCatadores';

interface ReciclaSystemLayoutProps {
  children?: React.ReactNode;
}

export function ReciclaSystemLayout({ children }: ReciclaSystemLayoutProps) {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [showEntidadeForm, setShowEntidadeForm] = useState(false);
  const [editingEntidade, setEditingEntidade] = useState(null);
  const [showTipoEntidadeForm, setShowTipoEntidadeForm] = useState(false);
  const [editingTipoEntidade, setEditingTipoEntidade] = useState(null);
  const [showPerfilForm, setShowPerfilForm] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState(null);

  const renderContent = () => {
    switch (activeItem) {
      case "dashboard":
        return <Dashboard />;
      case "entidades":
        if (showEntidadeForm) {
          return (
            <div className="p-6">
              <EntidadeForm
                onBack={() => {
                  setShowEntidadeForm(false);
                  setEditingEntidade(null);
                }}
                onSuccess={() => {
                  setShowEntidadeForm(false);
                  setEditingEntidade(null);
                  // Forçar refresh da lista
                  setActiveItem("dashboard");
                  setTimeout(() => setActiveItem("entidades"), 100);
                }}
                editingEntidade={editingEntidade}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <EntidadesList
              onAddNew={() => setShowEntidadeForm(true)}
              onEdit={(entidade) => {
                setEditingEntidade(entidade);
                setShowEntidadeForm(true);
              }}
            />
          </div>
        );
      case "tipos-entidades":
        if (showTipoEntidadeForm) {
          return (
            <div className="p-6">
              <TipoEntidadeForm
                onBack={() => {
                  setShowTipoEntidadeForm(false);
                  setEditingTipoEntidade(null);
                }}
                onSuccess={() => {
                  setShowTipoEntidadeForm(false);
                  setEditingTipoEntidade(null);
                  // Forçar refresh da lista
                  setActiveItem("dashboard");
                  setTimeout(() => setActiveItem("tipos-entidades"), 100);
                }}
                editingTipoEntidade={editingTipoEntidade}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <TipoEntidadeList
              onAddNew={() => setShowTipoEntidadeForm(true)}
              onEdit={(tipoEntidade) => {
                setEditingTipoEntidade(tipoEntidade);
                setShowTipoEntidadeForm(true);
              }}
            />
          </div>
        );
      case "perfis":
        if (showPerfilForm) {
          return (
            <div className="p-6">
              <PerfilForm
                onBack={() => {
                  setShowPerfilForm(false);
                  setEditingPerfil(null);
                }}
                onSuccess={() => {
                  setShowPerfilForm(false);
                  setEditingPerfil(null);
                  // Forçar refresh da lista
                  setActiveItem("dashboard");
                  setTimeout(() => setActiveItem("perfis"), 100);
                }}
                editingPerfil={editingPerfil}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <PerfilList
              onAddNew={() => setShowPerfilForm(true)}
              onEdit={(perfil) => {
                setEditingPerfil(perfil);
                setShowPerfilForm(true);
              }}
            />
          </div>
        );
      case "centrais-apoio":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Centrais de Apoio</CardTitle>
                <CardDescription>
                  Gestão das centrais de apoio à reciclagem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "eventos-coleta":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Eventos de Coleta</CardTitle>
                <CardDescription>
                  Agendamento e controle de eventos de coleta
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "usuarios":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Usuários</CardTitle>
                <CardDescription>
                  Cadastre e administre os usuários com acesso ao sistema.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "geradores":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Geradores de Resíduos</CardTitle>
                <CardDescription>
                  Cadastro e gestão de empresas geradoras de resíduos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "recebimentos":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Recebimento de Resíduos</CardTitle>
                <CardDescription>
                  Controle de recebimento e processamento de resíduos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "ecoindicadores":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Ecoindicadores</CardTitle>
                <CardDescription>
                  Métricas e indicadores de impacto ambiental
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "relatorios":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Relatórios</CardTitle>
                <CardDescription>
                  Geração de relatórios do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "reciclometro":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Reciclômetro</CardTitle>
                <CardDescription>
                  Medição e acompanhamento de metas de reciclagem
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "configuracoes":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Configurações</CardTitle>
                <CardDescription>
                  Configurações gerais do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      case "ajuda":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Ajuda</CardTitle>
                <CardDescription>
                  Documentação e suporte do sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Funcionalidade em desenvolvimento...
                </p>
              </CardContent>
            </Card>
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar activeItem={activeItem} onItemClick={setActiveItem} />
      <main className="flex-1 overflow-y-auto">
        {children || renderContent()}
      </main>
    </div>
  );
}
