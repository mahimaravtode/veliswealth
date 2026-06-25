import { useEffect, useRef, useState } from 'react';
import { API_BASE } from '@/lib/config';

export function useMarketStream(onMessage?: (data: Record<string, unknown>) => void) {
  const [connected, setConnected] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onMsg = onMessage;
    function connect() {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const es = new EventSource(`${API_BASE}/market/stream`);
      eventSourceRef.current = es;

      es.onopen = () => setConnected(true);

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'connected') return;
          onMsg?.(data);
        } catch { /* parse error, ignore */ }
      };

      es.onerror = () => {
        setConnected(false);
        es.close();
        reconnectTimeout.current = setTimeout(connect, 5000);
      };
    }

    connect();
    return () => {
      eventSourceRef.current?.close();
      clearTimeout(reconnectTimeout.current);
    };
  }, [onMessage]);

  return { connected };
}
