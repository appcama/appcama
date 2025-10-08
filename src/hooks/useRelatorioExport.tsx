import { useState } from "react";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

export function useRelatorioExport() {
  const [isExporting, setIsExporting] = useState(false);

  const exportToPDF = async (data: any, title: string, filters: RelatorioFiltersType, reportType?: string, logoUrl?: string) => {
    setIsExporting(true);
    try {
      const doc = await generatePDF(data, title, filters, reportType, logoUrl);
      
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

  const printPDF = async (data: any, title: string, filters: RelatorioFiltersType, reportType?: string, logoUrl?: string) => {
    setIsExporting(true);
    try {
      const doc = await generatePDF(data, title, filters, reportType, logoUrl);
      
      // Abrir PDF em nova janela para impressão
      const pdfBlob = doc.output('blob');
      const pdfUrl = URL.createObjectURL(pdfBlob);
      
      const printWindow = window.open(pdfUrl, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      // Limpar URL após um tempo
      setTimeout(() => {
        URL.revokeObjectURL(pdfUrl);
      }, 10000);
      
    } catch (error) {
      console.error('Erro ao imprimir PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  const generatePDF = async (data: any, title: string, filters: RelatorioFiltersType, reportType?: string, logoUrl?: string) => {
    // Criar novo documento PDF
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    let yPosition = 20;

    // Configurar fonte
    doc.setFont('helvetica');
    
    // Adicionar logo da entidade se disponível
    if (logoUrl) {
      try {
        doc.addImage(logoUrl, 'PNG', 14, yPosition, 25, 25);
      } catch (error) {
        console.warn('Erro ao carregar logo da entidade, usando logo padrão');
        try {
          doc.addImage('/logo-original.png', 'PNG', 14, yPosition, 25, 25);
        } catch {
          // Continuar sem logo se ambos falharem
        }
      }
    } else {
      // Logo padrão
      try {
        doc.addImage('/logo-original.png', 'PNG', 14, yPosition, 25, 25);
      } catch (error) {
        // Continuar sem logo se falhar
      }
    }
    
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

    return doc;
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

  const exportCertificadoPDF = async (certificado: any) => {
    setIsExporting(true);
    try {
      // Buscar dados da entidade coletora e geradora
      const { supabase } = await import('@/integrations/supabase/client');
      
      // Buscar dados completos da entidade coletora (quem está emitindo o certificado)
      const { data: entidadeColetora } = await supabase
        .from('entidade')
        .select(`
          nom_entidade, 
          num_cpf_cnpj, 
          des_logo_url, 
          id_municipio,
          id_unidade_federativa,
          des_logradouro,
          des_bairro
        `)
        .eq('id_entidade', certificado.id_entidade)
        .single();

      // Buscar dados da entidade geradora se houver
      let entidadeGeradora = null;
      if (certificado.num_cpf_cnpj_gerador) {
        const { data } = await supabase
          .from('entidade')
          .select('nom_entidade, num_cpf_cnpj, des_logradouro, des_bairro, nom_razao_social')
          .eq('num_cpf_cnpj', certificado.num_cpf_cnpj_gerador)
          .single();
        entidadeGeradora = data;
      }

      // Buscar resíduos do certificado
      const { data: residuos } = await supabase
        .from('certificado_residuo')
        .select('nom_residuo, qtd_total, vlr_total')
        .eq('id_certificado', certificado.id_certificado)
        .order('qtd_total', { ascending: false });

      // Buscar logo da entidade coletora
      let logoDataUrl = null;
      if (entidadeColetora?.des_logo_url) {
        try {
          const response = await fetch(entidadeColetora.des_logo_url);
          const blob = await response.blob();
          logoDataUrl = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (error) {
          console.log('Logo não pôde ser carregada');
        }
      }

      // Criar documento PDF
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      const margin = 20;
      let yPosition = 15;

      // Cores do layout
      const colors = {
        verde: [34, 139, 34] as [number, number, number],
        verdeClaro: [220, 255, 220] as [number, number, number],
        preto: [0, 0, 0] as [number, number, number],
        cinza: [128, 128, 128] as [number, number, number],
        cinzaClaro: [200, 200, 200] as [number, number, number]
      };

      // CABEÇALHO COM LOGO no canto superior direito
      if (logoDataUrl) {
        try {
          doc.addImage(logoDataUrl, 'PNG', pageWidth - 100, yPosition, 80, 60);
        } catch (error) {
          console.log('Erro ao adicionar logo ao PDF');
        }
      }
      
      // Texto abaixo da logo
      doc.setFontSize(7);
      doc.setTextColor(...colors.cinza);
      doc.text('Marca da associação/cooperativa', pageWidth - 60, yPosition + 63, { align: 'center' });

      // NÚMERO DO CERTIFICADO (centralizado)
      yPosition = 25;
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.preto);
      doc.text(`CERTIFICADO Nº ${certificado.cod_validador}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 10;

      // PERÍODO
      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const periodoTexto = `Período: ${format(new Date(certificado.dat_periodo_inicio), 'dd/MM/yyyy')} a ${format(new Date(certificado.dat_periodo_fim), 'dd/MM/yyyy')}`;
      doc.text(periodoTexto, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // TEXTO DESCRITIVO (box verde claro)
      const boxHeight = 45;
      doc.setFillColor(...colors.verdeClaro);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'F');
      doc.setDrawColor(...colors.verde);
      doc.setLineWidth(1);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, boxHeight, 'S');

      // Texto dentro do box
      doc.setFontSize(10);
      doc.setTextColor(...colors.preto);
      doc.setFont('helvetica', 'bold');
      const nomeColetora = entidadeColetora?.nom_entidade?.toUpperCase() || 'ENTIDADE NÃO IDENTIFICADA';
      const cpfCnpjColetora = entidadeColetora?.num_cpf_cnpj || '';
      const nomeGeradora = entidadeGeradora?.nom_entidade || entidadeGeradora?.nom_razao_social || 'NÃO IDENTIFICADO';
      
      const textoDescritivo = `${nomeColetora}, CPF/CNPJ ${cpfCnpjColetora}, certifica que recebeu e/ou coletou, do Gerador ${nomeGeradora} e no período relacionado, para tratamento por meio da reciclagem, os resíduos sólidos listados abaixo.`;

      const splitText = doc.splitTextToSize(textoDescritivo, pageWidth - 2 * margin - 10);
      doc.text(splitText, margin + 5, yPosition + 8);
      yPosition += boxHeight + 15;

      // IDENTIFICAÇÃO DO GERADOR (boxes com bordas verdes)
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.preto);
      doc.text('Identificação do Gerador (CLIENTE)', margin, yPosition);
      yPosition += 8;

      // Grid de campos do gerador
      const fieldHeight = 10;
      doc.setDrawColor(...colors.verde);
      doc.setLineWidth(0.5);
      
      const fields = [
        { label: 'Razão Social/Nome:', value: nomeGeradora, width: pageWidth - 2 * margin },
        { label: 'CNPJ/CPF:', value: entidadeGeradora?.num_cpf_cnpj || certificado.num_cpf_cnpj_gerador || '', width: pageWidth - 2 * margin },
        { label: 'Endereço:', value: entidadeGeradora ? `${entidadeGeradora.des_logradouro || ''}, ${entidadeGeradora.des_bairro || ''}` : '', width: pageWidth - 2 * margin }
      ];

      fields.forEach(field => {
        // Box com borda verde
        doc.rect(margin, yPosition, field.width, fieldHeight);
        
        // Label em negrito
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(...colors.preto);
        doc.text(field.label, margin + 2, yPosition + 6.5);
        
        // Valor normal
        doc.setFont('helvetica', 'normal');
        const valueText = field.value || '';
        const splitValue = doc.splitTextToSize(valueText, field.width - 50);
        doc.text(splitValue, margin + 42, yPosition + 6.5);
        
        yPosition += fieldHeight;
      });

      yPosition += 12;

      // TABELA DE RESÍDUOS
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.preto);
      doc.text('Identificação dos Resíduos Sólidos', margin, yPosition);
      yPosition += 8;

      const residuosData = (residuos || []).map((r: any) => [
        r.nom_residuo,
        r.qtd_total.toFixed(3),
        'Reciclagem'
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Resíduos Sólidos', 'Quantidade (Kg)', 'Tratamento']],
        body: residuosData,
        theme: 'grid',
        headStyles: {
          fillColor: colors.verde,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          halign: 'center',
          fontSize: 10
        },
        bodyStyles: {
          lineColor: colors.verde,
          lineWidth: 0.5,
          fontSize: 9
        },
        columnStyles: {
          0: { halign: 'left', cellWidth: 100 },
          1: { halign: 'center', cellWidth: 40 },
          2: { halign: 'center', fontStyle: 'bold' }
        },
        margin: { left: margin, right: margin }
      });

      yPosition = (doc as any).lastAutoTable.finalY + 12;

      // OBSERVAÇÕES
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...colors.preto);
      doc.text('Observações', margin, yPosition);
      yPosition += 8;

      const obsHeight = 20;
      doc.setDrawColor(...colors.verde);
      doc.setLineWidth(0.5);
      doc.rect(margin, yPosition, pageWidth - 2 * margin, obsHeight);

      if (certificado.observacoes) {
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        const splitObs = doc.splitTextToSize(certificado.observacoes, pageWidth - 2 * margin - 4);
        doc.text(splitObs, margin + 2, yPosition + 5);
      }

      yPosition += obsHeight + 12;

      // RODAPÉ
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.preto);
      const dataEmissao = format(new Date(), 'dd/MM/yyyy');
      doc.text(`Data: ${dataEmissao}`, margin, yPosition);
      yPosition += 6;
      doc.text(`Responsável pela Emissão: ${entidadeColetora?.nom_entidade || ''}`, margin, yPosition);
      yPosition += 6;
      doc.text(`CPF/CNPJ: ${entidadeColetora?.num_cpf_cnpj || ''}`, margin, yPosition);
      yPosition += 8;
      
      doc.setFontSize(8);
      doc.setTextColor(...colors.cinza);
      doc.text('Certificado emitido no sistema ReciclaE', margin, yPosition);

      // QR CODE (canto inferior direito)
      const validationUrl = `${window.location.origin}/validar-certificado/${certificado.cod_validador}`;
      
      try {
        const qrCodeDataUrl = await QRCode.toDataURL(validationUrl, {
          width: 200,
          margin: 1,
          errorCorrectionLevel: 'M',
        });
        
        // QR Code maior e mais visível
        const qrSize = 45;
        const qrX = pageWidth - qrSize - margin;
        const qrY = pageHeight - qrSize - 15;
        doc.addImage(qrCodeDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
        
        // Texto "Validar certificado" abaixo do QR
        doc.setFontSize(7);
        doc.setTextColor(...colors.cinza);
        doc.text('Validar certificado', qrX + qrSize / 2, qrY + qrSize + 4, { align: 'center' });
        
      } catch (qrError) {
        console.error('Erro ao gerar QR Code:', qrError);
      }

      // Download
      const fileName = `Certificado_${certificado.cod_validador}.pdf`;
      doc.save(fileName);
      
    } catch (error) {
      console.error('Erro ao exportar certificado PDF:', error);
      throw error;
    } finally {
      setIsExporting(false);
    }
  };

  return {
    exportToPDF,
    printPDF,
    exportToExcel, 
    exportToCSV,
    exportCertificadoPDF,
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