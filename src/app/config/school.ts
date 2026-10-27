export const SCHOOL = {
  name: 'Alphatech Computer Institute',
  shortName: 'Alphatech',
  motto: 'Computer Literacy is our priority',
  // Shown in the website header and hero. Replace with the school's real contact number
  // (leave empty '' to hide it).
  phone: '+260 974 041 810',
  email: 'admissions@alphatech-institute.com',
  address: 'Salvation Army House, First Floor, Room 14, Cairo Road, Lusaka',
};

/** Ways to study, as on the official enrolment form. */
export const STUDY_MODES = ['Full time learning', 'Part time learning', 'Online learning', 'e-Learning', 'Distance learning'] as const;

/** The course list from the official enrolment form, grouped as on the form. */
export const COURSE_CATALOGUE: { group: string; duration?: string; courses: string[] }[] = [
  { group: 'Beginner courses', duration: '1 month', courses: ['Computer Fundamentals', 'MS Word', 'MS Excel', 'Typing Skills', 'Internet Skills'] },
  { group: 'Office package', duration: '2 weeks', courses: ['MS Word', 'MS Excel', 'MS Access', 'MS Publisher', 'MS PowerPoint'] },
  { group: 'TEVET Level III', duration: '3 months', courses: ['Computer Studies'] },
  { group: 'Short computer courses', courses: ['Software Installation', 'Typing Practice', 'Typing Skills', 'Corel Draw', 'Adobe Photoshop', 'Adobe After Effects', 'Adobe Premiere Pro', 'Computer Networking', 'AutoCAD', 'Computer Repairing'] },
  { group: 'Advanced computer courses', courses: ['MS Access', 'Internet Skills', 'Typing Skills', 'MS Excel', 'Corel Draw', 'Adobe Photoshop', 'Adobe After Effects', 'Adobe Premiere Pro', 'AutoCAD', 'Computer Repairing', 'Computer Programming', 'Pastel Accounting', 'Pastel Payroll', 'QuickBooks', 'Web Design with WordPress', 'Video Editing (VFX)', 'Web Development'] },
  { group: 'Refresher I.C.T courses', courses: ['Computer Maintenance', 'Office Package for Business', 'Secretaries and Middle Managers', 'Entrepreneurs / Co-operatives', 'Skills for Industry', 'Skills for Managers', 'Business Centres & Self-employment', 'Business & Accountants'] },
];

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
  cash: { label: 'Cash at the office', where: 'Admissions Office, Salvation Army House, First Floor, Room 14, Cairo Road, Lusaka', hours: 'Mon–Fri, 08:00–17:00' },
} as const;

export const STUDENT_NUMBER_PREFIX = 'ATC';
export const CONFIRM_TIME = 'usually within 1 working day';
