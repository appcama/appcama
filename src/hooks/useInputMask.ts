
import { useState, useCallback } from 'react';

export function useDecimalMask(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);

  const formatDecimal = useCallback((inputValue: string) => {
    // Remove tudo que não é dígito
    let numbers = inputValue.replace(/\D/g, '');
    
    // Se estiver vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter 2 casas decimais
    const numberValue = parseInt(numbers) / 100;
    
    // Formata com 2 casas decimais
    return numberValue.toFixed(2);
  }, []);

  const handleChange = useCallback((inputValue: string) => {
    const formatted = formatDecimal(inputValue);
    setValue(formatted);
    return formatted;
  }, [formatDecimal]);

  return { value, handleChange, setValue };
}

export function useCurrencyMask(initialValue: string = '') {
  const [value, setValue] = useState(initialValue);

  const formatCurrency = useCallback((inputValue: string) => {
    // Remove tudo que não é dígito
    let numbers = inputValue.replace(/\D/g, '');
    
    // Se estiver vazio, retorna vazio
    if (!numbers) return '';
    
    // Converte para número e divide por 100 para ter 2 casas decimais
    const numberValue = parseInt(numbers) / 100;
    
    // Formata como moeda brasileira
    return numberValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }, []);

  const handleChange = useCallback((inputValue: string) => {
    const formatted = formatCurrency(inputValue);
    setValue(formatted);
    return formatted;
  }, [formatCurrency]);

  const getNumericValue = useCallback(() => {
    const numbers = value.replace(/\D/g, '');
    return numbers ? parseInt(numbers) / 100 : 0;
  }, [value]);

  return { value, handleChange, setValue, getNumericValue };
}
