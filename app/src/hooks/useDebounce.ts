import { useEffect, useState } from 'react';

// Só "confirma" o valor depois de `atrasoMs` sem mudanças (usado na busca).
export function useDebounce<T>(valor: T, atrasoMs = 400): T {
  const [debounced, setDebounced] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(valor), atrasoMs);
    return () => clearTimeout(t);
  }, [valor, atrasoMs]);
  return debounced;
}
