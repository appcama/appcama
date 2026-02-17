

## Plano: Corrigir filtro de entidade na funcao RPC do Dashboard

### Problema identificado
A funcao `get_dashboard_data` filtra coletas por `c.id_entidade_geradora = p_entidade_id`. Porem, quando o usuario seleciona "CAMAPET" no filtro de entidade, ele quer ver as coletas **realizadas** pela CAMAPET (onde usuarios da CAMAPET sao os criadores), nao as coletas onde CAMAPET e a entidade geradora dos residuos.

### Dados confirmados no banco
| Filtro | Coletas | Total (kg) |
|--------|---------|-----------|
| CAMAPET como entidade **geradora** (`id_entidade_geradora = 82`) | 12 | 82,30 |
| CAMAPET como entidade **coletora** (usuarios com `id_entidade = 82`) | 3.249 | 13.531,33 |

O Dashboard mostra 82,30 kg porque usa o filtro errado.

### Solucao
Alterar a funcao RPC `get_dashboard_data` para que o parametro `p_entidade_id` filtre por usuarios da entidade (coletora), nao pela entidade geradora.

A clausula atual:
```text
AND (p_entidade_id IS NULL OR c.id_entidade_geradora = p_entidade_id)
```

Sera alterada para:
```text
AND (p_entidade_id IS NULL OR c.id_usuario_criador IN (
  SELECT u.id_usuario FROM usuario u 
  WHERE u.id_entidade = p_entidade_id AND u.des_status = 'A'
))
```

Essa mesma alteracao sera aplicada nas duas sub-queries da funcao (residuos e indicadores).

### Arquivos a modificar

| Arquivo | Alteracao |
|---------|-----------|
| Migration SQL (nova) | Atualizar funcao `get_dashboard_data` com filtro por entidade coletora |

Nenhum arquivo TypeScript precisa ser alterado, pois o parametro `p_entidade_id` ja e passado corretamente pelo frontend. Apenas a logica SQL precisa mudar.

### Impacto
- O filtro "Entidade" no Dashboard passara a mostrar coletas realizadas por usuarios daquela entidade
- O filtro "Tipo de Entidade" ja filtra por `id_entidade_geradora` e permanecera como esta (filtra geradores por tipo)
- Os totais do Reciclometro e Ecoindicadores serao corrigidos automaticamente
