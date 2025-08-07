import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";
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
  const [emailSent, setEmailSent] = useState(false);

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
      setEmailSent(false);
    }
  }, [editingUsuario]);

  const sendValidationEmail = async (userId: number, userEmail: string) => {
    try {
      console.log('Sending validation email for user:', { userId, userEmail });
      
      const { data, error } = await supabase.functions.invoke('send-validation-email', {
        body: {
          userId: userId,
          email: userEmail,
          userName: userEmail.split('@')[0] // Use email username as display name
        }
      });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.success) {
        console.error('Email function returned error:', data);
        throw new Error(data?.error || 'Failed to send validation email');
      }

      console.log('Validation email sent successfully:', data);
      return data;
    } catch (error) {
      console.error('Error sending validation email:', error);
      throw error;
    }
  };

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
        return { isNew: false, userId: editingUsuario.id_usuario };
      } else {
        const { data, error } = await supabase
          .from('usuario')
          .insert({
            ...userData,
            des_senha: senha || '123456789',
            des_senha_validada: 'D',
            dat_criacao: new Date().toISOString(),
            id_usuario_criador: 1 // TODO: Use actual logged user id
          })
          .select('id_usuario')
          .single();

        if (error) throw error;
        return { isNew: true, userId: data.id_usuario };
      }
    },
    onSuccess: async (result) => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      
      if (result.isNew) {
        try {
          await sendValidationEmail(result.userId, email);
          setEmailSent(true);
          toast({
            title: "Usuário criado com sucesso!",
            description: "Email de validação enviado para " + email,
          });
        } catch (emailError: any) {
          console.error('Email error details:', emailError);
          
          let errorDescription = "Usuário criado, mas houve erro ao enviar email de validação";
          
          if (emailError.message?.includes('RESEND_API_KEY')) {
            errorDescription = "Usuário criado, mas API key do Resend não está configurada";
          } else if (emailError.message?.includes('domain')) {
            errorDescription = "Usuário criado, mas há problema com o domínio do email";
          }
          
          toast({
            title: "Usuário criado com avisos",
            description: errorDescription,
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Sucesso",
          description: "Usuário atualizado com sucesso!",
        });
        onSuccess();
      }
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

  if (emailSent) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-green-800">Usuário Criado com Sucesso!</CardTitle>
            <CardDescription>
              Email de validação enviado
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Mail className="h-5 w-5 text-green-600" />
                <span className="font-medium text-green-800">Email enviado para:</span>
              </div>
              <p className="text-green-700 font-mono">{email}</p>
            </div>
            
            <div className="text-left space-y-2 text-sm text-gray-600">
              <p><strong>O que fazer agora:</strong></p>
              <ol className="list-decimal list-inside space-y-1 ml-4">
                <li>O usuário deve verificar seu email</li>
                <li>Fazer login com email e senha temporária: <code className="bg-gray-100 px-2 py-1 rounded">123456789</code></li>
                <li>Inserir o código de validação recebido por email</li>
                <li>Definir uma nova senha</li>
              </ol>
            </div>

            <div className="flex justify-center space-x-2 pt-4">
              <Button onClick={() => {
                setEmailSent(false);
                onSuccess();
              }}>
                Criar Outro Usuário
              </Button>
              <Button variant="outline" onClick={onSuccess}>
                Voltar para Lista
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

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
              : 'Preencha os dados para criar um novo usuário. Um email de validação será enviado.'}
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
                  <Label htmlFor="senha">Senha Temporária</Label>
                  <Input
                    id="senha"
                    type="password"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="Deixe em branco para usar padrão (123456789)"
                  />
                  <p className="text-xs text-gray-500">
                    Se não informada, será usada a senha padrão: 123456789
                  </p>
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
                  : (editingUsuario ? 'Atualizar' : 'Criar e Enviar Email')
                }
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
