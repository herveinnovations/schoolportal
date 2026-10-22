export const SCHOOL = {
  name: 'Alphatech Computer Institute',
  shortName: 'Alphatech',
  motto: 'Computer Literacy is our priority',
  // Shown in the website header and hero. Replace with the school's real contact number
  // (leave empty '' to hide it).
  phone: '+260 966 123 456',
  email: '',
};

// Website photos. These are free Unsplash photos; swap in real Alphatech campus photos
// (put them in /public and use '/your-photo.jpg') whenever you have them.
const u = (id: string, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=70`;
export const PHOTOS = {
  hero: u('photo-1522202176988-66273c2fd55f', 2000),     // students studying together
  tile: u('photo-1531482615713-2afd69097998', 900),      // student working on a laptop
  band: u('photo-1524178232363-1fb2b075b655', 2000),     // classroom
  signIn: u('photo-1523240795612-9a054b0db644', 1400),   // students on campus
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
