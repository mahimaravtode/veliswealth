const calculateEMI = (principal, monthlyRate, months) => {
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
};

const calculateAmortizationSchedule = (loanAmount, interestRate, tenureMonths, startDate, prepayments = []) => {
  const monthlyRate = interestRate / 12 / 100;
  const emi = calculateEMI(loanAmount, monthlyRate, tenureMonths);
  let balance = loanAmount;
  const schedule = [];
  const sortedPrepayments = [...prepayments].sort((a, b) => new Date(a.date) - new Date(b.date));
  let prepayIndex = 0;
  const start = new Date(startDate);

  for (let i = 1; i <= tenureMonths && balance > 0; i++) {
    const interestPayment = balance * monthlyRate;
    let principalPayment = emi - interestPayment;

    const currentDate = new Date(start);
    currentDate.setMonth(currentDate.getMonth() + i);

    while (prepayIndex < sortedPrepayments.length) {
      const pp = sortedPrepayments[prepayIndex];
      const ppDate = new Date(pp.date);
      if (ppDate <= currentDate) {
        balance = Math.max(0, balance - pp.amount);
        prepayIndex++;
        if (balance <= 0) break;
      } else {
        break;
      }
    }

    if (balance <= 0) break;
    if (principalPayment > balance) principalPayment = balance;
    balance = Math.max(0, balance - principalPayment);

    schedule.push({
      month: i,
      year: currentDate.getFullYear(),
      monthOfYear: currentDate.getMonth() + 1,
      emi,
      principal: principalPayment,
      interest: interestPayment,
      balance,
      date: currentDate,
    });
  }

  return { emi, schedule, totalPayment: schedule.reduce((s, r) => s + r.emi, 0), totalInterest: schedule.reduce((s, r) => s + r.interest, 0) };
};

const simulateEMIChange = (loanAmount, interestRate, tenureMonths, currentEmi, newEmi) => {
  const monthlyRate = interestRate / 12 / 100;
  let balance = loanAmount;
  let months = 0;
  let totalInterest = 0;

  while (balance > 0 && months < 600) {
    const interest = balance * monthlyRate;
    totalInterest += interest;
    const principal = newEmi - interest;
    if (principal <= 0) return null;
    balance = Math.max(0, balance - principal);
    months++;
  }

  const originalTotal = currentEmi * tenureMonths;
  const originalInterest = originalTotal - loanAmount;
  return {
    newTenure: months,
    totalInterest,
    interestSaved: Math.max(0, originalInterest - totalInterest),
    totalSaved: Math.max(0, originalTotal - loanAmount - totalInterest),
  };
};

const calculateEarlyClosure = (loanAmount, interestRate, tenureMonths, monthsPaid, emi) => {
  const monthlyRate = interestRate / 12 / 100;
  let balance = loanAmount;
  let totalInterestPaid = 0;
  let totalPrincipalPaid = 0;

  for (let i = 0; i < monthsPaid; i++) {
    const interest = balance * monthlyRate;
    const principal = emi - interest;
    totalInterestPaid += interest;
    totalPrincipalPaid += principal;
    balance = Math.max(0, balance - principal);
  }

  const totalPaid = totalInterestPaid + totalPrincipalPaid;
  const remainingEMIs = tenureMonths - monthsPaid;
  const originalTotalInterest = emi * tenureMonths - loanAmount;
  const interestSaved = Math.max(0, originalTotalInterest - totalInterestPaid);

  return {
    outstandingBalance: balance,
    totalPaid,
    totalInterestPaid,
    totalPrincipalPaid,
    remainingEMIs,
    interestSavedIfClosedNow: interestSaved,
  };
};

const calculateYearlyBreakdown = (schedule) => {
  const years = {};
  schedule.forEach(s => {
    if (!years[s.year]) {
      years[s.year] = { year: s.year, principal: 0, interest: 0, balance: 0, emis: 0, totalPaid: 0 };
    }
    years[s.year].principal += s.principal;
    years[s.year].interest += s.interest;
    years[s.year].balance = s.balance;
    years[s.year].emis++;
    years[s.year].totalPaid += s.emi;
  });
  return Object.values(years).map(y => ({
    ...y,
    principal: Math.round(y.principal),
    interest: Math.round(y.interest),
    balance: Math.round(y.balance),
    totalPaid: Math.round(y.totalPaid),
  }));
};

const calculateMonthlyBreakdown = (schedule, year) => {
  return schedule
    .filter(s => s.year === year)
    .map(s => ({
      month: s.month,
      monthOfYear: s.monthOfYear,
      year: s.year,
      emi: Math.round(s.emi),
      principal: Math.round(s.principal),
      interest: Math.round(s.interest),
      balance: Math.round(s.balance),
      date: s.date,
    }));
};

const calculateLoanAnalytics = (loanAmount, interestRate, tenureMonths, startDate, prepayments = []) => {
  const { emi, schedule, totalPayment, totalInterest } = calculateAmortizationSchedule(
    loanAmount, interestRate, tenureMonths, startDate, prepayments
  );

  const start = new Date(startDate);
  const now = new Date();
  const monthsElapsed = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  const monthsPaid = Math.min(monthsElapsed, schedule.length);

  let principalPaid = 0;
  let interestPaid = 0;
  for (let i = 0; i < monthsPaid && i < schedule.length; i++) {
    principalPaid += schedule[i].principal;
    interestPaid += schedule[i].interest;
  }

  const remainingMonths = Math.max(0, tenureMonths - monthsPaid);
  const endDate = new Date(start);
  endDate.setMonth(endDate.getMonth() + tenureMonths);

  const totalPrepaid = prepayments.reduce((sum, pp) => sum + pp.amount, 0);
  const remainingPrincipal = loanAmount - principalPaid;
  const remainingInterest = totalInterest - interestPaid;

  return {
    emi: Math.round(emi),
    totalPayment: Math.round(totalPayment),
    totalInterest: Math.round(totalInterest),
    monthsElapsed,
    monthsPaid,
    remainingMonths,
    principalPaid: Math.round(principalPaid),
    interestPaid: Math.round(interestPaid),
    remainingPrincipal: Math.round(remainingPrincipal),
    remainingInterest: Math.round(remainingInterest),
    completionPercentage: Math.min(100, (monthsPaid / tenureMonths) * 100),
    amountRepaid: Math.round(principalPaid + interestPaid),
    remainingAmount: Math.round(totalPayment - principalPaid - interestPaid),
    outstandingBalance: Math.round(schedule[Math.min(monthsPaid, schedule.length - 1)]?.balance || loanAmount),
    loanEndDate: endDate,
    yearsLeft: Math.floor(remainingMonths / 12),
    monthsLeft: remainingMonths % 12,
    totalPrepaid,
    yearlyBreakdown: calculateYearlyBreakdown(schedule),
    schedule,
  };
};

module.exports = {
  calculateEMI,
  calculateAmortizationSchedule,
  simulateEMIChange,
  calculateEarlyClosure,
  calculateYearlyBreakdown,
  calculateMonthlyBreakdown,
  calculateLoanAnalytics,
};
