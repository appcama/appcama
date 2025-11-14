import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface FinancialPrivacyContextType {
  showFinancialValues: boolean;
  toggleFinancialValues: () => void;
}

const FinancialPrivacyContext = createContext<FinancialPrivacyContextType | undefined>(undefined);

const STORAGE_KEY = 'financial-privacy-visible';

export function FinancialPrivacyProvider({ children }: { children: ReactNode }) {
  const [showFinancialValues, setShowFinancialValues] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'true'; // Default: false (oculto)
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, String(showFinancialValues));
  }, [showFinancialValues]);

  const toggleFinancialValues = () => {
    setShowFinancialValues(prev => !prev);
  };

  return (
    <FinancialPrivacyContext.Provider value={{ showFinancialValues, toggleFinancialValues }}>
      {children}
    </FinancialPrivacyContext.Provider>
  );
}

export function useFinancialPrivacy() {
  const context = useContext(FinancialPrivacyContext);
  if (context === undefined) {
    throw new Error('useFinancialPrivacy must be used within a FinancialPrivacyProvider');
  }
  return context;
}
