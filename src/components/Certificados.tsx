import { useState } from 'react';
import { CertificadoList } from './CertificadoList';
import { GerarCertificado } from './GerarCertificado';
import { Button } from '@/components/ui/button';
import { FileText, FilePlus } from 'lucide-react';

export function Certificados() {
  const [currentView, setCurrentView] = useState<'gerar' | 'listar'>('gerar');

  return (
    <div className="space-y-6">
      {/* Tabs de Navegação */}
      <div className="flex gap-2 border-b">
        <Button
          variant={currentView === 'gerar' ? 'default' : 'ghost'}
          onClick={() => setCurrentView('gerar')}
          className="rounded-b-none"
        >
          <FilePlus className="w-4 h-4 mr-2" />
          Gerar Certificado
        </Button>
        <Button
          variant={currentView === 'listar' ? 'default' : 'ghost'}
          onClick={() => setCurrentView('listar')}
          className="rounded-b-none"
        >
          <FileText className="w-4 h-4 mr-2" />
          Listar Certificados
        </Button>
      </div>

      {/* Conteúdo */}
      {currentView === 'gerar' ? (
        <GerarCertificado />
      ) : (
        <CertificadoList 
          onAddNew={() => setCurrentView('gerar')} 
          onEdit={(item) => console.log('Edit certificate:', item)} 
        />
      )}
    </div>
  );
}
