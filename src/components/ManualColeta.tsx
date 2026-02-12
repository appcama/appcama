import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Package, Plus, CalendarIcon, ChevronDown, Save, CheckCircle, 
  DollarSign, Building, MapPin, Calendar, Recycle, Info, AlertTriangle, Lightbulb, Printer
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/** Mini-card wrapper que simula uma "captura de tela" do sistema */
function MockupCard({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      "rounded-lg border bg-muted/30 p-4 pointer-events-none select-none",
      className
    )}>
      {children}
    </div>
  );
}

function TipBadge({ children, variant = 'dica' }: { children: React.ReactNode; variant?: 'obrigatorio' | 'opcional' | 'dica' | 'atencao' }) {
  const styles = {
    obrigatorio: 'bg-red-100 text-red-700 border-red-200',
    opcional: 'bg-blue-100 text-blue-700 border-blue-200',
    dica: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    atencao: 'bg-amber-100 text-amber-700 border-amber-200',
  };
  const icons = {
    obrigatorio: <AlertTriangle className="w-3 h-3" />,
    opcional: <Info className="w-3 h-3" />,
    dica: <Lightbulb className="w-3 h-3" />,
    atencao: <AlertTriangle className="w-3 h-3" />,
  };
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md border", styles[variant])}>
      {icons[variant]}
      {children}
    </span>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-sm font-bold mr-2 flex-shrink-0">
      {n}
    </span>
  );
}

type ManualStep = {
  title: string;
  description: string;
  rules: { prefix: string; text: string }[];
};

const manualSteps: ManualStep[] = [
  {
    title: 'Acessar o formulário de Coletas',
    description: 'No menu lateral, clique em "Coletas" para abrir a listagem. Em seguida, clique no botão "Nova Coleta". O formulário abrirá com a data de hoje já preenchida.',
    rules: [
      { prefix: 'DICA', text: 'O formulário abrirá com a data de hoje já preenchida.' },
    ],
  },
  {
    title: 'Preencher a Data da Coleta',
    description: 'Selecione a data em que a coleta foi realizada. Por padrão, a data de hoje é preenchida automaticamente.',
    rules: [
      { prefix: 'OBRIGATÓRIO', text: 'Campo obrigatório.' },
    ],
  },
  {
    title: 'Selecionar o Evento (opcional)',
    description: 'Se a coleta está vinculada a um evento, selecione-o na lista. Caso contrário, deixe em branco.',
    rules: [
      { prefix: 'OPCIONAL', text: 'Campo opcional.' },
      { prefix: 'DICA', text: 'A busca funciona por substring (ex: "mutir" encontra "Mutirão").' },
    ],
  },
  {
    title: 'Custo da Coleta',
    description: 'Indique se esta coleta possui custos associados. O switch "Coleta com Custo" controla dois estados:\n\n• Desabilitado (padrão): A coleta não possui custos. A Entidade Geradora é opcional e o campo de Valor de Custo nos resíduos fica oculto.\n\n• Habilitado: A coleta possui custos. A Entidade Geradora torna-se obrigatória e cada resíduo exige o preenchimento do Valor Unitário de Custo (mínimo R$ 0,01). A grade de resíduos exibe colunas adicionais de custo.',
    rules: [
      { prefix: 'ATENÇÃO', text: 'Quando habilitado, a Entidade Geradora torna-se obrigatória.' },
      { prefix: 'ATENÇÃO', text: 'Resíduos passam a exigir o valor unitário de custo (mínimo R$ 0,01).' },
    ],
  },
  {
    title: 'Entidade Geradora',
    description: 'Selecione a entidade que gerou o resíduo. A obrigatoriedade depende do custo da coleta:\n\n• Sem custo: Campo opcional.\n• Com custo: Campo obrigatório.',
    rules: [
      { prefix: 'DICA', text: 'A busca funciona por nome ou CPF/CNPJ.' },
    ],
  },
  {
    title: 'Ponto de Coleta',
    description: 'Selecione o ponto de coleta onde os resíduos foram recolhidos.',
    rules: [
      { prefix: 'OPCIONAL', text: 'Geralmente opcional.' },
      { prefix: 'ATENÇÃO', text: 'Obrigatório quando o evento possui pontos de coleta associados.' },
    ],
  },
  {
    title: 'Adicionar Resíduos',
    description: 'Preencha os campos para cada resíduo coletado e clique em "Adicionar".\n\nCampos obrigatórios: Resíduo, Quantidade (kg) e Valor Unitário de Venda.\n\nQuando "Coleta com Custo" está habilitado, o campo Valor Unitário de Custo também é obrigatório (mínimo R$ 0,01).',
    rules: [
      { prefix: 'OBRIGATÓRIO', text: 'Resíduo, quantidade e valor de venda são sempre obrigatórios.' },
      { prefix: 'ATENÇÃO', text: 'Valor de custo aparece apenas quando "Coleta com Custo" está habilitado.' },
    ],
  },
  {
    title: 'Grid de Resíduos Adicionados',
    description: 'Confira os resíduos adicionados na tabela. Você pode remover itens antes de salvar. As colunas de custo só aparecem quando "Coleta com Custo" está habilitado.',
    rules: [
      { prefix: 'DICA', text: 'As colunas de custo só aparecem quando "Coleta com Custo" está habilitado.' },
    ],
  },
  {
    title: 'Salvar a Coleta',
    description: 'Após preencher todos os campos e adicionar os resíduos, clique em "Salvar" para registrar a coleta. A coleta aparecerá na listagem com o código gerado automaticamente.',
    rules: [
      { prefix: 'DICA', text: 'Após salvar, a coleta aparecerá na listagem com o código gerado automaticamente.' },
      { prefix: 'ATENÇÃO', text: 'Certifique-se de que pelo menos um resíduo foi adicionado antes de salvar.' },
    ],
  },
];

