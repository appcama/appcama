
import { useState } from "react";
import { EntidadeForm } from "./EntidadeForm";
import { EntidadesList } from "./EntidadesList";

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
  num_cpf_cnpj: string;
  nom_razao_social: string | null;
  des_logradouro: string;
  des_bairro: string;
  num_cep: string;
  num_telefone: string | null;
  id_tipo_pessoa: number;
  id_tipo_entidade: number;
  id_tipo_situacao: number;
  id_municipio: number;
  des_status: string;
}

export function EntidadeManagerView() {
  const [editingEntidade, setEditingEntidade] = useState<Entidade | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (entidade: Entidade) => {
    setEditingEntidade(entidade);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingEntidade(null);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingEntidade(null);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingEntidade(null);
  };

  if (showForm) {
    return (
      <EntidadeForm
        editingEntidade={editingEntidade}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <EntidadesList
      onEdit={handleEdit}
      onAddNew={handleAddNew}
    />
  );
}
