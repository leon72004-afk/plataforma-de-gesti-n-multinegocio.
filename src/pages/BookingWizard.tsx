import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Sparkles, Calendar, Clock, User, Check, ArrowLeft, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

export default function BookingWizard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialServiceId = searchParams.get('serviceId');

  const [business, setBusiness] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Wizard state machine
  const [step, setStep] = useState(1);

  // Selection states
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedStaff, setSelectedStaff] = useState<any>(null); // "any" or Staff object
  const [selectedDate, setSelectedDate] = useState<string>(''); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string>(''); // HH:MM

  // Available slots computed
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Paso 4: Form state
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  const [bikeBrand, setBikeBrand] = useState('');
  const [bikeModel, setBikeModel] = useState('');
  const [bikePlate, setBikePlate] = useState('');
  const [bikeColor, setBikeColor] = useState('');
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Generate beautiful next 14 calendar days
  const [next14Days, setNext14Days] = useState<{ label: string; dateStr: string; dayName: string; isWeekend: boolean }[]>([]);

  useEffect(() => {
    const days = [];
    const date = new Date();
    // Offset local dates correctly
    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(date.getDate() + i);
      const dayName = d.toLocaleDateString('es-ES', { weekday: 'short' });
      const label = d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
      // YYYY-MM-DD format local
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dayDigit = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${dayDigit}`;
      const dayOfWeek = d.getDay();
      days.push({
        label,
        dateStr,
        dayName: dayName.toUpperCase(),
        isWeekend: dayOfWeek === 0 || dayOfWeek === 6
      });
    }
    setNext14Days(days);
    // Standardize initial date selection to today or tomorrow depending on operational status
    setSelectedDate(days[0].dateStr);
  }, []);

  // On page mount
  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    api.get(`/businesses/${slug}/profile`)
      .then((res) => {
        setBusiness(res.data);
        // Pre-select service from URL parameter if exists
        if (initialServiceId && res.data.services) {
          const match = res.data.services.find((s: any) => s.id === initialServiceId);
          if (match) {
            setSelectedService(match);
            setStep(2); // Jump to step 2 if pre-selected
          }
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('No se pudo encontrar este lavadero.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [slug, initialServiceId]);

  // Retrieve active timeslots dynamically based on: date + service
  useEffect(() => {
    if (!business || !selectedService || !selectedDate) return;
    setLoadingSlots(true);
    api.get(`/businesses/${business.id}/availability`, {
      params: {
        date: selectedDate,
        serviceId: selectedService.id
      }
    })
      .then((res) => {
        setTimeSlots(res.data);
        // Reset selected time if not available in new list
        if (selectedTime && !res.data.includes(selectedTime)) {
          setSelectedTime('');
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Error calculando horas disponibles en tiempo real.');
      })
      .finally(() => {
        setLoadingSlots(false);
      });
  }, [business, selectedService, selectedDate, selectedTime]);

  const handleCreateAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Faltan selecciones previas.');
      return;
    }

    if (!customerName || !customerPhone || !customerEmail || !bikeBrand || !bikeModel || !bikePlate || !bikeColor) {
      toast.error('Por favor completa todos los datos obligatorios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        businessId: business.id,
        serviceId: selectedService.id,
        staffId: selectedStaff && selectedStaff !== 'any' ? selectedStaff.id : 'any',
        date: selectedDate,
        time: selectedTime,
        customerName,
        customerPhone,
        customerEmail,
        bikeBrand,
        bikeModel,
        bikePlate: bikePlate.trim().toUpperCase(),
        bikeColor,
        notes
      };

      const response = await api.post('/appointments', payload);
      toast.success('¡Cita agendada de forma exitosa!');
      navigate(`/confirm/${response.data.token}`);
    } catch (err: any) {
      console.error(err);
      const msg = err.response?.data?.error || 'Falló la conexión para agendar la cita.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-400 font-medium">Iniciando asistente de reserva...</p>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100 p-6">
        <div className="bg-[#151D2A] p-8 rounded-2xl border border-red-500/20 max-w-sm text-center shadow-lg">
          <p className="text-red-400 font-semibold mb-4">Error al cargar datos del lavadero.</p>
          <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-lg">
            Regresar al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="booking-wizard-wrapper" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans pb-16">
      <Navbar />
      {/* Mini Breadcrumb Header */}
      <header className="border-b border-[#1E293B] bg-[#0E1320] py-4">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <button onClick={() => navigate(`/${business.slug}`)} className="text-gray-400 hover:text-white flex items-center gap-1.5 text-sm transition">
            <ArrowLeft className="h-4 w-4" />
            <span>Volver a {business.name}</span>
          </button>
          <div className="px-3 py-1 bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-bold rounded-full uppercase tracking-wider">
            Reserva Inteligente
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto px-4 mt-8">
        {/* Wizard Step Progression Bar */}
        <div id="wizard-progression-panel" className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-4 gap-2 text-center text-xs md:text-sm">
            {[
              { num: 1, name: 'Servicio' },
              { num: 2, name: 'Técnico' },
              { num: 3, name: 'Fecha & Hora' },
              { num: 4, name: 'Datos' }
            ].map((s) => (
              <div 
                key={s.num} 
                onClick={() => {
                  if (s.num < step) setStep(s.num);
                }} 
                className={`flex flex-col items-center gap-2 cursor-pointer pb-2 border-b-2 transition ${
                  step === s.num
                    ? 'border-orange-500 text-orange-400 font-black'
                    : step > s.num
                    ? 'border-green-500 text-green-400 font-bold'
                    : 'border-[#1E293B] text-gray-500'
                }`}
              >
                <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-xs ${
                  step === s.num
                    ? 'bg-orange-500 text-white shadow-md'
                    : step > s.num
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1E293B] text-gray-400'
                }`}>
                  {step > s.num ? '✓' : s.num}
                </div>
                <span>{s.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* STEP 1: SERVICIOS */}
        {step === 1 && (
          <div id="booking-step-1" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">Paso 1: Selecciona el Servicio Estético</h3>
              <p className="text-gray-400 text-sm">Cada servicio cuenta con un tiempo estimado de lavado, secado y detallado.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {business.services?.map((serv: any) => (
                <div 
                  key={serv.id} 
                  onClick={() => {
                    setSelectedService(serv);
                    setStep(2);
                  }}
                  className={`p-6 rounded-2xl border cursor-pointer hover:border-orange-500/40 hover:bg-[#121A2E] transition flex flex-col justify-between h-48 ${
                    selectedService?.id === serv.id
                      ? 'border-orange-500 bg-[#121A2E] shadow-xl shadow-orange-500/5'
                      : 'border-[#1E293B] bg-[#0F172A]'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-orange-400 font-bold uppercase tracking-wider">⏱️ {serv.duration} Minutos</span>
                      {selectedService?.id === serv.id && <div className="h-4 w-4 rounded-full bg-orange-500 text-white flex items-center justify-center text-[10px]">✓</div>}
                    </div>
                    <h4 className="text-lg font-bold text-white uppercase tracking-tight">{serv.name}</h4>
                    <p className="text-gray-400 text-xs line-clamp-2 md:line-clamp-3 leading-relaxed">{serv.description || 'Lavado minucioso de alta estética.'}</p>
                  </div>
                  
                  <div className="flex justify-between items-center pt-4 border-t border-white/5">
                    <span className="text-xs text-gray-400">Precio estimado</span>
                    <span className="text-xl font-black text-orange-500">${serv.price.toLocaleString('es-CO')}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 2: TÉCNICOS */}
        {step === 2 && (
          <div id="booking-step-2" className="space-y-6 animate-fade-in">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">Paso 2: Elige el Especialista de Confianza</h3>
              <p className="text-gray-400 text-sm">Nuestros especialistas cuentan con certificaciones avanzadas y amplia trayectoria garantizando excelencia en cada sesión.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-6">
              {/* Cualquiera disponible option */}
              <div 
                onClick={() => {
                  setSelectedStaff('any');
                  setStep(3);
                }}
                className={`p-5 rounded-2xl border text-center cursor-pointer transition flex flex-col items-center justify-center gap-4 hover:border-orange-500/40 hover:bg-[#121A2E] h-56 ${
                  selectedStaff === 'any'
                    ? 'border-orange-500 bg-[#121A2E]'
                    : 'border-[#1E293B] bg-[#0F172A]'
                }`}
              >
                <div className="h-16 w-16 bg-gradient-to-tr from-orange-400 to-amber-500 rounded-full flex items-center justify-center text-white font-black shadow-lg shadow-orange-500/20">
                  ⚡
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm uppercase">Cualquier Operador</h4>
                  <p className="text-xs text-gray-400 mt-1">El más rápido disponible</p>
                </div>
              </div>

              {business.staff?.map((tech: any) => (
                <div 
                  key={tech.id} 
                  onClick={() => {
                    setSelectedStaff(tech);
                    setStep(3);
                  }}
                  className={`p-5 rounded-2xl border text-center cursor-pointer hover:border-orange-500/40 hover:bg-[#121A2E] transition flex flex-col items-center justify-center gap-4 h-56 ${
                    selectedStaff?.id === tech.id
                      ? 'border-orange-500 bg-[#121A2E]'
                      : 'border-[#1E293B] bg-[#0F172A]'
                  }`}
                >
                  {tech.photoUrl ? (
                    <img src={tech.photoUrl} alt={tech.name} referrerPolicy="no-referrer" className="h-16 w-16 rounded-full object-cover border border-white/10" />
                  ) : (
                    <div className="h-16 w-16 bg-gray-700/60 rounded-full flex items-center justify-center text-gray-300 font-bold uppercase">
                      {tech.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="text-white font-bold text-sm uppercase tracking-tight">{tech.name}</h4>
                    <p className="text-xs text-orange-400 font-semibold mt-1">{tech.specialty || 'Especialista General'}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4">
              <button onClick={() => setStep(1)} className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#2D3D56] text-white font-bold text-sm rounded-lg transition inline-flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Regresar
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: FECHA & HORA */}
        {step === 3 && (
          <div id="booking-step-3" className="space-y-6">
            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-white">Paso 3: Selecciona Fecha y Hora</h3>
              <p className="text-gray-400 text-sm">Disponibilidad recalculada al instante basada en las bahías y buffers estéticos del negocio.</p>
            </div>

            {/* Next 14 Days Carousel/Grid */}
            <div className="space-y-3">
              <label className="text-xs text-orange-500 uppercase tracking-widest font-black flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Selecciona el Día
              </label>
              
              <div className="grid grid-cols-4 sm:grid-cols-7 gap-2.5">
                {next14Days.map((d) => (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      setSelectedDate(d.dateStr);
                      setSelectedTime(''); // Reset time on date change
                    }}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center gap-1.5 transition ${
                      selectedDate === d.dateStr
                        ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/25'
                        : d.isWeekend
                        ? 'bg-[#151B27]/40 border-dashed border-[#1E293B] text-gray-500 hover:border-gray-600'
                        : 'bg-[#0F172A] border-[#1E293B] text-gray-300 hover:border-orange-500/40 hover:bg-[#121A2E]'
                    }`}
                  >
                    <span className="text-[10px] font-extrabold tracking-wider">{d.dayName}</span>
                    <span className="text-sm font-black">{d.label.split(' ')[0]}</span>
                    <span className="text-[9px] uppercase font-semibold text-gray-400/80">{d.label.split(' ')[1]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Active Timeslots */}
            <div className="space-y-3 pt-4">
              <label className="text-xs text-orange-500 uppercase tracking-widest font-black flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Horarios Disponibles para {selectedDate}
              </label>

              {loadingSlots ? (
                <div className="text-center py-10 bg-[#0F172A] border border-[#1E293B] rounded-2xl progress-container">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  <p className="text-gray-400 text-xs mt-3">Calculando buffers en tiempo real...</p>
                </div>
              ) : timeSlots.length === 0 ? (
                <div className="text-center py-8 bg-[#0F172A] border border-red-500/10 rounded-2xl text-gray-400 text-sm">
                  🛑 No hay turnos disponibles para esta fecha. Intenta cambiar de día o seleccionar otro servicio.
                </div>
              ) : (
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
                  {timeSlots.map((time) => (
                    <button
                      key={time}
                      type="button"
                      onClick={() => {
                        setSelectedTime(time);
                        setStep(4);
                      }}
                      className={`py-3 px-2 rounded-xl border text-center font-mono text-xs font-bold tracking-tight transition ${
                        selectedTime === time
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg'
                          : 'bg-[#0F172A] border-[#1E293B] text-gray-300 hover:border-orange-400 hover:text-orange-400 hover:bg-[#121A2E]'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-8 border-t border-[#1E293B]">
              <button onClick={() => setStep(2)} className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#2D3D56] text-white font-bold text-sm rounded-lg transition inline-flex items-center gap-1.5">
                <ArrowLeft className="h-4 w-4" />
                Atrás
              </button>
              {selectedTime && (
                <button onClick={() => setStep(4)} className="px-5 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-lg transition inline-flex items-center gap-1.5 shadow-lg shadow-orange-500/15">
                  Confirmar Detalles
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP 4: FORMULARIO CLIENTE & VEHÍCULO */}
        {step === 4 && (
          <div id="booking-step-4" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form Fields Column */}
            <form onSubmit={handleCreateAppointment} className="lg:col-span-7 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-6">
              <h3 className="text-xl font-extrabold text-white border-b border-[#1E293B] pb-3 uppercase tracking-tight">DATOS DE LA RESERVA</h3>
              
              {/* Customer Details */}
              <div className="space-y-4">
                <h4 className="text-xs text-orange-500 uppercase tracking-widest font-black">Información Personal</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Nombre Completo *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: David Restrepo" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Celular / Teléfono *</label>
                    <input 
                      type="tel" 
                      required 
                      placeholder="Ej: +57 321 000 0000" 
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">Correo Electrónico *</label>
                  <input 
                    type="email" 
                    required 
                    placeholder="Ej: david@ejemplo.com" 
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                  />
                  <p className="text-[10px] text-gray-500">Para enviarte el comprobante de cita y el enlace de reagendamiento.</p>
                </div>
              </div>

              {/* Vehicle / Request Details */}
              <div className="space-y-4 pt-4 border-t border-[#1E293B]">
                <h4 className="text-xs text-orange-500 uppercase tracking-widest font-black text-white">Detalles del Objeto o Motivo de Cita</h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Marca / Tipo de Objeto *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Toyota, Yamaha, Mascota/Perro, Laptop, Cliente" 
                      value={bikeBrand}
                      onChange={(e) => setBikeBrand(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Modelo o Raza / Categoría *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Corolla, Onix, Golden, ThinkPad, Adulto" 
                      value={bikeModel}
                      onChange={(e) => setBikeModel(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Placa, Código ID o Matrícula *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: XYZ99E, ABC123, Cedula/DNI, Reg-909" 
                      value={bikePlate}
                      onChange={(e) => setBikePlate(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white font-mono uppercase tracking-widest transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs text-gray-400 font-bold uppercase">Color / Aspecto o Detalles *</label>
                    <input 
                      type="text" 
                      required 
                      placeholder="Ej: Negro Mate, Plateado, Café, Gris, N/A" 
                      value={bikeColor}
                      onChange={(e) => setBikeColor(e.target.value)}
                      className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs text-gray-400 font-bold uppercase">Instrucciones Especiales / Notas (Opcional)</label>
                  <textarea 
                    placeholder="Ej: Cuidado especial con la tapicería/sensores, requerimientos médicos, lavado detallado, no mojar bocinas..."
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition resize-none"
                  />
                </div>
              </div>

              {/* Botones */}
              <div className="flex justify-between items-center pt-6 border-t border-[#1E293B]">
                <button type="button" onClick={() => setStep(3)} className="px-5 py-2.5 bg-[#1E293B] hover:bg-[#2D3D56] text-white font-bold text-sm rounded-lg transition inline-flex items-center gap-1.5">
                  <ArrowLeft className="h-4 w-4" />
                  Regresar
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-sm rounded-xl transition inline-flex items-center gap-1.5 shadow-lg shadow-orange-500/20 hover:opacity-90 active:transform active:scale-95 disabled:opacity-50"
                >
                  {isSubmitting ? 'Procesando Reservación...' : 'Confirmar Reserva de Cita'}
                  <Check className="h-4 w-4" />
                </button>
              </div>
            </form>

            {/* Resume Cart Column */}
            <div id="booking-resume-card" className="lg:col-span-5 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-6 sticky top-28">
              <h3 className="text-sm font-black text-orange-500 uppercase tracking-widest flex items-center gap-1">
                <Sparkles className="h-4 w-4" />
                Resumen del Servicio
              </h3>

              <div className="space-y-4">
                <div className="border-b border-[#1E293B] pb-4 flex justify-between items-start gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Establecimiento</p>
                    <p className="text-base font-black text-white tracking-tight">{business.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{business.address}</p>
                  </div>
                </div>

                <div className="border-b border-[#1E293B] pb-4 grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Servicio Elegido</p>
                    <p className="text-sm font-bold text-white mt-0.5 uppercase">{selectedService?.name}</p>
                    <p className="text-[11px] text-orange-400 font-semibold">{selectedService?.duration} minutos de duración</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 uppercase">Precio Base</p>
                    <p className="text-base font-extrabold text-white mt-0.5">${selectedService?.price.toLocaleString('es-CO')}</p>
                  </div>
                </div>

                {selectedStaff && selectedStaff !== 'any' && (
                  <div className="border-b border-[#1E293B] pb-4">
                    <p className="text-xs text-gray-400 uppercase">Operador Asignado</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      {selectedStaff.photoUrl ? (
                        <img src={selectedStaff.photoUrl} alt={selectedStaff.name} referrerPolicy="no-referrer" className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <div className="h-6 w-6 rounded-full bg-orange-500/20 text-orange-400 flex items-center justify-center text-[10px] font-bold">
                          {selectedStaff.name.charAt(0)}
                        </div>
                      )}
                      <span className="text-xs font-bold text-white">{selectedStaff.name}</span>
                    </div>
                  </div>
                )}

                <div className="bg-[#121A2E]/60 border border-orange-500/10 p-4 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Calendar className="h-4 w-4 text-orange-400" />
                    <span>Fecha: {selectedDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <Clock className="h-4 w-4 text-orange-400" />
                    <span>Hora: {selectedTime} CO (UTC-5)</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[#1E293B] text-center">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  🔒 Cumplimos con todas las políticas de protección de datos. El link para cancelar o reagendar tu cita se enviará instantáneamente a tu correo electrónico.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
