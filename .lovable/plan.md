

## Plano: Campo de Entidade Geradora com filtro de busca e filtragem por evento

### Resumo
Transformar o campo "Entidade Geradora" de um Select simples em um Combobox com filtro de busca (mesmo padrao do campo Evento). Quando um evento for selecionado, filtrar as entidades geradoras exibindo apenas as associadas ao evento via tabela `evento_entidade`. Sem evento selecionado, todas as entidades geradoras ficam disponiveis.

### Alteracoes

**Arquivo: `src/components/ColetaForm.tsx`**

1. **Novo estado para controle do popover e entidades completas**:
   - Adicionar `openEntidadePopover` (boolean) para controlar abertura/fechamento do combobox
   - Adicionar `allEntidades` para guardar todas as entidades geradoras carregadas (similar a `allPontosColeta`)

2. **Substituir Select por Popover + Command (Combobox)** no campo Entidade Geradora:
   - Mesmo padrao visual ja usado no campo Evento
   - Input de busca filtra entidades pelo nome em tempo real
   - Opcao "Nenhuma entidade" para limpar selecao
   - Ao selecionar, popover fecha e valor e preenchido

3. **Filtragem por evento selecionado**:
   - Quando um evento e selecionado (no `onSelect` do evento), buscar entidades associadas na tabela `evento_entidade`
   - Se o evento tiver entidades associadas, filtrar a lista de entidades geradoras para mostrar apenas essas
   - Se o evento nao tiver entidades associadas (ou for evento publico sem restricao), manter todas as entidades disponiveis
   - Quando o evento for desmarcado ("Nenhum evento"), restaurar todas as entidades geradoras
   - Limpar a selecao de entidade geradora quando o evento mudar (para evitar inconsistencia)

4. **Logica no `onSelect` do evento** (ja existente, sera expandida):
   - Alem de carregar pontos de coleta e tabela de precos, tambem carregar entidades associadas ao evento
   - Query: `supabase.from('evento_entidade').select('id_entidade').eq('id_evento', eventoId)`
   - Se houver entidades associadas, filtrar `entidades` para incluir apenas as que estao no resultado
   - Se nao houver, manter `allEntidades`

5. **No clear do evento** (opcao "Nenhum evento"):
   - Restaurar `entidades` para `allEntidades`
   - Limpar `id_entidade_geradora` do formData

### Secao Tecnica

O combobox da Entidade Geradora seguira o mesmo padrao do Evento:

```text
Entidade Geradora (Opcional)
+-------------------------------------------+
| Buscar entidade geradora...         [v]   |
+-------------------------------------------+
| Nenhuma entidade                          |
| Entidade ABC                              |
| Entidade DEF                              |
| Entidade GHI                              |
+-------------------------------------------+
```

Fluxo de filtragem por evento:

```text
Sem evento selecionado:
  entidades = allEntidades (todas as geradoras ativas)

Com evento selecionado:
  1. Buscar evento_entidade WHERE id_evento = X
  2. Se houver registros: entidades = allEntidades filtradas pelos ids retornados
  3. Se nao houver registros: entidades = allEntidades (sem restricao)
  4. Limpar id_entidade_geradora do formData
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ColetaForm.tsx` | Adicionar estados `openEntidadePopover` e `allEntidades`; substituir Select por Combobox; adicionar filtragem de entidades ao selecionar evento |

