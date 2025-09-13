import { useState, useEffect, useCallback } from 'react';
import { useOfflineSync } from './useOfflineSync';
import { offlineDB } from '@/lib/offline-db';
import { supabase } from '@/integrations/supabase/client';

interface UseOfflineQueryOptions {
  table: string;
  query?: string;
  select?: string;
  filters?: Record<string, any>;
  orderBy?: string;
  enabled?: boolean;
}

export function useOfflineQuery<T = any>({ 
  table, 
  query, 
  select = '*',
  filters = {}, 
  orderBy,
  enabled = true 
}: UseOfflineQueryOptions) {
  const { isOnline } = useOfflineSync();
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    if (!enabled) return;
    
    setLoading(true);
    setError(null);

    try {
      if (isOnline) {
        // Try to fetch from Supabase
        let supabaseQuery = (supabase as any).from(table).select(select);
        
        // Apply filters
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            supabaseQuery = supabaseQuery.eq(key, value);
          }
        });

        // Apply ordering
        if (orderBy) {
          supabaseQuery = supabaseQuery.order(orderBy);
        }

        const { data: supabaseData, error: supabaseError } = await supabaseQuery;

        if (supabaseError) throw supabaseError;

        // Cache the data
        if (supabaseData) {
          for (const item of supabaseData) {
            await offlineDB.cacheData(table, item[`id_${table.slice(0, -1)}`] || item.id, item);
          }
        }

        setData(supabaseData || []);
        setLastSync(new Date());
      } else {
        // Fallback to cached data
        console.log(`[OfflineQuery] Offline mode, loading cached data for ${table}`);
        const cachedData = await offlineDB.getCachedData(table);
        setData(cachedData || []);
      }
    } catch (err) {
      console.error(`[OfflineQuery] Error fetching ${table}:`, err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      
      // Try to load cached data as fallback
      try {
        const cachedData = await offlineDB.getCachedData(table);
        setData(cachedData || []);
      } catch (cacheErr) {
        console.error(`[OfflineQuery] Error loading cached data:`, cacheErr);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, table, select, filters, orderBy, isOnline]);

  const refetch = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isCachedData = !isOnline || (data.length > 0 && (data[0] as any)?._cached);

  return {
    data,
    loading,
    error,
    refetch,
    isOnline,
    isCachedData,
    lastSync
  };
}