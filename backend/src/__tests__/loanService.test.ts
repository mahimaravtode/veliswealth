import { describe, it, expect } from 'vitest';
import {
  calculateEMI,
  calculateAmortizationSchedule,
  simulateEMIChange,
  calculateEarlyClosure,
  calculateYearlyBreakdown,
  calculateMonthlyBreakdown,
} from '../services/loanService';

describe('calculateEMI', () => {
  it('should calculate EMI correctly for standard loan', () => {
    const principal = 1000000;
    const monthlyRate = 8.5 / 12 / 100;
    const months = 240;
    const emi = calculateEMI(principal, monthlyRate, months);
    expect(emi).toBeGreaterThan(0);
    expect(emi).toBeCloseTo(8678.23, 0);
  });

  it('should handle zero interest rate', () => {
    const emi = calculateEMI(120000, 0, 12);
    expect(emi).toBe(10000);
  });

  it('should handle 1-month tenure', () => {
    const emi = calculateEMI(100000, 0.01, 1);
    expect(emi).toBeGreaterThan(100000);
  });
});

describe('calculateAmortizationSchedule', () => {
  it('should generate correct schedule for a basic loan', () => {
    const { emi, schedule, totalPayment, totalInterest } = calculateAmortizationSchedule(
      1000000, 8.5, 12, '2024-01-01'
    );
    expect(emi).toBeGreaterThan(0);
    expect(schedule.length).toBe(12);
    expect(totalPayment).toBeGreaterThan(1000000);
    expect(totalInterest).toBeGreaterThan(0);
    expect(schedule[0].balance).toBeLessThan(1000000);
    expect(schedule[schedule.length - 1].balance).toBe(0);
  });

  it('should apply prepayments correctly', () => {
    const prepayments = [{ date: '2024-03-01', amount: 100000 }];
    const withoutPrepay = calculateAmortizationSchedule(1000000, 8.5, 12, '2024-01-01');
    const withPrepay = calculateAmortizationSchedule(1000000, 8.5, 12, '2024-01-01', prepayments);

    expect(withPrepay.totalInterest).toBeLessThan(withoutPrepay.totalInterest);
    expect(withPrepay.schedule.length).toBeLessThanOrEqual(withoutPrepay.schedule.length);
  });

  it('should schedule entries have correct structure', () => {
    const { schedule } = calculateAmortizationSchedule(500000, 9, 6, '2024-06-01');
    for (const item of schedule) {
      expect(item).toHaveProperty('month');
      expect(item).toHaveProperty('emi');
      expect(item).toHaveProperty('principal');
      expect(item).toHaveProperty('interest');
      expect(item).toHaveProperty('balance');
      expect(item).toHaveProperty('date');
      expect(item.interest).toBeGreaterThanOrEqual(0);
      expect(item.principal).toBeGreaterThanOrEqual(0);
      expect(item.balance).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('simulateEMIChange', () => {
  it('should calculate new tenure when EMI is increased', () => {
    const result = simulateEMIChange(1000000, 8.5, 120, 12400, 15000);
    expect(result).not.toBeNull();
    expect(result!.newTenure).toBeLessThan(120);
    expect(result!.interestSaved).toBeGreaterThan(0);
  });

  it('should return null when EMI is too low', () => {
    const result = simulateEMIChange(1000000, 8.5, 120, 12400, 5000);
    expect(result).toBeNull();
  });

  it('should handle EMI equal to current EMI', () => {
    const result = simulateEMIChange(1000000, 8.5, 120, 12400, 12400);
    expect(result).not.toBeNull();
    expect(result!.newTenure).toBe(120);
  });
});

describe('calculateEarlyClosure', () => {
  it('should calculate correct outstanding balance after some payments', () => {
    const emi = calculateEMI(1000000, 8.5 / 12 / 100, 120);
    const result = calculateEarlyClosure(1000000, 8.5, 120, 12, emi);

    expect(result.outstandingBalance).toBeGreaterThan(0);
    expect(result.outstandingBalance).toBeLessThan(1000000);
    expect(result.totalPrincipalPaid).toBeGreaterThan(0);
    expect(result.totalInterestPaid).toBeGreaterThan(0);
    expect(result.remainingEMIs).toBe(108);
  });

  it('should return full loan amount when no payments made', () => {
    const emi = calculateEMI(500000, 9 / 12 / 100, 60);
    const result = calculateEarlyClosure(500000, 9, 60, 0, emi);

    expect(result.outstandingBalance).toBeCloseTo(500000, 0);
    expect(result.totalPaid).toBe(0);
    expect(result.remainingEMIs).toBe(60);
  });
});

describe('calculateYearlyBreakdown', () => {
  it('should group schedule by year correctly', () => {
    const { schedule } = calculateAmortizationSchedule(1000000, 8.5, 24, '2024-01-01');
    const yearly = calculateYearlyBreakdown(schedule);

    expect(yearly.length).toBeGreaterThanOrEqual(1);
    expect(yearly.every(y => y.year > 0)).toBe(true);
    expect(yearly.every(y => y.principal > 0)).toBe(true);
    expect(yearly.every(y => y.interest > 0)).toBe(true);
  });
});

describe('calculateMonthlyBreakdown', () => {
  it('should filter schedule for specific year', () => {
    const { schedule } = calculateAmortizationSchedule(1000000, 8.5, 24, '2024-01-01');
    const year2024 = calculateMonthlyBreakdown(schedule, 2024);

    expect(year2024.every(m => m.year === 2024)).toBe(true);
    expect(year2024.length).toBeGreaterThan(0);
  });

  it('should return empty array for year with no payments', () => {
    const { schedule } = calculateAmortizationSchedule(100000, 8.5, 12, '2024-01-01');
    const year2030 = calculateMonthlyBreakdown(schedule, 2030);
    expect(year2030.length).toBe(0);
  });
});
