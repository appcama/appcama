import { useState } from "react";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function useRelatorioExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: any, title: string, filters: RelatorioFiltersType, reportType?: string) => {
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

      // Filtros aplicados
      const filtrosAplicados = [];
      if (filters.statusColetas) {
        const statusMap: Record<string, string> = {
          'A': 'Coletas Ativas',
          'D': 'Coletas Desativadas', 
          'A,D': 'Todas as Coletas'
        };
        filtrosAplicados.push(`Status Coletas: ${statusMap[filters.statusColetas] || filters.statusColetas}`);
      }
      if (filters.statusEntidades) {
        const statusMap: Record<string, string> = {
          'A': 'Entidades Ativas',
          'D': 'Entidades Desativadas',
          'A,D': 'Todas as Entidades'
        };
        filtrosAplicados.push(`Status Entidades: ${statusMap[filters.statusEntidades] || filters.statusEntidades}`);
      }
      
      if (filtrosAplicados.length > 0) {
        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        filtrosAplicados.forEach((filtro, index) => {
          doc.text(filtro, pageWidth / 2, yPosition, { align: 'center' });
          yPosition += 8;
        });
        yPosition += 5;
      }

      // Gerar conteúdo específico do tipo de relatório
      switch (reportType) {
        case 'coletas-periodo':
          yPosition = await generateColetasPeriodoPDF(doc, data, yPosition);
          break;
        case 'residuos-coletados':
          yPosition = await generateResiduosColetadosPDF(doc, data, yPosition);
          break;
        case 'pontos-performance':
          yPosition = await generatePontosPerformancePDF(doc, data, yPosition);
          break;
        case 'entidades-ranking':
          yPosition = await generateEntidadesRankingPDF(doc, data, yPosition);
          break;
        case 'eventos-coleta':
          yPosition = await generateEventosColetaPDF(doc, data, yPosition);
          break;
        default:
          // Fallback - gerar conteúdo genérico
          yPosition = await generateGenericPDF(doc, data, yPosition);
          break;
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

// Funções para gerar PDFs específicos por tipo de relatório
async function generateColetasPeriodoPDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Resumo executivo
  if (data.totalColetas !== undefined) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('RESUMO DE COLETAS POR PERÍODO', 14, yPosition);
    yPosition += 10;

    const resumoData = [
      ['Métrica', 'Valor'],
      ['Total de Coletas', String(data.totalColetas || 0)],
      ['Total de Resíduos (kg)', String(data.totalResiduos || 0)],
      ['Valor Total (R$)', `R$ ${(data.valorTotal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`],
      ['Entidades Participantes', String(data.entidadesAtivas || 0)]
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

  // Detalhes das coletas
  if (data.items && data.items.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(12);
    doc.text('DETALHES DAS COLETAS', 14, yPosition);
    yPosition += 10;

    const detalhesData = data.items.slice(0, 30).map((item: any) => [
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

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  return yPosition;
}

async function generateResiduosColetadosPDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Resumo de resíduos
  if (data.residuosPorTipo && data.residuosPorTipo.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('ANÁLISE DE RESÍDUOS COLETADOS', 14, yPosition);
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

  // Indicadores ambientais se existirem
  if (data.indicadores && data.indicadores.length > 0) {
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

  return yPosition;
}

async function generatePontosPerformancePDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Performance dos pontos
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('PERFORMANCE DOS PONTOS DE COLETA', 14, yPosition);
    yPosition += 10;

    const pontosData = data.items.slice(0, 20).map((item: any) => [
      item.nome || item.ponto || '',
      item.entidade || '',
      `${(item.quantidade || 0).toLocaleString('pt-BR')} kg`,
      `R$ ${(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      String(item.totalColetas || 0),
      `R$ ${((item.valor || 0) / (item.totalColetas || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
    ]);

    autoTable(doc, {
      head: [['Ponto de Coleta', 'Entidade Gestora', 'Resíduos (kg)', 'Valor Total', 'Nº Coletas', 'Valor Médio']],
      body: pontosData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [155, 89, 182] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  return yPosition;
}

async function generateEntidadesRankingPDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Ranking das entidades
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('RANKING DE ENTIDADES GERADORAS', 14, yPosition);
    yPosition += 10;

    const entidadesData = data.items.slice(0, 20).map((item: any, index: number) => [
      String(index + 1),
      item.entidade || item.nome || '',
      `${(item.quantidade || 0).toLocaleString('pt-BR')} kg`,
      `R$ ${(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      String(item.totalColetas || 0),
      `${((item.quantidade || 0) / (item.totalColetas || 1)).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} kg`
    ]);

    autoTable(doc, {
      head: [['Pos.', 'Entidade', 'Resíduos (kg)', 'Valor Total', 'Nº Coletas', 'Média/Coleta']],
      body: entidadesData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [231, 76, 60] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  return yPosition;
}

async function generateEventosColetaPDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Eventos de coleta
  if (data.items && data.items.length > 0) {
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('RELATÓRIO DE EVENTOS DE COLETA', 14, yPosition);
    yPosition += 10;

    const eventosData = data.items.slice(0, 20).map((item: any) => [
      item.nome || '',
      item.entidade || '',
      `${(item.quantidade || 0).toLocaleString('pt-BR')} kg`,
      `R$ ${(item.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      String(item.participantes || 0),
      item.data ? format(new Date(item.data), 'dd/MM/yyyy') : ''
    ]);

    autoTable(doc, {
      head: [['Evento', 'Organizador', 'Resíduos (kg)', 'Valor', 'Participantes', 'Data']],
      body: eventosData,
      startY: yPosition,
      theme: 'striped',
      headStyles: { fillColor: [52, 152, 219] },
      margin: { left: 14, right: 14 },
      styles: { fontSize: 8 }
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  return yPosition;
}

async function generateGenericPDF(doc: any, data: any, yPosition: number): Promise<number> {
  // Resumo executivo genérico
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

  return yPosition;
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