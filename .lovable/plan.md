

## Plano: Remover funcionalidade offline do sistema

### Problema
A funcao de sincronizacao offline (IndexedDB + Dexie.js) esta causando erros constantes quando o sinal de celular cai e volta. O banco "ReciclaEOfflineDB" fica armazenado no navegador e a tentativa de sincronizar ao reconectar gera falhas.

### O que sera removido
1. **OfflineIndicator** - badge de Online/Offline e botao Sincronizar
2. **PWAOfflineBanner** - banner de status offline
3. **Hooks offline** - useOfflineSync, useOfflineForm, useOfflineQuery, useNetworkStatus
4. **Banco IndexedDB** - offline-db.ts (Dexie)
5. **Capacitor** - dependencias de mobile nativo (nao estao em uso real)

### O que sera mantido
- PWA (service worker para cache de arquivos estaticos)
- PWAPrompt e PWAUpdateBanner (instalacao do app)
- Toda a logica de formularios (submit direto ao Supabase)

### Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/App.tsx` | Remover import e uso do OfflineIndicator |
| `src/components/ReciclaELayout.tsx` | Remover imports e uso do OfflineIndicator e PWAOfflineBanner |
| `src/components/ColetaForm.tsx` | Substituir useOfflineForm por submit direto ao Supabase |
| `src/components/ColetaResiduoForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/EntidadeForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/ResiduoForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/TipoResiduoForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/TipoResiduoIndicadorForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/TipoEntidadeForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/PerfilForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/PontosColetaForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/UsuarioForm.tsx` | Substituir useOfflineForm por submit direto |
| `src/components/IndicadorForm.tsx` | Substituir useOfflineForm por submit direto |

### Arquivos a remover

| Arquivo |
|---------|
| `src/lib/offline-db.ts` |
| `src/hooks/useOfflineSync.tsx` |
| `src/hooks/useOfflineForm.tsx` |
| `src/hooks/useOfflineQuery.tsx` |
| `src/hooks/useNetworkStatus.tsx` |
| `src/components/OfflineIndicator.tsx` |
| `src/components/PWAOfflineBanner.tsx` |

### Como ficam os formularios

Cada formulario que usa `useOfflineForm` sera simplificado. Em vez do wrapper offline, usara um `useState` simples para `isSubmitting` e chamara o Supabase diretamente, como ja fazia na funcao `onlineSubmit` que ja existe dentro de cada componente.

Exemplo antes:
```text
const { submitForm, isSubmitting } = useOfflineForm({
  table: 'coleta',
  onlineSubmit: async (data) => { /* logica supabase */ }
});
```

Exemplo depois:
```text
const [isSubmitting, setIsSubmitting] = useState(false);
const handleSubmit = async (data) => {
  setIsSubmitting(true);
  try {
    /* mesma logica supabase que ja existia */
    toast({ title: "Sucesso", ... });
    onSuccess?.();
  } catch (error) {
    toast({ title: "Erro", variant: "destructive" });
  } finally {
    setIsSubmitting(false);
  }
};
```

### Impacto
- O sistema so funcionara com conexao ativa (comportamento padrao de apps web)
- Se o usuario tentar salvar sem internet, recebera um erro claro do Supabase
- Nenhuma funcionalidade de coleta ou cadastro sera perdida
- Os erros de sincronizacao serao eliminados completamente

