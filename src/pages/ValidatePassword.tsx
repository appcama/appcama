
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Leaf, Mail, Shield } from 'lucide-react';

export default function ValidatePassword() {
  const [form, setForm] = useState({
    validationCode: '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const { user, validatePassword } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.validationCode || !form.password || !form.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    if (form.password !== form.confirmPassword) {
      toast({
        title: 'Erro',
        description: 'As senhas não coincidem',
        variant: 'destructive'
      });
      return;
    }

    if (form.password.length < 6) {
      toast({
        title: 'Erro',
        description: 'A senha deve ter pelo menos 6 caracteres',
        variant: 'destructive'
      });
      return;
    }

    if (!user) {
      toast({
        title: 'Erro',
        description: 'Usuário não encontrado',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // First validate the token
      const { data: tokenValid, error: tokenError } = await supabase
        .rpc('validate_user_token', {
          user_id_param: user.id,
          token_param: form.validationCode
        });

      if (tokenError || !tokenValid) {
        toast({
          title: 'Erro',
          description: 'Código de validação inválido ou expirado',
          variant: 'destructive'
        });
        return;
      }

      // If token is valid, update password
      const result = await validatePassword(user.id, form.password);
      
      if (result.success) {
        toast({
          title: 'Sucesso',
          description: 'Senha validada com sucesso! Redirecionando...'
        });
        
        // Small delay to show success message
        setTimeout(() => {
          navigate('/');
        }, 1500);
      } else {
        toast({
          title: 'Erro',
          description: result.error || 'Erro ao validar senha',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro inesperado ao validar token',
        variant: 'destructive'
      });
      console.error('Token validation error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Leaf className="h-12 w-12 text-green-600 mr-2" />
            <h1 className="text-3xl font-bold text-green-800">ReciclaSystem</h1>
          </div>
          <p className="text-gray-600">Validação de Conta</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Validar Nova Senha</span>
            </CardTitle>
            <CardDescription>
              Digite o código de validação enviado por email e defina sua nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <Mail className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">Verifique seu email</p>
                  <p className="text-blue-600">
                    Enviamos um código de 6 dígitos para <strong>{user?.email}</strong>. 
                    O código é válido por 24 horas.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="validationCode">Código de Validação</Label>
                <Input
                  id="validationCode"
                  type="text"
                  value={form.validationCode}
                  onChange={(e) => setForm(prev => ({ ...prev, validationCode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-lg tracking-widest font-mono"
                  required
                />
                <p className="text-xs text-gray-500">Digite o código de 6 dígitos recebido por email</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                  placeholder="Digite sua nova senha"
                  minLength={6}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Confirme sua nova senha"
                  minLength={6}
                  required
                />
              </div>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800">
                  <strong>Dica de segurança:</strong> Use uma senha forte com pelo menos 6 caracteres, 
                  combinando letras, números e símbolos.
                </p>
              </div>
              
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Validando...' : 'Validar e Definir Senha'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-500">
            Não recebeu o email? Verifique sua caixa de spam ou entre em contato com o administrador.
          </p>
        </div>
      </div>
    </div>
  );
}
