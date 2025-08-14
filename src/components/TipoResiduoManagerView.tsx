
import { useState } from "react";
import { TipoResiduoForm } from "./TipoResiduoForm";
import { TipoResiduoList } from "./TipoResiduoList";

interface TipoResiduo {
  id_tipo_residuo: number;
  des_tipo_residuo: string;
  des_recurso_natural: string;
  des_status: string;
  des_locked: string;
}

export function TipoResiduoManagerView() {
  const [editingTipoResiduo, setEditingTipoResiduo] = useState<TipoResiduo | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (tipoResiduo: TipoResiduo) => {
    setEditingTipoResiduo(tipoResiduo);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingTipoResiduo(null);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingTipoResiduo(null);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingTipoResiduo(null);
  };

  if (showForm) {
    return (
      <TipoResiduoForm
        editingTipoResiduo={editingTipoResiduo}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <TipoResiduoList
      onEdit={handleEdit}
      onAddNew={handleAddNew}
    />
  );
}
