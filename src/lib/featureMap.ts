
// Mapeamento entre itens do menu e funcionalidades do sistema
const itemToFeatureMap: Record<string, string> = {
  'dashboard': 'DASHBOARD',
  'entidades': 'ENTIDADES',
  'pontos-coleta': 'PONTOS_COLETA',
  'eventos-coleta': 'EVENTOS_COLETA',
  'coletas-residuos': 'COLETAS_RESIDUOS',
  'tipos-entidades': 'TIPOS_ENTIDADES',
  'tipos-residuos': 'TIPOS_RESIDUOS',
  'perfis': 'PERFIS',
  'usuarios': 'USUARIOS',
  'funcionalidades': 'FUNCIONALIDADES',
  'geradores': 'GERADORES_RESIDUOS',
  'recebimentos': 'RECEBIMENTO_RESIDUOS',
  'ecoindicadores': 'ECOINDICADORES',
  'relatorios': 'RELATORIOS',
  'reciclometro': 'RECICLOMETRO',
  'configuracoes': 'CONFIGURACOES',
  'ajuda': 'AJUDA'
};

export function featureByItemId(itemId: string): string | undefined {
  return itemToFeatureMap[itemId];
}

export function itemsByFeature(featureName: string): string[] {
  return Object.entries(itemToFeatureMap)
    .filter(([_, feature]) => feature === featureName)
    .map(([itemId, _]) => itemId);
}
