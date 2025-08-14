
/**
 * Mapa entre ids dos itens do layout e o nome da funcionalidade
 * conforme armazenado na tabela public.funcionalidade.nom_funcionalidade
 */
export const idToFeatureMap: Record<string, string> = {
  dashboard: "Dashboard",
  "cooperativas-catadores": "Cooperativas/Catadores",
  entidades: "Entidades",
  "pontos-coleta": "Pontos de Coleta",
  "eventos-coleta": "Eventos de Coleta",
  "geradores-residuos": "Geradores de Resíduos",
  "recebimento-residuos": "Recebimento de Resíduos",
  "tipos-ponto-coleta": "Tipos de Ponto de Coleta",
  "tipos-entidades": "Tipos de Entidades",
  "tipos-residuos": "Tipos de Resíduos",
  ecoindicadores: "Ecoindicadores",
  relatorios: "Relatórios",
  reciclometro: "Reciclômetro",
  perfis: "Perfis",
  usuarios: "Usuários",
  funcionalidades: "Perfis",
  configuracoes: "Configurações",
  ajuda: "Ajuda",
};

export function featureByItemId(itemId: string): string | undefined {
  return idToFeatureMap[itemId];
}
