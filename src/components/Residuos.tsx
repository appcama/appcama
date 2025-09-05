import { useState } from "react";
import { ResiduoList } from "./ResiduoList";
import { ResiduoForm } from "./ResiduoForm";

interface Residuo {
  id_residuo: number;
  nom_residuo: string;
  id_tipo_residuo: number;
  des_status: string;
  des_locked: string;
  tipo_residuo?: {
    des_tipo_residuo: string;
  };
}

export function Residuos() {
  const [currentView, setCurrentView] = useState<'list' | 'form'>('list');
  const [editingResiduo, setEditingResiduo] = useState<Residuo | null>(null);

  const goToList = () => {
    setCurrentView('list');
    setEditingResiduo(null);
  };

  const goToForm = (residuo?: Residuo) => {
    setEditingResiduo(residuo || null);
    setCurrentView('form');
  };

  if (currentView === 'form') {
    return (
      <ResiduoForm
        onBack={goToList}
        onSuccess={goToList}
        editingResiduo={editingResiduo}
      />
    );
  }

  return (
    <ResiduoList
      onAddNew={() => goToForm()}
      onEdit={goToForm}
    />
  );
}