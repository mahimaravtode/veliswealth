import { useEffect, useRef, useState, useCallback } from 'react';
import { createChart, ColorType, CrosshairMode, CandlestickSeries, HistogramSeries, type IChartApi, type ISeriesApi } from 'lightweight-charts';
import { Loader2 } from 'lucide-react';
import { apiRequest } from '@/lib/api';

interface CandleData {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface CandlestickChartProps {
  symbol: string;
  range?: string;
  interval?: string;
  height?: number;
  onCandleHover?: (data: { open: number; high: number; low: number; close: number; volume: number; time: string } | null) => void;
}

const TIMEFRAMES = [
  { label: '1D', range: '1d', interval: '5m' },
  { label: '5D', range: '5d', interval: '15m' },
  { label: '1M', range: '1mo', interval: '15m' },
  { label: '3M', range: '3mo', interval: '1h' },
  { label: '6M', range: '6mo', interval: '1d' },
  { label: '1Y', range: '1y', interval: '1d' },
  { label: '5Y', range: '5y', interval: '1wk' },
];

const INTERVALS = [
  { label: '5m', value: '5m' },
  { label: '15m', value: '15m' },
  { label: '30m', value: '30m' },
  { label: '1h', value: '1h' },
  { label: '1d', value: '1d' },
  { label: '1wk', value: '1wk' },
];

export default function CandlestickChart({
  symbol,
  range: initialRange = '1mo',
  interval: initialInterval = '15m',
  height = 480,
  onCandleHover,
}: CandlestickChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const disposedRef = useRef(false);
  const [loading, setLoading] = useState(false);
  const [activeRange, setActiveRange] = useState(initialRange);
  const [activeInterval, setActiveInterval] = useState(initialInterval);
  const [prediction, setPrediction] = useState<{ type: 'BUY' | 'SELL' | 'NEUTRAL'; reason: string } | null>(null);
  const [chartReady, setChartReady] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    setActiveRange(initialRange);
  }, [initialRange]);

  const isDark = document.documentElement.classList.contains('dark');

  const initChart = useCallback(() => {
    if (!chartContainerRef.current) return;

    // Ensure container has width before creating chart
    const container = chartContainerRef.current;
    if (container.clientWidth === 0) {
      container.style.width = '100%';
    }

    // Create chart
    const bgColor = isDark ? '#09090b' : '#ffffff';
    const textColor = isDark ? '#a1a1aa' : '#71717a';
    const gridColor = isDark ? 'rgba(63, 63, 70, 0.2)' : 'rgba(229, 231, 235, 0.5)';

    const chart = createChart(container, {
      width: container.clientWidth || 600,
      layout: {
        background: { type: ColorType.Solid, color: bgColor },
        textColor: textColor,
        fontFamily: "'Inter', -apple-system, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: gridColor },
        horzLines: { color: gridColor },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: {
          width: 1,
          color: isDark ? 'rgba(161, 161, 170, 0.3)' : 'rgba(113, 113, 122, 0.3)',
          labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
        },
        horzLine: {
          width: 1,
          color: isDark ? 'rgba(161, 161, 170, 0.3)' : 'rgba(113, 113, 122, 0.3)',
          labelBackgroundColor: isDark ? '#27272a' : '#f4f4f5',
        },
      },
      rightPriceScale: {
        visible: true,
        borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        visible: true,
        borderColor: isDark ? 'rgba(63, 63, 70, 0.5)' : 'rgba(229, 231, 235, 0.8)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderUpColor: '#22c55e',
      borderDownColor: '#ef4444',
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;
    disposedRef.current = false;
    setChartReady(true);

    if (onCandleHover) {
      chart.subscribeCrosshairMove((param) => {
        if (!param.time || !param.seriesData) {
          onCandleHover(null);
          return;
        }
        const candleData = param.seriesData.get(candleSeries);
        const volData = param.seriesData.get(volumeSeries);
        if (candleData) {
          const d = candleData as unknown as CandleData;
          const timeStr = new Date((param.time as number) * 1000).toLocaleString('en-IN');
          onCandleHover({
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
            volume: (volData as unknown as { value?: number })?.value || 0,
            time: timeStr,
          });
        }
      });
    }

    const handleResize = () => {
      if (chartContainerRef.current && chartRef.current && !disposedRef.current) {
        const width = chartContainerRef.current.clientWidth;
        if (width > 0) {
          chart.applyOptions({ width });
        }
      }
    };

    window.addEventListener('resize', handleResize);
    // Delay initial resize to ensure container has dimensions
    setTimeout(handleResize, 50);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      setChartReady(false);
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      chartRef.current = null;
      if (!disposedRef.current) {
        disposedRef.current = true;
        chart.remove();
      }
    };
  }, [isDark, onCandleHover]);

  useEffect(() => {
    const cleanup = initChart();
    return () => {
      cleanup?.();
    };
  }, [initChart]);

  useEffect(() => {
    if (!symbol || !chartReady) return;

    let cancelled = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;

    function updateChart(data: CandleData[]) {
      if (cancelled || !candleSeriesRef.current || !volumeSeriesRef.current || !chartRef.current || disposedRef.current) return;

      if (data && data.length > 1) {
        const last = data[data.length - 1];
        const secondLast = data[data.length - 2];
        if (last.close > secondLast.high) setPrediction({ type: 'BUY', reason: 'High Break' });
        else if (last.close < secondLast.low) setPrediction({ type: 'SELL', reason: 'Low Break' });
        else setPrediction({ type: 'NEUTRAL', reason: 'Consolidating' });

        const sortedData = [...data].sort((a, b) => a.time - b.time);
        
        candleSeriesRef.current.setData(sortedData.map(d => ({
          time: d.time as any,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
        })));

        volumeSeriesRef.current.setData(sortedData.map(d => ({
          time: d.time as any,
          value: d.volume,
          color: d.close >= d.open
            ? (isDark ? 'rgba(34, 197, 94, 0.3)' : 'rgba(34, 197, 94, 0.2)')
            : (isDark ? 'rgba(239, 68, 68, 0.3)' : 'rgba(239, 68, 68, 0.2)'),
        })));

        chartRef.current.timeScale().fitContent();
      } else {
        candleSeriesRef.current?.setData([]);
        volumeSeriesRef.current?.setData([]);
        setPrediction(null);
      }
    }

    async function fetchData(showLoading = true) {
      if (!chartRef.current || !candleSeriesRef.current || !volumeSeriesRef.current || disposedRef.current) return;
      
      if (showLoading) setLoading(true);
      try {
        const data: CandleData[] = await apiRequest(
          `/yahoo/candle/${encodeURIComponent(symbol)}?range=${activeRange}&interval=${activeInterval}`
        );

        if (!cancelled) {
          updateChart(data);
          setLastUpdated(new Date());
        }
      } catch (err) {
        console.error('Fetch error:', err);
        if (!cancelled && candleSeriesRef.current && volumeSeriesRef.current && !disposedRef.current) {
          candleSeriesRef.current.setData([]);
          volumeSeriesRef.current.setData([]);
        }
      } finally {
        if (!cancelled && showLoading) setLoading(false);
      }
    }

    fetchData(true);

    const isIntraday = ['5m', '15m', '30m', '1h'].includes(activeInterval);
    const pollMs = isIntraday ? 30_000 : 300_000;
    pollTimer = setInterval(() => fetchData(false), pollMs);

    return () => {
      cancelled = true;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [symbol, activeRange, activeInterval, chartReady, isDark]);

  return (
    <div className="relative w-full">
      {/* Timeframe Selector & Prediction */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <div className="flex gap-0.5">
            {TIMEFRAMES.map(tf => (
              <button
                key={tf.range}
                className={`px-2.5 py-1 text-[10px] font-semibold rounded transition-all ${
                  activeRange === tf.range && activeInterval === tf.interval
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => {
                  setActiveRange(tf.range);
                  setActiveInterval(tf.interval);
                }}
              >
                {tf.label}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border mx-1" />

          <div className="flex gap-0.5">
            {INTERVALS.map(int => (
              <button
                key={int.value}
                className={`px-2 py-1 text-[10px] font-medium rounded transition-all ${
                  activeInterval === int.value && TIMEFRAMES.find(tf => tf.range === activeRange)?.interval !== int.value
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                onClick={() => setActiveInterval(int.value)}
              >
                {int.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/30">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            LIVE
          </span>
          {lastUpdated && (
            <span className="text-[9px] text-muted-foreground">
              {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          {prediction && (
            <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all animate-in fade-in zoom-in duration-500 ${
              prediction.type === 'BUY' 
                ? 'bg-success/10 text-success border-success/30' 
                : prediction.type === 'SELL'
                  ? 'bg-destructive/10 text-destructive border-destructive/30'
                  : 'bg-muted text-muted-foreground border-border'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full bg-current ${prediction.type !== 'NEUTRAL' ? 'animate-pulse' : ''}`} />
              {prediction.type}: {prediction.reason}
            </div>
          )}
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative rounded-xl overflow-hidden border border-border/50 bg-card">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-sm">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={chartContainerRef} style={{ height, minHeight: height, width: '100%' }} />
      </div>
    </div>
  );
}
