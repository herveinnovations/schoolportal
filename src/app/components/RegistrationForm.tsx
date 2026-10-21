import { schoolLogo } from './BrandMark';
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { Button } from '@/app/components/ui/button';
import { Card, CardContent } from '@/app/components/ui/card';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Textarea } from '@/app/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Checkbox } from '@/app/components/ui/checkbox';
import { Alert, AlertDescription } from '@/app/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/app/components/ui/radio-group';
import { CheckCircle2, FileText, CreditCard, School, User as UserIcon } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface RegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
}

import { FEES } from '@/app/config/school';
const REGISTRATION_FEE = FEES.registration; // ZMW

export const RegistrationForm: React.FC<RegistrationFormProps> = ({ open, onOpenChange, onComplete }) => {
  const { user, updateUser } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({ accountNumber: '', transactionId: '', paymentConfirmation: '' });

  const [formData, setFormData] = useState({
    firstName: user?.name.split(' ')[0] || '',
    middleName: '',
    lastName: user?.name.split(' ').slice(1).join(' ') || '',
    dateOfBirth: user?.personalDetails?.dateOfBirth || '',
    gender: user?.personalDetails?.gender || '',
    nationality: user?.personalDetails?.nationality || 'Zambian',
    maritalStatus: '',
    sponsorshipType: 'self',
    nrcNumber: user?.personalDetails?.nrcNumber || '',
    passportNumber: user?.personalDetails?.passportNumber || '',
    phoneNumber: user?.personalDetails?.phoneNumber || '',
    alternativeNumber: user?.personalDetails?.alternativeNumber || '',
    emailAddress: user?.email || '',
    residentialAddress: user?.personalDetails?.residentialAddress || '',
    postalAddress: user?.personalDetails?.postalAddress || '',
    province: '',
    district: '',
    town: '',
    guardianName: user?.personalDetails?.guardianName || '',
    guardianRelationship: '',
    guardianPhone: user?.personalDetails?.guardianPhone || '',
    guardianAddress: '',
    guardianOccupation: '',
    lastSchoolAttended: '',
    yearCompleted: '',
    highestQualification: '',
    gradeObtained: '',
    employmentStatus: 'unemployed',
    employerName: '',
    employerAddress: '',
    occupation: '',
    disabilities: 'none',
    disabilityDetails: '',
    medicalConditions: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    agreeToTerms: false,
    informationAccurate: false,
  });

  // Autosave: the form is long, so keep a draft in this browser until it's submitted
  const draftKey = `registrationDraft:${user?.id}`;
  useEffect(() => {
    try {
      const d = localStorage.getItem(draftKey);
      if (d) { const parsed = JSON.parse(d); setFormData(prev => ({ ...prev, ...parsed.formData })); setCurrentStep(parsed.step || 1); }
    } catch { /* no draft */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    try { localStorage.setItem(draftKey, JSON.stringify({ formData, step: currentStep })); } catch { /* ignore */ }
  }, [formData, currentStep, draftKey]);

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 1: return !!(formData.firstName && formData.lastName && formData.dateOfBirth && formData.gender && formData.nationality);
      case 2: return !!((formData.nationality === 'Zambian' ? formData.nrcNumber : formData.passportNumber) && formData.phoneNumber && formData.emailAddress);
      case 3: return !!(formData.residentialAddress && formData.postalAddress && formData.province && formData.district);
      case 4: return !!(formData.guardianName && formData.guardianPhone && formData.guardianRelationship && formData.guardianAddress);
      case 5: return !!(formData.lastSchoolAttended && formData.yearCompleted && formData.highestQualification);
      case 6: return !!(formData.emergencyContactName && formData.emergencyContactPhone);
      case 7: return formData.agreeToTerms && formData.informationAccurate;
      default: return true;
    }
  };

  const handleNext = () => {
    if (isStepValid(currentStep)) {
      if (currentStep < 7) setCurrentStep(currentStep + 1);
      else handleSubmit();
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const handlePrevious = () => {
    if (showPaymentStep) setShowPaymentStep(false);
    else if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    try { doc.addImage(schoolLogo, "PNG", 18, 6, 16, 19); } catch { /* logo is optional */ }
    doc.setFontSize(20);
    doc.setTextColor(4, 120, 87);
    doc.text("Alphatech Computer Institute", 105, 20, { align: "center" });
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text("OFFICIAL STUDENT REGISTRATION FORM", 105, 30, { align: "center" });
    doc.setLineWidth(0.5);
    doc.line(20, 35, 190, 35);

    let y = 50;
    const addSection = (title: string) => {
      y += 10;
      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text(title, 20, y);
      y += 8;
      doc.setLineWidth(0.2);
      doc.line(20, y, 190, y);
      y += 10;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
    };
    const addField = (label: string, value: string) => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.text(`${label}:`, 20, y);
      doc.text(`${value || '-'}`, 80, y);
      y += 7;
    };

    addSection("PERSONAL INFORMATION");
    addField("Full Name", `${formData.firstName} ${formData.middleName} ${formData.lastName}`);
    addField("Date of Birth", formData.dateOfBirth);
    addField("Gender", formData.gender);
    addField("Nationality", formData.nationality);
    addField("Marital Status", formData.maritalStatus);

    addSection("IDENTIFICATION & CONTACT");
    addField(formData.nationality === 'Zambian' ? "NRC Number" : "Passport Number", formData.nationality === 'Zambian' ? formData.nrcNumber : formData.passportNumber);
    addField("Phone Number", formData.phoneNumber);
    addField("Email Address", formData.emailAddress);

    addSection("ADDRESS DETAILS");
    addField("Residential Address", formData.residentialAddress);
    addField("Postal Address", formData.postalAddress);
    addField("Province", formData.province);
    addField("Town/City", formData.town);

    addSection("GUARDIAN / NEXT OF KIN");
    addField("Guardian Name", formData.guardianName);
    addField("Relationship", formData.guardianRelationship);
    addField("Guardian Phone", formData.guardianPhone);

    addSection("EDUCATIONAL BACKGROUND");
    addField("Last School Attended", formData.lastSchoolAttended);
    addField("Highest Qualification", formData.highestQualification);
    addField("Year Completed", formData.yearCompleted);

    y += 20;
    doc.setFontSize(10);
    doc.text("I hereby declare that the information provided is true and correct.", 20, y);
    y += 15;
    doc.text("Student Signature: _______________________", 20, y);
    doc.text("Date: _______________________", 120, y);

    doc.save("Alphatech_Registration_Form.pdf");
  };

  const handleSubmit = () => {

    const fullName = `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`;

    updateUser({
      name: fullName,
      personalDetails: {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        address: formData.residentialAddress,
        residentialAddress: formData.residentialAddress,
        postalAddress: formData.postalAddress,
        nrcNumber: formData.nrcNumber,
        passportNumber: formData.passportNumber,
        phoneNumber: formData.phoneNumber,
        alternativeNumber: formData.alternativeNumber,
        guardianName: formData.guardianName,
        guardianPhone: formData.guardianPhone,
        nationality: formData.nationality,
        hasCompletedRegistration: true,
        sponsorshipType: formData.sponsorshipType as any
      }
    });


    try { localStorage.removeItem(draftKey); } catch { /* ignore */ }
    toast.success('Registration submitted. You can now enrol in courses.');

    try {
      generatePDF();
      toast.success('Registration form downloaded');
    } catch (e) {
      console.error(e);
      toast.error('Could not download registration form automatically');
    }

    onOpenChange(false);
    if (onComplete) onComplete();

    setCurrentStep(1);
    setShowPaymentStep(false);
    setPaymentMethod('');
    setPaymentDetails({ accountNumber: '', transactionId: '', paymentConfirmation: '' });
  };

  const sel = (field: keyof typeof formData, placeholder: string | undefined, items: [string, string][]) => (
    <Select value={formData[field] as string} onValueChange={(value) => handleChange(field, value)}>
      <SelectTrigger><SelectValue placeholder={placeholder} /></SelectTrigger>
      <SelectContent>
        {items.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}
      </SelectContent>
    </Select>
  );

  const inp = (field: keyof typeof formData, placeholder: string, type = 'text') => (
    <Input type={type} value={formData[field] as string} onChange={(e) => handleChange(field, e.target.value)} placeholder={placeholder} />
  );

  const renderStepContent = () => {
    if (showPaymentStep) {
      return (
        <div className="space-y-6">
          <Alert className="bg-emerald-50 border-emerald-200">
            <CreditCard className="w-4 h-4" />
            <AlertDescription>
              <strong>Registration Fee: K{REGISTRATION_FEE} ZMW</strong>
              <p className="text-sm mt-1">Please complete payment to finalize your registration.</p>
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div>
              <Label>Payment Method *</Label>
              <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="mobile_money" id="mobile_money" />
                  <Label htmlFor="mobile_money" className="cursor-pointer flex-1">Mobile Money (Airtel/MTN)</Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                  <Label htmlFor="bank_transfer" className="cursor-pointer flex-1">Bank Transfer</Label>
                </div>
                <div className="flex items-center space-x-2 border p-3 rounded-lg">
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="cursor-pointer flex-1">Cash Payment (At School)</Label>
                </div>
              </RadioGroup>
            </div>

            {paymentMethod === 'mobile_money' && (
              <Card className="bg-stone-50">
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm font-semibold">Pay to Alphatech Computer Institute:</p>
                  <p className="text-sm">Airtel: <strong>0977 123 456</strong></p>
                  <p className="text-sm">MTN: <strong>0966 123 456</strong></p>
                  <p className="text-sm text-stone-600">Reference: Registration Fee</p>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'bank_transfer' && (
              <Card className="bg-stone-50">
                <CardContent className="pt-6 space-y-3">
                  <p className="text-sm font-semibold">Alphatech Computer Institute bank details:</p>
                  <p className="text-sm">Bank: <strong>Zanaco Bank</strong></p>
                  <p className="text-sm">Account: <strong>1234567890</strong></p>
                  <p className="text-sm">Branch: <strong>Lusaka Main</strong></p>
                  <p className="text-sm text-stone-600">Reference: Registration Fee + Your Name</p>
                </CardContent>
              </Card>
            )}

            {paymentMethod === 'cash' && (
              <Card className="bg-stone-50">
                <CardContent className="pt-6">
                  <p className="text-sm">Visit the Alphatech Computer Institute administration office with K{REGISTRATION_FEE} ZMW cash payment.</p>
                  <p className="text-sm text-stone-600 mt-2">Operating Hours: Mon-Fri, 8:00 AM - 5:00 PM</p>
                </CardContent>
              </Card>
            )}

            {paymentMethod && (
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Transaction ID / Reference Number *</Label>
                  <Input value={paymentDetails.transactionId}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, transactionId: e.target.value }))}
                    placeholder="Enter your transaction ID" />
                </div>
                <div>
                  <Label>Payment Confirmation / Receipt Number</Label>
                  <Input value={paymentDetails.paymentConfirmation}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, paymentConfirmation: e.target.value }))}
                    placeholder="Optional" />
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><UserIcon className="w-5 h-5" /> Personal Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>First Name *</Label>{inp('firstName', 'First Name')}</div>
              <div><Label>Middle Name</Label>{inp('middleName', 'Middle Name')}</div>
              <div><Label>Last Name *</Label>{inp('lastName', 'Last Name')}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Date of Birth *</Label>{inp('dateOfBirth', '', 'date')}</div>
              <div><Label>Gender *</Label>{sel('gender', 'Select gender', [['Male', 'Male'], ['Female', 'Female'], ['Other', 'Other']])}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Nationality *</Label>{sel('nationality', undefined, [['Zambian', 'Zambian'], ['Non-Zambian', 'Non-Zambian']])}</div>
              <div><Label>Marital Status</Label>{sel('maritalStatus', 'Select status', [['Single', 'Single'], ['Married', 'Married'], ['Divorced', 'Divorced'], ['Widowed', 'Widowed']])}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Sponsorship Type *</Label>{sel('sponsorshipType', 'Select Type', [['self', 'Self Sponsored'], ['bursary', 'Bursary'], ['corporate', 'Corporate / Company']])}</div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><FileText className="w-5 h-5" /> Identification & Contact Information</h3>
            {formData.nationality === 'Zambian' ? (
              <div><Label>National Registration Card (NRC) Number *</Label>{inp('nrcNumber', 'e.g., 123456/11/1')}</div>
            ) : (
              <div><Label>Passport Number *</Label>{inp('passportNumber', 'Passport Number')}</div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Phone Number *</Label>{inp('phoneNumber', '+260 977 123 456')}</div>
              <div><Label>Alternative Number *</Label>{inp('alternativeNumber', '+260 966 123 456')}</div>
            </div>
            <div>
              <Label>Email Address *</Label>
              <Input type="email" value={formData.emailAddress} onChange={(e) => handleChange('emailAddress', e.target.value)} placeholder="your.email@example.com" disabled />
              <p className="text-xs text-stone-500 mt-1">Email from your account registration</p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Address Information</h3>
            <div>
              <Label>Residential Address *</Label>
              <Textarea value={formData.residentialAddress} onChange={(e) => handleChange('residentialAddress', e.target.value)} placeholder="House number, street name, area" rows={2} />
            </div>
            <div><Label>Postal Address *</Label>{inp('postalAddress', 'P.O. Box 12345, Lusaka')}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div><Label>Province *</Label>{sel('province', 'Select', ['Lusaka', 'Copperbelt', 'Central', 'Eastern', 'Luapula', 'Northern', 'Northwestern', 'Southern', 'Western', 'Muchinga'].map(p => [p, p] as [string, string]))}</div>
              <div><Label>District *</Label>{inp('district', 'District')}</div>
              <div><Label>Town/City</Label>{inp('town', 'Town/City')}</div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Guardian / Next of Kin Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Full Name *</Label>{inp('guardianName', 'Guardian/Next of Kin Name')}</div>
              <div><Label>Relationship *</Label>{sel('guardianRelationship', 'Select', ['Parent', 'Sibling', 'Spouse', 'Guardian', 'Other'].map(p => [p, p] as [string, string]))}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Contact Number *</Label>{inp('guardianPhone', '+260 977 123 456')}</div>
              <div><Label>Occupation</Label>{inp('guardianOccupation', 'Occupation')}</div>
            </div>
            <div>
              <Label>Address *</Label>
              <Textarea value={formData.guardianAddress} onChange={(e) => handleChange('guardianAddress', e.target.value)} placeholder="Guardian's residential address" rows={2} />
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><School className="w-5 h-5" /> Educational Background</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Last School/Institution Attended *</Label>{inp('lastSchoolAttended', 'School/Institution Name')}</div>
              <div><Label>Year Completed *</Label>{inp('yearCompleted', '2023', 'number')}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><Label>Highest Qualification *</Label>{sel('highestQualification', 'Select', ['Grade 12', 'Grade 9', 'Certificate', 'Diploma', 'Degree', 'Other'].map(p => [p, p] as [string, string]))}</div>
              <div><Label>Grade/Result Obtained</Label>{inp('gradeObtained', 'e.g., Full Certificate, Merit')}</div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Employment & Medical Information</h3>
            <div>
              <Label>Employment Status</Label>
              <RadioGroup value={formData.employmentStatus} onValueChange={(value) => handleChange('employmentStatus', value)}>
                {[['employed', 'Employed'], ['self-employed', 'Self-Employed'], ['unemployed', 'Unemployed']].map(([v, l]) => (
                  <div key={v} className="flex items-center space-x-2">
                    <RadioGroupItem value={v} id={v} />
                    <Label htmlFor={v}>{l}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {(formData.employmentStatus === 'employed' || formData.employmentStatus === 'self-employed') && (
              <div className="space-y-4 border-l-2 border-stone-300 pl-4">
                <div><Label>Employer Name / Business</Label>{inp('employerName', 'Company/Business Name')}</div>
                <div><Label>Occupation</Label>{inp('occupation', 'Job Title')}</div>
                <div><Label>Employer Address</Label>{inp('employerAddress', 'Work Address')}</div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-4">Medical & Emergency Information</h4>
              <div className="space-y-4">
                <div>
                  <Label>Any Disabilities?</Label>
                  <RadioGroup value={formData.disabilities} onValueChange={(value) => handleChange('disabilities', value)}>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="none" id="none" /><Label htmlFor="none">None</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="yes" /><Label htmlFor="yes">Yes (please specify below)</Label></div>
                  </RadioGroup>
                </div>
                {formData.disabilities === 'yes' && (
                  <div>
                    <Label>Please specify disability</Label>
                    <Textarea value={formData.disabilityDetails} onChange={(e) => handleChange('disabilityDetails', e.target.value)} placeholder="Details of disability" rows={2} />
                  </div>
                )}
                <div>
                  <Label>Medical Conditions (Allergies, etc.)</Label>
                  <Textarea value={formData.medicalConditions} onChange={(e) => handleChange('medicalConditions', e.target.value)} placeholder="Optional" rows={2} />
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Emergency Contact Name *</Label>{inp('emergencyContactName', 'Full Name')}</div>
                <div><Label>Emergency Contact Phone *</Label>{inp('emergencyContactPhone', '+260...')}</div>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-4">
            <h3 className="font-semibold text-lg flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> Declaration & Submission</h3>
            <Card className="bg-yellow-50 border-yellow-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold mb-2">Terms and Conditions</h4>
                <ul className="list-disc list-inside space-y-2 text-sm text-stone-700">
                  <li>I confirm that the information provided is true and accurate.</li>
                  <li>I agree to abide by the rules and regulations of Alphatech Computer Institute.</li>
                  <li>I understand that the registration fee is non-refundable.</li>
                  <li>I agree to pay all tuition fees on time as per the chosen payment plan.</li>
                </ul>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="accurate" checked={formData.informationAccurate} onCheckedChange={(checked) => handleChange('informationAccurate', checked as boolean)} />
                <Label htmlFor="accurate" className="cursor-pointer">I declare that the information provided above is correct and complete.</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="terms" checked={formData.agreeToTerms} onCheckedChange={(checked) => handleChange('agreeToTerms', checked as boolean)} />
                <Label htmlFor="terms" className="cursor-pointer">I agree to the Terms and Conditions of Alphatech Computer Institute.</Label>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Student Registration</DialogTitle>
          <DialogDescription>
            Step {showPaymentStep ? 'Payment' : currentStep} of {showPaymentStep ? 'Payment' : 7}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {!showPaymentStep && (
            <div className="flex justify-between mb-8 relative">
              <div className="absolute top-1/2 left-0 w-full h-1 bg-stone-200 -z-10 transform -translate-y-1/2" />
              {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                <div key={step}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                    step === currentStep ? 'bg-emerald-700 text-white'
                      : step < currentStep ? 'bg-green-500 text-white'
                      : 'bg-stone-200 text-stone-500'}`}>
                  {step < currentStep ? <CheckCircle2 className="w-5 h-5" /> : step}
                </div>
              ))}
            </div>
          )}
          {renderStepContent()}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 && !showPaymentStep}>Back</Button>
          {!showPaymentStep ? (
            <Button onClick={handleNext}>{currentStep === 7 ? 'Submit registration' : 'Next'}</Button>
          ) : (
            <Button onClick={handleSubmit} className="bg-green-600 hover:bg-green-700">Complete Registration</Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
