

## Plano: Substituir PDF por Impressao HTML

### Resumo
Trocar o botao "Imprimir PDF" para abrir uma nova aba com o conteudo HTML completo do manual (com todos os graficos, mockups, badges e ilustracoes), usando `window.print()` nativo do navegador. Isso preserva toda a fidelidade visual da pagina.

### Como funciona
Em vez de gerar um PDF via jsPDF (que nao suporta imagens/componentes visuais), o botao vai:
1. Abrir uma nova aba/janela com o conteudo HTML do manual
2. Incluir os estilos CSS necessarios para manter a aparencia
3. Chamar `window.print()` automaticamente para o usuario imprimir ou salvar como PDF pelo navegador

### Alteracoes

**Arquivo: `src/components/ManualColeta.tsx`**

1. **Remover** imports do `jsPDF` e `autoTable` (nao serao mais necessarios)
2. **Remover** toda a funcao `generateManualPDF()` e o array `manualSteps`
3. **Adicionar** funcao `handlePrint()` que:
   - Captura o HTML do container do manual (usando um `ref` no conteudo)
   - Abre uma nova janela com `window.open()`
   - Injeta o HTML do manual com estilos inline copiados do Tailwind
   - Expande todos os accordions antes de capturar (para que todos os passos aparecam)
   - Chama `window.print()` na nova janela
4. **Adicionar** um `ref` no container do conteudo do manual
5. **Antes de imprimir**: expandir programaticamente todos os itens do accordion para que todos os passos fiquem visiveis na impressao
6. **Manter** o botao com icone `Printer` e texto "Imprimir"

### Estrategia tecnica

A abordagem sera:
- Usar um `ref` no container principal do manual
- Ao clicar em "Imprimir", alterar o estado do Accordion para abrir todos os itens
- Aguardar um breve timeout para o DOM atualizar
- Clonar o `innerHTML` do container
- Abrir nova janela, injetar HTML + CSS (copiando as stylesheets da pagina atual)
- Chamar `window.print()` na nova janela
- Restaurar o estado original do Accordion

Isso garante que todos os componentes visuais (switches, badges coloridos, tabelas, icones SVG) aparecam exatamente como na tela.

### Arquivos Modificados

| Arquivo | Alteracao |
|---------|-----------|
| `ManualColeta.tsx` | Substituir geracao jsPDF por impressao HTML via window.print() |

