
import { useState } from "react";

interface TipoPontoColeta {
  id_tipo_ponto_coleta: number;
  des_tipo_ponto_coleta: string;
  des_status: string;
  des_locked: string;
  id_usuario_criador: number;
  dat_criacao: string;
  id_usuario_atualizador?: number;
  dat_atualizacao?: string;
}

import { TipoPontoColetaForm } from "./TipoPontoColetaForm";
import { TipoPontoColetaList } from "./TipoPontoColetaList";

export function TipoPontoColetaManagerView() {
  const [editingTipoPontoColeta, setEditingTipoPontoColeta] = useState<TipoPontoColeta | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (tipoPontoColeta: TipoPontoColeta) => {
    setEditingTipoPontoColeta(tipoPontoColeta);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingTipoPontoColeta(null);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingTipoPontoColeta(null);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingTipoPontoColeta(null);
  };

  if (showForm) {
    return (
      <TipoPontoColetaForm
        editingTipoPontoColeta={editingTipoPontoColeta}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <TipoPontoColetaList
      onEdit={handleEdit}
      onAddNew={handleAddNew}
    />
  );
}
