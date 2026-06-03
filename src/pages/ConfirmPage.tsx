import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, ShieldCheck, Calendar, Clock, MapPin, User, ChevronRight, ArrowRight, AlertTriangle, Smile } from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';
import Navbar from '../components/Navbar';

export default function ConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const [appointment, setAppointment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Rescheduling states
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Review states
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    fetchAppointment();
  }, [token]);

  const fetchAppointment = () => {
    if (!token) return;
    setLoading(true);
    api.get(`/appointments/confirm/${token}`)
      .then((res) => setAppointment(res.data))
      .catch((err) => {
        console.error(err);
        toast.error('No se pudo encontrar la reservación correspondiente al token.');
      })
      .finally(() => setLoading(false));
  };

  // Fetch available slots if date/service changes during reschedule
  useEffect(() => {
    if (!appointment || !rescheduleDate || !isRescheduling) return;
    setLoadingSlots(true);
    api.get(`/businesses/${appointment.businessId}/availability`, {
      params: {
        date: rescheduleDate,
        serviceId: appointment.serviceId
      }
    })
      .then((res) => setAvailableSlots(res.data))
      .catch((err) => {
        console.error(err);
        toast.error('Error al cargar la disponibilidad.');
      })
      .finally(() => setLoadingSlots(false));
  }, [appointment, rescheduleDate, isRescheduling]);

  // Confirm Appointment handler
  const handleConfirmAppointment = async () => {
    try {
      await api.patch(`/appointments/${appointment.id}`, { status: 'confirmed' });
      toast.success('¡Cita confirmada correctamente! Te esperamos.');
      fetchAppointment();
    } catch (err: any) {
      toast.error('No se pudo confirmar la cita.');
    }
  };

  // Cancel Appointment handler
  const handleCancel = async () => {
    if (!window.confirm('¿Seguro que deseas cancelar esta cita de lavado?')) return;
    try {
      await api.delete(`/appointments/${appointment.id}`);
      toast.success('Tu cita ha sido cancelada correctamente.');
      fetchAppointment();
    } catch (err: any) {
      toast.error('No se pudo cancelar la cita.');
    }
  };

  // Confirm Reschedule handler
  const handleRescheduleSubmit = async () => {
    if (!rescheduleDate || !rescheduleTime) {
      toast.error('Selecciona fecha y hora para reagendar.');
      return;
    }
    try {
      await api.patch(`/appointments/${appointment.id}`, {
        date: rescheduleDate,
        time: rescheduleTime
      });
      toast.success('¡Cita reagendada con éxito!');
      setIsRescheduling(false);
      fetchAppointment();
    } catch (err: any) {
      toast.error('No se pudo reagendar.');
    }
  };

  // Submit Review handler
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/reviews', {
        businessId: appointment.businessId,
        appointmentId: appointment.id,
        customerId: appointment.customerId,
        rating,
        comment
      });
      toast.success('¡Gracias por tu opinión! Reseña guardada.');
      setReviewSubmitted(true);
    } catch (err: any) {
      toast.error('Error al guardar la reseña.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-400">Verificando token de cita...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-gray-100 p-6 text-center">
        <div className="bg-[#151D2A] border border-red-500/20 p-8 rounded-2xl max-w-sm shadow-xl">
          <AlertTriangle className="mx-auto h-16 w-16 text-orange-500 mb-4" />
          <h2 className="text-xl font-black text-white">Cita No Encontrada</h2>
          <p className="text-gray-400 text-sm mt-2 mb-6">El código de comprobante es inválido o la reservación fue archivada.</p>
          <button onClick={() => window.location.href = '/'} className="px-5 py-2.5 bg-orange-500 text-white font-bold rounded-lg text-sm w-full">
            Regresar al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div id="confirm-page-layout" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans pb-16">
      <Navbar />

      <header className="border-b border-[#1E293B] bg-[#0E1320] py-5">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <Link to={`/${appointment.business?.slug}`} className="text-xl font-black text-white tracking-tight flex items-center gap-1.5">
            <span className="text-orange-500">★</span> {appointment.business?.name}
          </Link>
          <span className="text-xs text-gray-400 font-mono">TOKEN: {appointment.token}</span>
        </div>
      </header>
 
      <main className="max-w-4xl mx-auto px-4 mt-8 grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Navigation & Return link shortcuts */}
        <div className="md:col-span-12 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#0E1320] p-4.5 border border-[#1E293B] rounded-2xl">
          <Link 
            to={`/${appointment.business?.slug}`}
            className="text-xs font-black uppercase tracking-wider text-orange-400 hover:text-orange-500 transition flex items-center gap-2"
          >
            <ArrowRight className="h-4 w-4 rotate-180 text-orange-500" />
            <span>Volver al Establecimiento ({appointment.business?.name})</span>
          </Link>
          <Link 
            to="/explorar" 
            className="text-xs font-black uppercase tracking-wider text-gray-400 hover:text-white transition flex items-center gap-1.5"
          >
            <span>Explorar otros negocios</span>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
 
        {/* Reservation summary details */}
        <div className="md:col-span-7 space-y-6">
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="text-xs font-bold text-orange-500 uppercase tracking-wider">Comprobante de Reservación</span>
                <h2 className="text-2xl font-black text-white mt-1 uppercase tracking-tight">RESUMEN DE CITA</h2>
              </div>
              
              {/* Dynamic Badging */}
              <span className={`px-3 py-1 text-xs font-black rounded-full uppercase tracking-wider ${
                appointment.status === 'completed'
                  ? 'bg-green-500/10 text-green-400 border border-green-500/30'
                  : appointment.status === 'confirmed'
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                  : appointment.status === 'cancelled'
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-orange-500/10 text-orange-400 border border-orange-500/30 animate-pulse'
              }`}>
                {appointment.status === 'completed' ? 'Realizada' : appointment.status === 'confirmed' ? 'Confirmada' : appointment.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
              </span>
            </div>
 
            <div className="bg-[#121A2E]/50 border border-white/5 p-4 rounded-xl space-y-3.5 text-sm">
              <div className="flex items-center gap-2.5 text-lg font-bold text-white">
                <Calendar className="h-5 w-5 text-orange-500" />
                <span>{new Date(appointment.date).toISOString().split('T')[0]}</span>
              </div>
              <div className="flex items-center gap-2.5 text-lg font-bold text-white">
                <Clock className="h-5 w-5 text-orange-500" />
                <span>{appointment.time} CO (Hora Local)</span>
              </div>
              <div className="flex items-center gap-2.5 text-gray-300">
                <MapPin className="h-5 w-5 text-orange-500" />
                <span>{appointment.business?.address}</span>
              </div>
            </div>
 
            {/* Asset / Element details framework */}
            <div className="border-t border-[#1E293B] pt-4 space-y-4">
              <h4 className="text-xs text-orange-500 uppercase tracking-widest font-black">Detalles de Referencia o Servicio</h4>
              <div className="grid grid-cols-2 gap-4 bg-[#080D16] p-4 rounded-xl border border-white/5">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Matrícula / Código ID</p>
                  <p className="text-lg font-mono font-black text-white tracking-widest uppercase">{appointment.motorcycle?.plate || 'S/N'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Marca, Tipo o Categoría</p>
                  <p className="text-sm font-extrabold text-white mt-1 uppercase">{appointment.motorcycle?.brand || 'N/A'} - {appointment.motorcycle?.model || 'General'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Características / Color</p>
                  <p className="text-xs text-gray-400 mt-1 uppercase">{appointment.motorcycle?.color || 'Sin registrar'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Paciente o Cliente</p>
                  <p className="text-xs text-gray-400 mt-1">{appointment.customer?.name}</p>
                </div>
              </div>
            </div>
 
            {appointment.notes && (
              <div className="border-t border-[#1E293B] pt-4">
                <p className="text-[10px] text-gray-500 uppercase font-black">Indicaciones o Requerimientos</p>
                <p className="text-xs text-gray-300 bg-[#0A0E17] p-3 rounded-xl border border-white/5 mt-1.5 leading-relaxed">
                  "{appointment.notes}"
                </p>
              </div>
            )}
          </div>
 
          {/* Action buttons (Only if pending state) */}
          {appointment.status === 'pending' && !isRescheduling && (
            <div className="flex flex-col sm:flex-row gap-3">
              <button 
                onClick={handleConfirmAppointment}
                className="flex-1 py-3 text-center bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm rounded-xl border border-emerald-500/30 shadow-md transform hover:scale-[1.01] transition"
              >
                ✓ Confirmar Asistencia
              </button>
              <button 
                onClick={() => {
                  setRescheduleDate(appointment.date.split('T')[0]);
                  setIsRescheduling(true);
                }}
                className="flex-1 py-3 text-center bg-[#1E293B] hover:bg-[#2A374E] text-white font-extrabold text-sm rounded-xl border border-white/10 transition"
              >
                Reagendar / Cambiar Hora
              </button>
              <button 
                onClick={handleCancel}
                className="flex-1 py-3 text-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white font-extrabold text-sm rounded-xl border border-red-500/20 transition"
              >
                Cancelar Cita / Reservación
              </button>
            </div>
          )}
 
          {/* Rescheduling Form Overlay */}
          {isRescheduling && (
            <div className="bg-[#0F172A] border border-orange-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-[#1E293B] pb-3">
                <h3 className="font-extrabold text-white text-base">Reagendar Turno de Servicio</h3>
                <button onClick={() => setIsRescheduling(false)} className="text-xs text-gray-400 hover:text-white">✕ Cancelar</button>
              </div>
 
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Nuevo Día de Cita</label>
                  <input 
                    type="date" 
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white transition"
                  />
                </div>
 
                <div className="space-y-2">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Elige de los Horarios Disponibles</label>
                  {loadingSlots ? (
                    <p className="text-xs text-gray-500 animate-pulse">Consultando disponibilidad de cabinas y profesionales...</p>
                  ) : availableSlots.length === 0 ? (
                    <p className="text-xs text-red-400 bg-red-400/5 p-3.5 border border-red-500/10 rounded-xl">Ningún especialista o bahía disponible el día indicado. Selecciona otra fecha.</p>
                  ) : (
                    <div className="grid grid-cols-4 gap-2">
                      {availableSlots.map(time => (
                        <button
                          key={time}
                          type="button"
                          onClick={() => setRescheduleTime(time)}
                          className={`py-2 px-1 rounded-lg border font-mono text-xs font-bold text-center transition ${
                            rescheduleTime === time
                              ? 'bg-orange-500 border-orange-500 text-white shadow-md'
                              : 'bg-[#080D16] border-[#1E293B] text-gray-300 hover:border-orange-400'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
 
                <button 
                  onClick={handleRescheduleSubmit}
                  disabled={!rescheduleTime}
                  className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-extrabold text-sm rounded-xl transition disabled:opacity-55"
                >
                  Guardar Reagendamiento
                </button>
              </div>
            </div>
          )}
        </div>
 
        {/* Reviews Left Block Column */}
        <div className="md:col-span-5 space-y-6">
          {/* Card detailing the service info */}
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest">Servicio Agendado / Contratado</h3>
            <div>
              <p className="text-lg font-bold text-white uppercase">{appointment.service?.name}</p>
              <p className="text-sm text-gray-400 mt-1">${appointment.service?.price.toLocaleString('es-CO')}</p>
              <p className="text-xs text-orange-400 font-bold mt-2">⏱️ Duración estimada: {appointment.service?.duration} mins</p>
            </div>
            
            {appointment.staff && (
              <div className="pt-4 border-t border-[#1E293B] flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-slate-800 flex items-center justify-center font-bold text-sm text-white">
                  {appointment.staff.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Especialista asignado</p>
                  <p className="text-xs font-bold text-white">{appointment.staff.name}</p>
                </div>
              </div>
            )}
          </div>
 
          {/* Interactive Review panel */}
          {appointment.status === 'completed' && !reviewSubmitted && (
            <form onSubmit={handleReviewSubmit} className="bg-[#0F172A] border border-orange-500/20 rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold">
                <Smile className="h-5 w-5 text-orange-500" />
                <span>¿Cómo fue tu experiencia de servicio?</span>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">Tu opinión es fundamental para el crecimiento de nuestro equipo. Califica de 1 a 5 estrellas tu sesión.</p>
              
              {/* Star selector */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((stars) => (
                  <button 
                    key={stars}
                    type="button"
                    onClick={() => setRating(stars)}
                    className="p-1 hover:scale-105 transition outline-none"
                  >
                    <Star className={`h-6 w-6 ${rating >= stars ? 'text-orange-400 fill-current' : 'text-gray-600'}`} />
                  </button>
                ))}
              </div>
 
              <div className="space-y-1">
                <label className="text-[10px] text-gray-400 uppercase font-black">Comentarios / Reseña o Feedback</label>
                <textarea 
                  required
                  placeholder="Ej: Excelente servicio, puntual y sumamente profesional..."
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-xs outline-none text-white transition resize-none"
                />
              </div>
 
              <button type="submit" className="w-full py-2.5 bg-orange-500 font-bold text-xs text-white rounded-xl hover:bg-orange-600 transition">
                Enviar Comentario de Calificación
              </button>
            </form>
          )}
 
          {reviewSubmitted && (
            <div className="bg-[#121E1E] border border-emerald-500/25 p-6 rounded-2xl text-center space-y-2">
              <p className="text-emerald-400 font-black text-sm">¡Reseña Publicada!</p>
              <p className="text-xs text-gray-400 leading-relaxed">Tu testimonio ya forma parte de las calificaciones públicas del establecimiento.</p>
            </div>
          )}
        </div>
      </main>
 
      <footer className="max-w-4xl mx-auto px-4 text-center text-xs text-gray-600 mt-16">
        <p>&copy; 2026 ReserveFlow SaaS Connection. Consulta directa autorizada.</p>
      </footer>
    </div>
  );
}
