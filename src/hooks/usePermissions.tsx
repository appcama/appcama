
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
      console.log("[Permissions] No user or profileId, setting empty permissions");
      setAllowedFeatures([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    console.log("[Permissions] Loading permissions for profile:", user.profileId);

    // First, let's check if the profile exists and get its name
    const { data: profileData, error: profileError } = await supabase
      .from("perfil")
      .select("id_perfil, nom_perfil")
      .eq("id_perfil", user.profileId)
      .single();

    if (profileError) {
      console.error("[Permissions] Error loading profile:", profileError);
    } else {
      console.log("[Permissions] Profile found:", profileData);
    }

    // Now get the permissions
    const { data, error } = await supabase
      .from("perfil__funcionalidade")
      .select(`
        id_funcionalidade, 
        funcionalidade:funcionalidade!inner(
          id_funcionalidade,
          nom_funcionalidade, 
          des_status
        )
      `)
      .eq("id_perfil", user.profileId);

    if (error) {
      console.error("[Permissions] Error loading permissions:", error);
      setAllowedFeatures([]);
      setLoading(false);
      return;
    }

    console.log("[Permissions] Raw permission data:", data);

    const names = (data || [])
      .filter((row: any) => row.funcionalidade?.des_status === 'A') // Only active functionalities
      .map((row: any) => row.funcionalidade?.nom_funcionalidade as string)
      .filter((n: string | undefined) => !!n);

    console.log("[Permissions] Allowed features after filtering:", names);
    
    // Check specifically for "Indicadores" functionality
    const hasIndicadores = names.includes("Indicadores");
    console.log("[Permissions] Has Indicadores permission:", hasIndicadores);
    
    // For admin profile, let's add all available features if it's empty
    if (names.length === 0 && profileData?.nom_perfil?.toLowerCase().includes('admin')) {
      console.log("[Permissions] Admin profile detected with no permissions, loading all available features");
      
      const { data: allFeatures, error: allFeaturesError } = await supabase
        .from("funcionalidade")
        .select("nom_funcionalidade")
        .eq("des_status", "A");
        
      if (!allFeaturesError && allFeatures) {
        const allFeatureNames = allFeatures
          .map(f => f.nom_funcionalidade)
          .filter(n => !!n);
        console.log("[Permissions] Setting all features for admin:", allFeatureNames);
        setAllowedFeatures(allFeatureNames);
      } else {
        // Fallback: set basic features for admin
        const basicFeatures = [
          "Dashboard", 
          "Entidades", 
          "Tipos de Entidades", 
          "Tipos de Resíduos", 
          "Indicadores",
          "Perfis", 
          "Usuários"
        ];
        console.log("[Permissions] Setting basic features as fallback:", basicFeatures);
        setAllowedFeatures(basicFeatures);
      }
    } else {
      setAllowedFeatures(names);
    }
    
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
      if (!user) {
        console.log("[Permissions] No user, denying access to:", featureName);
        return false;
      }

      // Caso não haja nenhuma permissão carregada, negar por padrão
      if (!allowedFeatures || allowedFeatures.length === 0) {
        console.log("[Permissions] No features loaded, denying access to:", featureName);
        return false;
      }

      const allowed = allowedFeatures.includes(featureName);
      console.log(`[Permissions] Access to ${featureName}: ${allowed ? 'ALLOWED' : 'DENIED'}`);
      
      // Extra debug for Indicadores specifically
      if (featureName === "Indicadores") {
        console.log(`[Permissions] INDICADORES DEBUG - Available features:`, allowedFeatures);
        console.log(`[Permissions] INDICADORES DEBUG - Looking for: "${featureName}"`);
        console.log(`[Permissions] INDICADORES DEBUG - Found match:`, allowed);
      }
      
      return allowed;
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
