
import { useState } from "react";
import { IndicadorList } from "./IndicadorList";
import { IndicadorForm } from "./IndicadorForm";

interface Indicador {
  id_indicador: number;
  nom_indicador: string;
  id_unidade_medida: number;
  qtd_referencia: number | null;
  des_status: string;
}

export function Indicadores() {
  const [view, setView] = useState<'list' | 'form'>('list');
  const [editingIndicador, setEditingIndicador] = useState<Indicador | undefined>();

  const handleEdit = (indicador: Indicador) => {
    setEditingIndicador(indicador);
    setView('form');
  };

  const handleNew = () => {
    setEditingIndicador(undefined);
    setView('form');
  };

  const handleBack = () => {
    setEditingIndicador(undefined);
    setView('list');
  };

  const handleSave = () => {
    setEditingIndicador(undefined);
    setView('list');
  };

  return (
    <>
      {view === 'list' && (
        <IndicadorList onEdit={handleEdit} onNew={handleNew} />
      )}
      {view === 'form' && (
        <IndicadorForm
          editingIndicador={editingIndicador}
          onBack={handleBack}
          onSave={handleSave}
        />
      )}
    </>
  );
}
