
import { useState } from "react";
import { TipoEntidadeForm } from "./TipoEntidadeForm";
import { TipoEntidadeList } from "./TipoEntidadeList";

interface TipoEntidade {
  id_tipo_entidade: number;
  des_tipo_entidade: string;
  des_geradora_residuo: string;
  des_coletora_residuo: string;
  des_status: string;
  des_locked: string;
}

export function TipoEntidadeManagerView() {
  const [editingTipoEntidade, setEditingTipoEntidade] = useState<TipoEntidade | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (tipoEntidade: TipoEntidade) => {
    setEditingTipoEntidade(tipoEntidade);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingTipoEntidade(null);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingTipoEntidade(null);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingTipoEntidade(null);
  };

  if (showForm) {
    return (
      <TipoEntidadeForm
        editingTipoEntidade={editingTipoEntidade}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <TipoEntidadeList
      onEdit={handleEdit}
      onAddNew={handleAddNew}
    />
  );
}
