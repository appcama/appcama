
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { applyCpfCnpjMask, validateCpfOrCnpj } from '@/lib/cpf-cnpj-utils';
import { Leaf } from 'lucide-react';

export default function Login() {
  const [loginForm, setLoginForm] = useState({ cpfCnpj: '', password: '' });
  const [adesaoForm, setAdesaoForm] = useState({ nome: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyCpfCnpjMask(value);
    setLoginForm(prev => ({ ...prev, cpfCnpj: maskedValue }));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!loginForm.cpfCnpj || !loginForm.password) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    if (!validateCpfOrCnpj(loginForm.cpfCnpj)) {
      toast({
        title: 'Erro',
        description: 'CPF ou CNPJ inválido',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    const result = await login(loginForm.cpfCnpj, loginForm.password);
    
    if (result.success) {
      if (result.needsValidation) {
        navigate('/validate-password');
      } else {
        navigate('/');
      }
      toast({
        title: 'Sucesso',
        description: 'Login realizado com sucesso!'
      });
    } else {
      toast({
        title: 'Erro',
        description: result.error || 'Erro ao fazer login',
        variant: 'destructive'
      });
    }
    
    setLoading(false);
  };

  const handleAdesao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!adesaoForm.nome || !adesaoForm.telefone) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    
    try {
      // Aqui implementaremos o envio por email
      // Por enquanto, simular sucesso
      setTimeout(() => {
        toast({
          title: 'Sucesso',
          description: 'Solicitação de adesão enviada com sucesso!'
        });
        setAdesaoForm({ nome: '', telefone: '' });
        setLoading(false);
      }, 1000);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Erro ao enviar solicitação',
        variant: 'destructive'
      });
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
             {/* <Leaf className="h-12 w-12 text-green-600 mr-2" /> */}
            <h1 className="text-3xl font-bold text-green-800"><img src="/logo.png" alt="Minha Logo" style={{ width: "250px" }} /></h1>
          </div>
          <p className="text-green-600 mr-2">Sistema de Gestão de Reciclagem</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Logar</TabsTrigger>
            <TabsTrigger value="aderir">Aderir</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <Card>
              <CardHeader>
                <CardTitle>Fazer Login</CardTitle>
                <CardDescription>
                  Digite seu CPF ou CNPJ e senha para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cpfCnpj">CPF ou CNPJ</Label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      value={loginForm.cpfCnpj}
                      onChange={handleCpfCnpjChange}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite sua senha"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="aderir">
            <Card>
              <CardHeader>
                <CardTitle>Solicitar Adesão</CardTitle>
                <CardDescription>
                  Preencha seus dados para solicitar adesão ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdesao} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome Completo</Label>
                    <Input
                      id="nome"
                      type="text"
                      value={adesaoForm.nome}
                      onChange={(e) => setAdesaoForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite seu nome completo"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone</Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={adesaoForm.telefone}
                      onChange={(e) => setAdesaoForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      required
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={loading}>
                    {loading ? 'Enviando...' : 'Solicitar Adesão'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
