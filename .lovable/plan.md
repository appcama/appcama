
## Plano: Corrigir Filtro de Eventos no Dashboard

### Problema Identificado

O hook `useEventosVisiveis` filtra eventos pela data de término (`dat_termino >= hoje`), mostrando apenas eventos **vigentes**. 

No banco de dados, todos os eventos ativos têm data de término anterior a 30/01/2026:
- Carnaval de Juazeiro: término 01/01/2026
- Festival Verão 26: término 26/01/2026
- Festival da virada 2026: término 17/01/2026

Por isso, **nenhum evento aparece** no filtro do Dashboard.

### Diferença de Comportamento Esperado

| Tela | Comportamento Esperado |
|------|------------------------|
| Formulário de Coleta | Apenas eventos vigentes (data término >= hoje) |
| Dashboard (filtros) | **Todos os eventos ativos** (inclui passados para histórico) |
| Meus Números (filtros) | **Todos os eventos ativos** (inclui passados para histórico) |

### Solução

Adicionar parâmetro `includeExpired` ao hook `useEventosVisiveis` para permitir incluir eventos passados.

### Arquivos a Modificar

#### 1. `src/hooks/useEventosVisiveis.tsx`

**Adicionar parâmetro opcional:**
```typescript
interface UseEventosVisiveisOptions {
  includeExpired?: boolean; // Se true, inclui eventos com data de término passada
}

export function useEventosVisiveis(options: UseEventosVisiveisOptions = {}) {
  const { includeExpired = false } = options;
```

**Condicionar o filtro por data (linha 44):**
```typescript
// Apenas filtrar por data se não quiser incluir expirados
if (!includeExpired) {
  query = query.gte('dat_termino', today);
}
```

#### 2. `src/components/DashboardFilters.tsx` (linha 37)

**Passar parâmetro para incluir todos eventos:**
```typescript
const { eventos } = useEventosVisiveis({ includeExpired: true });
```

#### 3. `src/components/MeusNumeroFilters.tsx` (linha 26)

**Passar parâmetro para incluir todos eventos:**
```typescript
const { eventos } = useEventosVisiveis({ includeExpired: true });
```

#### 4. `src/components/ColetaForm.tsx` (linha 47)

**Manter comportamento atual (sem parâmetro = apenas vigentes):**
```typescript
const { eventos: eventosVisiveis, loading: eventosLoading } = useEventosVisiveis();
// Sem parâmetro, mantém o padrão: apenas eventos vigentes
```

### Resultado Esperado

| Local | Antes | Depois |
|-------|-------|--------|
| Dashboard | 0 eventos | Todos eventos ativos visíveis |
| Meus Números | 0 eventos | Todos eventos ativos visíveis |
| Formulário Coleta | 0 eventos vigentes | 0 eventos vigentes (correto) |

### Código Final do Hook

```typescript
interface UseEventosVisiveisOptions {
  includeExpired?: boolean;
}

export function useEventosVisiveis(options: UseEventosVisiveisOptions = {}) {
  const { includeExpired = false } = options;
  const { user } = useAuth();
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.isAdmin || user?.entityId === 1;

  useEffect(() => {
    const fetchEventos = async () => {
      if (!user) {
        setEventos([]);
        setLoading(false);
        return;
      }

      try {
        const today = new Date().toISOString().split('T')[0];

        // Base query
        let query = supabase
          .from('evento')
          .select(`
            id_evento, 
            nom_evento, 
            des_logo_url, 
            des_visibilidade,
            usuario_criador:usuario!id_usuario_criador(id_entidade)
          `)
          .eq('des_status', 'A')
          .order('nom_evento');

        // Só filtra por data de término se não quiser incluir expirados
        if (!includeExpired) {
          query = query.gte('dat_termino', today);
        }

        const { data: allEventos, error } = await query;
        // ... resto do código continua igual
      }
    };
    // ...
  }, [user, isAdmin, includeExpired]);
}
```
