
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
  perfis: "Perfis",
  usuarios: "Usuários",
  geradores: "Geradores de Resíduos",
  recebimentos: "Recebimento de Resíduos",
  ecoindicadores: "Ecoindicadores",
  relatorios: "Relatórios",
  reciclometro: "Reciclômetro",
  configuracoes: "Configurações",
  ajuda: "Ajuda",
  // A tela de gerenciamento de funcionalidades será controlada pela permissão "Perfis"
  funcionalidades: "Perfis",
};

export function featureByItemId(itemId: string): string | undefined {
  return idToFeatureMap[itemId];
}
