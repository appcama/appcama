
import { useEffect, useMemo, useState } from "react";
import { Sidebar } from "./Sidebar";
import { Dashboard } from "./Dashboard";
import { EntidadesList } from "./EntidadesList";
import { EntidadeForm } from "./EntidadeForm";
import { TipoEntidadeList } from "./TipoEntidadeList";
import { TipoEntidadeForm } from "./TipoEntidadeForm";
import { TipoResiduoList } from "./TipoResiduoList";
import { TipoResiduoForm } from "./TipoResiduoForm";
import { PerfilList } from "./PerfilList";
import { PerfilForm } from "./PerfilForm";
import { UsuariosList } from "./UsuariosList";
import { UsuarioForm } from "./UsuarioForm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CooperativasCatadores } from './CooperativasCatadores';
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";
import { featureByItemId } from "@/lib/featureMap";
import { PerfilFuncionalidades } from "./PerfilFuncionalidades";

interface ReciclaSystemLayoutProps {
  children?: React.ReactNode;
}

interface PerfilFilter {
  id_perfil: number;
  nom_perfil: string;
}

export function ReciclaSystemLayout({ children }: ReciclaSystemLayoutProps) {
  const [activeItem, setActiveItem] = useState("dashboard");
  const [showEntidadeForm, setShowEntidadeForm] = useState(false);
  const [editingEntidade, setEditingEntidade] = useState(null);
  const [showTipoEntidadeForm, setShowTipoEntidadeForm] = useState(false);
  const [editingTipoEntidade, setEditingTipoEntidade] = useState(null);
  const [showTipoResiduoForm, setShowTipoResiduoForm] = useState(false);
  const [editingTipoResiduo, setEditingTipoResiduo] = useState(null);
  const [showPerfilForm, setShowPerfilForm] = useState(false);
  const [editingPerfil, setEditingPerfil] = useState(null);
  const [showUsuarioForm, setShowUsuarioForm] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState(null);
  const [perfilFilter, setPerfilFilter] = useState<PerfilFilter | null>(null);

  const { toast } = useToast();
  const { allowedFeatures, loading: permissionsLoading, isAllowed } = usePermissions();

  const handleViewUsersFromPerfil = (perfil: any) => {
    setPerfilFilter({
      id_perfil: perfil.id_perfil,
      nom_perfil: perfil.nom_perfil
    });
    setActiveItem("usuarios");
  };

  const handleClearPerfilFilter = () => {
    setPerfilFilter(null);
  };

  // Garante que o item ativo seja permitido; caso contrário, tenta fallback
  useEffect(() => {
    if (permissionsLoading) return;
    const currentFeature = featureByItemId(activeItem);
    if (currentFeature && !isAllowed(currentFeature)) {
      // tenta ir para dashboard se permitido
      if (isAllowed("Dashboard")) {
        setActiveItem("dashboard");
      } else {
        // encontra primeiro item permitido simples
        const candidates = [
          "entidades",
          "tipos-entidades",
          "tipos-residuos",
          "perfis",
          "usuarios",
        ];
        const found = candidates.find((id) => {
          const f = featureByItemId(id);
          return f ? isAllowed(f) : true;
        });
        if (found) {
          setActiveItem(found);
        }
      }
    }
  }, [permissionsLoading, allowedFeatures, activeItem, isAllowed]);

  const onProtectedItemClick = (id: string) => {
    const feature = featureByItemId(id);
    if (feature && !isAllowed(feature)) {
      toast({
        title: "Acesso negado",
        description: "Você não tem permissão para acessar este módulo.",
        variant: "destructive",
      });
      return;
    }
    setActiveItem(id);
  };

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
      case "tipos-residuos":
        if (showTipoResiduoForm) {
          return (
            <div className="p-6">
              <TipoResiduoForm
                onBack={() => {
                  setShowTipoResiduoForm(false);
                  setEditingTipoResiduo(null);
                }}
                onSuccess={() => {
                  setShowTipoResiduoForm(false);
                  setEditingTipoResiduo(null);
                  setActiveItem("dashboard");
                  setTimeout(() => setActiveItem("tipos-residuos"), 100);
                }}
                editingTipoResiduo={editingTipoResiduo}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <TipoResiduoList
              onAddNew={() => setShowTipoResiduoForm(true)}
              onEdit={(tipoResiduo) => {
                setEditingTipoResiduo(tipoResiduo);
                setShowTipoResiduoForm(true);
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
              onViewUsers={handleViewUsersFromPerfil}
            />
          </div>
        );
      case "usuarios":
        if (showUsuarioForm) {
          return (
            <div className="p-6">
              <UsuarioForm
                onBack={() => {
                  setShowUsuarioForm(false);
                  setEditingUsuario(null);
                }}
                onSuccess={() => {
                  setShowUsuarioForm(false);
                  setEditingUsuario(null);
                  setActiveItem("dashboard");
                  setTimeout(() => setActiveItem("usuarios"), 100);
                }}
                editingUsuario={editingUsuario}
              />
            </div>
          );
        }
        return (
          <div className="p-6">
            <UsuariosList
              onAddNew={() => setShowUsuarioForm(true)}
              onEdit={(usuario) => {
                setEditingUsuario(usuario);
                setShowUsuarioForm(true);
              }}
              perfilFilter={perfilFilter}
              onClearFilter={handleClearPerfilFilter}
            />
          </div>
        );
      case "pontos-coleta":
        return (
          <div className="p-6">
            <Card>
              <CardHeader>
                <CardTitle>Pontos de Coleta</CardTitle>
                <CardDescription>
                  Gestão dos pontos de coleta à reciclagem
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
      case "funcionalidades":
        return (
          <div className="p-6">
            <PerfilFuncionalidades />
          </div>
        );
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar
        activeItem={activeItem}
        onItemClick={onProtectedItemClick}
        allowedFeatures={allowedFeatures}
      />
      <main className="flex-1 overflow-y-auto">
        {children || renderContent()}
      </main>
    </div>
  );
}