function generateManualPDF() {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const addFooter = (pageNum: number) => {
    const totalPages = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    doc.text('Gerado pelo Sistema ReCiclaÊ', margin, pageHeight - 10);
  };

  const checkPageBreak = (neededSpace: number) => {
    if (y + neededSpace > pageHeight - 25) {
      doc.addPage();
      y = margin;
    }
  };

  // Header
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 97, 51); // green
  doc.text('ReCiclaÊ', margin, y);
  y += 8;

  doc.setFontSize(14);
  doc.setTextColor(40, 40, 40);
  doc.text('Manual — Como Lançar uma Coleta', margin, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}`, margin, y);
  y += 4;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.line(margin, y, pageWidth - margin, y);
  y += 8;

  // Steps
  manualSteps.forEach((step, index) => {
    const stepNum = index + 1;

    checkPageBreak(40);

    // Step title
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(34, 97, 51);
    doc.text(`Passo ${stepNum}: ${step.title}`, margin, y);
    y += 7;

    // Description
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    const descLines = doc.splitTextToSize(step.description, contentWidth);
    descLines.forEach((line: string) => {
      checkPageBreak(6);
      doc.text(line, margin, y);
      y += 5;
    });
    y += 2;

    // Rules/tips
    step.rules.forEach((rule) => {
      checkPageBreak(8);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bolditalic');
      
      if (rule.prefix === 'OBRIGATÓRIO') {
        doc.setTextColor(185, 28, 28);
      } else if (rule.prefix === 'ATENÇÃO') {
        doc.setTextColor(180, 120, 0);
      } else if (rule.prefix === 'OPCIONAL') {
        doc.setTextColor(37, 99, 235);
      } else {
        doc.setTextColor(5, 122, 85);
      }

      const ruleText = `[${rule.prefix}] ${rule.text}`;
      const ruleLines = doc.splitTextToSize(ruleText, contentWidth);
      ruleLines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin, y);
        y += 4.5;
      });
    });

    // Step 8: tables
    if (stepNum === 8) {
      y += 3;
      checkPageBreak(45);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Exemplo — Sem custo:', margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Resíduo', 'Qtd. (kg)', 'Vlr. Unit.', 'Subtotal']],
        body: [
          ['Papelão', '150,00', 'R$ 0,50', 'R$ 75,00'],
          ['PET', '80,00', 'R$ 1,20', 'R$ 96,00'],
        ],
        foot: [['Total Venda', '', '', 'R$ 171,00']],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [34, 97, 51], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
      });

      y = (doc as any).lastAutoTable.finalY + 8;
      checkPageBreak(45);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(60, 60, 60);
      doc.text('Exemplo — Com custo:', margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Resíduo', 'Qtd. (kg)', 'Vlr. Venda', 'Sub. Venda', 'Vlr. Custo', 'Sub. Custo']],
        body: [
          ['Papelão', '150,00', 'R$ 0,50', 'R$ 75,00', 'R$ 0,30', 'R$ 45,00'],
          ['PET', '80,00', 'R$ 1,20', 'R$ 96,00', 'R$ 0,80', 'R$ 64,00'],
        ],
        foot: [['Total Venda', '', '', 'R$ 171,00', 'Total Custo', 'R$ 109,00']],
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [34, 97, 51], textColor: 255 },
        footStyles: { fillColor: [240, 240, 240], textColor: [40, 40, 40], fontStyle: 'bold' },
      });

      y = (doc as any).lastAutoTable.finalY + 6;
    }

    y += 6;

    // Divider between steps
    if (stepNum < manualSteps.length) {
      checkPageBreak(4);
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
    }
  });

  // Add footers to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    addFooter(i);
  }

  // Open in new tab
  const blobUrl = doc.output('bloburl');
  window.open(blobUrl as unknown as string, '_blank');
}

export function ManualColeta() {
  const [isGenerating, setIsGenerating] = useState(false);

  const handlePrintPDF = async () => {
    setIsGenerating(true);
    try {
      generateManualPDF();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Package className="w-6 h-6 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Manual — Como Lançar uma Coleta</CardTitle>
                <CardDescription>
                  Guia passo a passo ilustrado com os campos e regras do formulário de coleta
                </CardDescription>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handlePrintPDF} disabled={isGenerating} className="gap-2">
              <Printer className="w-4 h-4" />
              {isGenerating ? 'Gerando...' : 'Imprimir PDF'}
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <Accordion type="multiple" defaultValue={["passo-1"]} className="space-y-2">

            {/* ==================== PASSO 1 ==================== */}
            <AccordionItem value="passo-1" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={1} />
                  <span className="font-semibold">Acessar o formulário de Coletas</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  No menu lateral, clique em <strong>"Coletas"</strong> para abrir a listagem. Em seguida, clique no botão <strong>"Nova Coleta"</strong>.
                </p>
                <MockupCard>
                  <div className="flex gap-4 flex-col sm:flex-row">
                    {/* Mini sidebar */}
                    <div className="bg-white rounded-lg border p-3 w-full sm:w-48 space-y-1">
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground rounded">
                        <Building className="w-3.5 h-3.5" /> Entidades
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground rounded">
                        <MapPin className="w-3.5 h-3.5" /> Pontos de Coleta
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs bg-recycle-green-light text-recycle-green-dark font-medium rounded">
                        <Package className="w-3.5 h-3.5" /> Coletas
                      </div>
                      <div className="flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground rounded">
                        <Calendar className="w-3.5 h-3.5" /> Eventos
                      </div>
                    </div>
                    {/* Botão Nova Coleta */}
                    <div className="flex-1 flex items-start">
                      <Button size="sm" className="gap-1">
                        <Plus className="w-4 h-4" /> Nova Coleta
                      </Button>
                    </div>
                  </div>
                </MockupCard>
                <div className="mt-3">
                  <TipBadge variant="dica">O formulário abrirá com a data de hoje já preenchida</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 2 ==================== */}
            <AccordionItem value="passo-2" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={2} />
                  <span className="font-semibold">Preencher a Data da Coleta</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione a data em que a coleta foi realizada. Por padrão, a data de hoje é preenchida automaticamente.
                </p>
                <MockupCard>
                  <div className="space-y-2 max-w-xs">
                    <Label className="text-xs font-medium">Data da Coleta *</Label>
                    <div className="flex items-center gap-2 border rounded-md px-3 py-2 bg-white text-sm">
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      <span>12/02/2026</span>
                    </div>
                  </div>
                </MockupCard>
                <div className="mt-3">
                  <TipBadge variant="obrigatorio">Campo obrigatório</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 3 ==================== */}
            <AccordionItem value="passo-3" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={3} />
                  <span className="font-semibold">Selecionar o Evento (opcional)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Se a coleta está vinculada a um evento, selecione-o na lista. Caso contrário, deixe em branco.
                </p>
                <MockupCard>
                  <div className="space-y-2 max-w-sm">
                    <Label className="text-xs font-medium">Evento</Label>
                    <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-white text-sm">
                      <span className="text-muted-foreground">Selecione um evento...</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </MockupCard>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TipBadge variant="opcional">Campo opcional</TipBadge>
                  <TipBadge variant="dica">A busca funciona por substring (ex: "mutir" encontra "Mutirão")</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 4 ==================== */}
            <AccordionItem value="passo-4" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={4} />
                  <span className="font-semibold">Custo da Coleta</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Indique se esta coleta possui custos associados. Quando habilitado, campos adicionais de custo serão exibidos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Sem custo (padrão):</p>
                    <div className="flex items-center gap-3 border rounded-md p-3 bg-white">
                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Coleta com Custo</p>
                        <p className="text-xs text-muted-foreground">Desabilitado</p>
                      </div>
                      <Switch checked={false} disabled />
                    </div>
                  </MockupCard>
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Com custo:</p>
                    <div className="flex items-center gap-3 border rounded-md p-3 bg-white">
                      <DollarSign className="w-4 h-4 text-primary" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">Coleta com Custo</p>
                        <p className="text-xs text-muted-foreground">Habilitado</p>
                      </div>
                      <Switch checked={true} disabled />
                    </div>
                  </MockupCard>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TipBadge variant="atencao">Quando habilitado, a Entidade Geradora torna-se obrigatória</TipBadge>
                  <TipBadge variant="atencao">Resíduos passam a exigir o valor unitário de custo</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 5 ==================== */}
            <AccordionItem value="passo-5" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={5} />
                  <span className="font-semibold">Entidade Geradora</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione a entidade que gerou o resíduo. A obrigatoriedade depende do custo da coleta.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Sem custo — opcional:</p>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Entidade Geradora</Label>
                      <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-white text-sm">
                        <span className="text-muted-foreground">Selecione...</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </MockupCard>
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-2">Com custo — obrigatório:</p>
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">Entidade Geradora *</Label>
                      <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-white text-sm border-primary">
                        <span>Prefeitura Municipal</span>
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </div>
                  </MockupCard>
                </div>
                <div className="mt-3">
                  <TipBadge variant="dica">A busca funciona por nome ou CPF/CNPJ</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 6 ==================== */}
            <AccordionItem value="passo-6" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={6} />
                  <span className="font-semibold">Ponto de Coleta</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Selecione o ponto de coleta onde os resíduos foram recolhidos.
                </p>
                <MockupCard>
                  <div className="space-y-2 max-w-sm">
                    <Label className="text-xs font-medium">Ponto de Coleta</Label>
                    <div className="flex items-center justify-between border rounded-md px-3 py-2 bg-white text-sm">
                      <span className="text-muted-foreground">Selecione um ponto...</span>
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </MockupCard>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TipBadge variant="opcional">Geralmente opcional</TipBadge>
                  <TipBadge variant="atencao">Obrigatório quando o evento possui pontos de coleta associados</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 7 ==================== */}
            <AccordionItem value="passo-7" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={7} />
                  <span className="font-semibold">Adicionar Resíduos</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Preencha os campos abaixo para cada resíduo coletado e clique em <strong>"Adicionar"</strong>.
                </p>
                <div className="space-y-4">
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Formulário sem custo:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Resíduo *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">Papelão</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Quantidade (kg) *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">150,00</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vlr. Unit. Venda *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">R$ 0,50</div>
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" variant="outline" className="text-xs gap-1 w-full">
                          <Plus className="w-3 h-3" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  </MockupCard>

                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Formulário com custo (campo extra):</p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Resíduo *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">Papelão</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Qtd. (kg) *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">150,00</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Vlr. Venda *</Label>
                        <div className="border rounded-md px-2 py-1.5 bg-white text-xs">R$ 0,50</div>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-primary font-semibold">Vlr. Custo *</Label>
                        <div className="border border-primary rounded-md px-2 py-1.5 bg-white text-xs">R$ 0,30</div>
                      </div>
                      <div className="flex items-end">
                        <Button size="sm" variant="outline" className="text-xs gap-1 w-full">
                          <Plus className="w-3 h-3" /> Adicionar
                        </Button>
                      </div>
                    </div>
                  </MockupCard>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TipBadge variant="obrigatorio">Resíduo, quantidade e valor de venda são sempre obrigatórios</TipBadge>
                  <TipBadge variant="atencao">Valor de custo aparece apenas quando "Coleta com Custo" está habilitado</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 8 ==================== */}
            <AccordionItem value="passo-8" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={8} />
                  <span className="font-semibold">Grid de Resíduos Adicionados</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Confira os resíduos adicionados na tabela abaixo. Você pode remover itens antes de salvar.
                </p>
                <div className="space-y-4">
                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Sem custo:</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Resíduo</TableHead>
                            <TableHead className="text-xs text-right">Qtd. (kg)</TableHead>
                            <TableHead className="text-xs text-right">Vlr. Unit.</TableHead>
                            <TableHead className="text-xs text-right">Subtotal</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-xs">Papelão</TableCell>
                            <TableCell className="text-xs text-right">150,00</TableCell>
                            <TableCell className="text-xs text-right">R$ 0,50</TableCell>
                            <TableCell className="text-xs text-right font-medium">R$ 75,00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs">PET</TableCell>
                            <TableCell className="text-xs text-right">80,00</TableCell>
                            <TableCell className="text-xs text-right">R$ 1,20</TableCell>
                            <TableCell className="text-xs text-right font-medium">R$ 96,00</TableCell>
                          </TableRow>
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3} className="text-xs font-bold">Total Venda</TableCell>
                            <TableCell className="text-xs text-right font-bold">R$ 171,00</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </MockupCard>

                  <MockupCard>
                    <p className="text-xs font-medium text-muted-foreground mb-3">Com custo (colunas extras):</p>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-xs">Resíduo</TableHead>
                            <TableHead className="text-xs text-right">Qtd.</TableHead>
                            <TableHead className="text-xs text-right">Vlr. Venda</TableHead>
                            <TableHead className="text-xs text-right">Sub. Venda</TableHead>
                            <TableHead className="text-xs text-right text-primary">Vlr. Custo</TableHead>
                            <TableHead className="text-xs text-right text-primary">Sub. Custo</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          <TableRow>
                            <TableCell className="text-xs">Papelão</TableCell>
                            <TableCell className="text-xs text-right">150,00</TableCell>
                            <TableCell className="text-xs text-right">R$ 0,50</TableCell>
                            <TableCell className="text-xs text-right">R$ 75,00</TableCell>
                            <TableCell className="text-xs text-right text-primary">R$ 0,30</TableCell>
                            <TableCell className="text-xs text-right text-primary font-medium">R$ 45,00</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell className="text-xs">PET</TableCell>
                            <TableCell className="text-xs text-right">80,00</TableCell>
                            <TableCell className="text-xs text-right">R$ 1,20</TableCell>
                            <TableCell className="text-xs text-right">R$ 96,00</TableCell>
                            <TableCell className="text-xs text-right text-primary">R$ 0,80</TableCell>
                            <TableCell className="text-xs text-right text-primary font-medium">R$ 64,00</TableCell>
                          </TableRow>
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={3} className="text-xs font-bold">Total Venda</TableCell>
                            <TableCell className="text-xs text-right font-bold">R$ 171,00</TableCell>
                            <TableCell className="text-xs text-right font-bold text-primary">Total Custo</TableCell>
                            <TableCell className="text-xs text-right font-bold text-primary">R$ 109,00</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  </MockupCard>
                </div>
                <div className="mt-3">
                  <TipBadge variant="dica">As colunas de custo só aparecem quando "Coleta com Custo" está habilitado</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* ==================== PASSO 9 ==================== */}
            <AccordionItem value="passo-9" className="border rounded-lg px-4">
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center">
                  <StepNumber n={9} />
                  <span className="font-semibold">Salvar a Coleta</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Após preencher todos os campos e adicionar os resíduos, clique em <strong>"Salvar"</strong> para registrar a coleta.
                </p>
                <MockupCard>
                  <div className="flex flex-col items-center gap-4 py-4">
                    <Button className="gap-2">
                      <Save className="w-4 h-4" /> Salvar Coleta
                    </Button>
                    <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md px-4 py-2">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-medium">Coleta salva com sucesso!</span>
                    </div>
                  </div>
                </MockupCard>
                <div className="mt-3 flex flex-wrap gap-2">
                  <TipBadge variant="dica">Após salvar, a coleta aparecerá na listagem com o código gerado automaticamente</TipBadge>
                  <TipBadge variant="atencao">Certifique-se de que pelo menos um resíduo foi adicionado antes de salvar</TipBadge>
                </div>
              </AccordionContent>
            </AccordionItem>

          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
