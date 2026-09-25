import { useState, useCallback } from "react";
import { RelatorioFiltersType } from "@/components/RelatorioFilters";

export const getDefaultRelatorioFilters = (): RelatorioFiltersType => {
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  const start = new Date();
  start.setDate(start.getDate() - 30);
  start.setHours(0, 0, 0, 0);
  return {
    dataInicial: start,
    dataFinal: end,
    statusColetas: 'A',
  };
};

export function useRelatorioFilters() {
  const [filters, setFilters] = useState<RelatorioFiltersType>(getDefaultRelatorioFilters());

  const updateFilters = useCallback((newFilters: RelatorioFiltersType) => {
    setFilters(newFilters);
  }, []);

  const updateFilter = useCallback((key: keyof RelatorioFiltersType, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const removeFilter = useCallback((key: keyof RelatorioFiltersType) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(getDefaultRelatorioFilters());
  }, []);

  const hasActiveFilters = Object.keys(filters).length > 0;

  return {
    filters,
    updateFilters,
    updateFilter,
    removeFilter,
    resetFilters,
    hasActiveFilters
  };
}