import { useState } from 'react';
import { CertificadoList } from './CertificadoList';

export function Certificados() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingItem, setEditingItem] = useState<any>(null);

  const handleAddNew = () => {
    setCurrentView('form');
    setEditingItem(null);
  };

  const handleEdit = (item: any) => {
    setCurrentView('form');
    setEditingItem(item);
  };

  return (
    <CertificadoList 
      onAddNew={handleAddNew} 
      onEdit={handleEdit} 
    />
  );
}
