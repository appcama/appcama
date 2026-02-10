

## Plano: Pontos de Coleta associados a Eventos

### Resumo
Adicionar a funcionalidade de associar pontos de coleta a eventos. No formulário de evento, um botao tipo switch (igual ao "Evento Publico") permitira habilitar pontos de coleta. Quando habilitado, sera possivel selecionar os pontos. No formulario de coleta, se o evento selecionado tiver pontos associados, o campo ponto de coleta mostrara apenas esses pontos; se nao tiver, o campo sera desabilitado ou mostrara todos os pontos normalmente.

### 1. Migracao de Banco de Dados

**Adicionar coluna na tabela `evento`:**
```sql
ALTER TABLE evento ADD COLUMN des_ponto_coleta character(1) NOT NULL DEFAULT 'D';
```
- `'A'` = Evento possui pontos de coleta
- `'D'` = Evento nao possui pontos de coleta

**Criar tabela `evento_ponto_coleta`:**
```sql
CREATE TABLE evento_ponto_coleta (
  id_evento_ponto_coleta SERIAL PRIMARY KEY,
  id_evento INTEGER NOT NULL REFERENCES evento(id_evento),
  id_ponto_coleta INTEGER NOT NULL REFERENCES ponto_coleta(id_ponto_coleta),
  id_usuario_criador INTEGER NOT NULL,
  dat_criacao TIMESTAMP NOT NULL DEFAULT now(),
  UNIQUE(id_evento, id_ponto_coleta)
);

ALTER TABLE evento_ponto_coleta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read evento_ponto_coleta" ON evento_ponto_coleta FOR SELECT USING (true);
CREATE POLICY "Allow authenticated users to insert evento_ponto_coleta" ON evento_ponto_coleta FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow authenticated users to delete evento_ponto_coleta" ON evento_ponto_coleta FOR DELETE USING (true);
```

### 2. Atualizar `src/integrations/supabase/types.ts`

Adicionar os tipos da nova tabela `evento_ponto_coleta` e a nova coluna `des_ponto_coleta` na tabela `evento`.

### 3. Modificar `src/components/EventoForm.tsx`

**Novos estados:**
- `pontosColetaEnabled` (boolean) - switch ligado/desligado
- `pontosColeta` (array) - lista de pontos disponiveis
- `selectedPontosColeta` (array) - pontos selecionados
- `loadingPontos` (boolean)

**Nova secao no formulario** (abaixo do switch de visibilidade, acima do logo):
- Switch "Pontos de Coleta para Entrega" com icone MapPin
- Descricao: "Definir pontos de coleta especificos para entrega de residuos neste evento"
- Quando ativado, exibe Select para adicionar pontos + badges dos selecionados (mesmo padrao do Controle de Acesso)

**Regras de filtragem de pontos:**
- Se evento privado: apenas pontos cuja `id_entidade_gestora` seja a entidade criadora OU esteja na lista de `selectedEntidades` (controle de acesso)
- Apenas pontos com `des_status = 'A'`
- Cada ponto so pode ser adicionado uma vez (enforced pela constraint UNIQUE)

**No save (create/update):**
- Salvar `des_ponto_coleta` ('A' ou 'D') no evento
- Chamar nova funcao `saveEventoPontosColeta` para gerenciar a tabela `evento_ponto_coleta`

**No load (edicao):**
- Carregar `des_ponto_coleta` e setar o switch
- Carregar pontos associados da tabela `evento_ponto_coleta`

### 4. Modificar `src/components/ColetaForm.tsx`

**Ao selecionar um evento:**
- Buscar na tabela `evento` o campo `des_ponto_coleta`
- Se `des_ponto_coleta === 'A'`: buscar pontos da tabela `evento_ponto_coleta` e filtrar o select de pontos de coleta para mostrar apenas esses
- Se `des_ponto_coleta === 'D'`: desabilitar o campo ponto de coleta (limpar valor selecionado)
- Se nenhum evento selecionado: mostrar todos os pontos normalmente (comportamento atual)

**Logica de `onValueChange` do evento:**
```typescript
const handleEventoChange = async (eventoId: string) => {
  setFormData(prev => ({ ...prev, id_evento: eventoId, id_ponto_coleta: '' }));
  
  if (!eventoId) {
    // Sem evento: todos os pontos disponiveis
    setPontosColeta(allPontosColeta);
    setPontoColetaDisabled(false);
    return;
  }
  
  // Buscar config do evento
  const { data: evento } = await supabase
    .from('evento')
    .select('des_ponto_coleta')
    .eq('id_evento', parseInt(eventoId))
    .single();
    
  if (evento?.des_ponto_coleta === 'A') {
    // Evento com pontos: filtrar
    const { data: eventoPontos } = await supabase
      .from('evento_ponto_coleta')
      .select('id_ponto_coleta')
      .eq('id_evento', parseInt(eventoId));
    
    const pontosIds = new Set(eventoPontos?.map(p => p.id_ponto_coleta));
    setPontosColeta(allPontosColeta.filter(p => pontosIds.has(p.id_ponto_coleta)));
    setPontoColetaDisabled(false);
  } else {
    // Evento sem pontos: desabilitar campo
    setPontoColetaDisabled(true);
  }
};
```

### 5. Interface do Switch no EventoForm

O switch de Pontos de Coleta seguira o mesmo padrao visual do "Evento Publico":

```text
+--------------------------------------------------+
| [MapPin icon]  Pontos de Coleta para Entrega     [toggle] |
|   Definir pontos especificos para entrega         |
+--------------------------------------------------+
```

Quando ativado, aparece abaixo:
```text
+--------------------------------------------------+
| Pontos de Coleta                         2/sem limite |
|                                                  |
| [Select: Adicionar ponto de coleta...]           |
|                                                  |
| [Ponto A  x] [Ponto B  x]                       |
+--------------------------------------------------+
```

### 6. Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| Nova migracao SQL | Criar tabela `evento_ponto_coleta` + coluna `des_ponto_coleta` |
| `supabase types` | Adicionar tipos da nova tabela |
| `EventoForm.tsx` | Adicionar switch + selecao de pontos de coleta |
| `ColetaForm.tsx` | Filtrar/desabilitar pontos conforme evento selecionado |

### 7. Consideracoes

- Pontos de coleta podem ser desativados a qualquer momento independente da associacao ao evento
- A constraint UNIQUE(id_evento, id_ponto_coleta) garante que cada ponto so aparece uma vez por evento
- O campo nao e obrigatorio - o switch inicia desligado por padrao
- Ao desligar o switch, os pontos associados sao removidos

