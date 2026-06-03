import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, Sparkles, Building2 } from 'lucide-react';
import api from '../lib/api';
import Navbar from '../components/Navbar';

export default function Explorar() {
  const [businesses, setBusinesses] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/businesses')
      .then((res) => {
        setBusinesses(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = businesses.filter(b => 
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    (b.address && b.address.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div id="saas-portal-explorar" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans flex flex-col justify-between selection:bg-orange-500 selection:text-white">
      {/* SaaS Premium Navigation Bar */}
      <Navbar />

      {/* Main Explorar Content */}
      <div className="flex-grow py-12">
        <section className="max-w-5xl mx-auto px-4 space-y-10">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-[10px] font-black rounded-full uppercase tracking-wider mx-auto">
              <Building2 className="h-3.5 w-3.5" />
              Saber Multi-tenant en Vivo
            </div>
            
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none uppercase">
              Descubre Nuestros <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">Establecimientos Aliados</span>
            </h1>
            <p className="text-gray-400 text-sm max-w-lg mx-auto leading-relaxed">
              Prueba el flujo de reservas inteligente en cualquiera de las sedes aliadas registradas. Visualiza agendas, recursos, cabinas, profesionales y personal en tiempo real.
            </p>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, dirección o ciudad..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-[#0F172A] border border-[#1E293B] rounded-2xl pl-12 pr-4 py-3 text-sm focus:border-orange-500 outline-none text-white transition shadow-lg shrink-0"
            />
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
              <p className="text-xs text-gray-550 mt-3 font-mono uppercase tracking-wider">Cargando establecimientos...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 bg-[#0F172A] border border-[#1E293B] rounded-3xl p-8 max-w-md mx-auto space-y-2">
              <p className="text-sm text-gray-400 font-bold">Sin resultados encontrados</p>
              <p className="text-xs text-gray-500">Ninguno de nuestros comercios aliados coincide con la palabra "{search}". Intenta con otra palabra clave.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {filtered.map((b) => (
                <div key={b.id} className="bg-[#0F172A] border border-[#1E293B] rounded-3xl p-6 hover:border-orange-500/30 transition flex flex-col justify-between shadow-xl">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      {b.logoUrl ? (
                        <img src={b.logoUrl} alt={b.name} referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl object-cover border border-white/5" />
                      ) : (
                        <div className="h-14 w-14 bg-orange-500/10 text-orange-500 font-extrabold flex items-center justify-center text-xl rounded-2xl border border-orange-500/20">
                          {b.name.charAt(0)}
                        </div>
                      )}
                      <div>
                        <h4 className="text-lg font-black text-white uppercase tracking-tight">{b.name}</h4>
                        <p className="text-xs text-orange-400 font-bold flex items-center gap-1 mt-0.5">
                          <span>★</span> 5.0 (Reseñas certificadas)
                        </p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-2">{b.description || 'Establecimiento de servicios profesionales afiliado a la red de agendamiento inteligente multi-tenant de ReserveFlow.'}</p>
                    
                    {b.address && (
                      <p className="text-[11px] text-gray-450 font-medium flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-orange-500" />
                        <span>{b.address}</span>
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-6 border-t border-[#1C263A] mt-6">
                    <Link to={`/${b.slug}`} className="py-2.5 bg-[#1E293B] hover:bg-[#2A374E] text-white text-xs font-bold text-center rounded-xl border border-white/5 transition flex items-center justify-center gap-1">
                      Ver Perfil
                    </Link>
                    <Link to={`/${b.slug}/booking`} className="py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-black text-center rounded-xl transition flex items-center justify-center gap-1 shadow-md shadow-orange-500/10">
                      Reservar Cita
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Simple Footer */}
      <footer className="bg-[#06080F] border-t border-[#151E2E] py-8 text-center text-xs text-gray-650 mt-12">
        <div className="max-w-md mx-auto space-y-2 px-4">
          <p className="text-gray-500 font-bold">&copy; 2026 ReserveFlow SaaS Enterprise. Todos los derechos reservados.</p>
          <p className="text-gray-655">Aprovisionamiento multi-tenant para establecimientos de servicios.</p>
        </div>
      </footer>
    </div>
  );
}
