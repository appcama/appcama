

## Plano: Corrigir limite de 1000 registros no Meus Numeros

### Problema identificado
O Supabase JS client retorna no maximo 1000 linhas por consulta (limite padrao). A tela "Meus Numeros" da CAMAPET tem 1.374 coletas no periodo, mas so as primeiras 1.000 sao buscadas. Isso causa totais incorretos e ate situacoes onde filtrar por evento mostra um valor MAIOR que sem filtro.

### Dados reais no banco
- Sem filtro: 1.374 coletas = 6.348,86 kg (sistema mostra apenas 3.657,76 por truncamento)
- Com filtro Eco Folia Solidaria: 1.267 coletas = 5.927,12 kg (sistema mostra 3.729,98)

### Solucao
Criar uma funcao auxiliar `fetchAllIds` que pagina a consulta de IDs de coleta para buscar TODOS os registros, nao apenas os primeiros 1000.

A mesma correcao sera aplicada tanto no `useMyDashboardData` (Meus Numeros) quanto no `useDashboardData` (Dashboard principal), pois ambos sofrem do mesmo problema.

### Implementacao

**Arquivo: `src/hooks/useMyDashboardData.tsx`**
1. Criar funcao `fetchAllColetaIds()` que:
   - Faz a consulta com `.range(offset, offset + 999)` em loop
   - Acumula todos os IDs ate nao haver mais resultados
   - Retorna o array completo de IDs
2. Substituir a consulta simples de IDs pela chamada dessa funcao
3. Aplicar a mesma logica na segunda consulta (`coleta_residuo`) que tambem pode ultrapassar 1000 registros
4. Aplicar a mesma logica na consulta de `coleta_residuo_indicador`

**Arquivo: `src/hooks/useDashboardData.tsx`**
1. Aplicar a mesma correcao de paginacao nas consultas de coleta IDs, coleta_residuo e coleta_residuo_indicador

### Detalhes Tecnicos

Funcao de paginacao:

```text
fetchAllRows(query):
  allRows = []
  offset = 0
  pageSize = 1000
  loop:
    result = query.range(offset, offset + pageSize - 1)
    allRows += result.data
    if result.data.length < pageSize: break
    offset += pageSize
  return allRows
```

Como o Supabase nao permite reusar um query builder apos execucao, a funcao recebera os parametros e reconstruira a query a cada pagina.

As consultas de `coleta_residuo` e `coleta_residuo_indicador` tambem precisam de paginacao porque com 1000+ coletas, facilmente ultrapassam 1000 linhas de residuos.

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `src/hooks/useMyDashboardData.tsx` | Adicionar paginacao em todas as consultas |
| `src/hooks/useDashboardData.tsx` | Adicionar paginacao em todas as consultas |

