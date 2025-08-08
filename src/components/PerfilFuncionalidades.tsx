
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { usePermissions } from "@/hooks/usePermissions";

type Perfil = {
  id_perfil: number;
  nom_perfil: string | null;
  des_status: string;
};

type Funcionalidade = {
  id_funcionalidade: number;
  nom_funcionalidade: string | null;
  des_status: string;
};

export function PerfilFuncionalidades() {
  const { toast } = useToast();
  const { isAllowed } = usePermissions();

  const [perfis, setPerfis] = useState<Perfil[]>([]);
  const [funcionalidades, setFuncionalidades] = useState<Funcionalidade[]>([]);
  const [selectedPerfil, setSelectedPerfil] = useState<number | null>(null);
  const [linkedSet, setLinkedSet] = useState<Set<number>>(new Set());
  const [originalSet, setOriginalSet] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);

  const canManage = isAllowed("Perfis");

  const loadPerfis = async () => {
    const { data, error } = await supabase
      .from("perfil")
      .select("id_perfil, nom_perfil, des_status")
      .order("nom_perfil", { ascending: true });
    if (error) {
      console.error("[PerfilFuncionalidades] Error loading perfis:", error);
      return;
    }
    setPerfis(data || []);
  };

  const loadFuncionalidades = async () => {
    const { data, error } = await supabase
      .from("funcionalidade")
      .select("id_funcionalidade, nom_funcionalidade, des_status")
      .order("nom_funcionalidade", { ascending: true });
    if (error) {
      console.error("[PerfilFuncionalidades] Error loading funcionalidades:", error);
      return;
    }
    setFuncionalidades(data || []);
  };

  const loadLinks = async (perfilId: number) => {
    const { data, error } = await supabase
      .from("perfil__funcionalidade")
      .select("id_funcionalidade")
      .eq("id_perfil", perfilId);
    if (error) {
      console.error("[PerfilFuncionalidades] Error loading links:", error);
      setLinkedSet(new Set());
      setOriginalSet(new Set());
      return;
    }
    const ids = new Set((data || []).map((r: any) => r.id_funcionalidade as number));
    setLinkedSet(new Set(ids));
    setOriginalSet(new Set(ids));
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      await Promise.all([loadPerfis(), loadFuncionalidades()]);
      setLoading(false);
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (selectedPerfil != null) {
      void loadLinks(selectedPerfil);
    } else {
      setLinkedSet(new Set());
      setOriginalSet(new Set());
    }
  }, [selectedPerfil]);

  const toggleFuncionalidade = (id_funcionalidade: number) => {
    setLinkedSet(prev => {
      const next = new Set(prev);
      if (next.has(id_funcionalidade)) {
        next.delete(id_funcionalidade);
      } else {
        next.add(id_funcionalidade);
      }
      return next;
    });
  };

  const handleSalvar = async () => {
    if (selectedPerfil == null) return;
    setSaving(true);
    console.log("[PerfilFuncionalidades] Saving for perfil:", selectedPerfil);

    const toInsert = [...linkedSet].filter((id) => !originalSet.has(id));
    const toDelete = [...originalSet].filter((id) => !linkedSet.has(id));

    console.log("[PerfilFuncionalidades] toInsert:", toInsert, "toDelete:", toDelete);

    // Inserts
    if (toInsert.length > 0) {
      const insertRows = toInsert.map((id_funcionalidade) => ({
        id_perfil: selectedPerfil,
        id_funcionalidade,
      }));
      const { error: insertError } = await supabase
        .from("perfil__funcionalidade")
        .insert(insertRows);
      if (insertError) {
        console.error("[PerfilFuncionalidades] Insert error:", insertError);
        toast({
          title: "Erro ao salvar",
          description: "Falha ao adicionar funcionalidades ao perfil.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    // Deletes
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from("perfil__funcionalidade")
        .delete()
        .eq("id_perfil", selectedPerfil)
        .in("id_funcionalidade", toDelete);
      if (deleteError) {
        console.error("[PerfilFuncionalidades] Delete error:", deleteError);
        toast({
          title: "Erro ao salvar",
          description: "Falha ao remover funcionalidades do perfil.",
          variant: "destructive",
        });
        setSaving(false);
        return;
      }
    }

    setOriginalSet(new Set(linkedSet));
    setSaving(false);
    toast({
      title: "Permissões atualizadas",
      description: "As funcionalidades do perfil foram atualizadas com sucesso.",
    });
  };

  if (!canManage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Funcionalidades por Perfil</CardTitle>
          <CardDescription>Você não tem permissão para gerenciar funcionalidades.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Funcionalidades por Perfil</CardTitle>
            <CardDescription>Vincule módulos do sistema aos perfis de acesso.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setSelectedPerfil(null)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={saving || selectedPerfil == null}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Coluna perfis */}
              <div className="col-span-1">
                <h3 className="text-sm font-medium mb-2">Perfis</h3>
                <div className="rounded-md border">
                  {perfis.length === 0 ? (
                    <div className="p-4 text-sm text-muted-foreground">Nenhum perfil encontrado.</div>
                  ) : (
                    <ul className="divide-y">
                      {perfis.map((p) => (
                        <li key={p.id_perfil}>
                          <button
                            className={`w-full text-left px-4 py-2 hover:bg-accent ${selectedPerfil === p.id_perfil ? "bg-accent/60" : ""}`}
                            onClick={() => setSelectedPerfil(p.id_perfil)}
                          >
                            {p.nom_perfil || `Perfil #${p.id_perfil}`}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Coluna funcionalidades */}
              <div className="col-span-1 lg:col-span-2">
                <h3 className="text-sm font-medium mb-2">Funcionalidades</h3>
                {selectedPerfil == null ? (
                  <div className="p-4 rounded-md border text-sm text-muted-foreground">
                    Selecione um perfil à esquerda para gerenciar as funcionalidades.
                  </div>
                ) : (
                  <div className="rounded-md border divide-y">
                    {funcionalidades.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground">Nenhuma funcionalidade cadastrada.</div>
                    ) : (
                      funcionalidades.map((f) => (
                        <label
                          key={f.id_funcionalidade}
                          className="flex items-center justify-between px-4 py-3"
                        >
                          <span>{f.nom_funcionalidade || `Funcionalidade #${f.id_funcionalidade}`}</span>
                          <Checkbox
                            checked={linkedSet.has(f.id_funcionalidade)}
                            onCheckedChange={() => toggleFuncionalidade(f.id_funcionalidade)}
                          />
                        </label>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
