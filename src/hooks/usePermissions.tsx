
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

type PermissionsContextType = {
  allowedFeatures: string[];
  loading: boolean;
  refresh: () => Promise<void>;
  isAllowed: (featureName: string) => boolean;
};

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [allowedFeatures, setAllowedFeatures] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPermissions = useCallback(async () => {
    if (!user?.profileId) {
      setAllowedFeatures([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    console.log("[Permissions] Loading permissions for profile:", user.profileId);

    const { data, error } = await supabase
      .from("perfil__funcionalidade")
      .select("id_funcionalidade, funcionalidade:funcionalidade(nom_funcionalidade, des_status)")
      .eq("id_perfil", user.profileId);

    if (error) {
      console.error("[Permissions] Error loading permissions:", error);
      setAllowedFeatures([]);
      setLoading(false);
      return;
    }

    const names = (data || [])
      .map((row: any) => row.funcionalidade?.nom_funcionalidade as string)
      .filter((n: string | undefined) => !!n);

    console.log("[Permissions] Allowed features:", names);
    setAllowedFeatures(names);
    setLoading(false);
  }, [user?.profileId]);

  useEffect(() => {
    if (!authLoading) {
      void loadPermissions();
    }
  }, [authLoading, loadPermissions]);

  const isAllowed = useCallback(
    (featureName: string) => {
      // Se não houver usuário, nada é permitido
      if (!user) return false;

      // Caso não haja nenhuma permissão carregada, negar por padrão
      if (!allowedFeatures || allowedFeatures.length === 0) return false;

      return allowedFeatures.includes(featureName);
    },
    [allowedFeatures, user]
  );

  const contextValue = useMemo(
    () => ({
      allowedFeatures,
      loading,
      refresh: loadPermissions,
      isAllowed,
    }),
    [allowedFeatures, loading, loadPermissions, isAllowed]
  );

  return (
    <PermissionsContext.Provider value={contextValue}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const ctx = useContext(PermissionsContext);
  if (!ctx) {
    throw new Error("usePermissions deve ser usado dentro de um PermissionsProvider");
  }
  return ctx;
}
