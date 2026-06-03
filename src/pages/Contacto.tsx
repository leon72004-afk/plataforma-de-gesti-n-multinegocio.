import { Mail, Phone, Sparkles, MessageCircle, Clock } from 'lucide-react';
import Navbar from '../components/Navbar';

export default function Contacto() {
  return (
    <div id="saas-portal-contacto" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* SaaS Premium Navigation Bar */}
      <Navbar />

      {/* Main Contacto Content */}
      <div className="flex-grow flex items-center justify-center py-16 px-4">
        <div className="max-w-xl w-full bg-[#0F172A] border border-[#1E293B] rounded-3xl p-8 shadow-2xl relative space-y-8 overflow-hidden">
          {/* Decorative ambient light */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          {/* Header */}
          <div className="text-center space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black rounded-full uppercase tracking-wider mx-auto">
              <Mail className="h-3.5 w-3.5" />
              Soporte & Consultoría en Vivo
            </div>
            
            <h1 className="text-3xl font-black text-white tracking-tight uppercase">
              ¡Hablemos de <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">tu negocio!</span>
            </h1>
            
            <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-md mx-auto">
              ¿Tienes dudas sobre cómo configurar tus bahías, el algoritmo de turnos o el envío automático de recordatorios por WhatsApp? Conéctate de inmediato con nuestro equipo.
            </p>
          </div>

          {/* Support Info Cards */}
          <div className="space-y-4 relative z-10">
            {/* WhatsApp Card */}
            <a 
              href="https://wa.me/573051234567" 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 bg-[#080D16] border border-[#1E293B] hover:border-green-500/30 rounded-2xl transition group"
            >
              <div className="h-12 w-12 bg-green-500/10 border border-green-500/20 text-green-500 rounded-xl flex items-center justify-center group-hover:bg-green-500/20 transition shrink-0">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">WhatsApp Soporte</h4>
                <p className="text-sm font-bold text-white font-mono group-hover:text-green-400 transition">+57 305 123 4567</p>
              </div>
            </a>

            {/* Email Card */}
            <a 
              href="mailto:soporte@wewash-saas.com"
              className="flex items-center gap-4 p-4 bg-[#080D16] border border-[#1E293B] hover:border-orange-500/30 rounded-2xl transition group"
            >
              <div className="h-12 w-12 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl flex items-center justify-center group-hover:bg-orange-500/20 transition shrink-0">
                <Mail className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Correo Corporativo</h4>
                <p className="text-sm font-bold text-white font-mono group-hover:text-orange-400 transition">soporte@wewash-saas.com</p>
              </div>
            </a>

            {/* Call Center Card */}
            <div className="flex items-center gap-4 p-4 bg-[#080D16] border border-[#1E293B] rounded-2xl transition shrink-0">
              <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-xl flex items-center justify-center shrink-0">
                <Phone className="h-5 w-5" />
              </div>
              <div className="space-y-0.5">
                <h4 className="text-xs text-gray-400 font-extrabold uppercase tracking-wider">Línea Directa SaaS</h4>
                <p className="text-sm font-bold text-white font-mono">+57 1 800 999 9999</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 p-3 bg-[#080D16] border border-[#334155]/20 rounded-2xl">
            <Clock className="h-4 w-4 text-orange-400" />
            <span className="text-[10px] text-gray-400 uppercase tracking-wider font-extrabold">Atención inmediata: Lunes a Sábado, 8:00 AM - 6:00 PM</span>
          </div>
        </div>
      </div>

      {/* Simple Footer */}
      <footer className="bg-[#06080F] border-t border-[#151E2E] py-8 text-center text-xs text-gray-650">
        <div className="max-w-md mx-auto space-y-2 px-4">
          <p className="text-gray-500 font-bold">&copy; 2026 WeWash SaaS Enterprise. Todos los derechos reservados.</p>
          <p className="text-gray-655">Aprovisionamiento multi-tenant para detalladores.</p>
        </div>
      </footer>
    </div>
  );
}
