export interface Business {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  bufferTime: number;
  createdAt: string;
}

export interface BusinessHours {
  id: string;
  businessId: string;
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface Service {
  id: string;
  businessId: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  active: boolean;
}

export interface Staff {
  id: string;
  businessId: string;
  name: string;
  photoUrl?: string;
  specialty?: string;
  active: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Motorcycle {
  id: string;
  brand: string;
  model: string;
  plate: string;
  color: string;
  customerId: string;
}

export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  staffId?: string;
  customerId: string;
  motorcycleId: string;
  date: string;
  time: string;
  status: 'pending' | 'completed' | 'cancelled';
  notes?: string;
  token: string;
  createdAt: string;
  business?: Business;
  service?: Service;
  staff?: Staff;
  customer?: Customer;
  motorcycle?: Motorcycle;
}

export interface Review {
  id: string;
  businessId: string;
  appointmentId: string;
  customerId: string;
  rating: number;
  comment?: string;
  createdAt: string;
  customer?: Customer;
}

export interface Subscription {
  id: string;
  businessId: string;
  plan: string;
  status: string;
  endsAt?: string;
}
