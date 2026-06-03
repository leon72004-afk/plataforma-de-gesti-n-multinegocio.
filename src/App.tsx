import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import PublicLanding from './pages/PublicLanding';
import BookingWizard from './pages/BookingWizard';
import ConfirmPage from './pages/ConfirmPage';
import PortalHome from './pages/PortalHome';
import Explorar from './pages/Explorar';
import Contacto from './pages/Contacto';
import { useState, useEffect } from 'react';
import api from './lib/api';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Sync session on mount
  useEffect(() => {
    api.get('/auth/me')
      .then(res => setUser(res.data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#090D16] text-[#E2E8F0]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">Iniciando WeWash...</span>
        </div>
      </div>
    );
  }

  const handleLogin = (u: any) => {
    setUser(u);
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Main SaaS General Portal Page */}
          <Route path="/" element={<PortalHome />} />

          {/* New Independent SaaS Pages */}
          <Route path="/explorar" element={<Explorar />} />
          <Route path="/contacto" element={<Contacto />} />

          {/* SaaS Business Owner Login & Onboarding */}
          <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />} />

          {/* Secure Shop Admin Dashboard Panel */}
          <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />

          {/* Specific Appointment Direct Token link */}
          <Route path="/confirm/:token" element={<ConfirmPage />} />

          {/* Tenant Public Aesthetics Profile Landing Page */}
          <Route path="/:slug" element={<PublicLanding />} />

          {/* Tenant 4-Step Booking Wizard */}
          <Route path="/:slug/booking" element={<BookingWizard />} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
      {/* Premium Toast alert layout system */}
      <Toaster position="top-right" theme="dark" closeButton />
    </>
  );
}
