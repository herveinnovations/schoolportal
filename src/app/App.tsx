import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AuthProvider, useAuth } from '@/app/context/AuthContext';
import { SiteProvider } from '@/app/context/SiteContext';
import { Landing } from '@/app/components/Landing';
import { Login } from '@/app/components/Login';
import { Signup } from '@/app/components/Signup';
import { SetPassword } from '@/app/components/SetPassword';

// Each portal is downloaded only by the people who use it
const StudentDashboard = lazy(() => import('@/app/components/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const LecturerDashboard = lazy(() => import('@/app/components/LecturerDashboard').then(m => ({ default: m.LecturerDashboard })));
const DirectorDashboard = lazy(() => import('@/app/components/DirectorDashboard').then(m => ({ default: m.DirectorDashboard })));
import { Toaster } from '@/app/components/ui/sonner';
import { Button } from '@/app/components/ui/button';
import { schoolLogo } from '@/app/components/BrandMark';
import type { Role } from '@/app/components/AuthShell';

type View = { page: 'home' } | { page: 'login'; role: Role } | { page: 'signup'; role: Role };

const Splash: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-stone-50" role="status" aria-live="polite">
    <img src={schoolLogo} alt="" className="h-20 w-auto animate-pulse" />
    <p className="text-sm text-stone-500">Loading your portal…</p>
  </div>
);

function MainContent() {
  const { user, loading, authLink, logout } = useAuth();
  const [view, setView] = useState<View>({ page: 'home' });

  const go = (v: View) => { setView(v); window.scrollTo(0, 0); };

  // After logging out, return to the home page
  const wasSignedIn = useRef(!!user);
  useEffect(() => {
    if (wasSignedIn.current && !user) go({ page: 'home' });
    wasSignedIn.current = !!user;
  }, [user]);

  if (loading) return <Splash />;

  // Opened an invitation or password-reset email: choose a password first
  if (authLink && user) return <SetPassword mode={authLink} onHome={() => go({ page: 'home' })} />;

  if (user && user.active === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-50">
        <div className="max-w-sm text-center space-y-3 bg-white border border-stone-200 rounded-2xl p-6">
          <h1 className="text-lg font-bold text-stone-900">This account is switched off</h1>
          <p className="text-sm text-stone-600">Please contact the Alphatech Computer Institute administration office.</p>
          <Button onClick={logout} className="w-full">Sign out</Button>
        </div>
      </div>
    );
  }

  if (!user || (user.role === 'student' && !user.hasCompletedPayment)) {
    // An unpaid student lands on the payment step inside Signup
    if (user && user.role === 'student' && !user.hasCompletedPayment) {
      return <Signup onSwitchToLogin={() => go({ page: 'login', role: 'student' })} onHome={() => go({ page: 'home' })} />;
    }
    if (view.page === 'login') {
      return <Login onSwitchToSignup={() => go({ page: 'signup', role: 'student' })} onHome={() => go({ page: 'home' })} />;
    }
    if (view.page === 'signup') {
      return <Signup onSwitchToLogin={() => go({ page: 'login', role: 'student' })} onHome={() => go({ page: 'home' })} />;
    }
    return <Landing onSignIn={(r) => go({ page: 'login', role: r ?? 'student' })} onSignUp={(r) => go({ page: 'signup', role: r ?? 'student' })} />;
  }

  return (
    <Suspense fallback={<Splash />}>
      {user.role === 'staff' ? <DirectorDashboard /> : user.role === 'student' ? <StudentDashboard /> : <LecturerDashboard />}
    </Suspense>
  );
}

export default function App() {
  return (
    <SiteProvider>
      <AuthProvider>
        <MainContent />
        <Toaster />
      </AuthProvider>
    </SiteProvider>
  );
}
