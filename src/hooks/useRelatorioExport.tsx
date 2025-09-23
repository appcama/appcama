import { useState } from "react";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useRelatorioExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: any, title: string, filters: RelatorioFiltersType) => {
    setIsExporting(true);
    try {
      // Criar novo documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      let yPosition = 20;

      // Configurar fonte
      doc.setFont('helvetica');
      
      // Título principal
      doc.setFontSize(16);
      doc.setTextColor(40, 40, 40);
      doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Data de geração
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      doc.text(`Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // Período dos filtros
      if (filters.dataInicial && filters.dataFinal) {
        doc.text(`Período: ${format(filters.dataInicial, "dd/MM/yyyy")} - ${format(filters.dataFinal, "dd/MM/yyyy")}`, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;
      } else {
        yPosition += 10;
      }

      // Resumo executivo
      if (data.totalColetas !== undefined) {
        doc.setFontSize(12);
        doc.setTextColor(40, 40, 40);
        doc.text('RESUMO EXECUTIVO', 14, yPosition);
        yPosition += 10;

        const resumoData = [
          ['Métrica', 'Valor'],
          ['Total de Coletas', String(data.totalColetas || 0)],
          ['Total de Resíduos (kg)', String(data.totalResiduos || 0)],
          ['Valor Total (R$)', `R$ ${(data.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
          ['Entidades Ativas', String(data.entidadesAtivas || 0)]
        ];

        autoTable(doc, {
          head: [resumoData[0]],
          body: resumoData.slice(1),
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [41, 128, 185] },
          margin: { left: 14, right: 14 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Resíduos por tipo
      if (data.residuosPorTipo && data.residuosPorTipo.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > 200) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text('RESÍDUOS POR TIPO', 14, yPosition);
        yPosition += 10;

        const residuosData = data.residuosPorTipo.map((item: any) => [
          item.nome,
          `${item.quantidade.toLocaleString('pt-BR')} kg`,
          `R$ ${item.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          `${item.percentual}%`
        ]);

        autoTable(doc, {
          head: [['Tipo de Resíduo', 'Quantidade (kg)', 'Valor (R$)', 'Percentual (%)']],
          body: residuosData,
          startY: yPosition,
          theme: 'striped',
          headStyles: { fillColor: [46, 204, 113] },
          margin: { left: 14, right: 14 }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Indicadores ambientais
      if (data.indicadores && data.indicadores.length > 0) {
        // Verificar se precisa de nova página
        if (yPosition > 220) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(12);
        doc.text('INDICADORES AMBIENTAIS', 14, yPosition);
        yPosition += 10;

        const indicadoresData = data.indicadores.map((item: any) => [
          item.nome,
          `${item.valor.toLocaleString('pt-BR')} ${item.unidade}`
        ]);

        autoTable(doc, {
          head: [['Indicador', 'Valor']],
          body: indicadoresData,
          startY: yPosition,
          theme: 'grid',
          headStyles: { fillColor: [230, 126, 34] },
          margin: { left: 14, right: 14 },
          columnStyles: { 0: { cellWidth: 80 } }
        });

        yPosition = (doc as any).lastAutoTable.finalY + 15;
      }

      // Detalhes das coletas (se houver items)
      if (data.items && data.items.length > 0) {
        // Nova página para detalhes
        doc.addPage();
        yPosition = 20;

        doc.setFontSize(12);
        doc.text('DETALHES DAS COLETAS', 14, yPosition);
        yPosition += 10;

        const detalhesData = data.items.slice(0, 20).map((item: any) => [
          String(item.id),
          item.nome || '',
          item.entidade || '',
          item.ponto || '',
          `${(item.quantidade || 0).toLocaleString('pt-BR')} kg`,
          `R$ ${(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
          item.data ? format(new Date(item.data), 'dd/MM/yyyy') : ''
        ]);

        autoTable(doc, {
          head: [['ID', 'Código', 'Entidade', 'Ponto', 'Qtd (kg)', 'Valor (R$)', 'Data']],
          body: detalhesData,
          startY: yPosition,
          theme: 'striped',
          headStyles: { fillColor: [52, 73, 94] },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 8 }
        });

        if (data.items.length > 20) {
          const finalY = (doc as any).lastAutoTable.finalY + 10;
          doc.setFontSize(10);
          doc.setTextColor(100, 100, 100);
          doc.text(`Exibindo 20 de ${data.items.length} registros. Utilize filtros para refinar os resultados.`, 14, finalY);
        }
      }

      // Rodapé em todas as páginas
      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, doc.internal.pageSize.height - 10, { align: 'right' });
        doc.text('Gerado pelo Sistema ReciclaE', 14, doc.internal.pageSize.height - 10);
      }

      // Fazer download
      const fileName = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToExcel = async (data: any, title: string, filters: RelatorioFiltersType) => {
    setIsExporting(true);
    try {
      // Simular exportação Excel
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Preparar dados para CSV (formato simples)
      const csvData = prepareCSVData(data);
      const csvContent = convertToCSV(csvData, title, filters);
      
      // Download como .csv (que pode ser aberto no Excel)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao exportar Excel:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = async (data: any, title: string, filters: RelatorioFiltersType) => {
    setIsExporting(true);
    try {
      // Preparar dados CSV
      const csvData = prepareCSVData(data);
      const csvContent = convertToCSV(csvData, title, filters);
      
      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${title.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd_HHmmss')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    exportToExcel, 
    exportToCSV,
    isExporting
  };
}

function prepareCSVData(data: any) {
  const rows = [];
  
  // Cabeçalho com resumo
  rows.push(['RESUMO DO RELATÓRIO']);
  rows.push(['Total de Coletas', data.totalColetas || 0]);
  rows.push(['Total de Resíduos (kg)', data.totalResiduos || 0]);
  rows.push(['Valor Total (R$)', data.valorTotal || 0]);
  rows.push(['Entidades Ativas', data.entidadesAtivas || 0]);
  rows.push([]); // Linha vazia

  // Resíduos por tipo
  if (data.residuosPorTipo && data.residuosPorTipo.length > 0) {
    rows.push(['RESÍDUOS POR TIPO']);
    rows.push(['Tipo', 'Quantidade (kg)', 'Valor (R$)', 'Percentual (%)']);
    data.residuosPorTipo.forEach((item: any) => {
      rows.push([item.nome, item.quantidade, item.valor, item.percentual]);
    });
    rows.push([]); // Linha vazia
  }

  // Indicadores ambientais
  if (data.indicadores && data.indicadores.length > 0) {
    rows.push(['INDICADORES AMBIENTAIS']);
    rows.push(['Indicador', 'Valor', 'Unidade']);
    data.indicadores.forEach((item: any) => {
      rows.push([item.nome, item.valor, item.unidade]);
    });
    rows.push([]); // Linha vazia
  }

  // Detalhes das coletas
  if (data.items && data.items.length > 0) {
    rows.push(['DETALHES DAS COLETAS']);
    rows.push(['ID', 'Código', 'Entidade', 'Ponto', 'Quantidade (kg)', 'Valor (R$)', 'Data']);
    data.items.forEach((item: any) => {
      rows.push([
        item.id,
        item.nome,
        item.entidade,
        item.ponto,
        item.quantidade,
        item.valor,
        item.data ? format(new Date(item.data), 'dd/MM/yyyy') : ''
      ]);
    });
  }

  return rows;
}

function convertToCSV(data: any[][], title: string, filters: RelatorioFiltersType) {
  const header = [];
  header.push(`"${title}"`);
  header.push(`"Gerado em: ${format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}"`);
  
  if (filters.dataInicial && filters.dataFinal) {
    header.push(`"Período: ${format(filters.dataInicial, "dd/MM/yyyy")} - ${format(filters.dataFinal, "dd/MM/yyyy")}"`);
  }
  
  header.push(''); // Linha vazia

  const csvRows = [...header, ...data.map(row => 
    row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')
  )];

  return '\uFEFF' + csvRows.join('\n'); // BOM para UTF-8
}