
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

export function useViaCep() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const searchCep = async (cep: string): Promise<ViaCepResponse | null> => {
    if (!cep || cep.replace(/\D/g, '').length !== 8) {
      return null;
    }

    const cleanCep = cep.replace(/\D/g, '');
    setLoading(true);

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data: ViaCepResponse = await response.json();

      if (data.erro) {
        toast({
          title: "CEP não encontrado",
          description: "O CEP informado não foi encontrado",
          variant: "destructive",
        });
        return null;
      }

      return data;
    } catch (error) {
      console.error('Erro ao consultar CEP:', error);
      toast({
        title: "Erro",
        description: "Erro ao consultar CEP. Tente novamente.",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { searchCep, loading };
}
