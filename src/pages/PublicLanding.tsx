import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, Star, MapPin, Phone, Mail, Clock, ShieldCheck, ArrowRight, CheckCircle2 } from 'lucide-react';
import api from '../lib/api';
import Navbar from '../components/Navbar';

export default function PublicLanding() {
  const { slug } = useParams<{ slug: string }>();
  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/businesses/${slug}/profile`)
      .then((res) => {
        setBusiness(res.data);
        setError('');
      })
      .catch((err) => {
        console.error(err);
        setError('El lavadero de motos solicitado no existe en nuestro sistema SaaS.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-400 font-medium">Cargando lavadero premium...</p>
      </div>
    );
  }

  if (error || !business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100 p-6 text-center">
        <div className="bg-[#151D2A] border border-red-500/30 p-8 rounded-2xl max-w-md shadow-2xl">
          <ShieldCheck className="mx-auto h-16 w-16 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Error del Sistema</h2>
          <p className="text-gray-400 mb-6">{error || 'No se pudo cargar la información.'}</p>
          <Link to="/" className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-amber-600 transition shadow-lg shadow-orange-500/20">
            Ir al Portal del SaaS
          </Link>
        </div>
      </div>
    );
  }

  // Calculate average rating
  const avgRating = business.reviews?.length > 0
    ? (business.reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / business.reviews.length).toFixed(1)
    : '4.9';

  return (
    <div id="public-landing-container" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans selection:bg-orange-500 selection:text-white">
      <Navbar />
      {/* Dynamic SEO basic metatags custom update mockup */}
      
      {/* Shop Header */}
      <header className="border-b border-[#1E293B] bg-[#0E1320] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {business.logoUrl ? (
              <img src={business.logoUrl} alt={business.name} referrerPolicy="no-referrer" className="h-12 w-12 rounded-xl object-cover border border-orange-500/30" />
            ) : (
              <div className="h-12 w-12 rounded-xl bg-orange-500/20 flex items-center justify-center border border-orange-500 text-orange-500 font-bold text-xl">
                {business.name.charAt(0)}
              </div>
            )}
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">{business.name}</h1>
              <div className="flex items-center gap-1.5 text-xs text-orange-400 font-semibold">
                <Star className="h-3.5 w-3.5 fill-current" />
                <span>{avgRating} ({business.reviews?.length || 12} reseñas)</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link to={`/${business.slug}/booking`} className="hidden sm:inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 active:transform active:scale-95 text-white font-bold text-sm rounded-xl transition shadow-lg shadow-orange-500/20">
              Reservar Cita
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link to="/login" className="text-xs text-gray-400 hover:text-white font-semibold transition py-2 px-3 hover:bg-white/5 rounded-lg">
              Acceso Admin
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content Section */}
      <section className="relative overflow-hidden pt-20 pb-16 lg:pt-28 lg:pb-24 border-b border-[#151E2E]">
        <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 via-transparent to-blue-500/5 pointer-events-none" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
              <Sparkles className="h-3.5 w-3.5 animate-pulse" />
              Lavandería de Motos de Alta Estética
            </div>
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
              Brillo impecable. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400">Protección superior.</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed max-w-xl">
              {business.description || 'Agenda tu servicio de estética de motos premium en minutos y dale a tu máquina el cuidado profesional que merece con técnicos especializados.'}
            </p>
            
            <div className="flex flex-wrap items-center gap-4 pt-4">
              <Link to={`/${business.slug}/booking`} className="px-8 py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black rounded-2xl shadow-xl shadow-orange-500/25 hover:opacity-90 active:transform active:scale-95 transition flex items-center justify-center gap-2 text-base">
                Reservar Turno Ahora
                <ArrowRight className="h-5 w-5" />
              </Link>
              <a href="#services" className="px-6 py-4 bg-[#1E293B]/60 hover:bg-[#1E293B] font-semibold rounded-2xl border border-[#334155] transition text-center">
                Ver Servicios & Precios
              </a>
            </div>

            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-[#1E293B] max-w-lg">
              <div>
                <p className="text-3xl font-extrabold text-white">{business.services?.length || 4}</p>
                <p className="text-xs text-gray-400 mt-1">Servicios Estéticos</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{business.staff?.length || 3}</p>
                <p className="text-xs text-gray-400 mt-1">Especialistas</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-white">{avgRating} ★</p>
                <p className="text-xs text-gray-400 mt-1">Valoración Media</p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative group rounded-3xl overflow-hidden border border-[#334155] shadow-2xl">
              <img 
                src="https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80" 
                alt="Moto detallado con espuma" 
                className="w-full h-80 object-cover object-center group-hover:scale-105 transition duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#090D16] via-[#090D16]/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 p-4 bg-[#0F172A]/90 backdrop-blur-md rounded-2xl border border-white/10">
                <div className="flex items-center gap-3">
                  <span className="flex h-3 w-3 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <p className="text-sm font-bold text-white">¡Hay turnos disponibles para Hoy y Mañana!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 bg-[#070A11]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs text-orange-500 uppercase tracking-widest font-black">Nuestra Carta de Cuidado</h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Servicios Estéticos Profesionales</p>
            <p className="text-gray-400">Seleccionamos las mejores espumas neutras, microfibras y desengrasantes para cuidar tus componentes.</p>
          </div>

          {business.services?.length === 0 ? (
            <div className="text-center text-gray-400 py-12">No hay servicios definidos actualmente para este negocio.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {business.services?.map((service: any) => (
                <div key={service.id} className="bg-[#0F172A] border border-[#1E293B] hover:border-orange-500/40 rounded-2xl p-6 hover:shadow-xl transition flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-semibold text-gray-300">
                        ⏱️ {service.duration} mins
                      </div>
                      <span className="text-2xl font-black text-white">
                        ${service.price.toLocaleString('es-CO')}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white uppercase tracking-tight">{service.name}</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">{service.description || 'Limpieza estética garantizada con lavado de cadena.'}</p>
                  </div>
                  <div className="pt-6">
                    <Link to={`/${business.slug}/booking?serviceId=${service.id}`} className="w-full py-3 bg-[#1E293B] text-orange-500 hover:bg-orange-500 hover:text-white border border-orange-500/20 font-bold rounded-lg text-sm transition flex items-center justify-center gap-2">
                      Seleccionar & Agendar
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-20 border-t border-[#111A2E] bg-[#090D16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-3">
              <h2 className="text-xs text-orange-500 uppercase tracking-widest font-black">Estética de Exhibición</h2>
              <p className="text-3xl font-extrabold text-white tracking-tight">Galería de Resultados Reales</p>
            </div>
            <p className="text-gray-400 max-w-md">Soluciones de última tecnología, espacios limpios, profesionales capacitados e insumos óptimos para cada servicio.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="h-64 rounded-2xl overflow-hidden border border-white/5 group">
              <img src="https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=500&auto=format&fit=crop&q=70" alt="Moto espuma" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-white/5 group">
              <img src="https://images.unsplash.com/photo-1485965120184-e220f721d03e?w=500&auto=format&fit=crop&q=70" alt="Detalle rines" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
            <div className="h-64 rounded-2xl overflow-hidden border border-white/5 group">
              <img src="https://images.unsplash.com/photo-1599819811279-d5ad9cccf838?w=500&auto=format&fit=crop&q=70" alt="Secado aire caliente" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
            </div>
          </div>
        </div>
      </section>

      {/* Map, Info & Schedule */}
      <section className="py-20 bg-[#070A11] border-t border-[#111A2E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          <div className="lg:col-span-5 space-y-8 flex flex-col justify-between">
            <div className="space-y-6">
              <div>
                <h2 className="text-xs text-orange-500 uppercase tracking-widest font-black">Ubicación y Horarios</h2>
                <h3 className="text-3xl font-extrabold text-white mt-1">¿Dónde Ubicarnos?</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-orange-500 mt-1">
                    <MapPin className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Dirección Comercial</h4>
                    <p className="text-gray-400 text-sm mt-0.5">{business.address || 'Calle Central de Alta Estética'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-orange-500 mt-1">
                    <Phone className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Teléfono de Soporte</h4>
                    <p className="text-gray-400 text-sm mt-0.5">{business.phone || '+57 (300) 000-0000'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/10 text-orange-500 mt-1">
                    <Mail className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-base">Correo Electrónico</h4>
                    <p className="text-gray-400 text-sm mt-0.5">{business.email || 'correo@negocio.com'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Hours Grid */}
            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 border-b border-[#1E293B] pb-3 text-white font-bold">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>Horario Operativo</span>
              </div>
              <div className="space-y-2.5 text-sm">
                {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((dayName, idx) => {
                  const dayHour = business.businessHours?.find((h: any) => h.dayOfWeek === idx);
                  return (
                    <div key={dayName} className="flex justify-between items-center text-gray-300">
                      <span className={idx === new Date().getDay() ? "text-orange-400 font-bold" : "text-gray-400"}>
                        {dayName} {idx === new Date().getDay() && "•"}
                      </span>
                      {dayHour?.isClosed ? (
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-md font-semibold font-mono">Cerrado</span>
                      ) : (
                        <span className="font-mono text-xs">{dayHour?.openTime} - {dayHour?.closeTime}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Interactive Mock Map */}
          <div className="lg:col-span-7 rounded-3xl overflow-hidden border border-[#1E293B] bg-[#0E131F] relative min-h-[350px] flex flex-col justify-between">
            <div className="absolute inset-0 pointer-events-none opacity-40">
              {/* Clean high-contrast dark grid placeholder background representing maps */}
              <div className="w-full h-full bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] flex items-center justify-center">
                <div className="w-96 h-96 rounded-full border-4 border-dashed border-orange-500/20 animate-spin duration-[40s]"></div>
              </div>
            </div>
            
            <div className="relative z-10 p-8 flex flex-col items-center justify-center text-center h-full space-y-6">
              <div className="h-16 w-16 bg-orange-500/20 border-2 border-orange-500 animate-bounce flex items-center justify-center rounded-2xl text-orange-500 shadow-xl shadow-orange-500/20">
                <MapPin className="h-8 w-8" />
              </div>
              <div>
                <p className="font-bold text-white text-lg">Mapa de Alta Precisión Satelital</p>
                <p className="text-gray-400 text-sm mt-1 max-w-sm mx-auto">
                  {business.address || 'Avenida Principal de Motocicletas'}. <br />
                  Haz clic abajo para abrir indicaciones en tiempo real con Google Maps o Waze.
                </p>
              </div>
              
              <a 
                href={`https://maps.google.com/?q=${encodeURIComponent(business.name + ' ' + (business.address || ''))}`}
                target="_blank" 
                rel="no-referrer"
                className="px-6 py-3 bg-[#1E293B] hover:bg-[#2A374E] text-white text-sm font-bold rounded-xl border border-white/10 transition inline-flex items-center gap-2"
              >
                 Abrir en Google Maps
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-[#090D16]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-xs text-orange-500 uppercase tracking-widest font-black">Sello de Confianza</h2>
            <p className="text-3xl font-extrabold text-white tracking-tight">¿Qué Dicen los Motociclistas?</p>
            <p className="text-gray-400">Nuestros clientes valoran la transparencia en el servicio, la rapidez y el uso de insumos premium.</p>
          </div>

          {business.reviews?.length === 0 ? (
            <div className="text-center text-gray-400 bg-[#0F172A] border border-white/5 py-12 rounded-2xl">
              <p className="mb-3">Aún no hay reseñas registradas para este negocio.</p>
              <p className="text-xs text-orange-500">¿Fuiste atendido por nosotros? ¡Cuéntanos tu experiencia!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {business.reviews?.map((review: any) => (
                <div key={review.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-1 text-orange-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-600'}`} />
                      ))}
                    </div>
                    <p className="text-gray-300 italic text-sm leading-relaxed">
                      "{review.comment || 'Lavado de alta estética impecable.'}"
                    </p>
                  </div>
                  <div className="flex items-center gap-3 pt-6 border-t border-[#1E293B] mt-6">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center font-black text-white text-sm">
                      {review.customer?.name.charAt(0) || 'C'}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-sm">{review.customer?.name || 'Cliente Verificado'}</h4>
                      <p className="text-xs text-gray-400">Garantía Certificada</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer / CTA banner */}
      <footer className="bg-[#06080F] border-t border-[#151E2E] py-12 text-center text-sm text-gray-500">
        <div className="max-w-lg mx-auto space-y-4 px-4">
          <div className="flex justify-center items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-orange-500 animate-pulse"></span>
            <p className="text-gray-400 font-bold">&copy; 2026 {business.name}. Todos los derechos reservados.</p>
          </div>
          <p className="text-xs text-gray-600">
            Powered by WeWash SaaS Network. Conexión automatizada multi-tenant.
          </p>
        </div>
      </footer>
    </div>
  );
}
