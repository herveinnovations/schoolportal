import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import { useAuth } from '@/app/context/AuthContext';
import { useSite } from '@/app/context/SiteContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Check, ChevronDown } from 'lucide-react';
import { schoolLogo } from './BrandMark';
import { COURSE_CATALOGUE, STUDY_MODES, FEES } from '@/app/config/school';

interface RegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

interface FormState {
  fullName: string;
  dateOfBirth: string;
  gender: string;
  nrcNumber: string;
  phoneNumber: string;
  residentialAddress: string;
  email: string;
  modeOfStudy: string;
  coursesOfInterest: string[];
  disability: string;
  disabilityDetails: string;
  academicQualification: string;
  message: string;
  declaration: boolean;
}

const STEPS = ['Your details', 'Your study', 'Final details'];

/** The student enrolment form, matching Alphatech's official form. */
export const RegistrationForm: React.FC<RegistrationFormProps> = ({ open, onOpenChange, onComplete }) => {
  const { user, updateUser } = useAuth();
  const { contact } = useSite();
  const pd = user?.personalDetails;
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [openGroups, setOpenGroups] = useState<string[]>([COURSE_CATALOGUE[0].group]);

  const [f, setF] = useState<FormState>({
    fullName: user?.name ?? '',
    dateOfBirth: pd?.dateOfBirth ?? '',
    gender: pd?.gender ?? '',
    nrcNumber: pd?.nrcNumber ?? '',
    phoneNumber: pd?.phoneNumber ?? '',
    residentialAddress: pd?.residentialAddress ?? pd?.address ?? '',
    email: user?.email ?? '',
    modeOfStudy: pd?.modeOfStudy ?? '',
    coursesOfInterest: pd?.coursesOfInterest ?? [],
    disability: pd?.disability ?? '',
    disabilityDetails: pd?.disabilityDetails ?? '',
    academicQualification: pd?.academicQualification ?? '',
    message: pd?.message ?? '',
    declaration: false,
  });

  // Keep a draft in this browser so a dropped connection doesn't lose the form
  const draftKey = `registrationDraft:${user?.id}`;
  useEffect(() => {
    try {
      const d = localStorage.getItem(draftKey);
      if (d) { const parsed = JSON.parse(d); if (parsed?.f) setF(prev => ({ ...prev, ...parsed.f, email: prev.email })); if (typeof parsed?.step === 'number') setStep(parsed.step); }
    } catch { /* no draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ f, step })); } catch { /* ignore */ }
  }, [f, step, draftKey]);

  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => { setF(p => ({ ...p, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const courseKey = (group: string, course: string) => `${course} (${group})`;
  const toggleCourse = (key: string) => set('coursesOfInterest', f.coursesOfInterest.includes(key) ? f.coursesOfInterest.filter(c => c !== key) : [...f.coursesOfInterest, key]);

  const validate = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (f.fullName.trim().split(/\s+/).length < 2) e.fullName = 'Enter your full names (first and last name).';
      if (!f.dateOfBirth) e.dateOfBirth = 'Enter your date of birth.';
      if (!f.gender) e.gender = 'Choose one.';
      if (!/^[+\d][\d\s-]{8,}$/.test(f.phoneNumber.trim())) e.phoneNumber = 'Enter a cell number, e.g. 0977 123 456.';
      if (!f.residentialAddress.trim()) e.residentialAddress = 'Enter your residential address.';
    }
    if (s === 1) {
      if (!f.modeOfStudy) e.modeOfStudy = 'Choose how you want to study.';
      if (!f.coursesOfInterest.length) e.coursesOfInterest = 'Tick at least one course.';
    }
    if (s === 2) {
      if (!f.disability) e.disability = 'Choose Yes or No.';
      if (!f.declaration) e.declaration = 'Please confirm the information is correct.';
    }
    setErrors(e);
    if (Object.keys(e).length) toast.error('Please complete the highlighted fields');
    return !Object.keys(e).length;
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    try { doc.addImage(schoolLogo, 'PNG', 18, 8, 17, 20); } catch { /* logo is optional */ }
    doc.setFont('helvetica', 'bold'); doc.setFontSize(18); doc.setTextColor(12, 47, 136);
    doc.text('ALPHATECH COMPUTER INSTITUTE', 40, 17);
    doc.setFontSize(9); doc.setFont('helvetica', 'normal'); doc.setTextColor(80, 80, 80);
    doc.text([contact.address, [contact.phone, contact.email].filter(Boolean).join('  ·  ')].filter(Boolean), 40, 23);
    doc.setTextColor(0, 0, 0); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
    doc.text('FULL / PART TIME STUDENT ENROLMENT FORM', 105, 40, { align: 'center' });
    doc.setLineWidth(0.4); doc.line(20, 44, 190, 44);

    let y = 54;
    const row = (label: string, value: string) => {
      const lines = doc.splitTextToSize(value || '-', 110) as string[];
      if (y + lines.length * 6 > 280) { doc.addPage(); y = 20; }
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.text(label, 20, y);
      doc.setFont('helvetica', 'normal'); doc.text(lines, 80, y);
      y += Math.max(8, lines.length * 6);
    };
    row('Student full names', f.fullName);
    row('Date of birth', f.dateOfBirth);
    row('Gender', f.gender);
    row('N.R.C number', f.nrcNumber);
    row('Cell number', f.phoneNumber);
    row('Residential address', f.residentialAddress);
    row('Email', f.email);
    row('Student number', user?.studentNumber ?? 'Issued after the admission form fee is confirmed');
    row('Mode of study', f.modeOfStudy);
    row('Courses', f.coursesOfInterest.join('\n'));
    row('Physical disabilities', f.disability === 'Yes' && f.disabilityDetails ? `Yes: ${f.disabilityDetails}` : f.disability);
    row('Academic qualification', f.academicQualification);
    row('Message', f.message);
    y += 10;
    if (y > 260) { doc.addPage(); y = 20; }
    doc.setFontSize(9);
    doc.text(`Admission form fee: K${FEES.registration}. Other requirements will be given in your Acceptance Letter.`, 20, y);
    y += 14;
    doc.text('Student signature: ____________________________', 20, y);
    doc.text('Date: ____________________', 130, y);
    doc.save('Alphatech_Enrolment_Form.pdf');
  };

  const submit = () => {
    if (!validate(2)) return;
    updateUser({
      name: f.fullName.trim().replace(/\s+/g, ' '),
      personalDetails: {
        dateOfBirth: f.dateOfBirth,
        gender: f.gender,
        nrcNumber: f.nrcNumber.trim(),
        phoneNumber: f.phoneNumber.trim(),
        residentialAddress: f.residentialAddress.trim(),
        address: f.residentialAddress.trim(),
        modeOfStudy: f.modeOfStudy,
        coursesOfInterest: f.coursesOfInterest,
        disability: f.disability,
        disabilityDetails: f.disability === 'Yes' ? f.disabilityDetails.trim() : '',
        academicQualification: f.academicQualification.trim(),
        message: f.message.trim(),
        hasCompletedRegistration: true,
      },
    });
    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success('Enrolment form submitted', { description: user?.hasCompletedPayment ? 'The admissions office has your details.' : `Next, pay the K${FEES.registration} admission form fee.` });
    try { generatePDF(); } catch { /* the download is a convenience */ }
    onOpenChange(false);
    setStep(0);
    onComplete?.();
  };

  const err = (k: string) => errors[k] ? <p className="text-xs text-red-600 mt-1" role="alert">{errors[k]}</p> : null;
  const choice = (active: boolean) => `flex items-center gap-2.5 border px-3.5 py-3 text-sm font-medium cursor-pointer transition ${active ? 'border-ink bg-ink text-white' : 'border-transparent bg-stone-100 text-ink hover:bg-stone-200'}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[92vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="text-left px-6 pt-6 pb-4 border-b border-stone-200">
          <DialogTitle className="font-display font-extrabold text-[22px]">Full / Part Time Student Enrolment Form</DialogTitle>
          <DialogDescription>Step {step + 1} of 3 · {STEPS[step]}</DialogDescription>
          <div className="mt-3 grid grid-cols-3 gap-1.5" aria-hidden>
            {STEPS.map((s, i) => <span key={s} className={`h-1.5 ${i <= step ? 'bg-sun' : 'bg-stone-200'}`} />)}
          </div>
        </DialogHeader>

        <div className="px-6 py-6">
          <AnimatePresence mode="wait">
            <motion.div key={step} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-5">
              {step === 0 && <>
                <div>
                  <Label htmlFor="rf-name">Student full names *</Label>
                  <Input id="rf-name" value={f.fullName} onChange={e => set('fullName', e.target.value)} autoComplete="name" aria-invalid={!!errors.fullName} />
                  {err('fullName')}
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="rf-dob">Date of birth *</Label>
                    <Input id="rf-dob" type="date" value={f.dateOfBirth} max={new Date().toISOString().slice(0, 10)} onChange={e => set('dateOfBirth', e.target.value)} aria-invalid={!!errors.dateOfBirth} />
                    {err('dateOfBirth')}
                  </div>
                  <fieldset>
                    <legend className="text-sm font-medium mb-1.5">Gender *</legend>
                    <div className="grid grid-cols-2 gap-2">
                      {['Male', 'Female'].map(g => (
                        <label key={g} className={choice(f.gender === g)}>
                          <input type="radio" name="rf-gender" className="sr-only" checked={f.gender === g} onChange={() => set('gender', g)} />{g}
                        </label>
                      ))}
                    </div>
                    {err('gender')}
                  </fieldset>
                </div>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div>
                    <Label htmlFor="rf-nrc">N.R.C number</Label>
                    <Input id="rf-nrc" value={f.nrcNumber} onChange={e => set('nrcNumber', e.target.value)} placeholder="e.g. 123456/11/1" />
                  </div>
                  <div>
                    <Label htmlFor="rf-cell">Cell number *</Label>
                    <Input id="rf-cell" type="tel" value={f.phoneNumber} onChange={e => set('phoneNumber', e.target.value)} placeholder="0977 123 456" autoComplete="tel" aria-invalid={!!errors.phoneNumber} />
                    {err('phoneNumber')}
                  </div>
                </div>
                <div>
                  <Label htmlFor="rf-addr">Residential address *</Label>
                  <Input id="rf-addr" value={f.residentialAddress} onChange={e => set('residentialAddress', e.target.value)} placeholder="House number, street, area, town" autoComplete="street-address" aria-invalid={!!errors.residentialAddress} />
                  {err('residentialAddress')}
                </div>
                <div>
                  <Label htmlFor="rf-email">Email *</Label>
                  <Input id="rf-email" type="email" value={f.email} disabled />
                  <p className="text-xs text-stone-500 mt-1">The email you signed up with.</p>
                </div>
              </>}

              {step === 1 && <>
                <fieldset>
                  <legend className="text-sm font-medium mb-2">Choose mode of study *</legend>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {STUDY_MODES.map(m => (
                      <label key={m} className={choice(f.modeOfStudy === m)}>
                        <input type="radio" name="rf-mode" className="sr-only" checked={f.modeOfStudy === m} onChange={() => set('modeOfStudy', m)} />{m}
                      </label>
                    ))}
                  </div>
                  {err('modeOfStudy')}
                </fieldset>

                <fieldset>
                  <legend className="text-sm font-medium mb-1">Courses *</legend>
                  <p className="text-xs text-stone-500 mb-3">Tick every course you’re interested in. {f.coursesOfInterest.length > 0 && <strong className="text-ink">{f.coursesOfInterest.length} selected.</strong>}</p>
                  <div className="border border-stone-200 divide-y divide-stone-200">
                    {COURSE_CATALOGUE.map(g => {
                      const isOpen = openGroups.includes(g.group);
                      const picked = g.courses.filter(c => f.coursesOfInterest.includes(courseKey(g.group, c))).length;
                      return (
                        <div key={g.group}>
                          <button type="button" aria-expanded={isOpen} onClick={() => setOpenGroups(o => (isOpen ? o.filter(x => x !== g.group) : [...o, g.group]))}
                            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-stone-50">
                            <span className="flex-1">
                              <span className="block font-semibold text-ink text-sm">{g.group}</span>
                              {g.duration && <span className="block text-xs text-stone-500">Duration: {g.duration}</span>}
                            </span>
                            {picked > 0 && <span className="bg-sun text-ink text-xs font-bold px-2 py-0.5">{picked}</span>}
                            <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                          </button>
                          {isOpen && (
                            <div className="grid sm:grid-cols-2 gap-1.5 px-4 pb-4">
                              {g.courses.map(c => {
                                const k = courseKey(g.group, c);
                                const on = f.coursesOfInterest.includes(k);
                                return (
                                  <label key={k} className={`flex items-center gap-2.5 px-3 py-2 text-sm cursor-pointer border transition ${on ? 'border-sun bg-sun/15 text-ink font-medium' : 'border-transparent hover:bg-stone-50 text-stone-700'}`}>
                                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleCourse(k)} />
                                    <span className={`w-4 h-4 keep-border border-2 flex items-center justify-center shrink-0 ${on ? 'bg-ink border-ink text-white' : 'border-stone-300'}`}>{on && <Check className="w-3 h-3" />}</span>
                                    {c}
                                  </label>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {err('coursesOfInterest')}
                </fieldset>
              </>}

              {step === 2 && <>
                <fieldset>
                  <legend className="text-sm font-medium mb-2">Any physical disabilities? *</legend>
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    {['Yes', 'No'].map(v => (
                      <label key={v} className={choice(f.disability === v)}>
                        <input type="radio" name="rf-dis" className="sr-only" checked={f.disability === v} onChange={() => set('disability', v)} />{v}
                      </label>
                    ))}
                  </div>
                  {err('disability')}
                  {f.disability === 'Yes' && (
                    <div className="mt-3">
                      <Label htmlFor="rf-dis-d">Tell us anything that will help us support you (optional)</Label>
                      <Textarea id="rf-dis-d" rows={2} value={f.disabilityDetails} onChange={e => set('disabilityDetails', e.target.value)} />
                    </div>
                  )}
                </fieldset>
                <div>
                  <Label htmlFor="rf-qual">Academic qualification</Label>
                  <Input id="rf-qual" value={f.academicQualification} onChange={e => set('academicQualification', e.target.value)} placeholder="e.g. Grade 12 certificate" />
                </div>
                <div>
                  <Label htmlFor="rf-msg">Message</Label>
                  <Textarea id="rf-msg" rows={3} value={f.message} onChange={e => set('message', e.target.value)} placeholder="Anything you’d like the admissions office to know" />
                </div>
                <div className="bg-sun/15 px-4 py-3 text-sm text-stone-600">
                  The admission form fee is <strong className="text-ink">K{FEES.registration}</strong>. Other requirements will be given in your Acceptance Letter.
                  Questions? Contact the Student Admissions Office{contact.phone ? ` on ${contact.phone}` : ''}{contact.email ? ` or ${contact.email}` : ''}.
                </div>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" className="mt-1 w-4 h-4 accent-[#262626]" checked={f.declaration} onChange={e => set('declaration', e.target.checked)} />
                  <span className="text-sm text-stone-700">I confirm that the information I have given is true and correct.</span>
                </label>
                {err('declaration')}
              </>}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="sticky bottom-0 bg-white flex justify-between gap-3 px-6 py-4 border-t border-stone-200">
          <Button variant="outline" onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}>Back</Button>
          {step < 2
            ? <Button onClick={() => validate(step) && setStep(s => s + 1)}>Next</Button>
            : <Button onClick={submit}>Apply Now</Button>}
        </div>
      </DialogContent>
    </Dialog>
  );
};

