import { supabase } from "@/integrations/supabase/client";

const PAGE_SIZE = 1000;

/**
 * Fetches all rows from a Supabase query by paginating through results.
 * The Supabase JS client has a default limit of 1000 rows per query.
 * This function loops with .range() to fetch ALL rows.
 * 
 * @param buildQuery - A function that returns a fresh Supabase query builder each call
 * @returns All rows from the query
 */
export async function fetchAllRows<T = any>(
  buildQuery: () => any
): Promise<T[]> {
  const allRows: T[] = [];
  let offset = 0;

  while (true) {
    const { data, error } = await buildQuery().range(offset, offset + PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    
    allRows.push(...data);
    
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  return allRows;
}
