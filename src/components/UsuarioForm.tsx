
import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Usuario {
  id_usuario: number;
  des_email: string;
  des_status: string;
  des_locked: string;
  des_senha_validada: string;
  id_entidade: number;
  id_perfil: number;
}

interface UsuarioFormProps {
  onBack: () => void;
  onSuccess: () => void;
  editingUsuario?: Usuario | null;
}

interface Entidade {
  id_entidade: number;
  nom_entidade: string;
}

interface Perfil {
  id_perfil: number;
  nom_perfil: string;
}

export function UsuarioForm({ onBack, onSuccess, editingUsuario }: UsuarioFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [idEntidade, setIdEntidade] = useState<number | null>(null);
  const [idPerfil, setIdPerfil] = useState<number | null>(null);
  const [status, setStatus] = useState("A");

  const { data: entidades } = useQuery({
    queryKey: ['entidades'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entidade')
        .select('id_entidade, nom_entidade')
        .eq('des_status', 'A')
        .order('nom_entidade');

      if (error) throw error;
      return data as Entidade[];
    },
  });

  const { data: perfis } = useQuery({
    queryKey: ['perfis'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('perfil')
        .select('id_perfil, nom_perfil')
        .eq('des_status', 'A')
        .order('nom_perfil');

      if (error) throw error;
      return data as Perfil[];
    },
  });

  useEffect(() => {
    if (editingUsuario) {
      setEmail(editingUsuario.des_email || "");
      setIdEntidade(editingUsuario.id_entidade);
      setIdPerfil(editingUsuario.id_perfil);
      setStatus(editingUsuario.des_status);
      setSenha(""); // Não preencher senha para edição
    }
  }, [editingUsuario]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const userData = {
        des_email: email,
        id_entidade: idEntidade,
        id_perfil: idPerfil,
        des_status: status,
        dat_atualizacao: new Date().toISOString(),
        id_usuario_atualizador: 1 // TODO: Use actual logged user id
      };

      if (editingUsuario) {
        const { error } = await supabase
          .from('usuario')
          .update(userData)
          .eq('id_usuario', editingUsuario.id_usuario);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('usuario')
          .insert({
            ...userData,
            des_senha: senha || '123456789',
            des_senha_validada: 'D',
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1 // TODO: Use actual logged user id
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      toast({
        title: "Sucesso",
        description: editingUsuario 
          ? "Usuário atualizado com sucesso!" 
          : "Usuário criado com sucesso!",
      });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: editingUsuario 
          ? "Erro ao atualizar usuário" 
          : "Erro ao criar usuário",
        variant: "destructive",
      });
      console.error('Erro ao salvar usuário:', error);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Email é obrigatório",
        variant: "destructive",
      });
      return;
    }

    if (!editingUsuario && !senha.trim()) {
      toast({
        title: "Erro",
        description: "Senha é obrigatória para novos usuários",
        variant: "destructive",
      });
      return;
    }

    if (!idEntidade) {
      toast({
        title: "Erro",
        description: "Entidade é obrigatória",
        variant: "destructive",
      });
      return;
    }

    if (!idPerfil) {
      toast({
        title: "Erro",
        description: "Perfil é obrigatório",
        variant: "destructive",
      });
      return;
    }

    saveMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            {editingUsuario ? 'Editar Usuário' : 'Novo Usuário'}
          </CardTitle>
          <CardDescription>
            {editingUsuario 
              ? 'Atualize as informações do usuário' 
              : 'Preencha os dados para criar um novo usuário'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Digite o email"
                  required
                />
              </div>

              {!editingUsuario && (
                <div className="space-y-2">
                  <Label htmlFor="senha">Senha *</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Digite a senha"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="entidade">Entidade *</Label>
                <Select value={idEntidade?.toString() || ""} onValueChange={(value) => setIdEntidade(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma entidade" />
                  </SelectTrigger>
                  <SelectContent>
                    {entidades?.map((entidade) => (
                      <SelectItem key={entidade.id_entidade} value={entidade.id_entidade.toString()}>
                        {entidade.nom_entidade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil *</Label>
                <Select value={idPerfil?.toString() || ""} onValueChange={(value) => setIdPerfil(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    {perfis?.map((perfil) => (
                      <SelectItem key={perfil.id_perfil} value={perfil.id_perfil.toString()}>
                        {perfil.nom_perfil}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A">Ativo</SelectItem>
                    <SelectItem value="D">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={onBack}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending 
                  ? 'Salvando...' 
                  : (editingUsuario ? 'Atualizar' : 'Criar')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
