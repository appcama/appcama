
import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Dashboard } from '@/components/Dashboard';
import { EntidadesList } from '@/components/EntidadesList';
import { PontosColetaList } from '@/components/PontosColetaList';
import { EventosList } from '@/components/EventosList';
import { TipoPontoColetaList } from '@/components/TipoPontoColetaList';
import { TipoEntidadeList } from '@/components/TipoEntidadeList';
import { TipoResiduoList } from '@/components/TipoResiduoList';
import { PerfilList } from '@/components/PerfilList';
import { UsuariosList } from '@/components/UsuariosList';
import { Sidebar } from '@/components/Sidebar';
import { MobileHeader } from '@/components/MobileHeader';
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { cn } from '@/lib/utils';

export function ReciclaELayout() {
  const [activeItem, setActiveItem] = useState('dashboard');
  const { user } = useAuth();
  const { allowedFeatures, loading: permissionsLoading } = usePermissions();
  const { isMobile } = useBreakpoints();

  console.log('[ReciclaELayout] Current user:', user);
  console.log('[ReciclaELayout] Allowed features:', allowedFeatures);
  console.log('[ReciclaELayout] Active item:', activeItem);

  const handleItemClick = (item: string) => {
    console.log('[ReciclaELayout] Item clicked:', item);
    setActiveItem(item);
  };

  const renderContent = () => {
    switch (activeItem) {
      case 'dashboard':
        return <Dashboard />;
      case 'entidades':
        return <EntidadesList />;
      case 'pontos-coleta':
        return <PontosColetaList />;
      case 'eventos-coleta':
        return <EventosList />;
      case 'tipos-ponto-coleta':
        return <TipoPontoColetaList />;
      case 'tipos-entidades':
        return <TipoEntidadeList />;
      case 'tipos-residuos':
        return <TipoResiduoList />;
      case 'perfis':
        return <PerfilList />;
      case 'usuarios':
        return <UsuariosList />;
      default:
        return <Dashboard />;
    }
  };

  if (permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-recycle-green mx-auto"></div>
          <p className="text-gray-600">Carregando permissões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {isMobile ? (
        <>
          <MobileHeader
            activeItem={activeItem}
            onItemClick={handleItemClick}
            allowedFeatures={allowedFeatures}
            userName={user?.nom_usuario}
          />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto">
              <div className="p-4">
                {renderContent()}
              </div>
            </div>
          </main>
        </>
      ) : (
        <div className="flex h-screen">
          <Sidebar
            activeItem={activeItem}
            onItemClick={handleItemClick}
            allowedFeatures={allowedFeatures}
          />
          <main className="flex-1 overflow-hidden">
            <div className="h-full overflow-y-auto bg-gray-50">
              <div className="p-6">
                {renderContent()}
              </div>
            </div>
          </main>
        </div>
      )}
    </div>
  );
}
