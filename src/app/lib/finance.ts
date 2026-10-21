import type { Enrollment, PaymentClaim, User } from '@/app/context/AuthContext';

export const planCount = (p: Enrollment['paymentPlan']) => (p === 'installments-3' ? 3 : p === 'installments-6' ? 6 : 1);
export const planLabel = (p: Enrollment['paymentPlan']) => (p === 'installments-3' ? '3 monthly instalments' : p === 'installments-6' ? '6 monthly instalments' : 'Full payment');

export const kwacha = (n: number) => `K ${Math.round(n).toLocaleString()}`;

export type InstalmentStatus = 'paid' | 'pending' | 'due' | 'overdue' | 'upcoming';

/** Splits an enrolment into instalments and works out which are paid, waiting for confirmation, due or overdue. */
export function instalments(enr: Enrollment, claims: PaymentClaim[], now = new Date()) {
  const n = planCount(enr.paymentPlan);
  const each = enr.totalAmount / n;
  const start = new Date(enr.enrolledAt);
  const pending = claims.filter(c => c.purpose === 'course_fee' && c.courseId === enr.courseId && c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  let paidLeft = enr.amountPaid;
  let pendingLeft = pending;
  return Array.from({ length: n }, (_, i) => {
    const due = new Date(start);
    due.setMonth(due.getMonth() + i);
    let status: InstalmentStatus;
    if (paidLeft >= each - 1) { status = 'paid'; paidLeft -= each; }
    else if (pendingLeft + paidLeft >= each - 1) { status = 'pending'; pendingLeft -= (each - paidLeft); paidLeft = 0; }
    else {
      paidLeft = 0;
      const days = (due.getTime() - now.getTime()) / 86400000;
      status = days < -7 ? 'overdue' : days <= 7 ? 'due' : 'upcoming';
    }
    return { index: i + 1, amount: each, due, status };
  });
}

export function studentFinance(student: User, claims: PaymentClaim[]) {
  const mine = claims.filter(c => c.studentId === student.id);
  const enrolments = student.enrollments ?? [];
  const totalFees = enrolments.reduce((s, e) => s + e.totalAmount, 0);
  const paidFees = enrolments.reduce((s, e) => s + e.amountPaid, 0);
  const pending = mine.filter(c => c.status === 'pending').reduce((s, c) => s + c.amount, 0);
  const balance = Math.max(0, totalFees - paidFees);
  const schedule = enrolments.flatMap(e => instalments(e, mine).map(i => ({ ...i, courseId: e.courseId })));
  const next = schedule.filter(i => i.status === 'due' || i.status === 'overdue' || i.status === 'upcoming').sort((a, b) => a.due.getTime() - b.due.getTime())[0];
  const overdue = schedule.filter(i => i.status === 'overdue');
  const registration = mine.filter(c => c.purpose === 'registration').sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  return { totalFees, paidFees, pending, balance, schedule, next, overdue, registration, claims: mine };
}
