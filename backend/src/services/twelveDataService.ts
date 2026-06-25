import axios from 'axios';

const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY;
const BASE_URL = 'https://api.twelvedata.com';

export interface TwelveDataQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  currency: string;
  timestamp: number;
}

export interface TwelveDataCandle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TwelveDataSearchResult {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
  currency: string;
}

export async function fetchTwelveDataQuote(symbol: string): Promise<TwelveDataQuote | null> {
  try {
    const response = await axios.get(`${BASE_URL}/quote`, {
      params: {
        symbol,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    const data = response.data;
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    return {
      symbol: data.symbol,
      name: data.name || data.symbol,
      price: parseFloat(data.close) || 0,
      change: parseFloat(data.change) || 0,
      changePercent: parseFloat(data.percent_change) || 0,
      open: parseFloat(data.open) || 0,
      high: parseFloat(data.high) || 0,
      low: parseFloat(data.low) || 0,
      prevClose: parseFloat(data.previous_close) || 0,
      volume: parseInt(data.volume) || 0,
      currency: data.currency || 'USD',
      timestamp: data.timestamp || Math.floor(Date.now() / 1000),
    };
  } catch (err: any) {
    console.error(`Twelve Data quote error ${symbol}:`, err.message);
    return null;
  }
}

export async function fetchTwelveDataCandle(symbol: string, interval: string = '1day', outputsize: number = 30): Promise<TwelveDataCandle[]> {
  try {
    const intervalMap: Record<string, string> = {
      '1m': '1min',
      '5m': '5min',
      '15m': '15min',
      '30m': '30min',
      '1h': '1h',
      '1d': '1day',
      '1wk': '1week',
      '1mo': '1month',
    };

    const tdInterval = intervalMap[interval] || interval;

    const response = await axios.get(`${BASE_URL}/time_series`, {
      params: {
        symbol,
        interval: tdInterval,
        outputsize,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    const data = response.data;
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    if (!data.values) return [];

    return data.values.map((v: any) => ({
      time: Math.floor(new Date(v.datetime).getTime() / 1000),
      open: parseFloat(v.open),
      high: parseFloat(v.high),
      low: parseFloat(v.low),
      close: parseFloat(v.close),
      volume: parseInt(v.volume) || 0,
    })).reverse();
  } catch (err: any) {
    console.error(`Twelve Data candle error ${symbol}:`, err.message);
    return [];
  }
}

export async function fetchTwelveDataSearch(symbol: string): Promise<TwelveDataSearchResult[]> {
  try {
    const response = await axios.get(`${BASE_URL}/symbol_search`, {
      params: {
        symbol,
        apikey: TWELVE_DATA_API_KEY,
      },
    });

    const data = response.data;
    if (data.status === 'error') {
      throw new Error(data.message);
    }

    if (!data.data) return [];

    return data.data.map((s: any) => ({
      symbol: s.symbol,
      name: s.instrument_name,
      exchange: s.exchange,
      type: s.instrument_type,
      currency: s.currency,
    }));
  } catch (err: any) {
    console.error(`Twelve Data search error:`, err.message);
    return [];
  }
}
