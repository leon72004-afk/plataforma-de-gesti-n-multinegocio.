import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../lib/api';
import { toast } from 'sonner';
import { ShieldCheck, Sparkles, User, Mail, Phone, MapPin, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import Navbar from '../components/Navbar';

interface LoginProps {
  onLogin: (user: any) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [searchParams] = useSearchParams();
  const [isRegister, setIsRegister] = useState(searchParams.get('register') === 'true');

  useEffect(() => {
    setIsRegister(searchParams.get('register') === 'true');
  }, [searchParams]);
  
  // Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // Registration Onboarding State
  const [regStep, setRegStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Registration Fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regBusinessName, setRegBusinessName] = useState('');
  const [regBusinessSlug, setRegBusinessSlug] = useState('');

  // Auto-generate web address (slug) from business name
  useEffect(() => {
    if (regBusinessName) {
      const generated = regBusinessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setRegBusinessSlug(generated);
    } else {
      setRegBusinessSlug('');
    }
  }, [regBusinessName]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      if (res.data.token) {
        localStorage.setItem('wewash_token', res.data.token);
      }
      onLogin(res.data.user);
      toast.success(`¡Bienvenido de vuelta, ${res.data.user.name}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Credenciales inválidas para administrador.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: 'admin' | 'operator') => {
    const demoEmail = role === 'admin' ? 'admin@motowash.com' : 'rapido@motowash.com';
    const demoPassword = 'admin123';
    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email: demoEmail, password: demoPassword });
      if (res.data.token) {
        localStorage.setItem('wewash_token', res.data.token);
      }
      onLogin(res.data.user);
      toast.success(`¡Acceso Demo Exitoso como ${role === 'admin' ? 'Administrador' : 'Especialista / Operador'}!`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Error al iniciar sesión demo. Asegúrate de que el servidor local está activo.');
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (regStep === 1) {
      if (!regName || !regEmail || !regPassword) {
        toast.error('Completa todos los campos del administrador para continuar.');
        return;
      }
      if (regPassword.length < 6) {
        toast.error('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
    }
    setRegStep(2);
  };

  const prevStep = () => {
    setRegStep(1);
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regBusinessName || !regBusinessSlug) {
      toast.error('Por favor completa todos los campos requeridos.');
      return;
    }
    setLoading(true);
    try {
      // 1. Create Business Shop and associated Admin User Account setup
      await api.post('/auth/register', {
        name: regName,
        email: regEmail,
        password: regPassword,
        businessName: regBusinessName,
        businessSlug: regBusinessSlug
      });

      toast.success('¡Lavadero creado con éxito! Iniciando sesión automáticamente...');

      // 2. Perform Seamless Session Login
      const loginRes = await api.post('/auth/login', {
        email: regEmail,
        password: regPassword
      });

      if (loginRes.data.token) {
        localStorage.setItem('wewash_token', loginRes.data.token);
      }
      onLogin(loginRes.data.user);
      toast.success(`¡Bienvenido ${loginRes.data.user.name}! Te encuentras en tu Panel Directo.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Error registrando el lavadero. Prueba con un correo o dirección web diferente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div id="login-container-page" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans flex flex-col justify-between relative overflow-hidden">
      <Navbar />

      <div className="flex-grow flex items-center justify-center p-4 relative">
        {/* Visual background ambient glow lights */}
        <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-orange-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="w-full max-w-lg bg-[#0F172A] border border-[#1E293B] rounded-3xl p-8 shadow-2xl relative z-10 space-y-6">
        
        {/* Upper Brand Badge */}
        <div className="text-center space-y-2">
          <div className="h-14 w-14 bg-orange-500/10 border border-orange-500/30 rounded-2xl flex items-center justify-center mx-auto text-orange-500 mb-2">
            <Sparkles className="h-7 w-7 animate-pulse" />
          </div>
          <h2 className="text-3xl font-black text-white tracking-tight uppercase">
            {isRegister ? 'Crear mi Lavadero' : 'Acceder al Panel'}
          </h2>
          <p className="text-xs text-orange-500 font-extrabold uppercase tracking-widest">
            {isRegister ? 'Formulario de registro' : 'Administrador y personal'}
          </p>
        </div>

        {/* LOGIN MODE */}
        {!isRegister ? (
          <div className="space-y-6">
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Correo Electrónico *</label>
                <input 
                  type="email" 
                  required
                  placeholder="ej: admin@motowash.com" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black tracking-wider">Contraseña *</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                />
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-black rounded-xl tracking-wide transition shadow-lg shadow-orange-500/35 active:transform active:scale-95 hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Consultando credenciales...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="space-y-4 pt-3 border-t border-[#1E293B]">
              <div className="text-center">
                <span className="px-2 py-0.5 bg-[#1E293B] text-[10px] text-gray-400 uppercase tracking-widest font-black rounded-full">Acceso Rápido Demo</span>
              </div>

              <div className="grid grid-cols-2 gap-3 pb-1">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="flex flex-col items-center justify-center p-3 bg-[#080D16] hover:bg-orange-500/5 hover:border-orange-500/40 border border-[#1E293B] rounded-2xl text-center group transition cursor-pointer"
                >
                  <div className="p-2 bg-orange-500/10 text-orange-400 rounded-xl group-hover:scale-110 transition duration-300">
                    <ShieldCheck className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-black text-white mt-1.5 group-hover:text-orange-400 transition">Demo Admin</span>
                  <span className="text-[9px] text-gray-500 mt-0.5 leading-tight">Configuración, Sedes, Bahías</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleDemoLogin('operator')}
                  className="flex flex-col items-center justify-center p-3 bg-[#080D16] hover:bg-blue-500/5 hover:border-blue-500/40 border border-[#1E293B] rounded-2xl text-center group transition cursor-pointer"
                >
                  <div className="p-2 bg-blue-550/10 text-blue-400 rounded-xl group-hover:scale-110 transition duration-300">
                    <User className="h-4.5 w-4.5" />
                  </div>
                  <span className="text-xs font-black text-white mt-1.5 group-hover:text-blue-400 transition">Demo Especialista</span>
                  <span className="text-[9px] text-gray-500 mt-0.5 leading-tight">Turnos, Citas, Operario</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* TWO-STEP REAL TENANT REGISTRATION MODE */
          <div className="space-y-4">
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              
              {/* Stepper Progress Bar */}
              <div className="flex items-center justify-between pb-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <span 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      regStep === 1 ? 'w-8 bg-orange-500' : 'w-4 bg-orange-500/50'
                    }`}
                  />
                  <span 
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      regStep === 2 ? 'w-8 bg-orange-500' : 'w-4 bg-[#1E293B]'
                    }`}
                  />
                </div>
                <span className="text-[10px] font-mono tracking-wider uppercase font-black text-gray-400">
                  Paso {regStep} de 2
                </span>
              </div>

              {/* STEP 1: ADMIN ACCOUNT INFO */}
              {regStep === 1 && (
                <div className="space-y-3.5 animate-opacity">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">1. Tu cuenta de Administrador</h4>
                    <p className="text-[10px] text-gray-400">Datos primarios del propietario para acceder al panel.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Tu Nombre y Apellido *</label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                      <input 
                        type="text"
                        required
                        placeholder="Ej: Alejandro Restrepo"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-xs outline-none text-white transition animate-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Correo Electrónico de Acceso *</label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-500" />
                      <input 
                        type="email"
                        required
                        placeholder="Ej: alejandro@correo.com"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl pl-10 pr-4 py-2 text-xs outline-none text-white transition animate-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Crea tu Contraseña *</label>
                    <input 
                      type="password"
                      required
                      minLength={6}
                      placeholder="Mínimo 6 caracteres"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2 text-xs outline-none text-white transition"
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: BUSINESS STORE DETAILS */}
              {regStep === 2 && (
                <div className="space-y-3.5 animate-opacity">
                  <div>
                    <h4 className="text-xs font-black text-white uppercase tracking-tight">2. Detalles de tu Establecimiento</h4>
                    <p className="text-[10px] text-gray-400 font-medium font-sans">Asigna el nombre y configúralo para toda la red de ReserveFlow.</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Nombre Comercial del Establecimiento *</label>
                    <input 
                      type="text"
                      required
                      placeholder="Ej: Estética Sentidos, Barbería Roma, VIP Detail, Clinica Odonto"
                      value={regBusinessName}
                      onChange={(e) => setRegBusinessName(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2 text-xs outline-none text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-black">Identificador Web / Slug URL *</label>
                    <div className="flex items-center bg-[#080D16] border border-[#1E293B] rounded-xl px-3 py-2 text-xs">
                      <span className="text-gray-500 font-mono select-none">reserveflow.com/</span>
                      <input 
                        type="text"
                        required
                        placeholder="mi-negocio-premium"
                        value={regBusinessSlug}
                        onChange={(e) => setRegBusinessSlug(e.target.value.toLowerCase().replace(/[^a-z0-9\-]/g, ''))}
                        className="bg-transparent flex-grow outline-none border-none text-orange-400 font-black font-mono pl-0.5"
                      />
                    </div>
                    <p className="text-[9px] text-gray-400 mt-1 leading-normal italic">
                      Tus clientes usarán este enlace directo para programar sus citas y ver disponibilidad.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Action Footer row */}
              <div className="flex items-center gap-3 pt-2">
                {regStep > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex items-center justify-center gap-1 bg-[#1E293B] hover:bg-[#2D3C52] border border-white/5 py-2.5 px-4 text-xs font-black uppercase text-gray-300 hover:text-white rounded-xl transition"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Atrás
                  </button>
                )}

                {regStep < 2 ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 flex items-center justify-center gap-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-xl shadow-lg transition"
                  >
                    Continuar Paso
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black text-xs rounded-xl shadow-lg transition disabled:opacity-50"
                  >
                    {loading ? 'Creando establecimiento...' : 'Crear mi Lavadero 🚀'}
                  </button>
                )}
              </div>

            </form>
          </div>
        )}

        </div>
      </div>
      
      {/* Small informative sub-footer */}
      <div className="py-2.5 text-center text-[10px] text-gray-500 hover:text-white bg-[#06080F]/50 border-t border-[#151E2E] transition">
        WeWash SaaS Dashboard • Registro de Bahías de Lavado Estético
      </div>
    </div>
  );
}
