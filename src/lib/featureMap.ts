
/**
 * Mapa entre ids dos itens do layout e o nome da funcionalidade
 * conforme armazenado na tabela public.funcionalidade.nom_funcionalidade
 */
export const idToFeatureMap: Record<string, string> = {
  dashboard: "Dashboard",
  entidades: "Entidades",
  "pontos-coleta": "Pontos de Coleta",
  "eventos-coleta": "Eventos de Coleta",
  "tipos-ponto-coleta": "Tipos de Ponto de Coleta",
  "tipos-entidades": "Tipos de Entidades",
  "tipos-residuos": "Tipos de Resíduos",
  residuos: "Resíduos",
  indicadores: "Indicadores",
  perfis: "Perfis",
  usuarios: "Usuários",
  funcionalidades: "Perfis", // Funcionalidades usa a mesma permissão de Perfis
  configuracoes: "Configurações",
  ajuda: "Ajuda",
  coletas: "Coletas", // Nova funcionalidade
};

export function featureByItemId(itemId: string): string | undefined {
  return idToFeatureMap[itemId];
}
