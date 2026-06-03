import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, Clock, DollarSign, Award, Users, Trash, Edit2, 
  Settings, TrendingUp, Star, Phone, MapPin, Sparkles, LogOut, Check, ArrowRight, ShieldAlert, PlusCircle, MessageSquare,
  GripVertical, Store, X, Upload, Image
} from 'lucide-react';
import api from '../lib/api';
import { toast } from 'sonner';
import { WhatsAppDemoPanel } from '../components/WhatsAppDemoPanel';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  });
  const [filterByDate, setFilterByDate] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  // Active Dashboard Sub-view Tag
  const [activeTab, setActiveTab] = useState<'appointments' | 'services' | 'staff' | 'settings' | 'metrics' | 'whatsapp' | 'leads'>('appointments');
  const [useDemoMode, setUseDemoMode] = useState(true);

  // Superadmin State Helpers
  const [allBusinesses, setAllBusinesses] = useState<any[]>([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState<string>('');
  const [managedBusiness, setManagedBusiness] = useState<any | null>(null);

  // Custom manual shop creation inside Leads / SaaS view
  const [isCreatingShop, setIsCreatingShop] = useState(false);
  const [newShopName, setNewShopName] = useState('');
  const [newShopSlug, setNewShopSlug] = useState('');
  const [newShopEmail, setNewShopEmail] = useState('');
  const [newShopPhone, setNewShopPhone] = useState('');
  const [newShopAdminName, setNewShopAdminName] = useState('');
  const [newShopAdminPassword, setNewShopAdminPassword] = useState('');

  // Onboarding Leads state helpers
  const [leads, setLeads] = useState<any[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Custom Deletion Confirmation Modal States for Superadmin
  const [businessToDelete, setBusinessToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeletingLoading, setIsDeletingLoading] = useState(false);

  // WhatsApp Notifications State Helpers
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [simPhone, setSimPhone] = useState('');
  const [simMessage, setSimMessage] = useState('CONFIRMAR');
  const [isSimulating, setIsSimulating] = useState(false);

  // Services State Helper
  const [services, setServices] = useState<any[]>([]);
  const [isCreatingService, setIsCreatingService] = useState(false);
  const [serviceName, setServiceName] = useState('');
  const [serviceDuration, setServiceDuration] = useState('30');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceDesc, setServiceDesc] = useState('');

  // Manual Appointment State Helper
  const [showManualAppModal, setShowManualAppModal] = useState(false);
  const [manualAppName, setManualAppName] = useState('');
  const [manualAppPhone, setManualAppPhone] = useState('');
  const [manualAppEmail, setManualAppEmail] = useState('');
  const [manualAppPlate, setManualAppPlate] = useState('');
  const [manualAppBrand, setManualAppBrand] = useState('');
  const [manualAppModel, setManualAppModel] = useState('');
  const [manualAppColor, setManualAppColor] = useState('');
  const [manualAppServiceId, setManualAppServiceId] = useState('');
  const [manualAppStaffId, setManualAppStaffId] = useState('');
  const [manualAppDate, setManualAppDate] = useState('');
  const [manualAppTime, setManualAppTime] = useState('10:00');
  const [manualAppNotes, setManualAppNotes] = useState('');
  const [manualAppIsSubmitting, setManualAppIsSubmitting] = useState(false);

  // Metrics filtering states
  const [metricPeriod, setMetricPeriod] = useState<'dia' | 'semana' | 'mes' | 'personalizado'>('semana');
  const [metricStartDate, setMetricStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [metricEndDate, setMetricEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  // Staff State Helper
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isCreatingStaff, setIsCreatingStaff] = useState(false);
  const [staffName, setStaffName] = useState('');
  const [staffSpecialty, setStaffSpecialty] = useState('');
  const [staffPhoto, setStaffPhoto] = useState('');
  const [staffLunchStart, setStaffLunchStart] = useState('');
  const [staffLunchEnd, setStaffLunchEnd] = useState('');
  const [staffBreakStart, setStaffBreakStart] = useState('');
  const [staffBreakEnd, setStaffBreakEnd] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  // Staff Editing States
  const [editingStaff, setEditingStaff] = useState<any | null>(null);
  const [editingStaffName, setEditingStaffName] = useState('');
  const [editingStaffSpecialty, setEditingStaffSpecialty] = useState('');
  const [editingStaffPhoto, setEditingStaffPhoto] = useState('');
  const [editingStaffActive, setEditingStaffActive] = useState(true);
  const [editingStaffLunchStart, setEditingStaffLunchStart] = useState('');
  const [editingStaffLunchEnd, setEditingStaffLunchEnd] = useState('');
  const [editingStaffBreakStart, setEditingStaffBreakStart] = useState('');
  const [editingStaffBreakEnd, setEditingStaffBreakEnd] = useState('');
  const [isEditingDraggingFile, setIsEditingDraggingFile] = useState(false);

  // Settings business customization
  const [businessName, setBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessBuffer, setBusinessBuffer] = useState('15');
  const [businessDesc, setBusinessDesc] = useState('');
  const [businessHoursList, setBusinessHoursList] = useState<any[]>([]);

  // Drag and Drop view state
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [draggedAppId, setDraggedAppId] = useState<string | null>(null);
  const [draggingOverColumnId, setDraggingOverColumnId] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, appId: string) => {
    setDraggedAppId(appId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDraggingOverColumnId(columnId);
  };

  const handleDragLeave = () => {
    setDraggingOverColumnId(null);
  };

  const handleDrop = async (columnId: string) => {
    if (!draggedAppId) return;
    const targetStaffId = columnId === 'unassigned' ? 'any' : columnId;
    const currentApp = appointments.find(a => a.id === draggedAppId);
    
    // Clear drag coordinates immediately
    setDraggedAppId(null);
    setDraggingOverColumnId(null);

    if (!currentApp) return;
    
    // Check if it's already in this column
    const actualOldStaffId = currentApp.staffId;
    if (actualOldStaffId === null && columnId === 'unassigned') return;
    if (actualOldStaffId === columnId) return;

    // Optimistically update standard react state so UI feels extremely fast!
    const oldStaffId = currentApp.staffId;
    const oldStaff = currentApp.staff;
    const targetStaffObj = columnId === 'unassigned' ? null : staffList.find(s => s.id === columnId);

    setAppointments(prev => prev.map(a => {
      if (a.id === draggedAppId) {
        return {
          ...a,
          staffId: columnId === 'unassigned' ? null : columnId,
          staff: targetStaffObj
        };
      }
      return a;
    }));

    try {
      await api.patch(`/appointments/${draggedAppId}`, { staffId: targetStaffId });
      toast.success('¡Técnico asignado y cita transferida!');
      // Update actual background metrics
      if (user?.businessId) {
        fetchBusinessStats(user.businessId);
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Falló al reasignar el turno.');
      // Revert in case of failure
      setAppointments(prev => prev.map(a => {
        if (a.id === draggedAppId) {
          return {
            ...a,
            staffId: oldStaffId,
            staff: oldStaff
          };
        }
        return a;
      }));
    }
  };

  const fetchAllBusinesses = async () => {
    try {
      const res = await api.get('/businesses');
      setAllBusinesses(res.data);
      return res.data;
    } catch (err) {
      console.error('Error fetching businesses:', err);
      return [];
    }
  };

  const handleDeleteBusinessTrigger = (id: string, name: string) => {
    setBusinessToDelete({ id, name });
  };

  const handleDeleteBusinessConfirm = async () => {
    if (!businessToDelete) return;
    const { id: bizId, name: bizName } = businessToDelete;
    setIsDeletingLoading(true);

    try {
      await api.delete(`/businesses/${bizId}`);
      toast.success(`Lavadero "${bizName}" eliminado exitosamente.`);
      
      if (selectedBusinessId === bizId) {
        setSelectedBusinessId('');
      }
      if (managedBusiness?.id === bizId) {
        setManagedBusiness(null);
      }
      
      setBusinessToDelete(null);
      await fetchAllBusinesses();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || `Error al eliminar el lavadero "${bizName}".`);
    } finally {
      setIsDeletingLoading(false);
    }
  };

  const handleBusinessChange = (bizId: string) => {
    setSelectedBusinessId(bizId);
    fetchBusinessStats(bizId);
    fetchBusinessServices(bizId);
    fetchBusinessStaff(bizId);
    fetchBusinessAppointmentsAndDetails(bizId);
    
    const selectedBiz = allBusinesses.find(b => b.id === bizId);
    if (selectedBiz) {
      setBusinessName(selectedBiz.name || '');
      setBusinessAddress(selectedBiz.address || '');
      setBusinessPhone(selectedBiz.phone || '');
      setBusinessEmail(selectedBiz.email || '');
      setBusinessBuffer(String(selectedBiz.bufferTime || '15'));
      setBusinessDesc(selectedBiz.description || '');
    }
  };

  useEffect(() => {
    // Get user session metadata
    api.get('/auth/me')
      .then(async (res) => {
        const u = res.data.user;
        setUser(u);
        
        let targetBizId = u.businessId;

        if (u.role === 'superadmin') {
          const bizs = await fetchAllBusinesses();
          if (bizs && bizs.length > 0) {
            targetBizId = bizs[0].id;
            setSelectedBusinessId(bizs[0].id);
          }
        } else {
          if (u.businessId) {
            setSelectedBusinessId(u.businessId);
          }
        }
        
        if (targetBizId) {
          fetchBusinessStats(targetBizId);
          fetchBusinessServices(targetBizId);
          fetchBusinessStaff(targetBizId);
          fetchBusinessAppointmentsAndDetails(targetBizId);
        }
        
        // Feed settings form
        const biz = u.business || (u.role === 'superadmin' && targetBizId ? { id: targetBizId } : null);
        if (biz) {
          const bizs = await api.get('/businesses');
          const foundBiz = bizs.data.find((b: any) => b.id === targetBizId);
          if (foundBiz) {
            setBusinessName(foundBiz.name || '');
            setBusinessAddress(foundBiz.address || '');
            setBusinessPhone(foundBiz.phone || '');
            setBusinessEmail(foundBiz.email || '');
            setBusinessBuffer(String(foundBiz.bufferTime || '15'));
            setBusinessDesc(foundBiz.description || '');
          }
        }
      })
      .catch((err) => {
        console.error(err);
        toast.error('Sesión vencida. Autentícate de nuevo.');
        navigate('/login');
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  useEffect(() => {
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (activeBizId) {
      fetchBusinessAppointmentsAndDetails(activeBizId);
    }
  }, [user, selectedBusinessId]);

  useEffect(() => {
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (activeBizId && activeTab === 'whatsapp') {
      fetchNotifications();
    }
  }, [activeTab, user, selectedBusinessId]);

  useEffect(() => {
    if (activeTab === 'leads') {
      fetchLeads();
    }
  }, [activeTab]);

  const fetchLeads = async () => {
    try {
      setLoadingLeads(true);
      const res = await api.get('/leads');
      setLeads(res.data);
    } catch (err) {
      console.error('Error fetching leads:', err);
      toast.error('Error al cargar solicitudes de onboarding.');
    } finally {
      setLoadingLeads(false);
    }
  };

  const handleUpdateLeadStatus = async (leadId: string, status: string) => {
    try {
      setUpdatingLeadId(leadId);
      await api.patch(`/leads/${leadId}`, { status });
      toast.success(`Estado de solicitud cambiado a: ${status}`);
      fetchLeads();
    } catch (err) {
      console.error('Error updating lead status:', err);
      toast.error('Fallo al actualizar el estado del cliente.');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleApproveAndLaunchLead = async (leadId: string) => {
    if (!window.confirm('¿Confirmas que has acordado la tarifa y deseas aprovisionar este lavadero de forma automática?')) return;
    try {
      setUpdatingLeadId(leadId);
      const res = await api.post(`/leads/${leadId}/approve-launch`);
      if (res.data.success) {
        toast.success(`¡Éxito! Lavadero "${res.data.business.name}" creado.`);
        alert(`SISTEMA PROVISIONADO CON ÉXITO:\n\nColega admin, el establecimiento ha sido creado.\n\nSlug de Acceso: ${res.data.slug}\nUsuario Admin: ${res.data.business.email}\nContraseña Temporal obligatoria: ${res.data.tempPassword}\n\nPor favor, compártele estos datos al propietario para que inicie sesión.`);
        fetchLeads();
      }
    } catch (err: any) {
      console.error('Error approving lead:', err);
      toast.error(err.response?.data?.error || 'Error al aprovisionar automáticamente el lavadero.');
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Error fetching notification logs:', err);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const handleSendManualWhatsApp = async (appointmentId: string) => {
    try {
      await api.post('/notifications/manual-whatsapp', { appointmentId });
      toast.success('Recordatorio manual de WhatsApp remitido correctamente.');
      fetchNotifications();
    } catch (err: any) {
      toast.error('Ocurrió un error al despachar el WhatsApp manual.');
    }
  };

  const handleSimulateWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!simPhone || !simMessage) {
      toast.error('Número de celular y respuesta del cliente son requeridos.');
      return;
    }
    try {
      setIsSimulating(true);
      const res = await api.post('/whatsapp/webhook-simulate', { phone: simPhone, message: simMessage });
      if (res.data.success) {
        toast.success(`Webhook: "${res.data.reply}"`);
        fetchNotifications();
        if (user?.businessId) {
          fetchBusinessAppointmentsAndDetails(user.businessId);
          fetchBusinessStats(user.businessId);
        }
      } else {
        toast.error(`Respuesta de rechazo: ${res.data.reply}`);
      }
    } catch (err: any) {
      toast.error('Fallo al procesar la respuesta simulada en el webhook.');
    } finally {
      setIsSimulating(false);
    }
  };

  const fetchBusinessStats = async (id: string) => {
    try {
      const res = await api.get(`/businesses/${id}/stats`);
      setStats(res.data);
      if (res.data.businessHours) {
        setBusinessHoursList(res.data.businessHours);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBusinessServices = async (id: string) => {
    try {
      const res = await api.get(`/services/business/${id}`);
      setServices(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBusinessStaff = async (id: string) => {
    try {
      const res = await api.get(`/staff/business/${id}`);
      setStaffList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBusinessAppointmentsAndDetails = async (id: string) => {
    try {
      const res = await api.get(`/appointments/business/${id}`);
      setAppointments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Log out mechanism
  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
      localStorage.removeItem('wewash_token');
      toast.success('Sesión cerrada correctamente.');
      window.location.href = '/login';
    } catch (err) {
      toast.error('Error al intentar cerrar sesión.');
    }
  };

  // Change Appointment Status Handler (Complete or Cancel)
  const handleUpdateAppointmentStatus = async (appId: string, statusStr: 'completed' | 'cancelled') => {
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    try {
      await api.patch(`/appointments/${appId}`, { status: statusStr });
      toast.success(`Cita marcada como ${statusStr === 'completed' ? 'Realizada' : 'Cancelada'}`);
      // Refresh statistics and data grid
      if (activeBizId) {
        fetchBusinessStats(activeBizId);
        fetchBusinessAppointmentsAndDetails(activeBizId);
      }
    } catch (err) {
      toast.error('Error al cambiar de estado.');
    }
  };

  // Create Manual Walk-In Appointment
  const handleCreateManualAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (!activeBizId) {
      toast.error('No hay ningún negocio activo seleccionado.');
      return;
    }

    if (!manualAppServiceId) {
      toast.error('Por favor, selecciona un servicio.');
      return;
    }

    if (!manualAppPlate || manualAppPlate.trim().length < 3) {
      toast.error('Por favor, indica una placa válida para el vehículo (mínimo 3 caracteres).');
      return;
    }

    if (!manualAppName || manualAppName.trim().length < 2) {
      toast.error('Por favor, indica el nombre del cliente (mínimo 2 caracteres).');
      return;
    }

    if (!manualAppPhone || manualAppPhone.trim().length < 7) {
      toast.error('Por favor, indica un teléfono válido (mínimo 7 caracteres).');
      return;
    }

    const payload = {
      businessId: activeBizId,
      serviceId: manualAppServiceId,
      staffId: manualAppStaffId || null,
      date: manualAppDate || new Date().toISOString().split('T')[0],
      time: manualAppTime || '10:00',
      customerName: manualAppName.trim(),
      customerPhone: manualAppPhone.trim(),
      customerEmail: manualAppEmail.trim() || `${manualAppPlate.trim().toUpperCase()}@wewash-client.com`,
      bikeBrand: manualAppBrand.trim() || 'Genérica',
      bikeModel: manualAppModel.trim() || 'S/M',
      bikePlate: manualAppPlate.trim().toUpperCase(),
      bikeColor: manualAppColor.trim() || 'Negro',
      notes: manualAppNotes.trim()
    };

    setManualAppIsSubmitting(true);
    try {
      // 1. Create the appointment as pending
      const res = await api.post('/appointments', payload);
      const newApp = res.data;

      // 2. Immediately mark as confirmed so it's fully active
      await api.patch(`/appointments/${newApp.id}`, { status: 'confirmed' });

      toast.success('¡Cita presencial agendada y confirmada con éxito!');
      setShowManualAppModal(false);

      // Refresh appointments and statistics
      fetchBusinessAppointmentsAndDetails(activeBizId);
      fetchBusinessStats(activeBizId);
    } catch (err: any) {
      console.error(err);
      const errMsg = err.response?.data?.error || 'Error al agendar la cita presencial.';
      toast.error(errMsg);
    } finally {
      setManualAppIsSubmitting(false);
    }
  };

  // Add Service Handler
  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceName || !servicePrice) {
      toast.error('Faltan campos requeridos.');
      return;
    }
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (!activeBizId) {
      toast.error('No hay ningún negocio activo seleccionado.');
      return;
    }
    try {
      await api.post('/services', {
        name: serviceName,
        price: servicePrice,
        duration: serviceDuration,
        description: serviceDesc,
        businessId: activeBizId
      });
      toast.success('Servicio estético añadido satisfactoriamente.');
      setIsCreatingService(false);
      setServiceName('');
      setServicePrice('');
      setServiceDesc('');
      fetchBusinessServices(activeBizId);
    } catch (err) {
      toast.error('Fallo cargando el servicio.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Por favor, selecciona una imagen PNG o JPG válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('La imagen debe ser menor a 2MB para optimizar el rendimiento de la bahía.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setStaffPhoto(reader.result as string);
      toast.success('Foto cargada correctamente.');
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  };

  const handleDragLeaveFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
  };

  const handleDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Por favor, arrastra una imagen PNG o JPG válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('La imagen debe ser menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setStaffPhoto(reader.result as string);
      toast.success('Foto cargada correctamente.');
    };
    reader.onerror = () => {
      toast.error('Error al procesar la imagen arrastrada.');
    };
    reader.readAsDataURL(file);
  };

  // Add Technical Staff Handler
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName) {
      toast.error('El nombre del colaborador es requerido.');
      return;
    }
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (!activeBizId) {
      toast.error('No hay ningún negocio activo seleccionado.');
      return;
    }

    const getDurationInMinutes = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return 0;
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };

    if ((staffLunchStart && !staffLunchEnd) || (!staffLunchStart && staffLunchEnd)) {
      toast.error('Debes definir tanto el inicio como el fin de la hora de almuerzo.');
      return;
    }
    if ((staffBreakStart && !staffBreakEnd) || (!staffBreakStart && staffBreakEnd)) {
      toast.error('Debes definir tanto el inicio como el fin del break.');
      return;
    }

    if (staffLunchStart && staffLunchEnd) {
      const lunchMin = getDurationInMinutes(staffLunchStart, staffLunchEnd);
      if (lunchMin <= 0) {
        toast.error('La hora de fin del almuerzo debe ser posterior al inicio.');
        return;
      }
      if (lunchMin > 60) {
        toast.error('La hora de almuerzo no puede superar 1 hora (60 minutos).');
        return;
      }
    }

    if (staffBreakStart && staffBreakEnd) {
      const breakMin = getDurationInMinutes(staffBreakStart, staffBreakEnd);
      if (breakMin <= 0) {
        toast.error('La hora de fin del break debe ser posterior al inicio.');
        return;
      }
      if (breakMin > 30) {
        toast.error('El break no puede superar los 30 minutos de duración.');
        return;
      }
    }

    try {
      await api.post('/staff', {
        name: staffName,
        specialty: staffSpecialty,
        photoUrl: staffPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        businessId: activeBizId,
        lunchStart: staffLunchStart || null,
        lunchEnd: staffLunchEnd || null,
        breakStart: staffBreakStart || null,
        breakEnd: staffBreakEnd || null
      });
      toast.success('Colaborador técnico asignado con éxito a bahía.');
      setIsCreatingStaff(false);
      setStaffName('');
      setStaffSpecialty('');
      setStaffPhoto('');
      setStaffLunchStart('');
      setStaffLunchEnd('');
      setStaffBreakStart('');
      setStaffBreakEnd('');
      fetchBusinessStaff(activeBizId);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Error guardando técnico.';
      toast.error(errMsg);
    }
  };

  // Edit Technical Staff Handlers
  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Por favor, selecciona una imagen PNG o JPG válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('La imagen debe ser menor a 2MB para optimizar el rendimiento de la bahía.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingStaffPhoto(reader.result as string);
      toast.success('Foto cargada correctamente.');
    };
    reader.onerror = () => {
      toast.error('Error al leer el archivo de imagen.');
    };
    reader.readAsDataURL(file);
  };

  const handleEditDragOverFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditingDraggingFile(true);
  };

  const handleEditDragLeaveFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditingDraggingFile(false);
  };

  const handleEditDropFile = (e: React.DragEvent) => {
    e.preventDefault();
    setIsEditingDraggingFile(false);
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      toast.error('Por favor, arrastra una imagen PNG o JPG válida.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('La imagen debe ser menor a 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditingStaffPhoto(reader.result as string);
      toast.success('Foto cargada correctamente.');
    };
    reader.onerror = () => {
      toast.error('Error al procesar la imagen arrastrada.');
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    if (!editingStaffName) {
      toast.error('El nombre del colaborador es requerido.');
      return;
    }
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    if (!activeBizId) {
      toast.error('No hay ningún negocio activo seleccionado.');
      return;
    }

    const getDurationInMinutes = (startStr: string, endStr: string) => {
      if (!startStr || !endStr) return 0;
      const [sh, sm] = startStr.split(':').map(Number);
      const [eh, em] = endStr.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };

    if ((editingStaffLunchStart && !editingStaffLunchEnd) || (!editingStaffLunchStart && editingStaffLunchEnd)) {
      toast.error('Debes definir tanto el inicio como el fin de la hora de almuerzo.');
      return;
    }
    if ((editingStaffBreakStart && !editingStaffBreakEnd) || (!editingStaffBreakStart && editingStaffBreakEnd)) {
      toast.error('Debes definir tanto el inicio como el fin del break.');
      return;
    }

    if (editingStaffLunchStart && editingStaffLunchEnd) {
      const lunchMin = getDurationInMinutes(editingStaffLunchStart, editingStaffLunchEnd);
      if (lunchMin <= 0) {
        toast.error('La hora de fin del almuerzo debe ser posterior al inicio.');
        return;
      }
      if (lunchMin > 60) {
        toast.error('La hora de almuerzo no puede superar 1 hora (60 minutos).');
        return;
      }
    }

    if (editingStaffBreakStart && editingStaffBreakEnd) {
      const breakMin = getDurationInMinutes(editingStaffBreakStart, editingStaffBreakEnd);
      if (breakMin <= 0) {
        toast.error('La hora de fin del break debe ser posterior al inicio.');
        return;
      }
      if (breakMin > 30) {
        toast.error('El break no puede superar los 30 minutos de duración.');
        return;
      }
    }

    try {
      await api.put(`/staff/${editingStaff.id}`, {
        name: editingStaffName,
        specialty: editingStaffSpecialty,
        photoUrl: editingStaffPhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop',
        active: editingStaffActive,
        lunchStart: editingStaffLunchStart || null,
        lunchEnd: editingStaffLunchEnd || null,
        breakStart: editingStaffBreakStart || null,
        breakEnd: editingStaffBreakEnd || null
      });
      toast.success('Información del técnico actualizada con éxito.');
      setEditingStaff(null);
      setEditingStaffName('');
      setEditingStaffSpecialty('');
      setEditingStaffPhoto('');
      setEditingStaffLunchStart('');
      setEditingStaffLunchEnd('');
      setEditingStaffBreakStart('');
      setEditingStaffBreakEnd('');
      fetchBusinessStaff(activeBizId);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || 'Error actualizando técnico.';
      toast.error(errMsg);
    }
  };

  const handleStartEditStaff = (st: any) => {
    setEditingStaff(st);
    setEditingStaffName(st.name);
    setEditingStaffSpecialty(st.specialty || '');
    setEditingStaffPhoto(st.photoUrl || '');
    setEditingStaffActive(st.active !== false); // active defaults to true
    setEditingStaffLunchStart(st.lunchStart || '');
    setEditingStaffLunchEnd(st.lunchEnd || '');
    setEditingStaffBreakStart(st.breakStart || '');
    setEditingStaffBreakEnd(st.breakEnd || '');
    setIsCreatingStaff(false); // Close creation if open
  };

  // Save Business Settings Handler
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeBizId = user?.role === 'superadmin' ? selectedBusinessId : user?.businessId;
    const activeSlug = user?.role === 'superadmin' 
      ? allBusinesses.find(b => b.id === selectedBusinessId)?.slug 
      : user?.business?.slug;
    if (!activeBizId) {
      toast.error('No hay ningún negocio activo seleccionado.');
      return;
    }
    try {
      await api.post('/businesses', {
        name: businessName,
        slug: activeSlug,
        address: businessAddress,
        phone: businessPhone,
        email: businessEmail,
        description: businessDesc,
        bufferTime: businessBuffer
      });
      toast.success('Establecimiento actualizado con éxito.');
      fetchBusinessStats(activeBizId);
    } catch (err) {
      toast.error('Error guardando configuración del lavadero.');
    }
  };

  const handleManualShopCreation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newShopName || !newShopSlug || !newShopAdminName || !newShopEmail || !newShopAdminPassword || !newShopPhone) {
      toast.error('Todos los campos con asterisco son obligatorios.');
      return;
    }
    
    try {
      // Register via the auth/register endpoint which sets up the tenant with standard configurations
      await api.post('/auth/register', {
        name: newShopAdminName,
        email: newShopEmail,
        password: newShopAdminPassword,
        businessName: newShopName,
        businessSlug: newShopSlug
      });

      // Update phone of newly registered business using standard settings format
      // Refresh the selector list
      await fetchAllBusinesses();
      
      toast.success(`¡Lavadero "${newShopName}" y administrador "${newShopAdminName}" creados de forma exitosa!`);
      
      // Clear fields
      setNewShopName('');
      setNewShopSlug('');
      setNewShopAdminName('');
      setNewShopEmail('');
      setNewShopAdminPassword('');
      setNewShopPhone('');
      setIsCreatingShop(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Falló el registro del lavadero. Pruebe con otro slug o correo electrónico.');
    }
  };

  // Search for matching technician profile for the logged-in operator
  const matchingStaff = staffList.find(s => 
    s.name.toLowerCase().includes(user?.name?.toLowerCase() || '') || 
    (user?.name?.toLowerCase() || '').includes(s.name.toLowerCase())
  );

  // Generate dynamic stats and chart data based on selected filter and date range
  const getFilteredDemoData = () => {
    let title = "Comportamiento Semanal de Turnos";
    let subtitle = "Histograma que distribuye las citas registradas en tu lavadero en los últimos 7 días de operación.";
    let labelStart = "7 días atrás";
    let labelEnd = "Hoy";
    let centerLabel = "Evolución Diaria de Lavados";
    let totalAppointments = 148;
    let todayAppointments = 12;
    let totalRevenue = 3450000;
    let cancellationRate = 1.8;
    let recurrentCustomers = 42;
    let averageRating = 4.9;
    let totalReviews = 38;
    
    let chartData: Array<{ date: string; count: number }> = [];

    if (metricPeriod === 'dia') {
      title = "Comportamiento Diario por Horas";
      subtitle = "Distribución de citas agendadas/realizadas a lo largo del día de operación.";
      labelStart = "08:00 AM";
      labelEnd = "08:00 PM";
      centerLabel = "Densidad Horaria de Tránsito";
      
      const hours = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00'];
      const counts = [2, 5, 4, 6, 8, 3];
      chartData = hours.map((h, idx) => ({ date: h, count: counts[idx] }));
      
      totalAppointments = 28;
      todayAppointments = 28;
      totalRevenue = 980000;
      cancellationRate = 0.0;
      recurrentCustomers = 6;
      averageRating = 4.9;
      totalReviews = 11;
    } else if (metricPeriod === 'semana') {
      title = "Comportamiento Semanal de Turnos";
      subtitle = "Histograma que devela las citas agendadas de forma presencial o virtual en los últimos 7 días.";
      labelStart = "Hace 7 días";
      labelEnd = "Hoy";
      centerLabel = "Evolución de Citas / Turnos";
      
      const counts = [18, 24, 21, 29, 35, 42, 38];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dayLabel = d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' });
        chartData.push({ date: dayLabel, count: counts[6 - i] });
      }
      
      totalAppointments = 207;
      todayAppointments = 38;
      totalRevenue = 7245000;
      cancellationRate = 1.4;
      recurrentCustomers = 58;
      averageRating = 4.9;
      totalReviews = 49;
    } else if (metricPeriod === 'mes') {
      title = "Comportamiento Mensual (Últimos 30 días)";
      subtitle = "Reporte totalizado de bookings e ingresos devengados a lo largo de los últimos 30 días.";
      labelStart = "Hace 30 días";
      labelEnd = "Hoy";
      centerLabel = "Volumen Diario de Lavados";
      
      // We will generate 12 steps across 30 days to have a lovely chart
      for (let i = 11; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 2.5));
        const dayLabel = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        const countValue = 35 + Math.floor(Math.sin(i * 1.5) * 15) + (i % 2 === 0 ? 8 : 0);
        chartData.push({ date: dayLabel, count: countValue });
      }
      
      totalAppointments = 448;
      todayAppointments = 38;
      totalRevenue = 15680000;
      cancellationRate = 1.9;
      recurrentCustomers = 125;
      averageRating = 4.85;
      totalReviews = 98;
    } else { // personalizado
      title = "Comportamiento en Rango Personalizado";
      subtitle = `Análisis de servicios y turnos vehiculares solicitados entre el ${metricStartDate} y el ${metricEndDate}.`;
      labelStart = metricStartDate;
      labelEnd = metricEndDate;
      centerLabel = "Actividad por Rango de Fechas";
      
      const start = new Date(metricStartDate + 'T00:00:00');
      const end = new Date(metricEndDate + 'T00:00:00');
      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
      
      if (diffDays <= 3) {
        const hours = ['08:00', '11:00', '14:00', '17:00', '20:00'];
        const baseCounts = [3, 6, 8, 5, 2];
        chartData = hours.map((h, idx) => ({ date: h, count: baseCounts[idx] * diffDays }));
      } else if (diffDays <= 12) {
        for (let i = 0; i < diffDays; i++) {
          const d = new Date(start.getTime());
          d.setDate(start.getDate() + i);
          const label = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
          chartData.push({ date: label, count: 12 + (i % 4) * 3 + (i % 3 === 0 ? 5 : 0) });
        }
      } else {
        const step = Math.ceil(diffDays / 12);
        for (let i = 0; i < diffDays; i += step) {
          const d = new Date(start.getTime());
          d.setDate(start.getDate() + i);
          const label = d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
          chartData.push({ date: label, count: 22 + (i % 5) * 5 });
        }
      }
      
      const totalCountAgg = chartData.reduce((acc, c) => acc + c.count, 0) || 12;
      totalAppointments = totalCountAgg;
      todayAppointments = Math.round(totalCountAgg / diffDays) || 5;
      totalRevenue = totalCountAgg * 35000; // Average transaction value: 35.000 COP
      cancellationRate = 2.2;
      recurrentCustomers = Math.round(totalCountAgg * 0.28);
      averageRating = 4.9;
      totalReviews = Math.round(totalCountAgg * 0.4);
    }

    const popularServices = [
      { name: 'Lavado Premium Polichado', count: Math.round(totalAppointments * 0.38) },
      { name: 'Lavado General Extreme', count: Math.round(totalAppointments * 0.29) },
      { name: 'Lavado Básico Sencillo', count: Math.round(totalAppointments * 0.18) },
      { name: 'Encerado Alta Gama Cryo', count: Math.round(totalAppointments * 0.15) },
    ];

    const reviews = [
      {
        id: "rev-1",
        createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        rating: 5,
        comment: "¡Increíble servicio! Mi Suzuki V-Strom quedó espectacular. Los técnicos son muy amables y el sistema de avisos de WhatsApp funciona a la perfección. Altamente recomendado.",
        customer: { name: "Carlos Mendoza" },
        appointment: { 
          service: { name: "Lavado Premium Polichado" }, 
          motorcycle: { plate: "ZXY45F" },
          staffId: matchingStaff?.id || "tech-1"
        }
      },
      {
        id: "rev-2",
        createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
        rating: 5,
        comment: "Excelente lavado para scooters, muy meticulosos con los plásticos negros y las llantas. Me avisaron por WhatsApp apenas estuvo lista.",
        customer: { name: "Gabriela Torres" },
        appointment: { 
          service: { name: "Lavado General Extreme" }, 
          motorcycle: { plate: "KHN89G" },
          staffId: matchingStaff?.id || "tech-2"
        }
      },
      {
        id: "rev-3",
        createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString(),
        rating: 5,
        comment: "Lavaron mi vehículo y cuidaron cada detalle con la pintura, cadena y discos. El encerado premium eliminó microrayones.",
        customer: { name: "Andrés Pulido" },
        appointment: { 
          service: { name: "Encerado Alta Gama Cryo" }, 
          motorcycle: { plate: "IPL12C" },
          staffId: matchingStaff?.id || "tech-3"
        }
      },
      {
        id: "rev-4",
        createdAt: new Date(Date.now() - 72 * 3600 * 1000).toISOString(),
        rating: 4,
        comment: "Rápido y con una atención muy atenta. Me recibieron el vehículo en la bahía inmediatamente.",
        customer: { name: "Santiago Valencia" },
        appointment: { 
          service: { name: "Lavado Básico Sencillo" }, 
          motorcycle: { plate: "ODF67E" },
          staffId: matchingStaff?.id || "tech-4"
        }
      }
    ];

    return {
      title,
      subtitle,
      labelStart,
      labelEnd,
      centerLabel,
      totalAppointments,
      todayAppointments,
      totalRevenue,
      cancellationRate,
      recurrentCustomers,
      averageRating,
      totalReviews,
      chartData,
      popularServices,
      reviews
    };
  };

  const effectiveStats = (useDemoMode && (user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'operator')) ? getFilteredDemoData() : stats;

  // Filter appointments by selectedDate if filterByDate is true
  const filteredAppointments = appointments.filter(app => {
    if (filterByDate) {
      const appDateStr = new Date(app.date).toISOString().split('T')[0];
      return appDateStr === selectedDate;
    }
    return true;
  });

  const displayedAppointments = (user?.role === 'admin' || user?.role === 'superadmin')
    ? filteredAppointments
    : (matchingStaff ? filteredAppointments.filter(a => a.staffId === matchingStaff.id) : filteredAppointments);

  const displayedStaff = (user?.role === 'admin' || user?.role === 'superadmin')
    ? staffList
    : staffList.filter(s => 
        s.name.toLowerCase().includes(user?.name?.toLowerCase() || '') || 
        (user?.name?.toLowerCase() || '').includes(s.name.toLowerCase())
      );

  const finalStaffList = (user?.role === 'admin' || user?.role === 'superadmin')
    ? staffList
    : (displayedStaff.length > 0 ? displayedStaff : (staffList.length > 0 ? [staffList[0]] : []));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#0B0F17] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        <p className="mt-4 text-gray-400 font-medium">Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="min-h-screen bg-[#090D16] text-[#E2E8F0] font-sans selection:bg-orange-500 selection:text-white">
      
      {/* Upper Navigation Rail */}
      <header className="sticky top-0 z-40 bg-[#0E1320] border-b border-[#1E293B] shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="h-4 w-4 bg-orange-500 rounded-full animate-pulse"></span>
            <div>
              <h2 className="text-xl font-black text-white tracking-tight uppercase flex items-center gap-2">
                WeWash Manager
                {user?.role === 'superadmin' && (
                  <span className="px-1.5 py-0.5 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded text-[8px] tracking-widest font-black uppercase font-mono">SuperAdmin</span>
                )}
              </h2>
              {user?.role === 'superadmin' ? (
                <p className="text-xs text-purple-400 font-extrabold uppercase tracking-widest font-mono">Control Central Global</p>
              ) : (
                <p className="text-xs text-orange-400 font-semibold">{user?.business?.name || 'Lavadero Socio'}</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-white">{user?.name}</p>
              <p className="text-xs text-gray-400">
                {user?.role === 'superadmin' ? '🔥 Súper Administrador Global' : user?.role === 'admin' ? 'Administrador General' : 'Operador'}
              </p>
            </div>

            <button 
              onClick={handleLogout}
              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition"
              title="Cerrar sesión"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Sibling Backdrop for floating managed business view */}
      {user?.role === 'superadmin' && managedBusiness && (
        <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md animate-opacity" />
      )}

      {/* Main Body Grid */}
      <main className={
        (user?.role === 'superadmin' && managedBusiness)
          ? "fixed inset-4 sm:inset-6 md:inset-10 lg:inset-16 z-50 bg-[#090D16] border border-[#1E293B] rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-opacity"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 flex flex-col"
      }>

        {/* Dynamic header overlay only inside the floating window */}
        {user?.role === 'superadmin' && managedBusiness && (
          <div className="bg-[#0E1320] border-b border-[#1E293B] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0 shadow-md">
            <div className="flex items-center gap-3.5">
              {/* UPPER LEFT X BUTTON TO CLOSE */}
              <button
                onClick={() => {
                  setManagedBusiness(null);
                  setActiveTab('appointments');
                  toast.success('Retornando a panel global de sucursales...');
                }}
                className="p-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition cursor-pointer flex items-center justify-center shrink-0 shadow-lg"
                title="Cerrar Ventana (X) / Volver"
              >
                <X className="h-5 w-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-600/10 rounded-xl border border-purple-500/30 hidden sm:flex">
                  <Store className="h-6 w-6 text-purple-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-gradient-to-r from-purple-600 to-indigo-600 px-2 py-0.5 rounded text-white font-mono uppercase font-black tracking-widest shadow-sm">Mapeo Activo</span>
                    <h3 className="text-base sm:text-xl font-black text-white uppercase tracking-tight">{managedBusiness.name}</h3>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                    <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                    <span>{managedBusiness.address || 'Sin dirección registrada'}</span>
                    <span className="text-gray-600">•</span>
                    <span className="font-mono text-purple-400 text-[11px]">slug: /{managedBusiness.slug}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
              <a 
                href={`/${managedBusiness.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-[#080D16] hover:bg-orange-500/10 text-orange-400 hover:text-white border border-[#1E293B] hover:border-orange-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                🔗 Ver Reservas
              </a>
            </div>
          </div>
        )}

        {/* Navigation Tabs and Section Controls */}
        <div id="dashboard-navbar-rail" className="flex border-b border-[#1E293B] bg-[#0E1320]/45 overflow-x-auto gap-1 px-4 sm:px-6 shrink-0 z-10 select-none">
          {(user?.role === 'superadmin' && managedBusiness) ? (
            /* Managed shop internal sub-navigation (premium purple accent) */
            [
              { tag: 'appointments', label: 'Calendario / Agenda', icon: Calendar },
              { tag: 'services', label: 'Gestión Servicios', icon: Award },
              { tag: 'staff', label: 'Técnicos / Cantera', icon: Users },
              { tag: 'whatsapp', label: 'WhatsApp Recordatorios', icon: MessageSquare },
              { tag: 'settings', label: 'Filtro y Horarios', icon: Settings },
              { tag: 'metrics', label: 'Rendimiento y Gráficos', icon: TrendingUp }
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.tag}
                  onClick={() => {
                    setActiveTab(tab.tag as any);
                    toast.info(`Cambiando a vista: ${tab.label}`);
                  }}
                  className={`py-3.5 px-5 font-bold text-xs uppercase border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer transition ${
                    activeTab === tab.tag
                      ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })
          ) : (
            /* Root-level navigation list (standard orange accent) */
            [
              { 
                tag: 'appointments', 
                label: user?.role === 'superadmin' ? 'Tiendas Socias' : 'Calendario / Citas', 
                icon: user?.role === 'superadmin' ? Store : Calendar 
              },
              ...(user?.role === 'admin' ? [
                { tag: 'services', label: 'Gestión Servicios', icon: Award },
                { tag: 'staff', label: 'Técnicos / Equipo', icon: Users },
                { tag: 'whatsapp', label: 'Recordatorios WhatsApp', icon: MessageSquare },
                { tag: 'settings', label: 'Filtros y Horarios', icon: Settings },
                { tag: 'metrics', label: 'Rendimiento / Gráficos', icon: TrendingUp }
              ] : []),
              ...(user?.role === 'operator' ? [
                { tag: 'metrics', label: 'Rendimiento / Gráficos', icon: TrendingUp }
              ] : []),
              ...(user?.role === 'superadmin' ? [
                { tag: 'leads', label: 'Gestión SaaS', icon: Sparkles }
              ] : [])
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.tag}
                  onClick={() => setActiveTab(tab.tag as any)}
                  className={`py-3.5 px-6 font-bold text-sm transition border-b-2 whitespace-nowrap flex items-center gap-2 cursor-pointer ${
                    activeTab === tab.tag
                      ? 'border-orange-500 text-orange-400 bg-[#0F172A]/40'
                      : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <IconComponent className="h-4.5 w-4.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })
          )}
        </div>

        {/* Scrollable inner container for stats, warnings and children tabs */}
        <div className={
          (user?.role === 'superadmin' && managedBusiness)
            ? "flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-8 bg-[#090D16] min-h-0"
            : "space-y-8"
        }>
          {/* Presentation Mode banner */}
          {(user?.role === 'admin' || user?.role === 'superadmin' || user?.role === 'operator') && (
            <div id="demo-mode-presentation-banner" className="bg-[#0E1528] border border-orange-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl select-none">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-gradient-to-tr from-amber-500/20 to-orange-500/20 text-orange-400 rounded-xl border border-orange-500/30">
                  <Sparkles className="h-4 w-4 animate-pulse text-amber-400" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5 matches-glow">
                    Modo Demostración Activo
                    <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
                  </h4>
                  <p className="text-[10px] text-gray-450 mt-0.5 leading-normal">Hemos precargado estadísticas de rendimiento, histórico de turnos y feedback simulado para tu presentación.</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] uppercase font-mono font-bold text-gray-500">Origen:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUseDemoMode(true);
                    toast.success('Visualizando gráficos con datos demo de alta fidelidad.');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-mono border transition cursor-pointer ${
                    useDemoMode 
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 text-white font-black shadow-lg shadow-orange-500/10' 
                      : 'bg-[#090D16] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  ✨ Demo / Pitch
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseDemoMode(false);
                    toast.success('Visualizando datos reales de appointments del lavadero.');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase font-mono border transition cursor-pointer ${
                    !useDemoMode 
                      ? 'bg-gradient-to-r from-teal-600 to-emerald-600 border-emerald-500 text-white font-black shadow-lg shadow-emerald-500/10' 
                      : 'bg-[#090D16] border-white/5 text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  🔌 Datos Reales
                </button>
              </div>
            </div>
          )}

          {/* Quick Bento STATS row for Managed Business, Admin, Operator */}
          {(effectiveStats || stats) && (user?.role !== 'superadmin' || managedBusiness) && (
            (user?.role === 'admin' || user?.role === 'superadmin') ? (
              <div id="dashboard-bento-grid" className="grid grid-cols-2 lg:grid-cols-5 gap-4 shadow-sm shrink-0">
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] uppercase font-bold text-orange-400">Citas de hoy</span>
                    <Calendar className="h-4 w-4 text-orange-450" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{effectiveStats.todayAppointments}</p>
                  <p className="text-[10px] text-gray-500 font-mono">Día: {selectedDate}</p>
                </div>
 
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] uppercase font-bold text-emerald-400">Ingresos Totales</span>
                    <DollarSign className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">${effectiveStats.totalRevenue?.toLocaleString('es-CO')}</p>
                  <p className="text-[10px] text-emerald-450 font-semibold font-mono font-bold">Servicios finalizados</p>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] uppercase font-bold text-red-500">Tasa cancelación</span>
                    <ShieldAlert className="h-4 w-4 text-red-500" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{effectiveStats.cancellationRate}%</p>
                  <p className="text-[10px] text-gray-500 font-mono">Índice histórico</p>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] uppercase font-bold text-blue-400">Recurrentes</span>
                    <Users className="h-4 w-4 text-blue-400" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{effectiveStats.recurrentCustomers}</p>
                  <p className="text-[10px] text-gray-500 font-mono font-bold">Más de una cita</p>
                </div>

                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-4 sm:p-5 space-y-2 col-span-2 lg:col-span-1">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-[10px] uppercase font-bold text-orange-400 font-bold">Calificación Media</span>
                    <Star className="h-4 w-4 text-orange-400 fill-current" />
                  </div>
                  <p className="text-2xl sm:text-3xl font-black text-white">{effectiveStats.averageRating} ★</p>
                  <p className="text-[10px] text-gray-500 font-mono font-bold">De {effectiveStats.totalReviews || 12} reseñas</p>
                </div>
              </div>
            ) : (
              <div id="dashboard-bento-grid" className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                {/* 1. Mis Citas de hoy */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-xs uppercase font-bold font-bold text-orange-400">Mis Turnos de Hoy</span>
                    <Calendar className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-3xl font-black text-white">
                    {filteredAppointments.filter(a => matchingStaff ? a.staffId === matchingStaff.id : false).length}
                  </p>
                  <p className="text-[10px] text-gray-500">Asignados para el {selectedDate}</p>
                </div>

                {/* 2. Mi Calificación Media */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-400">
                    <span className="text-xs uppercase font-bold">Mi Valoración Promedio</span>
                    <Star className="h-4 w-4 text-orange-400 fill-current" />
                  </div>
                  <p className="text-3xl font-black text-white">
                    {stats?.reviews?.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false).length > 0
                      ? (stats.reviews.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false).reduce((sum: number, r: any) => sum + r.rating, 0) / stats.reviews.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false).length).toFixed(1)
                      : '4.9'} ★
                  </p>
                  <p className="text-[10px] text-gray-500">
                    De {stats?.reviews?.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false).length || 0} calificaciones recibidas
                  </p>
                </div>

                {/* 3. Comentarios Recibidos */}
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-5 space-y-2">
                  <div className="flex justify-between items-center text-gray-100">
                    <span className="text-xs uppercase font-bold text-gray-400">Recomendaciones</span>
                    <Award className="h-4 w-4 text-emerald-400" />
                  </div>
                  <p className="text-3xl font-black text-white">
                    {stats?.reviews?.filter((r: any) => matchingStaff ? (r.appointment?.staffId === matchingStaff.id && r.comment) : false).length || 0}
                  </p>
                  <p className="text-[10px] text-emerald-450 font-semibold font-bold">Reseñas con comentarios</p>
                </div>
              </div>
            )
          )}

          {/* Operator Profile Notice Warning */}
          {user?.role === 'operator' && !matchingStaff && (
            <div className="bg-amber-500/10 border border-amber-500/25 p-4 rounded-2xl text-amber-300 text-xs flex items-center gap-3 shrink-0">
              <span>⚠️</span>
              <p>
                <strong>Perfil de Técnico Desvinculado:</strong> Tu usuario administrativo (<strong className="text-white">{user?.name}</strong>) no coincide de forma exacta con ningún técnico registrado en la base de datos de este lavadero. Solicita a un administrador asociar tu nombre exactamente en el panel de equipo. Se muestran todos los turnos disponibles como vista alternativa.
              </p>
            </div>
          )}

          {/* TAB 1: CALENDARIO / GESTIÓN DE CITAS OR TIENDAS SOCIAS */}
          {activeTab === 'appointments' && (
          (user?.role === 'superadmin' && !managedBusiness) ? (
            <div className="space-y-6 animate-opacity">
              {/* Header Box */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl">
                <div>
                  <h3 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Store className="h-5 w-5 text-purple-400 animate-pulse" />
                    Sucursales y Tiendas Socias
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Supervisa las tiendas de lavado de vehículos y detailing activas en la plataforma. Selecciona un establecimiento para configurar y auditar sus servicios, técnicos y WhatsApp usando el menú superior.
                  </p>
                </div>
                
                <button
                  onClick={() => {
                    setActiveTab('leads');
                    setIsCreatingShop(true);
                  }}
                  className="px-5 py-2.5 bg-[#0F172A] hover:bg-purple-600/10 text-purple-450 hover:text-white border border-purple-500/25 rounded-xl text-xs font-black uppercase transition flex items-center gap-1.5 self-start whitespace-nowrap"
                >
                  ➕ Registrar Nueva Sucursal
                </button>
              </div>

              {/* Grid lists */}
              <div id="superadmin-shop-grid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBusinesses.map((b, index) => {
                  const shopImages = [
                    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1609182518231-48062d18178b?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=600&auto=format&fit=crop&q=80",
                    "https://images.unsplash.com/photo-1509059852496-f3822ae057bf?w=600&auto=format&fit=crop&q=80"
                  ];
                  const imgUrl = shopImages[index % shopImages.length];
                  const isSelected = selectedBusinessId === b.id;

                  return (
                    <div 
                      key={b.id}
                      className={`bg-[#0F172A] rounded-2xl overflow-hidden border transition-all duration-300 flex flex-col ${
                        isSelected 
                          ? 'border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500 scale-[1.01]' 
                          : 'border-[#1E293B] hover:border-gray-700/60'
                      }`}
                    >
                      {/* Image header with active marker */}
                      <div className="h-44 relative overflow-hidden bg-gray-950">
                        <img 
                          src={imgUrl} 
                          alt={b.name} 
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover opacity-75 hover:scale-105 transition-transform duration-500" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent"></div>
                        
                        {/* Overlay Indicators */}
                        <div className="absolute top-3 left-3 flex gap-1.5">
                          {isSelected ? (
                            <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[9px] font-black uppercase tracking-wider font-mono shadow flex items-center gap-1">
                              <span className="h-1.5 w-1.5 rounded-full bg-white animate-ping"></span>
                              Gestionando en Detalle
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 bg-gray-900/80 text-gray-400 rounded-lg text-[9px] font-black uppercase tracking-wider font-mono border border-white/5">
                              En Espera
                            </span>
                          )}
                        </div>

                        <div className="absolute bottom-3 left-3 right-3 flex justify-between items-end">
                          <span className="px-2 py-0.5 bg-black/50 text-[#F1F5F9] rounded text-[9px] font-mono tracking-widest font-bold uppercase backdrop-blur-sm">
                            Slug: {b.slug}
                          </span>
                        </div>
                      </div>

                      {/* Info body */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <h4 className="text-base font-black text-white uppercase tracking-tight line-clamp-1">
                            {b.name}
                          </h4>
                          
                          <div className="space-y-1.5">
                            <p className="text-xs text-gray-400 flex items-center gap-2">
                              <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              <span className="truncate">{b.address || 'Sin dirección registrada'}</span>
                            </p>
                            <p className="text-xs text-gray-400 flex items-center gap-2 font-mono">
                              <Phone className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                              <span>{b.phone || 'Sin teléfono'}</span>
                            </p>
                          </div>
                        </div>

                        {/* CTA buttons */}
                        <div className="space-y-2 pt-3 border-t border-white/5">
                          <div className="flex gap-2">
                            <a 
                              href={`/${b.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 py-1.5 text-center bg-[#080D16] hover:bg-orange-500/10 text-orange-400 hover:text-white border border-[#1E293B] hover:border-orange-550/30 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                            >
                              🔗 Link
                            </a>
                            
                            <button 
                              onClick={() => {
                                handleBusinessChange(b.id);
                                setManagedBusiness(b);
                                setActiveTab('appointments');
                                toast.success(`Abriendo panel de gestión para: ${b.name}`);
                              }}
                              className="flex-grow-[2] flex-1 py-1.5 text-xs font-black uppercase rounded-xl transition flex items-center justify-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white shadow shadow-purple-500/20"
                            >
                              🛠️ Gestionar
                            </button>

                            <button
                              onClick={() => handleDeleteBusinessTrigger(b.id, b.name)}
                              className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 rounded-xl transition flex items-center justify-center shrink-0"
                              title="Eliminar Sucursal"
                            >
                              <Trash className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl">
              <div>
                <h3 className="text-lg font-black text-white">Agenda Operativa</h3>
                <p className="text-xs text-gray-400 mt-1">Supervisa y balancea cargas en bahías de lavado. Arrastra citas para asignar técnicos.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <button
                    type="button"
                    onClick={() => {
                      setManualAppDate(selectedDate || new Date().toISOString().split('T')[0]);
                      setManualAppTime('10:00');
                      setManualAppName('');
                      setManualAppPhone('');
                      setManualAppEmail('');
                      setManualAppPlate('');
                      setManualAppBrand('');
                      setManualAppModel('');
                      setManualAppColor('');
                      setManualAppNotes('');
                      setManualAppStaffId(''); // unassigned/null by default
                      if (services && services.length > 0) {
                        setManualAppServiceId(services[0].id);
                      } else {
                        setManualAppServiceId('');
                      }
                      setShowManualAppModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>➕ Asignar Turno</span>
                  </button>
                )}

                {/* Segmented Control Switcher */}
                <div className="flex bg-[#080D16] p-1 rounded-xl border border-white/5">
                  <button
                    type="button"
                    onClick={() => setViewMode('kanban')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase transition flex items-center gap-1.5 ${
                      viewMode === 'kanban'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📊</span>
                    Tablero de Bahías
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`py-1.5 px-3 rounded-lg text-xs font-black uppercase transition flex items-center gap-1.5 ${
                      viewMode === 'table'
                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <span>📋</span>
                    Vista Tabla
                  </button>
                </div>

                <div className="flex items-center gap-3.5 flex-wrap">
                  <div className="flex bg-[#080D16] border border-[#1E293B] rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => setFilterByDate(true)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded-md transition ${
                        filterByDate 
                          ? 'bg-orange-500 text-white shadow' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Filtrar por Día
                    </button>
                    <button
                      type="button"
                      onClick={() => setFilterByDate(false)}
                      className={`px-2.5 py-1.5 text-[11px] font-bold rounded-md transition ${
                        !filterByDate 
                          ? 'bg-orange-500 text-white shadow' 
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      Ver Todas
                    </button>
                  </div>

                  {filterByDate && (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-gray-400 uppercase font-black font-mono">Día:</label>
                      <input 
                        type="date" 
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-1.5 text-xs outline-none text-white transition font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {displayedAppointments.length === 0 ? (
              <div className="text-center py-16 bg-[#0F172A] border border-[#1E293B] rounded-2xl text-gray-400 text-sm">
                {(user?.role === 'admin' || user?.role === 'superadmin') ? (
                  <>
                    {filterByDate 
                      ? `No hay citas agendadas registradas para el ${selectedDate}.` 
                      : 'No hay ninguna cita de lavado registrada en el sistema todavía.'
                    }
                    {filterByDate && appointments.length > 0 && (
                      <div className="my-5 p-4.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs text-orange-200 max-w-md mx-auto space-y-2">
                        <div className="flex items-center gap-1.5 justify-center font-bold text-orange-400">
                          <span>💡 Citas Programadas Detectadas</span>
                        </div>
                        <p>Tienes <strong>{appointments.length}</strong> citas en total registradas para otros días. Presiona el botón de abajo para visualizarlas.</p>
                        <button 
                          type="button"
                          onClick={() => setFilterByDate(false)}
                          className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg transition font-black uppercase text-[10px] tracking-wider"
                        >
                          Ver Todas Las Citas
                        </button>
                      </div>
                    )}
                    <br />
                    <span className="text-xs text-orange-400 mt-2 block font-semibold">Comparte tu slug público con tus clientes para que reserven en línea:</span>
                    <a 
                      href={`/${managedBusiness?.slug || user?.business?.slug || ""}`} 
                      target="_blank" 
                      rel="no-referrer"
                      className="mt-3 inline-block font-mono bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs py-1.5 px-3 rounded-lg"
                    >
                      http://localhost:3000/{managedBusiness?.slug || user?.business?.slug || ""}
                    </a>
                  </>
                ) : (
                  <>
                    {filterByDate 
                      ? `No tienes ninguna cita asignada para el ${selectedDate}.` 
                      : 'No tienes ninguna cita asignada en el sistema todavía.'
                    }
                    {filterByDate && appointments.length > 0 && (
                      <div className="my-5 p-4.5 bg-orange-500/10 border border-orange-500/20 rounded-2xl text-xs text-orange-200 max-w-md mx-auto space-y-2">
                        <div className="flex items-center gap-1.5 justify-center font-bold text-orange-400">
                          <span>💡 Citas Programadas Detectadas</span>
                        </div>
                        <p>Tienes <strong>{appointments.length}</strong> citas en total cargadas en el sistema para otros días.</p>
                        <button 
                          type="button"
                          onClick={() => setFilterByDate(false)}
                          className="px-4 py-1.5 bg-orange-500/20 hover:bg-orange-500 text-orange-400 hover:text-white rounded-lg transition font-black uppercase text-[10px] tracking-wider"
                        >
                          Ver Todas Las Citas
                        </button>
                      </div>
                    )}
                    <br />
                    <span className="text-xs text-orange-400 mt-2 block font-semibold">¡Buen trabajo! Disfruta de tu tiempo libre o solicita que te asignen nuevos turnos en la cola.</span>
                  </>
                )}
              </div>
            ) : viewMode === 'kanban' ? (
              /* KANBAN/COLUMN DRAG & DROP VIEW */
              <div className={(user?.role === 'admin' || user?.role === 'superadmin')
                ? "grid grid-cols-1 md:grid-cols-2 gap-6 items-start" 
                : "grid grid-cols-1 max-w-2xl mx-auto items-start"
              }>
                
                {/* 1. COLUMN: UNASSIGNED (Sin Técnico / Por Asignar) */}
                {(user?.role === 'admin' || user?.role === 'superadmin') && (
                  <div 
                    onDragOver={(e) => handleDragOver(e, 'unassigned')}
                    onDragLeave={handleDragLeave}
                  onDrop={() => handleDrop('unassigned')}
                  className={`rounded-2xl border p-4.5 space-y-4 min-h-[550px] transition-all duration-300 ${
                    draggingOverColumnId === 'unassigned'
                      ? 'bg-[#151D2F] border-orange-500/60 shadow-lg shadow-orange-500/10 scale-[1.01]'
                      : 'bg-[#0E1322] border-[#222E45]/40'
                  }`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <div>
                      <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-orange-400 animate-pulse"></span>
                        Por Asignar / Cola
                      </h4>
                      <p className="text-[10px] text-gray-400">Sin técnico asignado todavía</p>
                    </div>
                    <span className="text-xs font-mono font-black bg-[#1E293B] text-gray-300 border border-white/5 px-2 py-0.5 rounded-md">
                      {filteredAppointments.filter(a => !a.staffId).length}
                    </span>
                  </div>

                  {/* Appointments Card List */}
                  <div className="space-y-3.5">
                    {filteredAppointments.filter(a => !a.staffId).length === 0 ? (
                      <div className="py-12 text-center text-[11px] text-gray-500 border border-dashed border-white/5 rounded-xl">
                        Ningún turno en espera.
                      </div>
                    ) : (
                      filteredAppointments.filter(a => !a.staffId).map((app) => (
                        <div
                          key={app.id}
                          draggable={app.status === 'pending' || app.status === 'confirmed'}
                          onDragStart={(e) => handleDragStart(e, app.id)}
                          onDragEnd={() => { setDraggedAppId(null); setDraggingOverColumnId(null); }}
                          className={`bg-[#131B2F] border border-[#222F4D]/50 hover:border-orange-500/30 rounded-xl p-4 space-y-3 shadow-md transition-all ${
                            (app.status === 'pending' || app.status === 'confirmed') ? 'cursor-grab active:cursor-grabbing' : 'opacity-65'
                          } ${draggedAppId === app.id ? 'opacity-30 border-orange-500/40 border-dashed scale-95' : ''}`}
                        >
                          {/* Card header meta */}
                          <div className="flex items-center justify-between gap-1.5">
                            <span className="text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 font-mono font-bold rounded-md border border-orange-500/20" title={!filterByDate ? `Fecha de Reserva: ${new Date(app.date).toISOString().split('T')[0]}` : undefined}>
                              ⏱️ {!filterByDate ? `${new Date(app.date).toISOString().split('T')[0]} • ` : ''}{app.time}
                            </span>
                            
                            <div className="font-mono bg-[#080D16] border border-white/10 px-2 py-0.5 rounded text-[11px] font-black tracking-widest text-[#F1F5F9] uppercase">
                              {app.motorcycle?.plate}
                            </div>
                          </div>

                          {/* Client details info */}
                          <div>
                            <p className="font-extrabold text-white text-xs uppercase tracking-tight">{app.customer?.name}</p>
                            <a 
                              href={`https://wa.me/${app.customer?.phone?.replace(/[^0-9]/g, '')}`} 
                              target="_blank" 
                              rel="no-referrer"
                              className="text-[10px] text-gray-400 hover:text-emerald-400 transition font-mono mt-0.5 inline-flex items-center gap-1"
                            >
                              <span>📞</span> {app.customer?.phone}
                            </a>
                            <p className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">
                              {app.motorcycle?.brand} {app.motorcycle?.model} ({app.motorcycle?.color})
                            </p>
                          </div>

                          {/* Service scope details */}
                          <div className="text-[10px] bg-[#0A0E1A] p-2.5 rounded-lg border border-white/5 space-y-1">
                            <span className="font-extrabold text-orange-400 uppercase tracking-wide text-[9px] block">
                              ⚙️ {app.service?.name}
                            </span>
                            <span className="text-gray-400 block font-mono">
                              Duración: {app.service?.duration} Mins
                            </span>
                            {app.notes && (
                              <p className="text-[9px] text-gray-500 italic border-t border-white/5 pt-1 mt-1 leading-relaxed">
                                "{app.notes}"
                              </p>
                            )}
                          </div>

                          {/* Action row resolver */}
                          {(app.status === 'pending' || app.status === 'confirmed') ? (
                            <div className="flex gap-2 pt-1 border-t border-white/5 items-center">
                              <span className="text-[9px] text-gray-500 font-mono flex items-center gap-0.5 select-none" title="Mantén presionado para arrastrar">
                                <GripVertical className="h-3.5 w-3 text-slate-500" />
                                Mover {app.status === 'confirmed' && <span className="text-[9px] text-emerald-400 font-bold ml-1 uppercase">(Confirmada)</span>}
                              </span>
                              
                              <div className="flex-1 flex gap-1.5 justify-end">
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(app.id, 'completed')}
                                  className="flex-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white border border-emerald-500/20 text-[9px] font-black uppercase rounded transition"
                                >
                                  ✓ Listo
                                </button>
                                <button
                                  onClick={() => handleUpdateAppointmentStatus(app.id, 'cancelled')}
                                  className="py-1 px-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[9px] font-black uppercase rounded transition"
                                >
                                  ✕
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="pt-2 border-t border-white/5">
                              <span className={`text-[9px] block text-center py-1 rounded font-black uppercase font-mono ${
                                app.status === 'completed' 
                                  ? 'bg-green-500/10 text-green-400 border border-green-500/25' 
                                  : app.status === 'confirmed'
                                  ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'
                                  : 'bg-red-500/10 text-red-555 border border-red-500/25'
                              }`}>
                                {app.status === 'completed' ? 'Realizada' : app.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                              </span>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
                )}

                {/* 2. DYNAMICALLY RENDERED STAFF COLUMNS */}
                {finalStaffList.map((staff) => (
                  <div 
                    key={staff.id}
                    onDragOver={(e) => handleDragOver(e, staff.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={() => handleDrop(staff.id)}
                    className={`rounded-2xl border p-4.5 space-y-4 min-h-[550px] transition-all duration-300 ${
                      draggingOverColumnId === staff.id
                        ? 'bg-[#151D2F] border-orange-500/60 shadow-lg shadow-orange-500/10 scale-[1.01]'
                        : 'bg-[#0E1322] border-[#222E45]/40'
                    }`}
                  >
                    {/* Technician Column Header details */}
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        {staff.photoUrl ? (
                          <img src={staff.photoUrl} alt={staff.name} referrerPolicy="no-referrer" className="h-8 w-8 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="h-8 w-8 bg-orange-500/15 text-orange-400 rounded-full flex items-center justify-center font-black text-xs uppercase">
                            {staff.name.charAt(0)}
                          </div>
                        )}
                        <div>
                          <h4 className="text-xs font-black text-white uppercase tracking-tight flex items-center gap-1">
                            {staff.name}
                            {user?.role !== 'admin' && matchingStaff && staff.id === matchingStaff.id && (
                              <span className="px-1.5 py-0.5 bg-orange-500 text-white rounded text-[8px] font-black uppercase font-mono animate-pulse">Tú</span>
                            )}
                          </h4>
                          <p className="text-[10px] text-gray-400">{staff.specialty || 'Técnico Especialista'}</p>
                        </div>
                      </div>
                      <span className="text-xs font-mono font-black bg-[#1E293B] text-gray-300 border border-white/5 px-2 py-0.5 rounded-md">
                        {filteredAppointments.filter(a => a.staffId === staff.id).length}
                      </span>
                    </div>

                    {/* Appointments Stack inside technician column */}
                    <div className="space-y-3.5">
                      {filteredAppointments.filter(a => a.staffId === staff.id).length === 0 ? (
                        <div className="py-12 text-center text-[11px] text-gray-500 border border-dashed border-white/5 rounded-xl">
                          Sin lavar todavía hoy.
                        </div>
                      ) : (
                        filteredAppointments.filter(a => a.staffId === staff.id).map((app) => (
                          <div
                            key={app.id}
                            draggable={app.status === 'pending' || app.status === 'confirmed'}
                            onDragStart={(e) => handleDragStart(e, app.id)}
                            onDragEnd={() => { setDraggedAppId(null); setDraggingOverColumnId(null); }}
                            className={`bg-[#131B2F] border border-[#222F4D]/50 hover:border-orange-500/30 rounded-xl p-4 space-y-3 shadow-md transition-all ${
                              (app.status === 'pending' || app.status === 'confirmed') ? 'cursor-grab active:cursor-grabbing' : 'opacity-65'
                            } ${draggedAppId === app.id ? 'opacity-30 border-orange-500/40 border-dashed scale-95' : ''}`}
                          >
                            {/* Card Header row */}
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] px-2 py-0.5 bg-orange-500/10 text-orange-400 font-mono font-bold rounded-md border border-orange-500/20" title={!filterByDate ? `Fecha de Reserva: ${new Date(app.date).toISOString().split('T')[0]}` : undefined}>
                                ⏱️ {!filterByDate ? `${new Date(app.date).toISOString().split('T')[0]} • ` : ''}{app.time}
                              </span>
                              
                              <div className="font-mono bg-[#080D16] border border-white/10 px-2 py-0.5 rounded text-[11px] font-black tracking-widest text-[#F1F5F9] uppercase">
                                {app.motorcycle?.plate}
                              </div>
                            </div>

                            {/* Client & Motorcycle metrics */}
                            <div>
                              <p className="font-extrabold text-white text-xs uppercase tracking-tight">{app.customer?.name}</p>
                              <a 
                                href={`https://wa.me/${app.customer?.phone?.replace(/[^0-9]/g, '')}`} 
                                target="_blank" 
                                rel="no-referrer"
                                className="text-[10px] text-gray-400 hover:text-emerald-400 transition font-mono mt-0.5 inline-flex items-center gap-1"
                              >
                                <span>📞</span> {app.customer?.phone}
                              </a>
                              <p className="text-[10px] text-gray-500 uppercase font-semibold mt-0.5">
                                {app.motorcycle?.brand} {app.motorcycle?.model} ({app.motorcycle?.color})
                              </p>
                            </div>

                            {/* Service detail badge box */}
                            <div className="text-[10px] bg-[#0A0E1A] p-2.5 rounded-lg border border-white/5 space-y-1">
                              <span className="font-extrabold text-orange-400 uppercase tracking-wide text-[9px] block">
                                ⚙️ {app.service?.name}
                              </span>
                              <span className="text-gray-400 block font-mono">
                                Duración: {app.service?.duration} Mins
                              </span>
                              {app.notes && (
                                <p className="text-[9px] text-gray-500 italic border-t border-white/5 pt-1 mt-1 leading-relaxed">
                                  "{app.notes}"
                                </p>
                              )}
                            </div>

                            {/* Active pending controls */}
                            {(app.status === 'pending' || app.status === 'confirmed') ? (
                              <div className="flex gap-2 pt-1 border-t border-white/5 items-center">
                                <span className="text-[9px] text-gray-500 font-mono flex items-center gap-0.5 select-none" title="Mantén presionado para arrastrar">
                                  <GripVertical className="h-3.5 w-3 text-slate-500" />
                                  Mover {app.status === 'confirmed' && <span className="text-[9px] text-emerald-400 font-bold ml-1 uppercase">(Confirmada)</span>}
                                </span>
                                
                                <div className="flex-1 flex gap-1.5 justify-end">
                                  <button
                                    onClick={() => handleUpdateAppointmentStatus(app.id, 'completed')}
                                    className="flex-1 py-1 px-2 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-450 hover:text-white border border-emerald-500/20 text-[9px] font-black uppercase rounded transition"
                                  >
                                    ✓ Listo
                                  </button>
                                  <button
                                    onClick={() => handleUpdateAppointmentStatus(app.id, 'cancelled')}
                                    className="py-1 px-1.5 bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 text-[9px] font-black uppercase rounded transition"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="pt-2 border-t border-white/5">
                                <span className={`text-[9px] block text-center py-1 rounded font-black uppercase font-mono ${
                                  app.status === 'completed' 
                                    ? 'bg-green-500/10 text-green-400 border border-green-500/25' 
                                    : app.status === 'confirmed'
                                    ? 'bg-emerald-500/10 text-emerald-450 border border-emerald-500/25'
                                    : 'bg-red-500/10 text-red-550 border border-red-500/25'
                                }`}>
                                  {app.status === 'completed' ? 'Realizada' : app.status === 'confirmed' ? 'Confirmada' : 'Cancelada'}
                                </span>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* ORIGINAL TABLE TABULAR GRID VIEW */
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#151D2C] text-[10px] text-gray-400 uppercase font-black tracking-wider border-b border-[#1E293B]">
                      <th className="py-4 px-6">{filterByDate ? 'Hora' : 'Fecha / Hora'}</th>
                      <th className="py-4 px-6">Vehículo / Placa</th>
                      <th className="py-4 px-6">Cliente</th>
                      <th className="py-4 px-6">Servicio / Técnico</th>
                      <th className="py-4 px-6">Estado</th>
                      <th className="py-4 px-6 text-right">Acciones de Bahía</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1E293B] text-sm">
                    {displayedAppointments.map((app) => (
                      <tr key={app.id} className="hover:bg-[#121A2C]/40 transition">
                        <td className="py-4 px-6 font-mono font-bold text-orange-400">
                          {!filterByDate ? `${new Date(app.date).toISOString().split('T')[0]} • ` : ''}{app.time}
                        </td>
                        <td className="py-4 px-6">
                          <div className="font-mono bg-[#080D16] border border-white/5 py-1 px-2.5 rounded-lg text-xs font-black inline-block tracking-widest text-center text-white mb-1">
                            {app.motorcycle?.plate}
                          </div>
                          <p className="text-xs text-gray-400 uppercase font-semibold">{app.motorcycle?.brand} {app.motorcycle?.model} • {app.motorcycle?.color}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-white text-sm">{app.customer?.name}</p>
                          <p className="text-xs text-gray-400">{app.customer?.phone}</p>
                        </td>
                        <td className="py-4 px-6">
                          <p className="font-bold text-gray-300 text-xs uppercase tracking-tight">{app.service?.name}</p>
                          <p className="text-[10px] text-gray-500 font-semibold mt-1">👤 Técnico: {app.staff?.name || 'Por asignar'}</p>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded ${
                            app.status === 'completed'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/25'
                              : app.status === 'confirmed'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25'
                              : app.status === 'cancelled'
                              ? 'bg-red-500/10 text-red-400 border border-red-500/25'
                              : 'bg-orange-500/10 text-orange-400 border border-orange-500/25 text-orange-400'
                          }`}>
                            {app.status === 'completed' ? 'Realizada' : app.status === 'confirmed' ? 'Confirmada' : app.status === 'cancelled' ? 'Cancelada' : 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right space-x-2">
                          {(app.status === 'pending' || app.status === 'confirmed') && (
                            <>
                              <button 
                                onClick={() => handleUpdateAppointmentStatus(app.id, 'completed')}
                                className="px-3 py-1.5 bg-green-600/15 hover:bg-green-600 text-green-400 hover:text-white border border-green-600/30 text-xs font-bold rounded-lg transition"
                              >
                                Finalizada
                              </button>
                              <button
                                onClick={() => handleUpdateAppointmentStatus(app.id, 'cancelled')}
                                className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600 text-red-400 hover:text-white border border-red-600/30 text-xs font-bold rounded-lg transition"
                              >
                                Cancelar
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          )
        )}

        {/* TAB 2: SERVICIOS */}
        {activeTab === 'services' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Catálogo de Servicios Estéticos</h3>
                <p className="text-xs text-gray-400 mt-1">Configura los precios, duración del servicio estético y buffers.</p>
              </div>
              <button 
                onClick={() => setIsCreatingService(!isCreatingService)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white rounded-lg transition flex items-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Nuevo Servicio
              </button>
            </div>

            {/* Creation service panel overlay inline */}
            {isCreatingService && (
              <form onSubmit={handleCreateService} className="bg-[#0F172A] border border-orange-500/20 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-4">
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Nombre del Servicio *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej / Pulido y Encerado premium" 
                    value={serviceName}
                    onChange={(e) => setServiceName(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Precio COP *</label>
                  <input 
                    type="number" 
                    required 
                    placeholder="Ej / 35000" 
                    value={servicePrice}
                    onChange={(e) => setServicePrice(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="md:col-span-2 space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Duración (Mins)</label>
                  <select 
                    value={serviceDuration} 
                    onChange={(e) => setServiceDuration(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  >
                    <option value="20">20 min</option>
                    <option value="30">30 min (Básico)</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min (Premium)</option>
                    <option value="90">90 min</option>
                    <option value="120">120 min</option>
                  </select>
                </div>
                <div className="md:col-span-4 space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Descripción Corta</label>
                  <input 
                    type="text"
                    placeholder="Detalla los insumos o beneficios..." 
                    value={serviceDesc}
                    onChange={(e) => setServiceDesc(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="md:col-span-12 flex justify-end gap-2 pt-2 border-t border-white/5">
                  <button type="button" onClick={() => setIsCreatingService(false)} className="px-4 py-1.5 bg-[#1E293B] text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">Cancelar</button>
                  <button type="submit" className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition">Guardar Servicio</button>
                </div>
              </form>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {services.map((serv) => (
                <div key={serv.id} className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <span className="text-xs font-mono text-orange-400 font-bold">⏱️ {serv.duration} Minutos</span>
                      <span className="text-sm font-black text-white">${serv.price.toLocaleString('es-CO')}</span>
                    </div>
                    <h4 className="font-extrabold uppercase text-white leading-tight mt-1">{serv.name}</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">{serv.description || 'Cumple con el lavado estético premium de la cadena.'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: TÉCNICOS EXPAT / EQUIPO */}
        {activeTab === 'staff' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center bg-[#0F172A] border border-[#1E293B] p-5 rounded-2xl">
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight">Colaboradores & Especialistas</h3>
                <p className="text-xs text-gray-400 mt-1">Controla los técnicos activos en bahías de lavado.</p>
              </div>
              <button 
                onClick={() => setIsCreatingStaff(!isCreatingStaff)}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-xs text-white rounded-lg transition flex items-center gap-1.5"
              >
                <PlusCircle className="h-4 w-4" />
                Registrar Técnico
              </button>
            </div>

            {/* Creation technician inline form slider */}
            {isCreatingStaff && (
              <form onSubmit={handleCreateStaff} className="bg-[#0F172A] border border-orange-500/20 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-6 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Nombre del Operador *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ej / Carlos Méndez" 
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Especialidades</label>
                  <input 
                    type="text" 
                    placeholder="Ej / Detallado, Motores" 
                    value={staffSpecialty}
                    onChange={(e) => setStaffSpecialty(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Inicio Almuerzo</label>
                  <input 
                    type="time" 
                    value={staffLunchStart}
                    onChange={(e) => setStaffLunchStart(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                  <p className="text-[8px] text-gray-400">Duración máx: 1 hr</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Fin Almuerzo</label>
                  <input 
                    type="time" 
                    value={staffLunchEnd}
                    onChange={(e) => setStaffLunchEnd(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Inicio Break</label>
                  <input 
                    type="time" 
                    value={staffBreakStart}
                    onChange={(e) => setStaffBreakStart(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                  <p className="text-[8px] text-gray-400">Duración máx: 30 min</p>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Fin Break</label>
                  <input 
                    type="time" 
                    value={staffBreakEnd}
                    onChange={(e) => setStaffBreakEnd(e.target.value)}
                    className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-lg px-3 py-2 text-xs outline-none text-white"
                  />
                </div>
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[10px] text-gray-400 uppercase font-black">Foto del Técnico (PNG o JPG)</label>
                  <div
                    onDragOver={handleDragOverFile}
                    onDragLeave={handleDragLeaveFile}
                    onDrop={handleDropFile}
                    className={`relative border-2 border-dashed rounded-xl p-3.5 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer h-[58px] ${
                      isDraggingFile 
                        ? 'border-orange-500 bg-orange-500/10' 
                        : staffPhoto 
                          ? 'border-emerald-500/40 bg-emerald-500/5' 
                          : 'border-[#1E293B] bg-[#080D16] hover:border-gray-500'
                    }`}
                  >
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg, image/jpg"
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    
                    {staffPhoto ? (
                      <div className="flex items-center gap-3 w-full h-full justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <img 
                            src={staffPhoto} 
                            alt="Previsualización" 
                            className="h-8 w-8 rounded-full object-cover border border-emerald-500/30"
                          />
                          <div className="text-left min-w-0">
                            <p className="text-[9px] text-emerald-400 font-bold uppercase">Foto Lista</p>
                            <p className="text-[8px] text-gray-500 truncate">PNG/JPG en Base64</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setStaffPhoto('');
                          }}
                          className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md text-[9px] transition font-bold"
                        >
                          Quitar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 justify-center">
                        <Upload className={`h-4 w-4 ${isDraggingFile ? 'text-orange-500' : 'text-gray-500'}`} />
                        <div className="text-left">
                          <p className="text-[10px] text-gray-300 font-medium leading-none">
                            {isDraggingFile ? 'Suelta la foto aquí' : 'Sube o arrastra foto @ PNG/JPG'}
                          </p>
                          <p className="text-[8px] text-gray-500 mt-0.5 leading-none font-sans">Menor a 2MB</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="md:col-span-6 flex justify-end gap-2 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsCreatingStaff(false)} className="px-4 py-1.5 bg-[#1E293B] text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">Cancelar</button>
                  <button type="submit" className="px-4 py-1.5 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition">Asignar Operador</button>
                </div>
              </form>
            )}

            {/* Edit technician modal */}
            {editingStaff && (
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                {/* Backdrop */}
                <div 
                  className="fixed inset-0 bg-[#020617]/80 backdrop-blur-sm z-40 cursor-pointer" 
                  onClick={() => setEditingStaff(null)}
                />
                
                {/* Modal Container */}
                <div className="relative bg-[#0F172A] border border-purple-500/40 p-6 rounded-2xl max-w-2xl w-full z-50 shadow-2xl flex flex-col gap-5 max-h-[95vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
                  {/* Header */}
                  <div className="flex justify-between items-center pb-3 border-b border-white/5">
                    <div>
                      <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                        <Edit2 className="h-4 w-4 text-purple-400" />
                        Editar Técnico Especialista
                      </h3>
                      <p className="text-[10px] text-gray-400 mt-0.5">Modifica la información y horarios del colaborador en bahía.</p>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setEditingStaff(null)}
                      className="p-1.5 hover:bg-white/5 text-gray-400 hover:text-white rounded-lg transition"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleUpdateStaff} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Nombre del Operador *</label>
                      <input 
                        type="text" 
                        required 
                        placeholder="Ej / Carlos Méndez" 
                        value={editingStaffName}
                        onChange={(e) => setEditingStaffName(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Especialidades</label>
                      <input 
                        type="text" 
                        placeholder="Ej / Detallado, Scooter, Motores profundos" 
                        value={editingStaffSpecialty}
                        onChange={(e) => setEditingStaffSpecialty(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Inicio Almuerzo</label>
                      <input 
                        type="time" 
                        value={editingStaffLunchStart}
                        onChange={(e) => setEditingStaffLunchStart(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                      <p className="text-[8px] text-gray-400 text-left font-sans">Duración máx: 1 hora</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Fin Almuerzo</label>
                      <input 
                        type="time" 
                        value={editingStaffLunchEnd}
                        onChange={(e) => setEditingStaffLunchEnd(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Inicio Break</label>
                      <input 
                        type="time" 
                        value={editingStaffBreakStart}
                        onChange={(e) => setEditingStaffBreakStart(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                      <p className="text-[8px] text-gray-400 text-left font-sans">Duración máx: 30 minutos</p>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Fin Break</label>
                      <input 
                        type="time" 
                        value={editingStaffBreakEnd}
                        onChange={(e) => setEditingStaffBreakEnd(e.target.value)}
                        className="w-full bg-[#080D16] border border-[#1E293B] focus:border-purple-500 rounded-lg px-3 py-2 text-xs outline-none text-white transition"
                      />
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Foto del Técnico (PNG o JPG)</label>
                      <div
                        onDragOver={handleEditDragOverFile}
                        onDragLeave={handleEditDragLeaveFile}
                        onDrop={handleEditDropFile}
                        className={`relative border-2 border-dashed rounded-xl p-3.5 transition-all text-center flex flex-col items-center justify-center gap-1.5 cursor-pointer h-[64px] ${
                          isEditingDraggingFile 
                            ? 'border-purple-500 bg-purple-500/10' 
                            : editingStaffPhoto 
                              ? 'border-emerald-500/40 bg-emerald-500/5' 
                              : 'border-[#1E293B] bg-[#080D16] hover:border-gray-500'
                        }`}
                      >
                        <input 
                          type="file" 
                          accept="image/png, image/jpeg, image/jpg"
                          onChange={handleEditFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        
                        {editingStaffPhoto ? (
                          <div className="flex items-center gap-3 w-full h-full justify-between">
                            <div className="flex items-center gap-2 min-w-0 animate-fade-in">
                              <img 
                                src={editingStaffPhoto} 
                                alt="Previsualización" 
                                className="h-8 w-8 rounded-full object-cover border border-emerald-500/30"
                              />
                              <div className="text-left min-w-0">
                                <p className="text-[9px] text-emerald-400 font-bold uppercase">Foto Lista</p>
                                <p className="text-[8px] text-gray-500 truncate">PNG/JPG en Base64</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setEditingStaffPhoto('');
                              }}
                              className="px-2 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-md text-[9px] transition font-bold"
                            >
                              Quitar
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 justify-center">
                            <Upload className={`h-4 w-4 ${isEditingDraggingFile ? 'text-purple-500' : 'text-gray-500'}`} />
                            <div className="text-left">
                              <p className="text-[10px] text-gray-300 font-medium leading-none">
                                {isEditingDraggingFile ? 'Suelta la foto aquí' : 'Sube o arrastra foto (@ PNG/JPG)'}
                              </p>
                              <p className="text-[8px] text-gray-500 mt-0.5 leading-none">Menor a 2MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-1 md:col-span-2">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Estado del Operador</label>
                      <label className="flex items-center gap-2 p-2.5 bg-[#080D16] border border-[#1E293B] rounded-lg cursor-pointer hover:border-purple-500/40 select-none">
                        <input 
                          type="checkbox" 
                          checked={editingStaffActive} 
                          onChange={(e) => setEditingStaffActive(e.target.checked)}
                          className="rounded border-[#1E293B] text-purple-600 focus:ring-purple-500"
                        />
                        <span className="text-xs text-gray-200 font-semibold uppercase font-sans">Activo en Bahía</span>
                      </label>
                    </div>
                    <div className="md:col-span-2 flex justify-end gap-2 pt-4 border-t border-white/5">
                      <button type="button" onClick={() => setEditingStaff(null)} className="px-4 py-2 bg-[#1E293B] text-white text-xs font-bold rounded-lg hover:bg-slate-700 transition">Cancelar</button>
                      <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition shadow-lg shadow-purple-500/10">Guardar Cambios</button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {staffList.map((st) => (
                <div key={st.id} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 text-center space-y-4 flex flex-col justify-between items-center group relative overflow-hidden">
                  <div className="w-full flex flex-col items-center space-y-4 animate-opacity">
                    {st.photoUrl ? (
                      <img src={st.photoUrl} alt={st.name} referrerPolicy="no-referrer" className="h-20 w-20 rounded-full object-cover border-2 border-orange-500/10" />
                    ) : (
                      <div className="h-20 w-20 bg-orange-500/10 text-orange-400 rounded-full flex items-center justify-center font-black text-xl">
                        {st.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h4 className="font-extrabold text-white uppercase sm:text-base leading-tight">{st.name}</h4>
                      <p className="text-xs text-orange-400 font-semibold mt-1">{st.specialty || 'Técnico Detallador'}</p>
                      <div className="mt-2.5 space-y-1.5 flex flex-col items-center">
                        {st.lunchStart && st.lunchEnd ? (
                          <p className="text-[10px] text-gray-300 bg-[#080D16] border border-[#1E293B] px-2 py-0.5 rounded-full inline-block">
                            ☕ Almuerzo: <span className="font-bold text-gray-200">{st.lunchStart} - {st.lunchEnd}</span>
                          </p>
                        ) : (
                          <p className="text-[9px] text-gray-500 italic">Sin almuerzo configurado</p>
                        )}
                        {st.breakStart && st.breakEnd ? (
                          <p className="text-[10px] text-gray-300 bg-[#080D16] border border-[#1E293B] px-2 py-0.5 rounded-full inline-block">
                            ⚡ Break: <span className="font-bold text-gray-200">{st.breakStart} - {st.breakEnd}</span>
                          </p>
                        ) : (
                          <p className="text-[9px] text-gray-500 italic">Sin break configurado</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="w-full space-y-3 pt-3 mt-3 border-t border-white/5 flex flex-col items-center">
                    {st.active !== false ? (
                      <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/25 text-[#10B981] font-mono font-bold rounded text-[9px] uppercase">Activo en Bahía</span>
                    ) : (
                      <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/25 text-red-500 font-mono font-bold rounded text-[9px] uppercase">Inactivo</span>
                    )}
                    <button
                      onClick={() => handleStartEditStaff(st)}
                      className="w-full py-2 bg-purple-600/10 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/25 rounded-xl text-xs font-black uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow"
                    >
                      <Edit2 className="h-3 w-3" />
                      Editar Técnico
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: CONFIGURACIÓN GENERAL DEL NEGOCIO */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-6">
            <h3 className="text-lg font-black text-white uppercase border-b border-[#1E293B] pb-3 tracking-tight">Actualizar Información Comercial</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Nombre del Lavadero</label>
                <input 
                  type="text" 
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Buffer estético entre citas (Minutos)</label>
                <input 
                  type="number" 
                  min="0"
                  max="60"
                  value={businessBuffer}
                  onChange={(e) => setBusinessBuffer(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
                <p className="text-[10px] text-gray-500">Tiempo necesario para limpiar la bahía y acomodar el siguiente vehículo.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Celular / Teléfono comercial</label>
                <input 
                  type="text" 
                  value={businessPhone}
                  onChange={(e) => setBusinessPhone(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Correo de Soporte</label>
                <input 
                  type="email" 
                  value={businessEmail}
                  onChange={(e) => setBusinessEmail(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Dirección Física</label>
                <input 
                  type="text" 
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white"
                />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs text-gray-400 font-bold uppercase">Carta de Presentación / Descripción del negocio</label>
                <textarea 
                  rows={3}
                  value={businessDesc}
                  onChange={(e) => setBusinessDesc(e.target.value)}
                  className="w-full bg-[#080D16] border border-[#1E293B] focus:border-orange-500 rounded-xl px-4 py-2.5 text-sm outline-none text-white resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-[#1E293B]">
              <button type="submit" className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white text-sm font-black rounded-xl transition shadow-lg shadow-orange-500/10">
                Guardar Cambios
              </button>
            </div>
          </form>
        )}

        {/* TAB 5: MÉTRICAS / HISTOGRAMAS ESTADÍSTICOS */}
        {activeTab === 'metrics' && (effectiveStats || stats) && (
          (user?.role === 'admin' || user?.role === 'superadmin') ? (
            <div className="space-y-8 animate-opacity duration-300">
              
              {/* Filtros de Rápida Selección y Rango de Fechas */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                      <Settings className="h-4.5 w-4.5 text-orange-400" />
                      Filtros de Análisis Temporal
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Selecciona el rango para proyectar los gráficos e histórico de productividad.</p>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-1.5 bg-[#080D16] border border-[#1E293B] p-1 rounded-xl">
                    {[
                      { value: 'dia', label: 'Hoy' },
                      { value: 'semana', label: 'Semana' },
                      { value: 'mes', label: 'Mes' },
                      { value: 'personalizado', label: 'Personalizado' }
                    ].map((p) => (
                      <button
                        key={p.value}
                        type="button"
                        onClick={() => {
                          setMetricPeriod(p.value as any);
                          toast.success(`Filtrando métricas por: ${p.label}`);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase transition cursor-pointer select-none border ${
                          metricPeriod === p.value
                            ? 'bg-gradient-to-r from-orange-600 to-amber-600 border-orange-500 text-white font-black shadow-md shadow-orange-500/10'
                            : 'border-transparent text-gray-400 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Date Inputs */}
                {metricPeriod === 'personalizado' && (
                  <div className="p-4 bg-[#080D16] border border-white/5 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-4 animate-opacity">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Fecha Inicio *</label>
                      <input
                        type="date"
                        required
                        value={metricStartDate}
                        onChange={(e) => {
                          setMetricStartDate(e.target.value);
                          toast.info('Actualizando fecha de inicio para el análisis');
                        }}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none w-full font-mono transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-black">Fecha Fin *</label>
                      <input
                        type="date"
                        required
                        value={metricEndDate}
                        onChange={(e) => {
                          setMetricEndDate(e.target.value);
                          toast.info('Actualizando fecha de fin para el análisis');
                        }}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-xs text-white focus:outline-none w-full font-mono transition"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Contenedor del Histograma / Gráfico de Barras */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-lg font-black text-white uppercase tracking-tight">{effectiveStats.title}</h3>
                  <p className="text-xs text-gray-400 mt-1">{effectiveStats.subtitle}</p>
                </div>

                {/* Robust responsive vector-drawn visual representation of appointments distribution */}
                <div className="bg-[#080D16] rounded-xl border border-white/5 p-6 h-80 flex flex-col justify-between">
                  <div className="h-64 flex items-end gap-3 sm:gap-5 relative pt-4 overflow-x-auto scroller-hidden">
                    {/* Axis line */}
                    <div className="absolute left-0 bottom-0 right-0 h-0.5 bg-[#1E293B]"></div>
                    
                    {effectiveStats.chartData?.map((slot: any) => {
                      const maxVal = Math.max(...(effectiveStats.chartData || []).map((c: any) => c.count as number), 1);
                      const percent = (slot.count / maxVal) * 75 + 5; // offset scale to look clean
                      
                      return (
                        <div key={slot.date} className="h-full flex-1 min-w-[48px] flex flex-col justify-end items-center relative group pb-6">
                          {/* Hover/Standard Tooltip value bubble layout */}
                          <span className="absolute bottom-[calc(100%-10px)] mb-2 text-[10px] font-mono text-orange-400 font-extrabold bg-[#0F173A] border border-orange-500/20 px-2.5 py-1 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none shadow-lg">
                            {slot.count} citas
                          </span>

                          {/* Bar Pillar */}
                          <div 
                            style={{ height: `${percent}%` }}
                            className="w-full min-h-[6px] bg-gradient-to-t from-orange-600 to-amber-400 hover:from-orange-500 hover:to-amber-300 rounded-t-lg transition-all duration-700 shadow-lg shadow-orange-500/15"
                          />

                          {/* Label Date */}
                          <span className="absolute bottom-0 text-[10px] text-gray-400 font-mono tracking-tighter truncate w-full text-center">
                            {slot.date}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="flex justify-between items-center text-[10px] text-gray-500 pt-3 border-t border-white/5 font-mono uppercase tracking-wider">
                    <span>← {effectiveStats.labelStart}</span>
                    <span className="text-gray-400 font-bold">{effectiveStats.centerLabel}</span>
                    <span>{effectiveStats.labelEnd} →</span>
                  </div>
                </div>
              </div>

              {/* Tabular data breakdown layout: 'Métricas Consolidadas por Período' */}
              <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-orange-400" />
                    Tabla Detallada de Rendimiento por Rango
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Visualiza el desglose numérico exacto de citas, conversión y facturación estimada para el período filtrado.
                  </p>
                </div>

                <div className="overflow-x-auto border border-[#1E293B] rounded-xl">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-[#080D16] border-b border-[#1E293B] text-[10px] font-black uppercase tracking-wider text-gray-400 font-mono">
                        <th className="py-3 px-4">Intervalo / Fecha</th>
                        <th className="py-3 px-4 text-center">Citas Totales</th>
                        <th className="py-3 px-4 text-center">Finalizadas (92%)</th>
                        <th className="py-3 px-4 text-right">Efectivo Comercial (COP)</th>
                        <th className="py-3 px-4 text-center">Fidelización</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B] text-xs">
                      {effectiveStats.chartData?.map((item: any, i: number) => {
                        const finishedCount = Math.round(item.count * 0.92) || (item.count > 0 ? 1 : 0);
                        const revenueEstimate = finishedCount * 35000;
                        return (
                          <tr key={`${item.date}-${i}`} className="hover:bg-white/5 transition font-mono">
                            <td className="py-3.5 px-4 font-bold text-white uppercase">{item.date}</td>
                            <td className="py-3.5 px-4 text-center text-orange-400 font-black">{item.count}</td>
                            <td className="py-3.5 px-4 text-center text-[#10B981]">{finishedCount} servicios</td>
                            <td className="py-3.5 px-4 text-right text-emerald-400 font-extrabold">${revenueEstimate?.toLocaleString('es-CO')}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-sans font-bold uppercase whitespace-nowrap">
                                {(4.7 + (i % 3) * 0.1).toFixed(1)} ★
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                      {/* Totales consolidados row */}
                      <tr className="bg-[#080D16]/45 font-mono text-xs font-black border-t-2 border-[#1E293B]">
                        <td className="py-4 px-4 text-white uppercase">Suma Total Consolidador</td>
                        <td className="py-4 px-4 text-center text-orange-500 text-sm">{effectiveStats.totalAppointments}</td>
                        <td className="py-4 px-4 text-center text-emerald-400 text-sm">
                          {Math.round(effectiveStats.totalAppointments * 0.92)} serv.
                        </td>
                        <td className="py-4 px-4 text-right text-emerald-400 text-sm font-black">
                          ${effectiveStats.totalRevenue?.toLocaleString('es-CO')}
                        </td>
                        <td className="py-4 px-4 text-center text-amber-400">
                          {effectiveStats.averageRating} ★
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Popular Services Ranking Bento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                  <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-1">
                    <TrendingUp className="h-5 w-5 text-orange-400" />
                    Servicios Más Demandados
                  </h4>
                  
                  <div className="space-y-3">
                    {effectiveStats.popularServices?.length === 0 ? (
                      <p className="text-xs text-gray-500">No se registran citas suficientes para consolidar ranking.</p>
                    ) : (
                      effectiveStats.popularServices?.slice(0, 4).map((serv: any, i: number) => (
                        <div key={serv.name} className="flex items-center justify-between p-3 bg-[#080D16] rounded-xl border border-white/5">
                          <div className="flex items-center gap-3">
                            <span className="h-6 w-6 rounded-lg bg-orange-500/15 text-orange-400 flex items-center justify-center font-mono font-black text-xs">
                              {i + 1}
                            </span>
                            <span className="text-xs font-extrabold text-white uppercase">{serv.name}</span>
                          </div>
                          <span className="font-mono text-xs text-orange-400 font-bold bg-[#1A1107] border border-orange-500/10 px-2 py-0.5 rounded-md">
                            {serv.count} bookings
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Multi-Tenant SaaS general info banner */}
                <div className="bg-gradient-to-tr from-orange-600/15 via-[#0F172A] to-blue-500/5 border border-[#1E293B] rounded-2xl p-6 flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="inline-flex items-center gap-1 text-xs text-orange-400 font-bold uppercase tracking-widest">
                      <Sparkles className="h-4 w-4 animate-spin-slow" />
                      WeWash SaaS Enterprise Plan
                    </div>
                    <h4 className="text-xl font-black text-white leading-tight">Tu Negocio crece con nosotros.</h4>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Soporte para múltiples bahías habilitado. Configuración multi-tenant activa. Tu subdominio / slug {user?.business?.slug} está optimizado para indexación SEO y velocidad PWA móvil.
                    </p>
                  </div>

                  <div className="flex items-center gap-4 pt-6 border-t border-white/10 mt-6 md:mt-0">
                    <div className="text-left">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Estado SaaS</p>
                      <p className="text-xs text-[#10B981] font-bold">Activo • Al Corriente</p>
                    </div>
                    <div className="text-left border-l border-white/10 pl-4">
                      <p className="text-[10px] text-gray-500 uppercase font-black">Vencimiento del Plan</p>
                      <p className="text-xs text-white font-mono">25 de Mayo, 2028</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          ) : (
            <div className="space-y-8 animate-opacity duration-300">
              <div className="bg-[#0F172A] border border-[#1E293B] p-6 rounded-2xl">
                <h3 className="text-lg font-black text-white uppercase tracking-tight flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  Mi Desempeño Profesional
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Revisa tu rendimiento, calificaciones promedio y la lista completa de reseñas dejadas por los clientes que has atendido.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left: reviews & feedback comments */}
                <div className="lg:col-span-2 bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                  <h4 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Star className="h-4.5 w-4.5 text-orange-400 fill-current" />
                    Últimas Calificaciones & Recomendaciones
                  </h4>
                  
                  <div className="space-y-3.5 max-h-[500px] overflow-y-auto pr-1">
                    {(effectiveStats.reviews || [])?.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false).length === 0 ? (
                      <div className="py-16 text-center text-xs text-gray-500 border border-dashed border-white/5 rounded-xl">
                        Aún no has recibido valoraciones escritas en el sistema. ¡Sigue dando un servicio brillante a tus clientes!
                      </div>
                    ) : (
                      (effectiveStats.reviews || [])
                        ?.filter((r: any) => matchingStaff ? r.appointment?.staffId === matchingStaff.id : false)
                        .map((rev: any) => (
                          <div key={rev.id} className="bg-[#080D16] border border-white/5 rounded-xl p-4 space-y-2.5">
                            <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                              <span className="font-extrabold text-white uppercase tracking-tight">
                                {rev.customer?.name || 'Cliente'}
                              </span>
                              <span className="text-[10px] text-gray-500 font-mono">
                                {new Date(rev.createdAt).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}
                              </span>
                            </div>

                            {/* Stars ratings */}
                            <div className="flex items-center gap-0.5">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-3.5 w-3.5 ${
                                    i < rev.rating 
                                      ? 'text-orange-400 fill-current' 
                                      : 'text-gray-700'
                                  }`} 
                                />
                              ))}
                              <span className="text-[10px] font-mono text-gray-400 font-bold ml-1.5">{rev.rating}.0 / 5.0</span>
                            </div>

                            {/* Comments comment details wrapper */}
                            {rev.comment ? (
                              <p className="text-xs text-gray-300 italic bg-[#0E1320]/80 py-2.5 px-3 border-l-2 border-orange-500 rounded-r-lg leading-relaxed">
                                "{rev.comment}"
                              </p>
                            ) : (
                              <p className="text-xs text-gray-550 italic">No dejó comentarios escritos.</p>
                            )}

                            {/* Service and plate meta data */}
                            <div className="text-[10px] text-orange-450 font-mono flex items-center justify-between flex-wrap pt-0.5">
                              <span>🏍️ Servicio: {rev.appointment?.service?.name || 'Lavado'}</span>
                              <span className="text-slate-505 text-gray-500">Placa: {rev.appointment?.motorcycle?.plate}</span>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>

                {/* Right: Technical Badges & Identity summary scorecard card */}
                <div className="space-y-6">
                  {/* Persona Bio */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 text-center space-y-4">
                    <div className="mx-auto h-20 w-20 relative">
                      {matchingStaff?.photoUrl ? (
                        <img 
                          src={matchingStaff.photoUrl} 
                          alt={user?.name} 
                          referrerPolicy="no-referrer"
                          className="h-20 w-20 rounded-full object-cover border-2 border-orange-500 shadow-lg shadow-orange-500/25" 
                        />
                      ) : (
                        <div className="h-20 w-20 bg-orange-500/15 text-orange-400 rounded-full flex items-center justify-center font-black text-2xl uppercase border-2 border-orange-500/40">
                          {user?.name?.charAt(0)}
                        </div>
                      )}
                      <span className="absolute bottom-0 right-0 h-5 w-5 bg-emerald-500 border-2 border-[#0F172A] rounded-full" title="Técnico En Línea"></span>
                    </div>

                    <div>
                      <h4 className="text-base font-black text-white px-2 uppercase tracking-tight">
                        {matchingStaff?.name || user?.name}
                      </h4>
                      <p className="text-xs text-orange-400 font-bold mt-1">
                        {matchingStaff?.specialty || 'Técnico Especialista'}
                      </p>
                    </div>

                    <div className="py-2.5 px-3 bg-[#080D16] rounded-xl border border-white/5 space-y-1 text-left">
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Puesto:</span>
                        <span className="font-extrabold text-white uppercase text-xs">Operador</span>
                      </div>
                      <div className="flex justify-between text-[11px] text-gray-400">
                        <span>Lugar:</span>
                        <span className="font-extrabold text-[#10B981] truncate max-w-[120px] text-xs">{user?.business?.name || 'Socio MotoSpa'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Recognition merits bento widget */}
                  <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
                    <h4 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Award className="h-4 w-4 text-emerald-400" />
                      Insignias y Logros
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5 p-2 bg-[#080D16] border border-white/5 rounded-xl">
                        <span className="text-xl">🏆</span>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">Cuidado Estético</p>
                          <p className="text-[10px] text-gray-400">Reconocido por acabados perfectos libre de rayones.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2 bg-[#080D16] border border-white/5 rounded-xl">
                        <span className="text-xl">⚡</span>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">Eficiencia Total</p>
                          <p className="text-[10px] text-gray-400">Completa servicios en el tiempo proyectado.</p>
                        </div>
                      </div>

                      <div className="flex items-start gap-2.5 p-2 bg-[#080D16] border border-white/5 rounded-xl">
                        <span>🤝</span>
                        <div>
                          <p className="text-xs font-bold text-white uppercase">Socio de Confianza</p>
                          <p className="text-[10px] text-gray-400">Recomendado recurrentemente por clientes y flotas exigentes.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>

              </div>
            </div>
          )
        )}

        {/* TAB: WHATSAPP DEMO PANEL */}
{activeTab === 'whatsapp' && (
  <div className="space-y-6 animate-opacity">
    <WhatsAppDemoPanel />
  </div>
)}

        {/* TAB: SAAS ONBOARDING LEADS & LICENSE APPROVAL */}
        {activeTab === 'leads' && (
          <div className="space-y-6 animate-opacity">
            <div className="bg-[#0F172A] border border-orange-500/20 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
              <div className="space-y-2 max-w-xl">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 rounded-full text-xs font-black uppercase tracking-wider font-mono animate-pulse">
                  <span>★</span>
                  Corporación WeWash SaaS
                </div>
                <h3 className="text-xl font-black text-white uppercase tracking-tight">Postulaciones y Solicitudes de Lavaderos</h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Lista de prospectos de lavaderos y centros de detailing que han completado la encuesta de incorporación para WeWash. Negocia sus tarifas de licenciamiento mensuales o anuales y da de alta su bahía con un solo clic.
                </p>
              </div>
              <div className="flex gap-3 w-full md:w-auto self-stretch md:self-auto flex-wrap justify-center">
                <button 
                  onClick={() => setIsCreatingShop(!isCreatingShop)} 
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-750 hover:to-indigo-750 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  {isCreatingShop ? '❌ Cancelar Registro' : '➕ Crear Tienda Directo'}
                </button>
                <button 
                  onClick={fetchLeads} 
                  className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl transition shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  🔄 Recargar Solicitudes
                </button>
              </div>
            </div>

            {/* Manual Direct Register Shop Form */}
            {isCreatingShop && (
              <div className="bg-[#0F172A] border border-purple-500/30 rounded-2xl p-6 space-y-4 animate-opacity">
                <div>
                  <h4 className="text-base font-black text-white uppercase tracking-tight flex items-center gap-2">
                    <span className="text-purple-400">✨</span>
                    Registrar Nuevo Lavadero Socio (Cuentas Directas)
                  </h4>
                  <p className="text-xs text-gray-400">Proporcione los detalles del lavadero y las credenciales iniciales de su dueño administrador.</p>
                </div>
                
                <form onSubmit={handleManualShopCreation} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Nombre del Lavadero / Tienda *</label>
                    <input 
                      type="text"
                      required
                      value={newShopName}
                      onChange={(e) => {
                        setNewShopName(e.target.value);
                        setNewShopSlug(e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
                      }}
                      placeholder="e.g. Speed Wash SAS"
                      className="w-full bg-[#080D16] border border-[#1E293B] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Slug público URL (Sin espacios ni símbolos) *</label>
                    <div className="flex items-center">
                      <span className="bg-[#1E293B] text-gray-400 text-xs px-3 py-2 rounded-l-xl border-y border-l border-[#1E293B] font-mono leading-tight">/</span>
                      <input 
                        type="text"
                        required
                        value={newShopSlug}
                        onChange={(e) => setNewShopSlug(e.target.value)}
                        placeholder="speedwash"
                        className="w-full bg-[#080D16] border-y border-r border-[#1E293B] rounded-r-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Nombre Completo del Dueño / Admin *</label>
                    <input 
                      type="text"
                      required
                      value={newShopAdminName}
                      onChange={(e) => setNewShopAdminName(e.target.value)}
                      placeholder="Juan Pérez"
                      className="w-full bg-[#080D16] border border-[#1E293B] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Correo Electrónico del Admin *</label>
                    <input 
                      type="email"
                      required
                      value={newShopEmail}
                      onChange={(e) => setNewShopEmail(e.target.value)}
                      placeholder="admin@speedwash.com"
                      className="w-full bg-[#080D16] border border-[#1E293B] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Contraseña Inicial del Admin *</label>
                    <input 
                      type="password"
                      required
                      value={newShopAdminPassword}
                      onChange={(e) => setNewShopAdminPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-[#080D16] border border-[#1E293B] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-wider text-gray-400">Teléfono móvil de contacto *</label>
                    <input 
                      type="text"
                      required
                      value={newShopPhone}
                      onChange={(e) => setNewShopPhone(e.target.value)}
                      placeholder="+57 322 123 4567"
                      className="w-full bg-[#080D16] border border-[#1E293B] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-purple-500 transition"
                    />
                  </div>

                  <div className="md:col-span-2 flex justify-end pt-2">
                    <button 
                      type="submit"
                      className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl transition shadow-md"
                    >
                      🚀 Registrar y Configurar Lavadero
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div className="bg-[#0F172A] border border-[#1E293B] rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-black text-white uppercase tracking-tight">Cola de Contrato de Licencias</h4>
                  <p className="text-[10px] text-gray-400">Prospectos listos para contactar y aprobar.</p>
                </div>
                <div className="text-xs text-gray-400">
                  Total Solicitudes: <strong className="font-mono text-white text-sm">{leads.length}</strong>
                </div>
              </div>

              {loadingLeads ? (
                <div className="py-12 flex flex-col items-center justify-center space-y-3">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
                  <p className="text-xs text-gray-500 animate-pulse">Cargando leads y solicitudes del SaaS...</p>
                </div>
              ) : leads.length === 0 ? (
                <div className="py-16 text-center text-gray-500 space-y-2 border border-dashed border-white/5 rounded-xl">
                  <p className="text-sm">Ninguna solicitud registrada todavía.</p>
                  <p className="text-xs">Los prospectos que completen el formulario de registro de tienda en WeWash aparecerán listados aquí.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead>
                      <tr className="border-b border-[#1E293B] text-gray-400 uppercase font-black text-[10px] font-mono bg-[#080D16]/50">
                        <th className="py-3 px-4">Propietario / Contacto</th>
                        <th className="py-3 px-4">Establecimiento / Ciudad</th>
                        <th className="py-3 px-4">Capacidad / Carga diaria</th>
                        <th className="py-3 px-4">Petición Notas</th>
                        <th className="py-3 px-4">Plan / Licencia</th>
                        <th className="py-3 px-4">F. Solicitud</th>
                        <th className="py-3 px-4">Estado</th>
                        <th className="py-3 px-4 text-right">Aprobar / Configurar</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1E293B]">
                      {leads.map((lead) => (
                        <tr key={lead.id} className="hover:bg-[#151D2A]/30 transition text-xs">
                          {/* Owner details */}
                          <td className="py-3.5 px-4 space-y-1">
                            <p className="font-extrabold text-white text-xs">{lead.name}</p>
                            <p className="text-[10px] text-gray-400 font-mono">{lead.email}</p>
                            <div className="flex items-center gap-1">
                              <span className="text-[10px] text-orange-400 font-mono">{lead.phone}</span>
                              <a 
                                href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}?text=Hola%20${encodeURIComponent(lead.name)},%20te%20escribimos%20de%20WeWash%20SaaS%20para%20conversar%20sobre%20las%20tarifas%20de%20licencia%20para%20tu%20lavadero%20${encodeURIComponent(lead.businessName)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-1 text-[9px] bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500 hover:text-white rounded border border-emerald-500/20 font-bold ml-1 transition"
                              >
                                WhatsApp 💬
                              </a>
                            </div>
                          </td>

                          {/* Business details */}
                          <td className="py-3.5 px-4 space-y-1">
                            <p className="font-extrabold text-white uppercase">{lead.businessName}</p>
                            <span className="px-2 py-0.5 bg-[#1E293B] text-gray-300 rounded text-[10px] font-semibold">{lead.city}</span>
                          </td>

                          {/* Capacity / workload details */}
                          <td className="py-3.5 px-4 space-y-1">
                            <p className="font-mono text-gray-300">Bahías: {lead.baysCount}</p>
                            <p className="text-[10px] text-gray-400">Carga: {lead.washesPerDay || 'N/D'} lavadas/día</p>
                          </td>

                          {/* Additional requested notes */}
                          <td className="py-3.5 px-4">
                            {lead.additionalNotes ? (
                              <p className="text-[10px] text-gray-400 leading-relaxed max-w-xs truncate" title={lead.additionalNotes}>
                                "{lead.additionalNotes}"
                              </p>
                            ) : (
                              <span className="text-[9px] text-gray-600 font-serif italic">Ninguna</span>
                            )}
                          </td>

                          {/* Selected license tier */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-1 text-[10px] font-black rounded font-mono ${
                              lead.licenseTier === 'Pro' 
                                ? 'bg-[#9333EA]/10 text-purple-400 border border-purple-500/20' 
                                : lead.licenseTier === 'Premium' 
                                ? 'bg-[#EAB308]/10 text-yellow-400 border border-yellow-500/20' 
                                : 'bg-gray-500/10 text-gray-400 border border-white/5'
                            }`}>
                              {lead.licenseTier || 'Básico'}
                            </span>
                          </td>

                          {/* Date of request */}
                          <td className="py-3.5 px-4 text-[10px] font-mono text-gray-400 whitespace-nowrap">
                            {new Date(lead.createdAt).toLocaleDateString()}
                          </td>

                          {/* Status indicator badges */}
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-1 text-[10px] font-black rounded-lg uppercase font-mono border ${
                              lead.status === 'approved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                : lead.status === 'rejected' 
                                ? 'bg-red-500/10 text-red-400 border-red-500/30'
                                : lead.status === 'contacted'
                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/30 font-bold'
                                : 'bg-orange-500/10 text-orange-400 border-orange-500/30 animate-pulse'
                            }`}>
                              {lead.status === 'approved' ? 'Aprobado ✅' : lead.status === 'rejected' ? 'Rechazado' : lead.status === 'contacted' ? 'Contactado' : 'Pendiente'}
                            </span>
                          </td>

                          {/* Action triggers */}
                          <td className="py-3.5 px-4 text-right space-y-1.5 whitespace-nowrap">
                            {lead.status !== 'approved' && (
                              <div className="flex flex-col sm:flex-row gap-1 justify-end items-center">
                                {lead.status === 'pending' && (
                                  <button
                                    onClick={() => handleUpdateLeadStatus(lead.id, 'contacted')}
                                    disabled={updatingLeadId === lead.id}
                                    className="text-[10px] font-bold text-blue-400 hover:text-blue-300 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 rounded py-1 px-2 transition w-full cursor-pointer"
                                  >
                                    ✓ Marcar Contactado
                                  </button>
                                )}
                                <button
                                  onClick={() => handleApproveAndLaunchLead(lead.id)}
                                  disabled={updatingLeadId === lead.id}
                                  className="text-[10px] font-extrabold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded py-1 px-2.5 transition w-full cursor-pointer"
                                >
                                  🚀 Aprobar y Lanzar
                                </button>
                                <button
                                  onClick={() => handleUpdateLeadStatus(lead.id, 'rejected')}
                                  disabled={updatingLeadId === lead.id}
                                  className="text-[10px] font-bold text-red-400 hover:text-red-350 bg-red-500/5 hover:bg-red-500/10 border border-red-500/20 rounded py-1 px-1.5 transition cursor-pointer"
                                >
                                  ✕
                                </button>
                              </div>
                            )}
                            {lead.status === 'approved' && (
                              <span className="text-[10px] text-gray-500 italic font-mono">Licencia Seteada & Alta Completada</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
 
       </main>

      {/* Custom Deletion Confirmation Modal for Superadmin */}
      {user?.role === 'superadmin' && businessToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-opacity">
          <div className="w-full max-w-lg bg-[#0F172A] border border-red-500/20 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            {/* Red alert top line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 to-orange-500" />
            
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-2xl border border-red-500/20 text-red-500 shrink-0">
                <Trash className="h-6 w-6 animate-bounce" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white uppercase tracking-tight">¿Eliminar Establecimiento?</h4>
                <p className="text-xs text-red-400 font-bold mt-1 uppercase font-mono tracking-wider">Esta acción es permanente e irreversible</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-300 leading-relaxed bg-[#090D16] p-4 rounded-2xl border border-white/5 font-medium">
              ¿Estás absolutamente seguro de que deseas eliminar permanentemente el lavadero <strong className="text-white">"{businessToDelete.name}"</strong>? <br />
              <span className="text-xs text-gray-400 mt-2 block font-normal text-red-400/90 italic">
                Aviso: Se borrarán de forma inmediata todas sus citas, catálogos de servicios, técnicos registrados, calificaciones y configuraciones en cascada de la base de datos.
              </span>
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setBusinessToDelete(null)}
                disabled={isDeletingLoading}
                className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-[#1E293B] rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-50"
              >
                No, Cancelar
              </button>
              <button
                onClick={handleDeleteBusinessConfirm}
                disabled={isDeletingLoading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-red-500/20 flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isDeletingLoading ? (
                  <span>Eliminando...</span>
                ) : (
                  <>
                    <span>Sí, Eliminar</span>
                    <Trash className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Appointment Creation Modal */}
      {showManualAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="w-full max-w-2xl bg-[#0F172A] border border-[#1E293B] rounded-3xl shadow-2xl relative my-8">
            {/* Top decorative gradient line */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 to-amber-500" />
            
            <form onSubmit={handleCreateManualAppointment} className="p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500 shrink-0">
                    <Calendar className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white uppercase tracking-tight">Crear Cita Presencial</h4>
                    <p className="text-xs text-gray-400 mt-0.5">Agenda un turno rápido para un cliente o vehículo que acaba de llegar al establecimiento.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowManualAppModal(false)}
                  className="p-1 px-3 text-xs bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. SECCIÓN DE CLIENTE */}
                <div className="space-y-4 bg-[#090D16] border border-white/5 p-4 rounded-2xl">
                  <h5 className="text-[11px] font-black uppercase text-orange-400 tracking-wider font-mono">1. Datos del Cliente</h5>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Juan Pérez"
                      value={manualAppName}
                      onChange={(e) => setManualAppName(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Teléfono de Contacto (WhatsApp) *</label>
                    <input
                      type="tel"
                      required
                      placeholder="Ej. 3123456789"
                      value={manualAppPhone}
                      onChange={(e) => setManualAppPhone(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Correo Electrónico (Opcional)</label>
                    <input
                      type="email"
                      placeholder="cliente@reserveflow.com"
                      value={manualAppEmail}
                      onChange={(e) => setManualAppEmail(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                    />
                    <span className="text-[9px] text-gray-500 leading-normal block">Si se deja vacío, se generará uno temporal ligado a su identificación o placa.</span>
                  </div>
                </div>

                {/* 2. SECCIÓN DE REFERENCIA O MUESTRA */}
                <div className="space-y-4 bg-[#090D16] border border-white/5 p-4 rounded-2xl">
                  <h5 className="text-[11px] font-black uppercase text-orange-400 tracking-wider font-mono">2. Datos de Referencia (Vehículo / Mascota / Solicitud)</h5>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Placa o ID Registro *</label>
                      <input
                        type="text"
                        required
                        placeholder="Ej. ABC12D, REG-901"
                        value={manualAppPlate}
                        onChange={(e) => setManualAppPlate(e.target.value)}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full uppercase transition placeholder:normal-case font-black tracking-widest text-center"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Aspecto / Color (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. Negro, Café"
                        value={manualAppColor}
                        onChange={(e) => setManualAppColor(e.target.value)}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Marca / Tipo (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. Yamaha, Perro"
                        value={manualAppBrand}
                        onChange={(e) => setManualAppBrand(e.target.value)}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] text-gray-400 uppercase font-bold">Modelo / Raza (Opcional)</label>
                      <input
                        type="text"
                        placeholder="Ej. NMAX, Golden"
                        value={manualAppModel}
                        onChange={(e) => setManualAppModel(e.target.value)}
                        className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                      />
                    </div>
                  </div>
                  <span className="text-[9px] text-gray-500 leading-normal block pt-1.5 font-sans">Estos datos ayudan a los profesionales y especialistas a identificar el objeto, motivo o vehículo del servicio.</span>
                </div>
              </div>

              {/* 3. DETALLES DEL TURNO Y SERVICIO */}
              <div className="space-y-4 bg-[#090D16] border border-white/5 p-4 rounded-2xl">
                <h5 className="text-[11px] font-black uppercase text-orange-400 tracking-wider font-mono">3. Detalles del Servicio y Asignación</h5>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Tipo de Lavado / Servicio *</label>
                    <select
                      required
                      value={manualAppServiceId}
                      onChange={(e) => setManualAppServiceId(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none w-full transition cursor-pointer"
                    >
                      <option value="" disabled>Selecciona un servicio</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id} className="text-slate-850">
                          {s.name} (${s.price.toLocaleString()}) - {s.duration} min
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Asignar a Técnico *</label>
                    <select
                      value={manualAppStaffId}
                      onChange={(e) => setManualAppStaffId(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-[#F1F5F9] focus:outline-none w-full transition cursor-pointer"
                    >
                      <option value="">🚫 Ninguno (Por asignar en cola)</option>
                      {staffList.filter(s => s.active).map((s) => (
                        <option key={s.id} value={s.id} className="text-slate-850">
                          🧑‍🔧 {s.name} ({s.specialty || 'Técnico de Lavado'})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Fecha del Turno</label>
                    <input
                      type="date"
                      required
                      value={manualAppDate}
                      onChange={(e) => setManualAppDate(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none w-full transition"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-gray-400 uppercase font-bold">Hora del Turno</label>
                    <input
                      type="text"
                      required
                      placeholder="HH:MM (Ej. 10:30)"
                      value={manualAppTime}
                      onChange={(e) => setManualAppTime(e.target.value)}
                      className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none w-full transition"
                    />
                  </div>
                </div>

                <div className="space-y-1 pt-1">
                  <label className="text-[10px] text-gray-400 uppercase font-bold">Notas o Síntomas Especiales (Opcional)</label>
                  <textarea
                    rows={1}
                    placeholder="Ej. Cuidado especial con la tapicería de cuero, lavado de motor detallado..."
                    value={manualAppNotes}
                    onChange={(e) => setManualAppNotes(e.target.value)}
                    className="bg-[#0B0F19] border border-[#1E293B] focus:border-orange-500 rounded-xl px-3 py-2 text-sm text-white focus:outline-none w-full transition"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualAppModal(false)}
                  disabled={manualAppIsSubmitting}
                  className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white border border-[#1E293B] rounded-xl text-xs font-black uppercase tracking-wider transition disabled:opacity-55 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={manualAppIsSubmitting}
                  className="flex-grow-[1.5] py-3 px-4 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 disabled:opacity-55 cursor-pointer"
                >
                  {manualAppIsSubmitting ? (
                    <span>Registrando...</span>
                  ) : (
                    <>
                      <span>Confirmar e Ingresar Lavado</span>
                      <Calendar className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
