

## Plano: Botao de Imprimir PDF no Manual de Coleta

### Resumo
Adicionar um botao "Imprimir PDF" no cabecalho do manual que gera um PDF completo com todo o passo a passo, usando jsPDF (ja instalado no projeto). O PDF tera layout limpo com titulo, passos numerados, descricoes, tabelas ilustrativas e badges de dicas.

### Alteracoes

**Arquivo: `src/components/ManualColeta.tsx`**

1. **Importar** `jsPDF`, `autoTable`, `Printer` (lucide), `useState` e `format` (date-fns)

2. **Funcao `generateManualPDF()`** que cria o PDF com todo o conteudo:
   - Cabecalho com logo ReciclaE e titulo "Manual - Como Lancar uma Coleta"
   - Data de geracao
   - Cada passo renderizado como secao numerada:
     - Titulo do passo em negrito
     - Descricao do passo
     - Tabelas ilustrativas onde aplicavel (Passo 8: grid sem custo e com custo usando autoTable)
     - Regras/dicas como texto destacado com prefixo (OBRIGATORIO, OPCIONAL, DICA, ATENCAO)
   - Quebra de pagina automatica quando necessario
   - Rodape com numero de pagina e "Gerado pelo Sistema ReciclaE"

3. **Botao "Imprimir PDF"** no CardHeader, ao lado do titulo:
   - Icone `Printer` + texto "Imprimir PDF"
   - Variant `outline`, tamanho `sm`
   - Ao clicar, gera o PDF e abre em nova aba para impressao (mesmo padrao do `printPDF` existente no sistema)
   - Estado `isGenerating` para desabilitar durante geracao

### Conteudo do PDF por passo

| Passo | Titulo | Conteudo especial no PDF |
|-------|--------|--------------------------|
| 1 | Acessar o formulario de Coletas | Texto descritivo |
| 2 | Preencher a Data da Coleta | Texto + regra "Campo obrigatorio" |
| 3 | Selecionar o Evento | Texto + "Campo opcional" |
| 4 | Custo da Coleta | Texto com explicacao dos dois estados (sem/com custo) e impacto nos campos |
| 5 | Entidade Geradora | Texto com regra de obrigatoriedade condicional |
| 6 | Ponto de Coleta | Texto com regra de obrigatoriedade condicional |
| 7 | Adicionar Residuos | Texto com campos obrigatorios e campo de custo condicional |
| 8 | Grid de Residuos | Duas tabelas via autoTable: sem custo (4 colunas) e com custo (6 colunas) com dados ficticios |
| 9 | Salvar a Coleta | Texto final com dicas |

### Secao Tecnica

Estrutura da funcao de geracao:

```text
generateManualPDF()
  +-- Criar jsPDF (orientacao retrato, A4)
  +-- Cabecalho: logo + titulo + data
  +-- Loop pelos 9 passos:
  |   +-- Verificar espaco na pagina (addPage se necessario)
  |   +-- Titulo do passo (font bold, tamanho 13)
  |   +-- Descricao (font normal, tamanho 10)
  |   +-- Regras/dicas (font italic, tamanho 9, com prefixo colorido)
  |   +-- Tabelas especiais no passo 8 (autoTable)
  +-- Rodape em todas as paginas
  +-- Abrir blob em nova aba para impressao
```

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ManualColeta.tsx` | Adicionar botao de imprimir PDF e funcao de geracao do PDF completo |

