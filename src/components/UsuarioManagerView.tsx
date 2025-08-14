
import { useState } from "react";
import { UsuarioForm } from "./UsuarioForm";
import { UsuariosList } from "./UsuariosList";

interface Usuario {
  id_usuario: number;
  nom_usuario: string;
  des_email: string;
  id_perfil: number;
  des_status: string;
}

export function UsuarioManagerView() {
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [showForm, setShowForm] = useState(false);

  const handleEdit = (usuario: Usuario) => {
    setEditingUsuario(usuario);
    setShowForm(true);
  };

  const handleAddNew = () => {
    setEditingUsuario(null);
    setShowForm(true);
  };

  const handleBack = () => {
    setShowForm(false);
    setEditingUsuario(null);
  };

  const handleSuccess = () => {
    setShowForm(false);
    setEditingUsuario(null);
  };

  if (showForm) {
    return (
      <UsuarioForm
        editingUsuario={editingUsuario}
        onBack={handleBack}
        onSuccess={handleSuccess}
      />
    );
  }

  return (
    <UsuariosList
      onEdit={handleEdit}
      onAddNew={handleAddNew}
    />
  );
}
