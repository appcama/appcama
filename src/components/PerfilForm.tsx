
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";


interface Perfil {
  id_perfil: number;
  nom_perfil: string;
  des_status: string;
  des_locked: string;
  dat_criacao: string;
  dat_atualizacao?: string;
  id_usuario_criador: number;
  id_usuario_atualizador?: number;
}

interface PerfilFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingPerfil?: Perfil | null;
}

export function PerfilForm({ onBack, onSuccess, editingPerfil }: PerfilFormProps) {
  const [formData, setFormData] = useState({
    nom_perfil: "",
  });
  const { toast } = useToast();
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingPerfil) {
      setFormData({
        nom_perfil: editingPerfil.nom_perfil || "",
      });
    }
  }, [editingPerfil]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.nom_perfil.trim()) {
      toast({
        title: "Erro de validação",
        description: "Nome do perfil é obrigatório",
        variant: "destructive",
      });
      return false;
    }

    if (formData.nom_perfil.length > 100) {
      toast({
        title: "Erro de validação",
        description: "Nome do perfil deve ter no máximo 100 caracteres",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const data = {
        nom_perfil: formData.nom_perfil,
      };

      if (editingPerfil) {
        const { error } = await supabase
          .from('perfil')
          .update({
            nom_perfil: data.nom_perfil,
            dat_atualizacao: new Date().toISOString(),
            id_usuario_atualizador: 1,
          })
          .eq('id_perfil', editingPerfil.id_perfil);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('perfil')
          .insert({
            nom_perfil: data.nom_perfil,
            des_status: 'A',
            des_locked: 'D',
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1,
          });
        if (error) throw error;
      }

      toast({
        title: "Sucesso",
        description: `Perfil ${editingPerfil ? 'atualizado' : 'criado'} com sucesso!`,
      });
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao salvar perfil:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao salvar perfil.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <CardTitle>
          {editingPerfil ? "Editar Perfil" : "Novo Perfil"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="nom_perfil">
                Nome do Perfil <span className="text-red-500">*</span>
              </Label>
              <Input
                id="nom_perfil"
                type="text"
                value={formData.nom_perfil}
                onChange={(e) => handleInputChange('nom_perfil', e.target.value)}
                placeholder="Digite o nome do perfil"
                maxLength={100}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={onBack}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
