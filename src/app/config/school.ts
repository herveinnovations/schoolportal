export const SCHOOL = {
  name: 'Alphatech Computer Institute',
  shortName: 'Alphatech',
  motto: 'Computer Literacy is our priority',
};

// One place for the school's fees and payment details.
// Replace the example numbers below with Alphatech's real accounts before launch.

export const FEES = {
  registration: 170,   // ZMW, once, at sign-up
  certificate: 500,    // ZMW, per certificate, after passing
  passMark: 50,        // percent needed to pass a course exam
} as const;

export const PAY_TO = {
  mtn: { label: 'MTN Money', number: '0966 123 456', name: 'Alphatech Computer Institute' },
  airtel: { label: 'Airtel Money', number: '0977 123 456', name: 'Alphatech Computer Institute' },
  bank: { label: 'Bank transfer', bank: 'Zanaco Bank', account: '1234567890', branch: 'Lusaka Main', name: 'Alphatech Computer Institute' },
  cash: { label: 'Cash at the office', where: 'Alphatech Computer Institute, Administration Office', hours: 'Mon–Fri, 08:00–17:00' },
} as const;

export const STUDENT_NUMBER_PREFIX = 'ATC';
export const CONFIRM_TIME = 'usually within 1 working day';
