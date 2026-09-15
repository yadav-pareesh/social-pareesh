import { useCallback, useEffect, useState } from 'react';

interface UseAsyncState<T> {
  status: 'idle' | 'pending' | 'success' | 'error';
  data: T | null;
  error: Error | null;
}

export const useAsync = <T,>(
  asyncFunction: () => Promise<T>,
  immediate: boolean = true
): UseAsyncState<T> & { execute: () => Promise<void> } => {
  const [state, setState] = useState<UseAsyncState<T>>({
    status: immediate ? 'pending' : 'idle',
    data: null,
    error: null,
  });

  const execute = useCallback(async () => {
    setState((prev) => (prev.status === 'pending' ? prev : { status: 'pending', data: null, error: null }));
    try {
      const response = await asyncFunction();
      setState({ status: 'success', data: response, error: null });
    } catch (error) {
      setState({
        status: 'error',
        data: null,
        error: error instanceof Error ? error : new Error(String(error)),
      });
    }
  }, [asyncFunction]);

  useEffect(() => {
    let isSubscribed = true;
    if (immediate) {
      asyncFunction()
        .then((response) => {
          if (isSubscribed) {
            setState({ status: 'success', data: response, error: null });
          }
        })
        .catch((err) => {
          if (isSubscribed) {
            setState({
              status: 'error',
              data: null,
              error: err instanceof Error ? err : new Error(String(err)),
            });
          }
        });
    }
    return () => {
      isSubscribed = false;
    };
  }, [asyncFunction, immediate]);

  return { ...state, execute };
};