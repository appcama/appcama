

## Plano: Campo identificador de custo de coleta com radio button e impacto no formulario de residuos

### Resumo
Adicionar um radio button "Coleta com Custo" / "Coleta sem Custo" no formulario de coleta. Quando marcado "com custo", a entidade geradora torna-se obrigatoria e o formulario de residuos ganha um campo adicional "Valor Unitario de Custo". A grid de residuos exibira colunas extras de custo. O valor sera salvo na tabela `coleta_residuo` no campo `vlr_custo`.

### Pre-requisito: Migracao de banco de dados

Antes da implementacao, sera necessario:

1. **Tabela `coleta`**: Adicionar coluna `des_custo char(1) NOT NULL DEFAULT 'D'`
   - `'D'` = sem custo (default)
   - `'A'` = com custo

2. **Tabela `coleta_residuo`**: Adicionar coluna `vlr_custo numeric(10,2) NULL`

### Alteracoes no codigo

**Arquivo: `src/components/ColetaForm.tsx`**

1. **Importar RadioGroup e RadioGroupItem** de `@/components/ui/radio-group`

2. **Novo estado `desCusto`** (string, default `'D'`):
   - Controla se a coleta e com ou sem custo

3. **Radio button posicionado ANTES do campo Entidade Geradora**:
   - Ordem dos campos ficara: Evento > **Custo da Coleta (radio)** > Entidade Geradora > Ponto de Coleta
   - Opcoes: "Sem Custo" (valor `'D'`, default) e "Com Custo" (valor `'A'`)

4. **Quando `desCusto = 'A'` (com custo)**:
   - Label da Entidade Geradora muda para "Entidade Geradora *" (obrigatoria)
   - Opcao "Nenhuma entidade" (clear) fica oculta no combobox
   - Validacao no `handleSubmit`: bloquear se entidade geradora nao selecionada

5. **Quando `desCusto = 'D'` (sem custo)**:
   - Entidade Geradora volta a ser opcional (comportamento atual)
   - Opcao "Nenhuma entidade" fica visivel

6. **Passar `desCusto` como prop para `ColetaResiduoForm`**

7. **Incluir `des_custo` no payload de salvamento** (`coletaData`)

8. **Atualizar interface `ColetaResiduo`**:
   - Adicionar campos `vlr_custo?: number` e `subtotal_custo?: number`

9. **Grid de residuos (tabela)**:
   - Quando `desCusto = 'A'`: exibir 3 colunas adicionais: "Vlr. Unit. Custo", "Subtotal Custo"
   - Adicionar linha de "Total Custo" no rodape dos totais
   - Quando `desCusto = 'D'`: manter grid atual sem colunas de custo

10. **Salvar `vlr_custo` no insert de `coleta_residuo`** no `handleSubmit`

11. **Carregar `vlr_custo` ao editar coleta** no `loadColetaEditingData`

---

**Arquivo: `src/components/ColetaResiduoForm.tsx`**

1. **Nova prop `comCusto: boolean`** na interface `ColetaResiduoFormProps`

2. **Quando `comCusto = true`**:
   - Exibir campo "Valor Unitario de Custo (R$) *" usando `useCurrencyMask` (mesmo padrao do vlr_total)
   - Campo obrigatorio com valor minimo R$ 0,01
   - Maximo: R$ 9.999,99 (mesmo limite do campo de venda)
   - Exibir subtotal de custo (quantidade x valor custo)

3. **Atualizar interface `ColetaResiduo`** para incluir `vlr_custo` e `subtotal_custo`

4. **Validacao**: quando `comCusto = true`, vlr_custo deve ser >= 0.01

5. **Incluir vlr_custo e subtotal_custo no objeto retornado via `onAdd`**

---

**Arquivo: `src/integrations/supabase/types.ts`**
- Sera necessario regenerar ou atualizar manualmente os tipos para incluir `des_custo` em `coleta` e `vlr_custo` em `coleta_residuo`

### Secao Tecnica

Layout do radio button:

```text
Custo da Coleta
( ) Sem Custo    ( ) Com Custo
```

Grid de residuos COM custo:

```text
| Residuo | Tipo | Qtd (kg) | Prev. Venda | Subtotal Venda | Vlr. Unit. Custo | Subtotal Custo | Acoes |
|---------|------|----------|-------------|----------------|------------------|----------------|-------|
| Papel   | ...  | 100,00   | R$ 0,50     | R$ 50,00       | R$ 0,30          | R$ 30,00       | [E][R]|

Total Quantidade: 100,00 kg
Total Venda: R$ 50,00
Total Custo: R$ 30,00
```

Grid de residuos SEM custo (atual, sem alteracao):

```text
| Residuo | Tipo | Qtd (kg) | Prev. Venda | Subtotal | Acoes |
```

Fluxo de obrigatoriedade:

```text
desCusto = 'D' (sem custo):
  - Entidade Geradora: opcional
  - vlr_custo: nao exibido, salvo como null

desCusto = 'A' (com custo):
  - Entidade Geradora: obrigatoria
  - vlr_custo: obrigatorio >= 0.01
  - Grid com colunas extras de custo
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| Migracao SQL | Adicionar `des_custo` em `coleta` e `vlr_custo` em `coleta_residuo` |
| `ColetaForm.tsx` | Radio button de custo, obrigatoriedade condicional da entidade, colunas extras na grid, salvar des_custo e vlr_custo |
| `ColetaResiduoForm.tsx` | Nova prop `comCusto`, campo de valor unitario de custo, validacao, subtotal custo |
| `types.ts` | Atualizar tipos Supabase |

