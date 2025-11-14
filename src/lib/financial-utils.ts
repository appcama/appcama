export function formatFinancialValue(value: number, isVisible: boolean): string {
  if (!isVisible) {
    return 'R$ •••••';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatFinancialValueShort(value: number, isVisible: boolean): string {
  if (!isVisible) {
    return '•••••';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
