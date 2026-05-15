function lastDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function computeInstallmentStatus(
  startDate: string,
  totalInstallments: number,
  dueDay: number,
  closingDay?: number,
  startInstallment: number = 1,
  today: Date = new Date()
): { currentInstallment: number; isDone: boolean } {
  const [purchaseYear, purchaseMonth, purchaseDay] = startDate.split("-").map(Number);

  // Determine which month the first installment falls in
  let firstDueYear: number;
  let firstDueMonth: number;

  if (closingDay && purchaseDay > closingDay) {
    // Purchase was after closing day → first bill is next cycle
    if (purchaseMonth === 12) {
      firstDueYear = purchaseYear + 1;
      firstDueMonth = 1;
    } else {
      firstDueYear = purchaseYear;
      firstDueMonth = purchaseMonth + 1;
    }
  } else {
    firstDueYear = purchaseYear;
    firstDueMonth = purchaseMonth;
  }

  const todayYear = today.getFullYear();
  const todayMonth = today.getMonth() + 1;
  const todayDay = today.getDate();

  const monthsElapsed = (todayYear - firstDueYear) * 12 + (todayMonth - firstDueMonth);

  // Account for months shorter than dueDay (e.g. dueDay=31 in February)
  const effectiveDueDay = Math.min(dueDay, lastDayOfMonth(todayYear, todayMonth));

  let paymentsMade: number;
  if (monthsElapsed < 0) {
    paymentsMade = 0;
  } else if (todayDay > effectiveDueDay) {
    paymentsMade = monthsElapsed + 1;
  } else {
    paymentsMade = monthsElapsed;
  }

  paymentsMade = Math.max(0, paymentsMade);

  const currentInstallment = Math.min(startInstallment + paymentsMade, totalInstallments);
  const isDone = startInstallment + paymentsMade > totalInstallments;

  return { currentInstallment, isDone };
}
