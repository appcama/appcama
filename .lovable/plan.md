

## Plano: Campo de Ponto de Coleta como Combobox com obrigatoriedade condicional

### Resumo
Transformar o campo "Ponto de Coleta" de um Select simples em um Combobox com filtro de busca (mesmo padrao dos campos Evento e Entidade Geradora). Quando um evento com pontos de coleta habilitados e associados for selecionado (`des_ponto_coleta = 'A'`), o campo torna-se obrigatorio e exibe apenas os pontos associados. Sem evento ou com evento sem pontos, comportamento atual e mantido.

### Alteracoes

**Arquivo: `src/components/ColetaForm.tsx`**

1. **Novo estado para controle do popover**:
   - Adicionar `openPontoColetaPopover` (boolean)
   - Adicionar `pontoColetaRequired` (boolean) - indica se o campo e obrigatorio baseado no evento selecionado

2. **Substituir Select por Popover + Command (Combobox)** no campo Ponto de Coleta:
   - Mesmo padrao visual dos outros dois campos (Evento e Entidade Geradora)
   - Input de busca filtra pontos de coleta pelo nome
   - Opcao "Nenhum ponto de coleta" para limpar selecao (visivel apenas quando nao obrigatorio)
   - Filtro customizado com `.includes()` (substring match)

3. **Obrigatoriedade condicional**:
   - Quando evento selecionado com `des_ponto_coleta = 'A'` (pontos associados habilitados): campo obrigatorio, label muda para "Ponto de Coleta *"
   - Quando evento sem pontos ou sem evento: campo opcional, label "Ponto de Coleta (Opcional)"
   - Setar `pontoColetaRequired = true` quando `des_ponto_coleta === 'A'` e houver pontos associados
   - Setar `pontoColetaRequired = false` ao limpar evento ou quando `des_ponto_coleta !== 'A'`

4. **Validacao no handleSubmit**:
   - Adicionar verificacao: se `pontoColetaRequired === true` e `formData.id_ponto_coleta` estiver vazio, exibir toast de erro e bloquear envio

5. **Logica existente mantida**:
   - Quando evento tem `des_ponto_coleta = 'A'`: filtra pontos para os associados (ja implementado)
   - Quando evento tem `des_ponto_coleta = 'D'`: desabilita campo (mantido via `pontoColetaDisabled`)
   - Sem evento: mostra todos os pontos de coleta (ja implementado)

### Secao Tecnica

Layout do combobox:

```text
Ponto de Coleta * (ou "Opcional" conforme contexto)
+-------------------------------------------+
| Buscar ponto de coleta...           [v]   |
+-------------------------------------------+
| Nenhum ponto de coleta (se opcional)      |
| Ponto ABC                                |
| Ponto DEF                                |
+-------------------------------------------+
```

Logica de obrigatoriedade:

```text
Evento selecionado com des_ponto_coleta = 'A':
  pontoColetaRequired = true
  pontoColetaDisabled = false
  pontosColeta = filtrados pelos associados

Evento selecionado com des_ponto_coleta = 'D':
  pontoColetaRequired = false
  pontoColetaDisabled = true
  pontosColeta = []

Sem evento:
  pontoColetaRequired = false
  pontoColetaDisabled = false
  pontosColeta = allPontosColeta
```

Validacao adicionada no `handleSubmit`:

```text
if (pontoColetaRequired && !formData.id_ponto_coleta) {
  toast error: "Selecione um ponto de coleta para este evento"
  return
}
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ColetaForm.tsx` | Adicionar estados `openPontoColetaPopover` e `pontoColetaRequired`; substituir Select por Combobox; adicionar validacao condicional no submit |

