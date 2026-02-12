
## Plano: Pagina de Manual Ilustrado - Como Lancar uma Coleta

### Resumo
Criar um componente `ManualColeta` acessivel pelo menu lateral (item "ajuda" ja mapeado no `featureMap.ts`), contendo um guia passo a passo ilustrado com representacoes visuais dos campos do formulario de coleta, usando os proprios componentes do sistema (Card, Label, Switch, Input, Badge, Table, etc.) como "mockups" estaticos.

### Estrutura da Pagina

A pagina tera um layout de scroll vertical com secoes numeradas (Passo 1, 2, 3...), cada uma contendo:
- Titulo e descricao do passo
- Ilustracao estatica usando componentes reais do sistema (readonly/desabilitados) mostrando como o campo aparece
- Dicas e observacoes em destaque

### Passos Ilustrados

1. **Acessar o formulario de Coletas**: Ilustracao do menu lateral com o item "Coletas" destacado e o botao "Nova Coleta"
2. **Preencher a data**: Campo de calendario ilustrado
3. **Selecionar o Evento (opcional)**: Combobox de evento com exemplo
4. **Custo da Coleta**: Switch ilustrado mostrando os dois estados (sem custo / com custo) e explicando o impacto nos campos seguintes
5. **Entidade Geradora**: Combobox com destaque de quando e obrigatorio (com custo) vs opcional
6. **Ponto de Coleta**: Combobox com destaque de quando e obrigatorio (evento com pontos associados)
7. **Adicionar Residuos**: Formulario de residuo com campos de tipo, quantidade, valor de venda e valor de custo (quando habilitado)
8. **Grid de Residuos**: Tabela ilustrando as colunas (com e sem custo)
9. **Salvar a Coleta**: Botao de salvar e confirmacao

### Alteracoes

**Novo arquivo: `src/components/ManualColeta.tsx`**
- Componente com todas as secoes ilustradas
- Usa Accordion para cada passo (permite expandir/colapsar)
- Ilustracoes feitas com componentes do sistema em modo visual (nao interativos)
- Badges coloridos para dicas ("Obrigatorio", "Opcional", "Dica")
- Responsivo para mobile e desktop

**Arquivo: `src/components/ReciclaELayout.tsx`**
- Adicionar import do `ManualColeta`
- Adicionar case `'ajuda'` ou `'manual-coleta'` no switch do `renderContent`

**Arquivo: `src/components/Sidebar.tsx`**
- Verificar se ja existe item de menu para "Ajuda" e se necessario adicionar item "Manual" ou reaproveitar o existente

**Arquivo: `src/lib/featureMap.ts`**
- Verificar mapeamento do item (ja existe `ajuda: "Ajuda"`)

### Secao Tecnica

Estrutura do componente:

```text
ManualColeta
+-- Card (Titulo: Manual - Como Lancar uma Coleta)
+-- Accordion
    +-- Passo 1: Acessar Coletas
    |   +-- Ilustracao: mini sidebar + botao "Nova Coleta"
    +-- Passo 2: Data da Coleta
    |   +-- Ilustracao: campo de data com calendario
    +-- Passo 3: Selecionar Evento
    |   +-- Ilustracao: combobox de evento
    +-- Passo 4: Custo da Coleta
    |   +-- Ilustracao: Switch OFF (sem custo) + Switch ON (com custo)
    |   +-- Badge: "Quando habilitado, entidade geradora obrigatoria"
    +-- Passo 5: Entidade Geradora
    |   +-- Ilustracao: combobox com label dinamico
    +-- Passo 6: Ponto de Coleta
    |   +-- Ilustracao: combobox + regra de obrigatoriedade
    +-- Passo 7: Adicionar Residuos
    |   +-- Ilustracao: campos de tipo, quantidade, valores
    |   +-- Destaque: campo de custo quando habilitado
    +-- Passo 8: Grid de Residuos
    |   +-- Tabela ilustrativa com dados fictícios
    |   +-- Versao sem custo vs com custo lado a lado
    +-- Passo 9: Salvar
        +-- Botao ilustrativo + mensagem de sucesso
```

Cada ilustracao sera um mini-card com fundo cinza claro (`bg-gray-50`) contendo os componentes do sistema renderizados em modo estatico (pointer-events-none, opacity ajustada para parecer uma "captura de tela").

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ManualColeta.tsx` (novo) | Componente completo do manual ilustrado |
| `ReciclaELayout.tsx` | Adicionar case para renderizar ManualColeta |
| `Sidebar.tsx` | Verificar/adicionar item de menu (se necessario) |
