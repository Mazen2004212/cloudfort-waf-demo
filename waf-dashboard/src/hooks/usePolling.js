import { useState, useEffect, useCallback } from "react";

/**
 * Polls an async fetcher function every `interval` ms.
 * Returns { data, loading, error, refresh }.
 */
export function usePolling(fetcher, interval = 5000) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const result = await fetcher();
      setData(result);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [fetcher]);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, interval);
    return () => clearInterval(id);
  }, [refresh, interval]);

  return { data, loading, error, refresh };
}
