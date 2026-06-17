import { useEffect, useRef } from 'react';

const SSE_URL = 'http://localhost:5000/api/market/stream';

export function useMarketStream(onData: (data: any) => void) {
  const esRef = useRef<EventSource | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    const connect = () => {
      if (esRef.current) {
        esRef.current.close();
      }

      const es = new EventSource(SSE_URL);
      esRef.current = es;

      es.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          onData(data);
        } catch { /* ignore parse errors */ }
      };

      es.onerror = () => {
        es.close();
        reconnectTimer.current = setTimeout(connect, 3000);
      };
    };

    connect();
    return () => {
      esRef.current?.close();
      clearTimeout(reconnectTimer.current);
    };
  }, [onData]);
}
