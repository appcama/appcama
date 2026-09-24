import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PaginationControls } from "@/components/PaginationControls";
import { Search, Table as TableIcon } from "lucide-react";
import { format } from "date-fns";

interface ColumnDef {
  key: string;
  label: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: any) => React.ReactNode;
}

interface RelatorioTabelaPaginadaProps {
  data: any;
  reportType: string;
}

export function RelatorioTabelaPaginada({ data, reportType }: RelatorioTabelaPaginadaProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");

  const items = useMemo(() => {
    return Array.isArray(data?.items) ? data.items : [];
  }, [data?.items]);

  // Colunas configuradas por relatório
  const columns: ColumnDef[] = useMemo(() => {
    switch (reportType) {
      case 'coletas-periodo':
        return [
          { key: 'nome', label: 'Código' },
          { key: 'data', label: 'Data', render: (v) => v ? format(new Date(v), "dd/MM/yyyy") : '-' },
          { key: 'entidadeGeradora', label: 'Entidade Geradora', render: (v, r) => v || r.entidade || '-' },
          { key: 'ponto', label: 'Ponto de Coleta' },
          { key: 'entidadeColetora', label: 'Entidade Coletora', render: (v) => v || '-' },
          { 
            key: 'quantidade', 
            label: 'Volume (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { 
            key: 'status', 
            label: 'Status', 
            align: 'center',
            render: (v) => (
              <Badge variant="outline" className={v === 'Ativa' ? 'border-recycle-green text-recycle-green-dark bg-recycle-green/10' : 'text-muted-foreground'}>
                {v || 'Ativa'}
              </Badge>
            )
          }
        ];

      case 'residuos-coletados':
        return [
          { key: 'nome', label: 'Tipo de Resíduo' },
          { 
            key: 'quantidade', 
            label: 'Volume (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor Total (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { key: 'entidade', label: 'Participação no Total', align: 'center' },
          { key: 'ponto', label: 'Status Operacional', align: 'center' }
        ];

      case 'performance-pontos':
      case 'pontos-performance':
        return [
          { key: 'nome', label: 'Ponto de Coleta' },
          { key: 'entidade', label: 'Entidade Gestora' },
          { 
            key: 'quantidade', 
            label: 'Volume Total (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor Total (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { key: 'ponto', label: 'Coletas Registradas', align: 'center' }
        ];

      case 'ranking-entidades-geradoras':
        return [
          { key: 'id', label: 'Posição', align: 'center', render: (v) => `#${v}` },
          { key: 'nome', label: 'Entidade Geradora' },
          { 
            key: 'quantidade', 
            label: 'Volume Gerado (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor Gerado (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { key: 'entidade', label: 'Total de Coletas' },
          { key: 'ponto', label: 'Média por Coleta' }
        ];

      case 'eventos-coleta':
        return [
          { key: 'nome', label: 'Evento de Coleta' },
          { key: 'entidade', label: 'Participantes Envolvidos' },
          { key: 'ponto', label: 'Coletas Realizadas' },
          { 
            key: 'quantidade', 
            label: 'Volume Coletado (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor Total (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          }
        ];

      case 'indicadores-ambientais':
        return [
          { key: 'nome', label: 'Indicador Ambiental' },
          { 
            key: 'quantidade', 
            label: 'Impacto Estimado', 
            align: 'right',
            render: (v, r) => `${typeof v === 'number' ? v.toLocaleString('pt-BR') : v} ${r.unidade || ''}`
          },
          { key: 'ponto', label: 'Meta Estabelecida' },
          { 
            key: 'progresso', 
            label: 'Progresso da Meta', 
            align: 'center',
            render: (v) => (
              <Badge variant="outline" className="border-recycle-green bg-recycle-green/10 text-recycle-green-dark">
                {v !== undefined ? `${v}%` : 'Ativo'}
              </Badge>
            )
          }
        ];

      case 'reciclometro':
        return [
          { key: 'nome', label: 'Equivalência Ecológica' },
          { key: 'quantidade', label: 'Impacto Acumulado', align: 'right' },
          { key: 'entidade', label: 'Descrição da Mitigação' },
          { key: 'ponto', label: 'Classificação', align: 'center' }
        ];

      case 'comparativo-temporal':
      case 'crescimento':
        return [
          { key: 'nome', label: 'Mês / Período' },
          { 
            key: 'quantidade', 
            label: 'Volume Total (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor Total (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { key: 'entidade', label: 'Coletas Realizadas' },
          { key: 'ponto', label: 'Variação vs Anterior', align: 'center' }
        ];

      case 'benchmark-entidades':
        return [
          { key: 'ranking', label: 'Rank', align: 'center', render: (v) => `#${v}` },
          { key: 'nome', label: 'Entidade Geradora' },
          { 
            key: 'volume', 
            label: 'Volume (kg)', 
            align: 'right',
            render: (v, r) => `${(v || r.quantidade || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`
          },
          { key: 'coletas', label: 'Coletas', align: 'center' },
          { 
            key: 'mediaPorColeta', 
            label: 'Média por Coleta', 
            align: 'right',
            render: (v) => `${(v || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg`
          },
          { key: 'entidade', label: 'Participação no Total' }
        ];

      case 'tipos-residuo':
        return [
          { key: 'nome', label: 'Tipo de Material' },
          { 
            key: 'quantidade', 
            label: 'Volume Total (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Receita (R$)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { 
            key: 'precoMedio', 
            label: 'Preço Médio (R$/kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toFixed(2)}/kg` : (v || '-')
          },
          { key: 'entidade', label: '% do Volume Total', align: 'center' }
        ];

      case 'sazonalidade':
        return [
          { key: 'nome', label: 'Dia da Semana' },
          { 
            key: 'quantidade', 
            label: 'Volume (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { key: 'coletas', label: 'Coletas Registradas', align: 'center' },
          { key: 'entidade', label: '% do Volume Global' },
          { key: 'ponto', label: 'Média por Coleta' }
        ];

      case 'rejeitos-coletados':
        return [
          { key: 'nome', label: 'Identificador / Coleta' },
          { key: 'data', label: 'Data', render: (v) => v ? format(new Date(v), "dd/MM/yyyy") : '-' },
          { key: 'entidade', label: 'Entidade Geradora' },
          { key: 'ponto', label: 'Ponto de Coleta' },
          { 
            key: 'quantidade', 
            label: 'Rejeito (kg)', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} kg` : (v || '-')
          },
          { key: 'coletora', label: 'Entidade Coletora' }
        ];

      default:
        return [
          { key: 'nome', label: 'Item / Descrição' },
          { 
            key: 'quantidade', 
            label: 'Quantidade', 
            align: 'right',
            render: (v) => typeof v === 'number' ? v.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) : (v || '-')
          },
          { 
            key: 'valor', 
            label: 'Valor', 
            align: 'right',
            render: (v) => typeof v === 'number' ? `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : (v || '-')
          },
          { key: 'entidade', label: 'Entidade' },
          { key: 'ponto', label: 'Ponto / Detalhe' },
          { key: 'data', label: 'Data', render: (v) => v ? format(new Date(v), "dd/MM/yyyy") : '-' }
        ];
    }
  }, [reportType]);

  // Filtragem por busca
  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items;
    const term = searchTerm.toLowerCase();
    return items.filter(item => {
      return Object.values(item).some(val => 
        String(val || '').toLowerCase().includes(term)
      );
    });
  }, [items, searchTerm]);

  // Paginação
  const totalItems = filteredItems.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (!items || items.length === 0) {
    return (
      <Card className="border-border/80">
        <CardContent className="p-8 text-center space-y-2">
          <TableIcon className="w-10 h-10 text-muted-foreground mx-auto opacity-50" />
          <h3 className="font-semibold text-foreground">Nenhum registro encontrado</h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Não foram localizados dados para o período e filtros selecionados. Tente expandir o intervalo de datas.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/80 shadow-xs">
      <CardHeader className="pb-3 border-b border-border/60">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-recycle-green" />
              Detalhamento dos Dados
            </CardTitle>
            <CardDescription className="text-xs">
              {totalItems} {totalItems === 1 ? 'registro encontrado' : 'registros encontrados'}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            {/* Input de busca rápida */}
            <div className="relative w-48 sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar nesta tabela..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-8 text-xs pl-8 border-border/70"
              />
            </div>

            {/* Seletor de registros por página */}
            <Select
              value={String(pageSize)}
              onValueChange={(val) => {
                setPageSize(Number(val));
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-8 text-xs w-[110px] border-border/70">
                <SelectValue placeholder="10 / pág" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="10">10 / pág</SelectItem>
                <SelectItem value="25">25 / pág</SelectItem>
                <SelectItem value="50">50 / pág</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="border-b border-border/70 bg-muted/40 font-medium text-muted-foreground">
              <tr>
                {columns.map(column => (
                  <th 
                    key={column.key} 
                    className={`py-3 px-4 font-semibold text-foreground/80 ${
                      column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {paginatedItems.map((item: any, index: number) => (
                <tr 
                  key={item.id || index} 
                  className="hover:bg-muted/30 transition-colors"
                >
                  {columns.map(column => (
                    <td 
                      key={column.key} 
                      className={`py-3 px-4 ${
                        column.align === 'right' ? 'text-right font-mono' : column.align === 'center' ? 'text-center' : 'text-left'
                      }`}
                    >
                      {column.render 
                        ? column.render(item[column.key], item)
                        : (item[column.key] !== undefined && item[column.key] !== null ? String(item[column.key]) : '-')
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Controles de Paginação */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-border/60">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              startIndex={startIndex + 1}
              endIndex={endIndex}
              itemName="registros"
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
