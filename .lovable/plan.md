## Plano: Remover todos os console.log/info/debug/warn — manter apenas console.error

### Diagnóstico
- **371 chamadas `console.*`** em ~45 arquivos.
- Em produção, nada além de `console.error` deve aparecer.

### Estratégia (duas camadas)

**1. Rede de segurança no build (Vite/esbuild)**
Editar `vite.config.ts` para que o build de produção descarte automaticamente qualquer `console.log`, `console.info`, `console.debug`, `console.trace`, `console.warn` e `debugger` que sobrar — preservando `console.error`:

```ts
esbuild: {
  pure: mode === 'production'
    ? ['console.log', 'console.info', 'console.debug', 'console.trace', 'console.warn']
    : [],
  drop: mode === 'production' ? ['debugger'] : [],
},
```
Em desenvolvimento (`npm run dev` / `build:dev`) tudo continua funcionando normalmente.

**2. Limpeza explícita no código-fonte**
Mesmo com o strip do build, remover as chamadas no fonte para deixar o código limpo e evitar custo de avaliação de argumentos.

Regra aplicada arquivo por arquivo:
- Remover **toda** chamada `console.log`, `console.info`, `console.debug`, `console.trace`, `console.warn`.
- **Manter** todas as chamadas `console.error` (úteis para suporte/diagnóstico real, inclusive em produção).
- Se a remoção deixar um bloco `if` vazio, simplificar o bloco.

### Arquivos a editar
Todos os arquivos sob `src/` que contêm `console.*` (exceto `console.error`):

- `src/hooks/useAuth.tsx` (36)
- `src/components/ColetaForm.tsx` (33)
- `src/components/TipoResiduoForm.tsx` (26)
- `src/components/CertificadoList.tsx` (26)
- `src/components/EventoForm.tsx` (16)
- `src/components/ColetaList.tsx` (15)
- `src/hooks/usePermissions.tsx` (14)
- `src/components/UsuarioForm.tsx` (14)
- `src/components/PontosColetaForm.tsx` (13)
- `src/components/PontosColetaList.tsx` (12)
- `src/components/TipoResiduoList.tsx` (11)
- `src/lib/sw-registration.ts` (10)
- `src/components/ReciclaELayout.tsx` (9)
- `src/components/ColetaResiduoForm.tsx` (9)
- `src/hooks/useRelatorioExport.tsx` (7)
- `src/components/TipoPontoColetaList.tsx` (7)
- `src/components/PerfilFuncionalidades.tsx` (7)
- `src/components/IndicadorList.tsx` (7)
- `src/components/GerarCertificado.tsx` (7)
- `src/components/IndicadorForm.tsx` (6)
- `src/components/TipoEntidadeList.tsx` (5)
- `src/components/PWAUpdateBanner.tsx` (5)
- `src/components/EntidadeForm.tsx` (5)
- `src/components/UsuariosList.tsx` (4)
- `src/components/RelatorioViewer.tsx` (4)
- `src/components/PWAPrompt.tsx` (4)
- `src/components/EntidadesList.tsx` (4)
- `src/hooks/useRelatorioData.tsx` (3)
- `src/components/TipoEntidadeForm.tsx` (3)
- `src/components/TabelaPrecosForm.tsx` (3)
- `src/components/Sidebar.tsx` (3)
- `src/components/DashboardMap.tsx` (3)
- `src/components/TipoResiduoIndicadorForm.tsx` (2)
- `src/components/TabelaPrecosList.tsx` (2)
- `src/components/ResiduoList.tsx` (2)
- `src/components/PerfilList.tsx` (2)
- `src/components/MeusNumeros.tsx` (2)
- `src/components/EventosList.tsx` (2)
- `src/components/DashboardFilters.tsx` (2)
- demais arquivos com 1 ocorrência cada
- `src/test-tipo-entidade.ts` — arquivo solto de teste; será **removido**
- `vite.config.ts` — receberá o bloco `esbuild` acima

### Verificação após implementação
Rodar `rg "console\.(log|info|debug|trace|warn)" src/` e confirmar resultado vazio. Apenas `console.error` permanecerão no código.

### Fora de escopo
- Nenhuma alteração de lógica, UI ou comportamento.
- Sem integração com ferramenta externa de logs (Sentry/LogRocket) — posso propor depois se quiser.