
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
import { useBreakpoints } from '@/hooks/use-breakpoints';
import { cn } from '@/lib/utils';

export default function Login() {
  const [loginForm, setLoginForm] = useState({ cpfCnpj: '', password: '' });
  const [adesaoForm, setAdesaoForm] = useState({ nome: '', telefone: '' });
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isMobile } = useBreakpoints();

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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-recycle-green-light to-eco-blue/10 p-4">
      <div className={cn(
        "w-full",
        isMobile ? "max-w-sm" : "max-w-md"
      )}>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <div className={cn(
              "flex items-center justify-center",
              isMobile ? "mb-2" : "mb-4"
            )}>
              <img 
                src="/horizontallogo.png" 
                alt="ReciclaÊ Logo" 
                className={cn(
                  "object-contain",
                  isMobile ? "h-16 w-auto" : "h-20 w-auto"
                )}
              />
            </div>
          </div>
          <p className={cn(
            "text-gray-600 font-medium",
            isMobile ? "text-sm" : "text-base"
          )}>
            Sistema de Gestão de Reciclagem
          </p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className={cn(
            "grid w-full grid-cols-2",
            isMobile ? "h-12" : "h-10"
          )}>
            <TabsTrigger 
              value="login" 
              className={cn(
                "text-sm font-medium",
                isMobile && "min-h-[44px]"
              )}
            >
              Logar
            </TabsTrigger>
            <TabsTrigger 
              value="aderir"
              className={cn(
                "text-sm font-medium",
                isMobile && "min-h-[44px]"
              )}
            >
              Aderir
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-4">
            <Card>
              <CardHeader className={cn(isMobile ? "pb-4" : "pb-6")}>
                <CardTitle className={cn(
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  Fazer Login
                </CardTitle>
                <CardDescription className={cn(
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Digite seu CPF ou CNPJ e senha para acessar o sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="space-y-6">
                  <div className="space-y-2">
                    <Label 
                      htmlFor="cpfCnpj"
                      className="text-sm font-medium"
                    >
                      CPF ou CNPJ
                    </Label>
                    <Input
                      id="cpfCnpj"
                      type="text"
                      value={loginForm.cpfCnpj}
                      onChange={handleCpfCnpjChange}
                      placeholder="000.000.000-00 ou 00.000.000/0000-00"
                      maxLength={18}
                      required
                      className={cn(
                        "text-base",
                        isMobile && "min-h-[44px] text-[16px]"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label 
                      htmlFor="password"
                      className="text-sm font-medium"
                    >
                      Senha
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Digite sua senha"
                      required
                      className={cn(
                        "text-base",
                        isMobile && "min-h-[44px] text-[16px]"
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full font-medium",
                      isMobile ? "min-h-[44px] text-base" : "h-10"
                    )} 
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="aderir" className="mt-4">
            <Card>
              <CardHeader className={cn(isMobile ? "pb-4" : "pb-6")}>
                <CardTitle className={cn(
                  isMobile ? "text-lg" : "text-xl"
                )}>
                  Solicitar Adesão
                </CardTitle>
                <CardDescription className={cn(
                  isMobile ? "text-sm" : "text-base"
                )}>
                  Preencha seus dados para solicitar adesão ao sistema
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdesao} className="space-y-6">
                  <div className="space-y-2">
                    <Label 
                      htmlFor="nome"
                      className="text-sm font-medium"
                    >
                      Nome Completo
                    </Label>
                    <Input
                      id="nome"
                      type="text"
                      value={adesaoForm.nome}
                      onChange={(e) => setAdesaoForm(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Digite seu nome completo"
                      required
                      className={cn(
                        "text-base",
                        isMobile && "min-h-[44px] text-[16px]"
                      )}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label 
                      htmlFor="telefone"
                      className="text-sm font-medium"
                    >
                      Telefone
                    </Label>
                    <Input
                      id="telefone"
                      type="tel"
                      value={adesaoForm.telefone}
                      onChange={(e) => setAdesaoForm(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(00) 00000-0000"
                      required
                      className={cn(
                        "text-base",
                        isMobile && "min-h-[44px] text-[16px]"
                      )}
                    />
                  </div>
                  
                  <Button 
                    type="submit" 
                    className={cn(
                      "w-full font-medium",
                      isMobile ? "min-h-[44px] text-base" : "h-10"
                    )} 
                    disabled={loading}
                  >
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
