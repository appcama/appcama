

## Plano: Tabela de Precos para Residuos em Eventos

### Resumo

Criar um modulo completo de "Tabela de Precos" que permite cadastrar tabelas com residuos e seus valores de referencia. Essas tabelas podem ser vinculadas a eventos, controlando os precos praticados nas coletas. Tambem renomear o campo "Valor Unitario" para "Previsao de Venda" no formulario de residuos da coleta.

---

### 1. Migracao de Banco de Dados

**Criar tabela `tabela_precos`:**
```sql
CREATE TABLE tabela_precos (
  id_tabela_precos SERIAL PRIMARY KEY,
  des_tabela_precos VARCHAR(255) NOT NULL,
  des_status CHAR(1) NOT NULL DEFAULT 'A',
  des_locked CHAR(1) NOT NULL DEFAULT 'D',
  id_usuario_criador INTEGER NOT NULL,
  dat_criacao TIMESTAMP NOT NULL DEFAULT now(),
  id_usuario_atualizado INTEGER,
  dat_atualizacao TIMESTAMP
);
```

**Criar tabela `tabela_precos_residuo`:**
```sql
CREATE TABLE tabela_precos_residuo (
  id_tabela_preco INTEGER NOT NULL REFERENCES tabela_precos(id_tabela_precos),
  id_residuo INTEGER REFERENCES residuo(id_residuo),
  vlr_total NUMERIC(10,2) NOT NULL,
  PRIMARY KEY (id_tabela_preco, id_residuo)
);
```

**Adicionar colunas na tabela `evento`:**
```sql
ALTER TABLE evento ADD COLUMN id_tabela_precos INTEGER REFERENCES tabela_precos(id_tabela_precos);
ALTER TABLE evento ADD COLUMN des_tabela_preco_restrita CHAR(1) NOT NULL DEFAULT 'D';
```
- `des_tabela_preco_restrita`: `'A'` = Restrita (nao permite alterar valor na coleta), `'D'` = Irrestrita (permite alterar)

**Inserir funcionalidade na tabela `funcionalidade`:**
```sql
INSERT INTO funcionalidade (nom_funcionalidade, des_status, des_locked, id_usuario_criador, dat_criacao)
VALUES ('Tabela de Preços', 'A', 'D', 1, now());
```

**RLS para as novas tabelas:**
- Policies de SELECT, INSERT, UPDATE, DELETE para usuarios autenticados

---

### 2. Novos Arquivos

#### `src/components/TabelaPrecosList.tsx`
Tela de listagem de tabelas de precos com:
- Busca por nome
- Colunas: Nome, Status, Acoes (Editar, Excluir)
- Botao "+ Novo"
- Regra: Nao permitir excluir tabela associada a evento (verificar na tabela `evento` se existe `id_tabela_precos`)
- Acessivel apenas para administrador CAMA

#### `src/components/TabelaPrecosForm.tsx`
Formulario de cadastro/edicao com:
- Campo: Nome da tabela (obrigatorio, max 255 chars)
- Secao de residuos: Select para adicionar residuos com campo de valor (numeric 10,2)
- Lista de residuos adicionados com badges mostrando nome + valor + botao remover
- Validacao: pelo menos 1 residuo com preco deve ser informado
- Mesmo padrao visual dos outros formularios do sistema

---

### 3. Modificar Arquivos Existentes

#### `src/components/Sidebar.tsx`
Adicionar item "Tabela de Precos" no grupo AUXILIARES:
```typescript
{
  id: "tabela-precos",
  label: "Tabela de Preços",
  icon: DollarSign, // importar de lucide-react
}
```

#### `src/lib/featureMap.ts`
Adicionar mapeamento:
```typescript
"tabela-precos": "Tabela de Preços",
```

#### `src/components/ReciclaELayout.tsx`
- Importar `TabelaPrecosList` e `TabelaPrecosForm`
- Adicionar cases para `'tabela-precos'` no `renderContent()` (tanto form quanto list)

#### `src/components/EventoForm.tsx`
Adicionar secao de Tabela de Precos (switch + selecao):
- Switch "Compra de Residuos" (mesmo padrao do Evento Publico e Pontos de Coleta)
- Quando ativado: Select para escolher uma tabela de precos
- Radio button: Tabela Restrita / Tabela Irrestrita
- Salvar `id_tabela_precos` e `des_tabela_preco_restrita` no evento

#### `src/components/ColetaResiduoForm.tsx`
- Renomear label "Valor Unitario (R$)" para "Previsao de Venda (R$)"
- Receber nova prop `tabelaPrecos` (opcional) com os precos do evento
- Quando um residuo e selecionado e existe tabela de precos:
  - Preencher automaticamente o valor com o preco da tabela
  - Se tabela restrita: desabilitar o campo de valor (nao permite edicao)
  - Se tabela irrestrita: permitir edicao do valor pre-preenchido

#### `src/components/ColetaForm.tsx`
- Ao selecionar um evento, buscar `id_tabela_precos` e `des_tabela_preco_restrita`
- Se houver tabela de precos, carregar os residuos/precos da tabela `tabela_precos_residuo`
- Passar dados da tabela de precos para `ColetaResiduoForm` via props

#### `src/integrations/supabase/types.ts`
Adicionar tipos das novas tabelas e colunas

---

### 4. Fluxo da Tabela de Precos no Evento

```text
EventoForm:
+--------------------------------------------------+
| [DollarSign]  Compra de Residuos        [toggle]  |
|   Vincular tabela de precos a este evento         |
+--------------------------------------------------+

Quando ativado:
+--------------------------------------------------+
| Tabela de Precos                                  |
| [Select: Selecionar tabela de precos...]          |
|                                                   |
| Tipo de Tabela:                                   |
| (o) Irrestrita - Permite alterar valores na coleta|
| (o) Restrita - Nao permite alterar valores        |
+--------------------------------------------------+
```

### 5. Fluxo na Coleta

Quando o evento selecionado tem tabela de precos:
- Ao adicionar residuo, se o residuo existe na tabela de precos, o campo "Previsao de Venda" e preenchido automaticamente
- Se tabela restrita: campo desabilitado
- Se tabela irrestrita: campo editavel
- Se residuo nao esta na tabela de precos: campo fica livre para digitacao

---

### 6. Resumo de Arquivos

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar `tabela_precos`, `tabela_precos_residuo`, colunas no `evento`, funcionalidade |
| `TabelaPrecosList.tsx` | Novo - Listagem |
| `TabelaPrecosForm.tsx` | Novo - Formulario CRUD |
| `Sidebar.tsx` | Adicionar menu "Tabela de Precos" em AUXILIARES |
| `featureMap.ts` | Adicionar mapeamento |
| `ReciclaELayout.tsx` | Registrar componentes |
| `EventoForm.tsx` | Adicionar switch + selecao de tabela de precos |
| `ColetaForm.tsx` | Carregar tabela de precos do evento e passar para ColetaResiduoForm |
| `ColetaResiduoForm.tsx` | Renomear label + logica de preco automatico + campo restrito/irrestrito |
| `types.ts` | Atualizar tipos Supabase |

### 7. Consideracoes

- A tabela de precos so pode ser deletada se nao estiver associada a nenhum evento
- Deve ter pelo menos 1 residuo com preco cadastrado
- O modulo so e acessivel para administradores CAMA (controlado via funcionalidades por perfil)
- O campo "Valor Unitario" sera renomeado para "Previsao de Venda" em todo o formulario de residuos da coleta
- Tabela restrita impede alteracao do valor; tabela irrestrita permite

