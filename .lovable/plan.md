

## Plano: Campo de Evento como primeiro campo com filtro de busca

### Resumo
Mover o campo "Evento" para ser o primeiro dos 3 campos opcionais na tela de Coleta e transformar o Select simples em um campo com filtro de busca por nome do evento. As regras de visibilidade (eventos publicos/privados com controle de acesso) ja estao implementadas pelo hook `useEventosVisiveis` e serao mantidas.

### Alteracoes

**Arquivo: `src/components/ColetaForm.tsx`**

1. **Reordenar campos** (linhas ~764-876):
   - Ordem atual: Ponto de Coleta > Entidade Geradora > Evento
   - Ordem nova: **Evento** > Ponto de Coleta > Entidade Geradora

2. **Substituir Select por Popover + Command (Combobox)** no campo Evento:
   - Usar os componentes `Popover`, `Command`, `CommandInput`, `CommandList`, `CommandEmpty`, `CommandItem` (ja disponiveis no projeto via cmdk)
   - O campo tera um input de busca que filtra eventos pelo nome
   - Ao digitar, a lista de eventos e filtrada em tempo real
   - Ao selecionar, o popover fecha e o valor e preenchido
   - Manter toda a logica existente de `onValueChange` (carregar pontos de coleta e tabela de precos do evento)

3. **Importar componentes necessarios**:
   - Adicionar imports de `Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandGroup` de `@/components/ui/command`
   - Adicionar import de `Check, ChevronsUpDown` de `lucide-react`

### Secao Tecnica

O componente Combobox seguira este padrao:

```text
Evento (Opcional)
+-------------------------------------------+
| Buscar evento...                    [v]   |
+-------------------------------------------+
| Evento ABC                               |
| Evento DEF                               |
| Evento GHI                               |
+-------------------------------------------+
```

A logica de visibilidade dos eventos permanece inalterada - o hook `useEventosVisiveis` ja filtra:
- Eventos publicos ativos para todos
- Eventos privados apenas para entidades autorizadas
- Apenas eventos vigentes (dat_termino >= hoje)

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ColetaForm.tsx` | Reordenar campos; substituir Select do evento por Combobox com filtro de busca |

