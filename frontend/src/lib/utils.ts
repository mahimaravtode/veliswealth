import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(val: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
}

export function formatCurrencyDec(val: number): string {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
}

export function formatCompact(val: number): string {
  if (val >= 1e12) return `₹${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e7) return `₹${(val / 1e7).toFixed(2)}Cr`;
  if (val >= 1e5) return `₹${(val / 1e5).toFixed(2)}L`;
  if (val >= 1e3) return `₹${(val / 1e3).toFixed(1)}K`;
  return formatCurrency(val);
}

export function formatVolume(val: number): string {
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(2)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return val?.toLocaleString() || '-';
}

export function formatPercent(val: number): string {
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
