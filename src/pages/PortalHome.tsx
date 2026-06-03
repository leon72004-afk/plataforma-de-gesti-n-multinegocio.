import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight, ShieldCheck, Settings, Compass, Car, Layers, MessageSquare, ShieldAlert } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function PortalHome() {
  return (
    <div id="saas-portal-wrapper" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* SaaS Premium Navigation Bar */}
      <Navbar />

      {/* SaaS Main Hero Section */}
      <div className="relative overflow-hidden pt-24 pb-16 lg:pb-24 flex-grow flex flex-col justify-center">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider mx-auto">
            <Sparkles className="h-3.5 w-3.5" />
            La suite SaaS de reservas, cabinas y bahías definitiva
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight uppercase">
            El software de agendamiento para <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Cualquier tipo de Negocio</span>
          </h1>

          <p className="text-gray-400 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto">
            Optimiza bahías de trabajo, cabinas, consultorios o canchas. Administra tu personal de especialistas, habilita reservas en tiempo real 24/7 y genera métricas en un portal multi-tenant premium.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link to="/login?register=true" className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/25 hover:opacity-90 active:transform active:scale-95 transition flex items-center justify-center gap-2 text-sm uppercase tracking-wider">
              Crear mi Negocio Gratis
              <ArrowRight className="h-5 w-5" />
            </Link>
            <Link to="/explorar" className="px-6 py-4 bg-[#1E293B]/60 hover:bg-[#1E293B] font-semibold border border-[#334155] rounded-2xl transition text-sm flex items-center gap-1.5 uppercase tracking-wider">
              <Car className="h-4.5 w-4.5 text-orange-500" />
              Explorar Tiendas Aliadas
            </Link>
          </div>
        </div>
      </div>

      {/* Main SaaS Platform Features Info Grid */}
      <section className="py-20 bg-[#070A11] border-t border-b border-[#111A2E]">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-xs text-orange-500 font-extrabold uppercase tracking-widest flex items-center justify-center gap-1">
              <Layers className="h-4 w-4" />
              Módulos Inteligentes
            </h2>
            <p className="text-2xl font-black text-white tracking-tight uppercase">Diseñado para la eficiencia operativa</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-3">
              <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl flex items-center justify-center font-bold text-lg">
                <Settings className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-white uppercase text-base tracking-tight">Onboarding & Conectividad</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Crea tu comercio, personaliza servicios y define slots o bahías de trabajo. Cada sucursal obtiene un slug único inmediato para agendamientos.
              </p>
            </div>

            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-3">
              <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl flex items-center justify-center font-bold text-lg">
                <Compass className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-white text-base uppercase tracking-tight">Motor de Disponibilidad</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Algoritmia inteligente que calcula turnos libres tomando horarios, duraciones de servicio y buffers de descanso configurables entre citas.
              </p>
            </div>

            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-3">
              <div className="h-10 w-10 bg-orange-500/10 border border-orange-500/30 text-orange-400 rounded-xl flex items-center justify-center font-bold text-lg">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="font-extrabold text-white text-base uppercase tracking-tight">Control de Recursos</h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                Visualización de tableros directos, drag-and-drop de agenda, historiales de fichas de citas y reportes consolidados para fidelizar a tus clientes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Single CTA Showcase */}
      <section className="py-16 bg-gradient-to-t from-[#06080F] to-[#090D16]">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl font-black text-white uppercase tracking-tight">Moderniza tu centro de servicios hoy mismo</h2>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">Únete a decenas de marcas profesionales en la región que ya optimizan sus tiempos de atención y multiplican la fidelidad de sus clientes con ReserveFlow.</p>
          <div>
            <Link to="/login?register=true" className="inline-flex items-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 text-gray-900 text-xs font-black rounded-xl uppercase tracking-wider transition">
              Comenzar Ahora Gratis
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Simple Footer */}
      <footer className="bg-[#06080F] border-t border-[#151E2E] py-8 text-center text-xs text-gray-550">
        <div className="max-w-md mx-auto space-y-2 px-4">
          <p className="text-gray-500 font-bold">&copy; 2026 ReserveFlow SaaS Enterprise. Todos los derechos reservados.</p>
          <p className="text-gray-655">Aprovisionamiento multi-tenant para establecimientos de servicios.</p>
        </div>
      </footer>
    </div>
  );
}
