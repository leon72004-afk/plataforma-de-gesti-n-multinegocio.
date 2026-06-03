import express from 'express';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

// Detect if we're using PostgreSQL (set by vercel-db-prep.cjs at build time or by env var)
const isPostgres = process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('postgresql://') || process.env.DATABASE_URL.includes('postgres://')) : false;

// Ensure fallback for DATABASE_URL if not provided (and use /tmp on Vercel for writable SQLite)
if (!process.env.DATABASE_URL) {
  if (process.env.VERCEL) {
    process.env.DATABASE_URL = 'file:/tmp/dev.db';
  } else {
    process.env.DATABASE_URL = 'file:./dev.db';
  }
}

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'motor-wash-super-secret-key-2026';

let isDbChecking = false;
let isDbOk = false;
let dbInitAttempted = false;

async function ensureDbInitialized() {
  if (isDbOk || isDbChecking) return;
  if (dbInitAttempted && isPostgres) {
    // For PostgreSQL on Vercel, if we already attempted and failed, don't retry every request
    return;
  }
  isDbChecking = true;
  try {
    const count = await prisma.user.count();
    isDbOk = true;
    console.log(`[DB-CHECK] Database is healthy. User count: ${count}`);
    } catch (err: any) {
    console.log('[DB-CHECK] Database connection failed or tables missing. Attempting self-healing...');
    dbInitAttempted = true;
    // On Vercel serverless, execSync is unreliable and the build already runs prisma db push + seed
    if (!process.env.VERCEL) {
      try {
        const { execSync } = await import('child_process');
        console.log('[DB-CHECK] Running: npx prisma db push --accept-data-loss');
        execSync('npx prisma db push --accept-data-loss', { stdio: 'inherit', timeout: 60000 });
        console.log('[DB-CHECK] Seeding database...');
        execSync('npx prisma db seed', { stdio: 'inherit', timeout: 60000 });
        isDbOk = true;
        console.log('[DB-CHECK] Database self-healing completed successfully!');
      } catch (pushErr: any) {
        console.error('[DB-CHECK] Database self-healing failed:', pushErr.message);
        if (pushErr.stdout) console.error('[DB-CHECK] stdout:', pushErr.stdout.toString());
        if (pushErr.stderr) console.error('[DB-CHECK] stderr:', pushErr.stderr.toString());
      }
    } else {
      console.log('[DB-CHECK] Vercel environment detected. Self-healing skipped (build already handled db push + seed).');
    }
  } finally {
    isDbChecking = false;
  }
}

// Trigger initial check asynchronously on startup
ensureDbInitialized().catch(console.error);

function parseTimeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(m: number): string {
  const h = Math.floor(m / 60);
  const mins = m % 60;
  return `${h.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

const app = express();

  app.use(express.json());
  app.use(cookieParser());

  // Wait/confirm database is initialized before serving API calls
  app.use(async (req, res, next) => {
    if (req.path.startsWith('/api') && !isDbOk) {
      await ensureDbInitialized();
    }
    next();
  });

  // Zod schemas for validations
  const AppointmentSchema = z.object({
    businessId: z.string().uuid(),
    serviceId: z.string().uuid(),
    staffId: z.string().nullable().optional(), // Null or empty for "any available"
    date: z.string(), // "YYYY-MM-DD"
    time: z.string().regex(/^\d{2}:\d{2}$/),
    customerName: z.string().min(2),
    customerPhone: z.string().min(7),
    customerEmail: z.string().email(),
    bikeBrand: z.string().min(1),
    bikeModel: z.string().min(1),
    bikePlate: z.string().min(3),
    bikeColor: z.string().min(1),
    notes: z.string().optional()
  });

  // Auth Middleware
  const authenticate = async (req: any, res: any, next: any) => {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }
    if (!token) return res.status(401).json({ error: 'No autorizado. Token faltante.' });
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: { business: true }
      });
      if (!user || !user.active) return res.status(401).json({ error: 'Usuario no activo o inexistente.' });
      req.user = user;
      next();
    } catch (err) {
      res.status(401).json({ error: 'Sesión inválida o expirada.' });
    }
  };

  const isAdmin = (req: any, res: any, next: any) => {
    if (req.user.role !== 'admin' && req.user.role !== 'superadmin') return res.status(403).json({ error: 'Acceso prohibido. Se requiere rol administrador o súperadministrador.' });
    next();
  };

  // API Router V1
  const api = express.Router();

  // Route to trigger manual DB setup (push & seed) for production/Vercel
  api.get('/db-setup', async (req, res) => {
    try {
      const { execSync } = await import('child_process');
      console.log('[DB-SETUP] Running prisma db push...');
      const pushOutput = execSync('npx prisma db push --accept-data-loss', { timeout: 60000 }).toString();
      console.log('[DB-SETUP] Running seed...');
      const seedOutput = execSync('npx prisma db seed', { timeout: 60000 }).toString();
      
      isDbOk = true;
      
      res.json({
        success: true,
        message: 'Base de datos sincronizada y sembrada con éxito en Vercel.',
        pushOutput,
        seedOutput
      });
    } catch (err: any) {
      console.error('[DB-SETUP ERROR]:', err);
      res.status(500).json({
        success: false,
        error: 'Error al sincronizar o sembrar la base de datos.',
        details: err.message,
        output: err.stdout?.toString() || err.stderr?.toString()
      });
    }
  });

  // Rate limiter simulator
  const rateLimitMap = new Map<string, { count: number, resetAt: number }>();
  const rateLimiter = (req: any, res: any, next: any) => {
    const ip = req.ip || 'global';
    const now = Date.now();
    const limit = 30; // 30 requests per minute
    const windowMs = 60 * 1000;

    const record = rateLimitMap.get(ip);
    if (!record || now > record.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs });
      return next();
    }

    record.count++;
    if (record.count > limit) {
      return res.status(429).json({ error: 'Demasiadas solicitudes. Inténtalo de nuevo más tarde.' });
    }
    next();
  };

  // APPLY rate limit to bookings to prevent spam
  api.use('/appointments', rateLimiter);

  // AUTH API
  api.post('/auth/register', async (req, res) => {
    try {
      const { name, email, password, businessName, businessSlug } = req.body;
      if (!name || !email || !password || !businessName || !businessSlug) {
        return res.status(400).json({ error: 'Completa todos los campos.' });
      }

      // Check if business exists
      const existingBusiness = await prisma.business.findUnique({ where: { slug: businessSlug } });
      if (existingBusiness) return res.status(400).json({ error: 'El slug del negocio ya está en uso' });

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) return res.status(400).json({ error: 'El email de usuario ya está registrado' });

      const hash = await bcrypt.hash(password, 10);

      const business = await prisma.$transaction(async (tx) => {
        // Create business
        const b = await tx.business.create({
          data: {
            name: businessName,
            slug: businessSlug,
            description: `Centro de estética para motos ${businessName}`,
            bufferTime: 15,
          }
        });

        // Create standard business hours (Mon-Sat 8:00 AM - 6:00 PM, Sun closed)
        for (let day = 1; day <= 6; day++) {
          await tx.businessHours.create({
            data: { businessId: b.id, dayOfWeek: day, openTime: '08:00', closeTime: '18:00', isClosed: false }
          });
        }
        await tx.businessHours.create({
          data: { businessId: b.id, dayOfWeek: 0, openTime: '09:00', closeTime: '13:00', isClosed: true }
        });

        // Create subscription
        await tx.subscription.create({
          data: { businessId: b.id, plan: 'Premium', status: 'active', endsAt: new Date('2028-05-25T00:00:00.000Z') }
        });

        // Create initial services
        await tx.service.create({
          data: { businessId: b.id, name: 'Lavado Básico', price: 16000, duration: 30, description: 'Limpieza con espuma activa, rines y cadena.' }
        });
        await tx.service.create({
          data: { businessId: b.id, name: 'Lavado Premium', price: 26000, duration: 60, description: 'Desengrase profundo de motor, tratamiento protector y abrillantador.' }
        });

        // Create staff
        await tx.staff.create({
          data: { businessId: b.id, name: 'Operador Principal', specialty: 'Detallado general' }
        });

        // Create owner user
        await tx.user.create({
          data: { name, email, passwordHash: hash, role: 'admin', active: true, businessId: b.id }
        });

        return b;
      });

      res.status(201).json({ success: true, business });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Error registrando tenant', details: err.message });
    }
  });

  api.post('/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
        include: { business: true }
      });
      if (!user || !user.active) return res.status(401).json({ error: 'Credenciales inválidas o cuenta inactiva.' });
      
      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) return res.status(401).json({ error: 'Credenciales inválidas.' });

      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1d' });
      res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
      res.json({ 
        token, 
        user: { id: user.id, name: user.name, email: user.email, role: user.role, businessId: user.businessId, business: user.business } 
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Error en el login.', details: err.message });
    }
  });

  api.post('/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  api.get('/auth/me', authenticate, (req: any, res) => {
    res.json({
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        businessId: req.user.businessId,
        business: req.user.business
      }
    });
  });

  /**
   * 1. POST /api/businesses
   * Onboards/creates a new motorcycle wash shop tenant.
   */
  api.post('/businesses', async (req, res) => {
    try {
      const { name, slug, address, phone, email, description, bufferTime } = req.body;
      if (!name || !slug) return res.status(400).json({ error: 'Nombre y Slug son requeridos.' });

      const existing = await prisma.business.findUnique({ where: { slug } });
      if (existing) {
        // Update the existing business
        const updatedBusiness = await prisma.business.update({
          where: { slug },
          data: {
            name,
            address,
            phone,
            email,
            description,
            bufferTime: bufferTime ? parseInt(bufferTime) : 15,
          }
        });
        return res.status(200).json(updatedBusiness);
      }

      const business = await prisma.business.create({
        data: {
          name,
          slug,
          address,
          phone,
          email,
          description,
          bufferTime: bufferTime ? parseInt(bufferTime) : 15,
        }
      });

      // Default business hours seed
      for (let day = 1; day <= 6; day++) {
        await prisma.businessHours.create({
          data: {
            businessId: business.id,
            dayOfWeek: day,
            openTime: '08:00',
            closeTime: '18:00',
            isClosed: false,
          }
        });
      }
      await prisma.businessHours.create({
        data: {
          businessId: business.id,
          dayOfWeek: 0,
          openTime: '09:00',
          closeTime: '13:00',
          isClosed: true,
        }
      });

      res.status(201).json(business);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al registrar negocio', details: err.message });
    }
  });

  /**
   * List all businesses (SaaS Portal Landing or Search nearby)
   */
  api.get('/businesses', async (req, res) => {
    try {
      const { search } = req.query;
      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search as string } },
          { address: { contains: search as string } },
          { description: { contains: search as string } }
        ];
      }
      const businesses = await prisma.business.findMany({
        where,
        include: {
          reviews: { take: 5, orderBy: { createdAt: 'desc' } }
        }
      });
      res.json(businesses);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener negocios', details: err.message });
    }
  });

  /**
   * DELETE /api/businesses/:id
   * Admin/Superadmin only can delete a business, deleting all of its cascading associations.
   */
  api.delete('/businesses/:id', authenticate, async (req: any, res) => {
    try {
      console.log(`[DELETE BUSINESS] Endpoint hit. Target ID: ${req.params.id}. Requested by: ${req.user?.email} (${req.user?.role})`);
      if (req.user.role !== 'superadmin') {
        console.warn(`[DELETE BUSINESS] Access denied for non-superadmin user: ${req.user?.role}`);
        return res.status(403).json({ error: 'Acceso denegado. Se requiere cuenta de Súper Administrador.' });
      }
      const { id } = req.params;
      
      const business = await prisma.business.findUnique({ where: { id } });
      if (!business) {
        console.warn(`[DELETE BUSINESS] Business not found with ID: ${id}`);
        return res.status(404).json({ error: 'Establecimiento no encontrado.' });
      }

      console.log(`[DELETE BUSINESS] Deleting associated tables manually first for fallback safety...`);
      // We perform manual cascading deletions to be absolutely sure we don't encounter SQLite/foreign key blocks
      await prisma.appointment.deleteMany({ where: { businessId: id } });
      await prisma.businessHours.deleteMany({ where: { businessId: id } });
      await prisma.service.deleteMany({ where: { businessId: id } });
      await prisma.staff.deleteMany({ where: { businessId: id } });
      await prisma.review.deleteMany({ where: { businessId: id } });
      await prisma.subscription.deleteMany({ where: { businessId: id } });
      await prisma.user.deleteMany({ where: { businessId: id } });

      console.log(`[DELETE BUSINESS] Deleting core Business record...`);
      await prisma.business.delete({ where: { id } });

      console.log(`[DELETE BUSINESS] Business "${business.name}" deleted successfully.`);
      res.json({ success: true, message: `El establecimiento "${business.name}" fue eliminado correctamente.` });
    } catch (err: any) {
      console.error('[DELETE BUSINESS] Catch Block Error:', err);
      res.status(500).json({ error: 'Error al de-registrar y eliminar el negocio', details: err.message });
    }
  });

  /**
   * 2. GET /api/businesses/:slug
   * Public profile showing services, staff, business hours, and reviews.
   */
  api.get('/businesses/:slug/profile', async (req, res) => {
    try {
      const { slug } = req.params;
      const business = await prisma.business.findUnique({
        where: { slug },
        include: {
          services: { where: { active: true } },
          staff: { where: { active: true } },
          businessHours: true,
          reviews: {
            include: { customer: true },
            orderBy: { createdAt: 'desc' }
          }
        }
      });

      if (!business) return res.status(404).json({ error: 'Lavadero de motos no encontrado.' });
      res.json(business);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener perfil', details: err.message });
    }
  });

  /**
   * 3. GET /api/businesses/:id/availability?date=&serviceId=
   * Core real-time slot checking algorithm.
   */
  api.get('/businesses/:id/availability', async (req, res) => {
    try {
      const { id } = req.params;
      const { date, serviceId } = req.query;

      if (!date || !serviceId) {
        return res.status(400).json({ error: 'Se requiere fecha (date) y servicio (serviceId).' });
      }

      const business = await prisma.business.findUnique({ where: { id } });
      if (!business) return res.status(404).json({ error: 'Negocio no encontrado.' });

      const service = await prisma.service.findUnique({ where: { id: serviceId as string } });
      if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });

      // Calculate Day of Week
      const dateParts = (date as string).split('-');
      const yStr = parseInt(dateParts[0]);
      const mStr = parseInt(dateParts[1]) - 1;
      const dStr = parseInt(dateParts[2]);
      const reqDate = new Date(Date.UTC(yStr, mStr, dStr));
      
      const dayOfWeek = reqDate.getUTCDay();

      // Find hours
      const hours = await prisma.businessHours.findFirst({
        where: { businessId: id, dayOfWeek }
      });

      if (!hours || hours.isClosed) {
        return res.json([]); // Return empty list, closed!
      }

      const openMin = parseTimeToMinutes(hours.openTime);
      const closeMin = parseTimeToMinutes(hours.closeTime);

      // Get active technicians/staff
      const staffList = await prisma.staff.findMany({
        where: { businessId: id, active: true }
      });

      if (staffList.length === 0) {
        return res.json([]); // No technicians to perform work
      }

      // Fetch booked non-cancelled appointments on that exact date
      // Note: We match on 'YYYY-MM-DD' exactly from the date field by comparing day start and day end
      const startOfDay = new Date(Date.UTC(yStr, mStr, dStr, 0, 0, 0, 0));
      const endOfDay = new Date(Date.UTC(yStr, mStr, dStr, 23, 59, 59, 999));

      const appointments = await prisma.appointment.findMany({
        where: {
          businessId: id,
          status: { in: ['pending', 'confirmed', 'completed'] },
          date: {
            gte: startOfDay,
            lte: endOfDay
          }
        },
        include: { service: true }
      });

      const slots: string[] = [];
      const duration = service.duration;
      const buffer = business.bufferTime;

      // Iteratively check potential spots at 15m granularity
      for (let currentMin = openMin; currentMin + duration <= closeMin; currentMin += 15) {
        const slotStart = currentMin;
        const slotEnd = currentMin + duration;

        // At least one tech must be free of overlaps
        const isFree = staffList.some(tech => {
          // Check tech lunch hours
          if (tech.lunchStart && tech.lunchEnd) {
            const lunchStartMin = parseTimeToMinutes(tech.lunchStart);
            const lunchEndMin = parseTimeToMinutes(tech.lunchEnd);

            // 1. Direct overlap with lunch (Proposed slot overlaps with lunch window)
            if (slotStart < lunchEndMin && slotEnd > lunchStartMin) {
              return false; // Not free!
            }

            // 2. Buffer window of 40 mins before the lunch
            if (slotStart < lunchStartMin && (lunchStartMin - slotStart) < 40) {
              return false; // Not free because of insufficient slot-lunch gap
            }
          }

          // Check tech break hours
          if (tech.breakStart && tech.breakEnd) {
            const breakStartMin = parseTimeToMinutes(tech.breakStart);
            const breakEndMin = parseTimeToMinutes(tech.breakEnd);

            // Direct overlap with break (Proposed slot overlaps with break window)
            if (slotStart < breakEndMin && slotEnd > breakStartMin) {
              return false; // Not free!
            }
          }

          // Check overlaps with this technician's schedule
          const hasOverlap = appointments.some(app => {
            // If the appointment has been assigned specifically and it's NOT this tech, then no conflict
            if (app.staffId && app.staffId !== tech.id) return false;

            const appStart = parseTimeToMinutes(app.time);
            const appEnd = appStart + app.service.duration;

            // Busy span including the buffer configured
            const busyStart = appStart;
            const busyEnd = appEnd + buffer;

            // Overlaps if ProposedStart < ExistingEndBusy AND ProposedEndBusy > ExistingStart
            return slotStart < busyEnd && (slotEnd + buffer) > busyStart;
          });

          return !hasOverlap;
        });

        if (isFree) {
          slots.push(formatMinutesToTime(currentMin));
        }
      }

      res.json(slots);
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Error del sistema al buscar disponibilidad.', details: err.message });
    }
  });

  /**
   * 4. POST /api/appointments
   * Schedules a new appointment. Handles automatic updates or additions in multi-level objects.
   */
  api.post('/appointments', async (req, res) => {
    try {
      const validated = AppointmentSchema.parse(req.body);

      // Verify business & service exists
      const business = await prisma.business.findUnique({ where: { id: validated.businessId } });
      if (!business) return res.status(404).json({ error: 'Negocio no encontrado.' });

      const service = await prisma.service.findUnique({ where: { id: validated.serviceId } });
      if (!service) return res.status(404).json({ error: 'Servicio no encontrado.' });

      // Upsert Customer
      let customer = await prisma.customer.findFirst({
        where: {
          OR: [
            { email: validated.customerEmail },
            { phone: validated.customerPhone }
          ]
        }
      });

      if (!customer) {
        customer = await prisma.customer.create({
          data: {
            name: validated.customerName,
            phone: validated.customerPhone,
            email: validated.customerEmail
          }
        });
      }

      // Upsert Motorcycle
      let bike = await prisma.motorcycle.findUnique({
        where: { plate: validated.bikePlate.toUpperCase() }
      });

      if (!bike) {
        bike = await prisma.motorcycle.create({
          data: {
            brand: validated.bikeBrand,
            model: validated.bikeModel,
            plate: validated.bikePlate.toUpperCase(),
            color: validated.bikeColor,
            customerId: customer.id
          }
        });
      }

      // Check date parsing
      const dateParts = validated.date.split('-');
      const y = parseInt(dateParts[0]);
      const m = parseInt(dateParts[1]) - 1;
      const d = parseInt(dateParts[2]);
      const bookingDate = new Date(Date.UTC(y, m, d));

      // Resolve staffId (either specific, or "any" based on scheduling vacancy)
      let resolvedStaffId = validated.staffId;
      const staffList = await prisma.staff.findMany({
        where: { businessId: validated.businessId, active: true }
      });

      if (staffList.length === 0) return res.status(400).json({ error: 'No hay técnicos activos en este lavadero.' });

      // Get overlapping appointments for same day
      const appointmentsOnDay = await prisma.appointment.findMany({
        where: {
          businessId: validated.businessId,
          status: { in: ['pending', 'confirmed', 'completed'] },
          date: {
            gte: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
            lte: new Date(Date.UTC(y, m, d, 23, 59, 59, 999))
          }
        },
        include: { service: true }
      });

      const slotStart = parseTimeToMinutes(validated.time);
      const slotEnd = slotStart + service.duration;
      const buffer = business.bufferTime;

      if (!resolvedStaffId || resolvedStaffId === 'any') {
        // Find first staff that is free
        const freeStaff = staffList.find(tech => {
          // Check lunch on that tech
          if (tech.lunchStart && tech.lunchEnd) {
            const lunchStartMin = parseTimeToMinutes(tech.lunchStart);
            const lunchEndMin = parseTimeToMinutes(tech.lunchEnd);
            if (slotStart < lunchEndMin && slotEnd > lunchStartMin) return false;
            if (slotStart < lunchStartMin && (lunchStartMin - slotStart) < 40) return false;
          }

          // Check breaks on that tech
          if (tech.breakStart && tech.breakEnd) {
            const breakStartMin = parseTimeToMinutes(tech.breakStart);
            const breakEndMin = parseTimeToMinutes(tech.breakEnd);
            if (slotStart < breakEndMin && slotEnd > breakStartMin) return false;
          }

          const overlap = appointmentsOnDay.some(app => {
            if (app.staffId !== tech.id) return false;
            const appStart = parseTimeToMinutes(app.time);
            const appEnd = appStart + app.service.duration;
            return slotStart < (appEnd + buffer) && (slotEnd + buffer) > appStart;
          });
          return !overlap;
        });

        if (!freeStaff) return res.status(400).json({ error: 'No hay técnicos disponibles para el horario y duración seleccionada.' });
        resolvedStaffId = null;
      } else {
        // Verify specifically requested staff
        const selectedTech = staffList.find(t => t.id === resolvedStaffId);
        if (!selectedTech) return res.status(400).json({ error: 'El técnico seleccionado no existe.' });

        // Check if overlaps with lunch hours
        if (selectedTech.lunchStart && selectedTech.lunchEnd) {
          const lunchStartMin = parseTimeToMinutes(selectedTech.lunchStart);
          const lunchEndMin = parseTimeToMinutes(selectedTech.lunchEnd);
          if (slotStart < lunchEndMin && slotEnd > lunchStartMin) {
            return res.status(400).json({ error: 'El técnico seleccionado está en su horario de almuerzo.' });
          }
          if (slotStart < lunchStartMin && (lunchStartMin - slotStart) < 40) {
            return res.status(400).json({ error: 'El técnico seleccionado va a salir a almorzar pronto (último turno permitido 40 min antes).' });
          }
        }

        // Check if overlaps with break hours
        if (selectedTech.breakStart && selectedTech.breakEnd) {
          const breakStartMin = parseTimeToMinutes(selectedTech.breakStart);
          const breakEndMin = parseTimeToMinutes(selectedTech.breakEnd);
          if (slotStart < breakEndMin && slotEnd > breakStartMin) {
            return res.status(400).json({ error: 'El técnico seleccionado está en su horario de descanso/break.' });
          }
        }

        const overlap = appointmentsOnDay.some(app => {
          if (app.staffId !== resolvedStaffId) return false;
          const appStart = parseTimeToMinutes(app.time);
          const appEnd = appStart + app.service.duration;
          return slotStart < (appEnd + buffer) && (slotEnd + buffer) > appStart;
        });

        if (overlap) return res.status(400).json({ error: 'El técnico seleccionado ya no está disponible para ese horario.' });
      }

      // Generate random confirmation token
      const token = Math.random().toString(36).substring(2, 10).toUpperCase();

      const appointment = await prisma.appointment.create({
        data: {
          businessId: validated.businessId,
          serviceId: validated.serviceId,
          staffId: resolvedStaffId,
          customerId: customer.id,
          motorcycleId: bike.id,
          date: bookingDate,
          time: validated.time,
          status: 'pending',
          notes: validated.notes,
          token
        },
        include: {
          service: true,
          staff: true,
          customer: true,
          motorcycle: true
        }
      });

      // Simulation of Twilio SMS and Nodemailer notification row
      await prisma.notification.create({
        data: {
          appointmentId: appointment.id,
          type: 'SMS',
          recipient: customer.phone,
          message: `Hola ${customer.name}, tu cita en ${business.name} está agendada el ${validated.date} a las ${validated.time} para tu moto placa ${bike.plate}. Reagenda o cancela aquí: http://localhost:3000/confirm/${token}`,
          status: 'sent',
          sentAt: new Date()
        }
      });

      await prisma.notification.create({
        data: {
          appointmentId: appointment.id,
          type: 'EMAIL',
          recipient: customer.email,
          message: `Confirmación de cita en ${business.name}. Tu lavado de moto tiene servicio de ${service.name}. Detalle: Moto ${bike.brand} ${bike.model} Placa ${bike.plate}. Token link: http://localhost:3000/confirm/${token}`,
          status: 'sent',
          sentAt: new Date()
        }
      });

      res.status(201).json(appointment);
    } catch (err: any) {
      console.error('[BOOKING API ERROR]:', err);
      if (err instanceof z.ZodError) {
        const errorMsg = err.issues.map(issue => `${issue.path.join('.') || 'datos'}: ${issue.message}`).join(', ');
        return res.status(400).json({ error: `Campos no válidos: ${errorMsg}`, details: err.issues });
      }
      res.status(500).json({ error: 'Error interno al agendar la cita.', details: err.message });
    }
  });

  /**
   * 5. GET /api/appointments/confirm/:token
   * Verifies/obtains a public appointment detail page.
   */
  api.get('/appointments/confirm/:token', async (req, res) => {
    try {
      const { token } = req.params;
      const appointment = await prisma.appointment.findUnique({
        where: { token },
        include: {
          business: true,
          service: true,
          staff: true,
          customer: true,
          motorcycle: true
        }
      });

      if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });
      res.json(appointment);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al consultar cita', details: err.message });
    }
  });

  /**
   * 6. PATCH /api/appointments/:id
   * Fully edits/reschedules or updates the status of an appointment.
   */
  api.patch('/appointments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const { date, time, status, staffId, notes } = req.body;

      const appToUpdate = await prisma.appointment.findUnique({
        where: { id },
        include: { business: true, service: true }
      });
      if (!appToUpdate) return res.status(404).json({ error: 'Cita no encontrada.' });

      const updateData: any = {};
      if (status) updateData.status = status;
      if (notes !== undefined) updateData.notes = notes;
      if (staffId !== undefined) updateData.staffId = staffId === 'any' ? null : staffId;

      if (date && time) {
        const dateParts = date.split('-');
        updateData.date = new Date(Date.UTC(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, parseInt(dateParts[2])));
        updateData.time = time;
      }

      const updated = await prisma.appointment.update({
        where: { id },
        data: updateData,
        include: { service: true, staff: true, customer: true, motorcycle: true }
      });

      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar cita', details: err.message });
    }
  });

  /**
   * 7. DELETE /api/appointments/:id
   * Cancels/destroys an appointment (or toggles to state "cancelled").
   */
  api.delete('/appointments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const app = await prisma.appointment.findUnique({ where: { id } });
      if (!app) return res.status(404).json({ error: 'Cita no encontrada' });

      // Usually safer to mark cancelled
      const updated = await prisma.appointment.update({
        where: { id },
        data: { status: 'cancelled' }
      });

      res.json({ success: true, appointment: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al cancelar la cita', details: err.message });
    }
  });

  /**
   * 8. GET /api/appointments/business/:id?date=
   * Dashboard admin calendar view (daily, weekly, monthly queries).
   */
  api.get('/appointments/business/:businessId', authenticate, async (req, res) => {
    try {
      const { businessId } = req.params;
      const { date } = req.query;

      const where: any = { businessId };

      if (date) {
        const dateParts = (date as string).split('-');
        const y = parseInt(dateParts[0]);
        const m = parseInt(dateParts[1]) - 1;
        const d = parseInt(dateParts[2]);
        where.date = {
          gte: new Date(Date.UTC(y, m, d, 0, 0, 0, 0)),
          lte: new Date(Date.UTC(y, m, d, 23, 59, 59, 999))
        };
      }

      const appointments = await prisma.appointment.findMany({
        where,
        include: {
          service: true,
          staff: true,
          customer: true,
          motorcycle: true
        },
        orderBy: [
          { date: 'asc' },
          { time: 'asc' }
        ]
      });

      res.json(appointments);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al recuperar citas del lavadero.', details: err.message });
    }
  });

  /**
   * Business owner services manager
   */
  api.get('/services/business/:businessId', authenticate, async (req, res) => {
    try {
      const services = await prisma.service.findMany({
        where: { businessId: req.params.businessId, active: true },
        orderBy: { name: 'asc' }
      });
      res.json(services);
    } catch (err: any) {
      res.status(500).json({ error: 'Error', details: err.message });
    }
  });

  api.post('/services', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, price, duration, description, businessId } = req.body;
      const service = await prisma.service.create({
        data: {
          name,
          price: parseFloat(price),
          duration: parseInt(duration),
          description,
          businessId
        }
      });
      res.json(service);
    } catch (err: any) {
      res.status(500).json({ error: 'Error creando servicio', details: err.message });
    }
  });

  api.put('/services/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, price, duration, description, active } = req.body;
      const service = await prisma.service.update({
        where: { id: req.params.id },
        data: {
          name,
          price: price !== undefined ? parseFloat(price) : undefined,
          duration: duration !== undefined ? parseInt(duration) : undefined,
          description,
          active
        }
      });
      res.json(service);
    } catch (err: any) {
      res.status(500).json({ error: 'Error de actualización', details: err.message });
    }
  });

  /**
   * Business owner staff manager
   */
  api.get('/staff/business/:businessId', authenticate, async (req, res) => {
    try {
      const staffList = await prisma.staff.findMany({
        where: { businessId: req.params.businessId, active: true },
        orderBy: { name: 'asc' }
      });
      res.json(staffList);
    } catch (err: any) {
      res.status(500).json({ error: 'Error', details: err.message });
    }
  });

  api.post('/staff', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, photoUrl, specialty, businessId, lunchStart, lunchEnd, breakStart, breakEnd } = req.body;

      const getDurationInMinutes = (start: string, end: string) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
      };

      if ((lunchStart && !lunchEnd) || (!lunchStart && lunchEnd)) {
        return res.status(400).json({ error: 'Debes definir tanto el inicio como el fin de la hora de almuerzo.' });
      }
      if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
        return res.status(400).json({ error: 'Debes definir tanto el inicio como el fin del break.' });
      }

      if (lunchStart && lunchEnd) {
        const lunchMin = getDurationInMinutes(lunchStart, lunchEnd);
        if (lunchMin <= 0) {
          return res.status(400).json({ error: 'La hora de fin del almuerzo debe ser posterior al inicio.' });
        }
        if (lunchMin > 60) {
          return res.status(400).json({ error: 'La hora de almuerzo no puede durar más de 1 hora (60 minutos).' });
        }
      }

      if (breakStart && breakEnd) {
        const breakMin = getDurationInMinutes(breakStart, breakEnd);
        if (breakMin <= 0) {
          return res.status(400).json({ error: 'La hora de fin del break debe ser posterior al inicio.' });
        }
        if (breakMin > 30) {
          return res.status(400).json({ error: 'El break no puede durar más de 30 minutos.' });
        }
      }

      const staff = await prisma.staff.create({
        data: { 
          name, 
          photoUrl, 
          specialty, 
          businessId,
          lunchStart: lunchStart || null,
          lunchEnd: lunchEnd || null,
          breakStart: breakStart || null,
          breakEnd: breakEnd || null
        }
      });
      res.json(staff);
    } catch (err: any) {
      res.status(500).json({ error: 'Error creando colaborador', details: err.message });
    }
  });

  api.put('/staff/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const { name, photoUrl, specialty, active, lunchStart, lunchEnd, breakStart, breakEnd } = req.body;

      const getDurationInMinutes = (start: string, end: string) => {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        return (eh * 60 + em) - (sh * 60 + sm);
      };

      if ((lunchStart && !lunchEnd) || (!lunchStart && lunchEnd)) {
        return res.status(400).json({ error: 'Debes definir tanto el inicio como el fin de la hora de almuerzo.' });
      }
      if ((breakStart && !breakEnd) || (!breakStart && breakEnd)) {
        return res.status(400).json({ error: 'Debes definir tanto el inicio como el fin del break.' });
      }

      if (lunchStart && lunchEnd) {
        const lunchMin = getDurationInMinutes(lunchStart, lunchEnd);
        if (lunchMin <= 0) {
          return res.status(400).json({ error: 'La hora de fin del almuerzo debe ser posterior al inicio.' });
        }
        if (lunchMin > 60) {
          return res.status(400).json({ error: 'La hora de almuerzo no puede durar más de 1 hora (60 minutos).' });
        }
      }

      if (breakStart && breakEnd) {
        const breakMin = getDurationInMinutes(breakStart, breakEnd);
        if (breakMin <= 0) {
          return res.status(400).json({ error: 'La hora de fin del break debe ser posterior al inicio.' });
        }
        if (breakMin > 30) {
          return res.status(400).json({ error: 'El break no puede durar más de 30 minutos.' });
        }
      }

      const staff = await prisma.staff.update({
        where: { id: req.params.id },
        data: { 
          name, 
          photoUrl, 
          specialty, 
          active,
          lunchStart: lunchStart || null,
          lunchEnd: lunchEnd || null,
          breakStart: breakStart || null,
          breakEnd: breakEnd || null
        }
      });
      res.json(staff);
    } catch (err: any) {
      res.status(500).json({ error: 'Error actualizando colaborador', details: err.message });
    }
  });

  api.delete('/staff/:id', authenticate, isAdmin, async (req, res) => {
    try {
      const staff = await prisma.staff.update({
        where: { id: req.params.id },
        data: { active: false }
      });
      res.json(staff);
    } catch (err: any) {
      res.status(500).json({ error: 'Error' });
    }
  });

  /**
   * 9. POST /api/reviews
   * Rate a service/shop.
   */
  api.post('/reviews', async (req, res) => {
    try {
      const { businessId, appointmentId, customerId, rating, comment } = req.body;
      if (!businessId || !appointmentId || !customerId || !rating) {
        return res.status(400).json({ error: 'Faltan parámetros obligatorios para publicar la reseña.' });
      }

      const review = await prisma.review.create({
        data: {
          businessId,
          appointmentId,
          customerId,
          rating: parseInt(rating),
          comment
        },
        include: { customer: true }
      });

      res.status(201).json(review);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al publicar la reseña.', details: err.message });
    }
  });

  /**
   * 10. GET /api/businesses/:id/stats
   * Business analytic metrics for custom layout visualisations.
   */
  api.get('/businesses/:id/stats', authenticate, async (req: any, res) => {
    try {
      const { id } = req.params;

      // Verify owner can access their business stats
      if (req.user.businessId !== id && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
        return res.status(403).json({ error: 'No tienes permiso sobre este negocio' });
      }

      const appointments = await prisma.appointment.findMany({
        where: { businessId: id },
        include: { service: true, customer: true }
      });

      const reviews = await prisma.review.findMany({
        where: { businessId: id },
        include: {
          customer: true,
          appointment: {
            include: {
              staff: true,
              service: true
            }
          }
        }
      });

      const services = await prisma.service.findMany({
        where: { businessId: id }
      });

      const staff = await prisma.staff.findMany({
        where: { businessId: id }
      });

      // Simple calculation of analytics metrics
      // 1. Today's appointments
      const todayStr = new Date().toISOString().split('T')[0];
      const todayApps = appointments.filter(a => {
        const appDateStr = a.date.toISOString().split('T')[0];
        return appDateStr === todayStr;
      });

      // 2. Revenue (Completed appointments)
      const totalRevenue = appointments
        .filter(a => a.status === 'completed')
        .reduce((sum, a) => sum + (a.service?.price || 0), 0);

      // 3. Category/Popular services count
      const servicePopularity: Record<string, { count: number, name: string }> = {};
      appointments.forEach(a => {
        if (!a.service) return;
        if (!servicePopularity[a.serviceId]) {
          servicePopularity[a.serviceId] = { count: 0, name: a.service.name };
        }
        servicePopularity[a.serviceId].count++;
      });

      const popularServices = Object.values(servicePopularity).sort((a,b) => b.count - a.count);

      // 4. Cancellation Rate
      const totalCount = appointments.length;
      const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;
      const cancellationRate = totalCount > 0 ? (cancelledCount / totalCount) * 100 : 0;

      // 5. Customer recurrence
      const customerCounts: Record<string, number> = {};
      appointments.forEach(a => {
        if (a.customerId) {
          customerCounts[a.customerId] = (customerCounts[a.customerId] || 0) + 1;
        }
      });
      const recurrentCustomers = Object.values(customerCounts).filter(c => c > 1).length;

      // 6. Average rating
      const averageRating = reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) : 4.8;

      // Chart: Citas por día (last 7 days helper)
      const last7Days: Record<string, number> = {};
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        last7Days[key] = 0;
      }
      appointments.forEach(a => {
        const key = a.date.toISOString().split('T')[0];
        if (last7Days[key] !== undefined) {
          last7Days[key]++;
        }
      });
      const chartData = Object.entries(last7Days).map(([date, count]) => ({ date, count }));

      res.json({
        totalAppointments: totalCount,
        todayAppointments: todayApps.length,
        totalRevenue,
        popularServices,
        cancellationRate: parseFloat(cancellationRate.toFixed(1)),
        recurrentCustomers,
        averageRating: parseFloat(averageRating.toFixed(1)),
        totalReviews: reviews.length,
        totalServices: services.length,
        totalStaff: staff.length,
        chartData,
        reviews: reviews
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Error al recuperar estadísticas de negocio.', details: err.message });
    }
  });

  /**
   * 11. GET /api/v1/notifications
   * Recovers notification history (SMS, EMAIL, WHATSAPP) of a business for administrative logs.
   */
  api.get('/notifications', authenticate, async (req: any, res) => {
    try {
      const notifications = await prisma.notification.findMany({
        where: {
          appointment: {
            businessId: req.user.businessId
          }
        },
        include: {
          appointment: {
            include: {
              customer: true,
              service: true,
              motorcycle: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      res.json(notifications);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener notificaciones', details: err.message });
    }
  });

  /**
   * 12. POST /api/v1/notifications/manual-whatsapp
   * Triggers an immediate customized mock WhatsApp reminder for a specific appointment ID.
   */
  api.post('/notifications/manual-whatsapp', authenticate, async (req: any, res) => {
    try {
      const { appointmentId } = req.body;
      if (!appointmentId) return res.status(400).json({ error: 'ID de cita requerido.' });

      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: { customer: true, business: true, service: true, motorcycle: true }
      });

      if (!appointment) return res.status(404).json({ error: 'Cita no encontrada.' });

      const message = `Hola ${appointment.customer.name}, WeWash te recuerda tu cita en el lavadero "${appointment.business.name}" agendada el ${appointment.date.toISOString().split('T')[0]} a las ${appointment.time} para tu moto con placa ${appointment.motorcycle?.plate || ''}. Confirma o reprograma con este link: http://localhost:3000/confirm/${appointment.token}`;

      console.log(`[WHATSAPP MANUAL] Enviando mensaje a ${appointment.customer.phone}: ${message}`);

      const notification = await prisma.notification.create({
        data: {
          appointmentId: appointment.id,
          type: 'WHATSAPP',
          recipient: appointment.customer.phone,
          message,
          status: 'sent',
          sentAt: new Date()
        }
      });

      res.status(201).json({ success: true, notification });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al enviar WhatsApp manual', details: err.message });
    }
  });

  /**
   * 13. POST /api/v1/whatsapp/webhook-simulate
   * Simulates an incoming webhook from WhatsApp Cloud API (e.g. customer replying "CONFIRMAR").
   * This updates the appointment's status to 'confirmed' natively in the database!
   */
  api.post('/whatsapp/webhook-simulate', async (req, res) => {
    try {
      const { phone, message } = req.body;
      if (!phone || !message) return res.status(400).json({ error: 'Destinatario y mensaje son requeridos.' });

      const cleanMessage = message.trim().toUpperCase();
      let statusToSet = '';

      if (cleanMessage.includes('CONFIRMAR') || cleanMessage.includes('CONFIRMO') || cleanMessage.includes('SI') || cleanMessage.includes('SÍ')) {
        statusToSet = 'confirmed';
      } else if (cleanMessage.includes('CANCELAR') || cleanMessage.includes('CANCELD') || cleanMessage.includes('NO')) {
        statusToSet = 'cancelled';
      }

      if (!statusToSet) {
        return res.json({ 
          success: false, 
          reply: 'No se reconoció ninguna instrucción. Responde con CONFIRMAR o CANCELAR.' 
        });
      }

      // Find the customer details
      const customer = await prisma.customer.findUnique({
        where: { phone }
      });

      if (!customer) return res.status(404).json({ error: 'Cliente no encontrado con ese celular.' });

      const appointment = await prisma.appointment.findFirst({
        where: {
          customerId: customer.id,
          status: 'pending'
        },
        orderBy: {
          createdAt: 'desc'
        },
        include: { business: true }
      });

      if (!appointment) {
        return res.json({ 
          success: false, 
          reply: `Hola ${customer.name}, no encontramos citas pendientes de confirmar asociadas a tu número.` 
        });
      }

      // Update the status
      const updatedApp = await prisma.appointment.update({
        where: { id: appointment.id },
        data: { status: statusToSet }
      });

      // Save a trace notification
      await prisma.notification.create({
        data: {
          appointmentId: appointment.id,
          type: 'WHATSAPP',
          recipient: phone,
          message: `[Respuesta WhatsApp Recibida del Cliente]: "${message}". Turno actualizado a: ${statusToSet === 'confirmed' ? 'CONFIRMADA' : 'CANCELADA'}.`,
          status: 'sent',
          sentAt: new Date()
        }
      });

      res.json({
        success: true,
        appointment: updatedApp,
        reply: statusToSet === 'confirmed' 
          ? `¡Gracias! Hemos confirmado correctamente tu cita en "${appointment.business.name}" a las ${appointment.time}.`
          : `Entendido. Hemos cancelado tu cita en "${appointment.business.name}" según tus indicaciones.`
      });
    } catch (err: any) {
      console.error(err);
      res.status(500).json({ error: 'Error al simular webhook de WhatsApp', details: err.message });
    }
  });

  // --- AUTOMATIC 2-HOURS WHATSAPP AUTOMATION SCHEDULER TASK ---
  async function runWhatsAppNotificationCheck() {
    try {
      const now = new Date();
      const futureLimit = new Date(now.getTime() + 120 * 60 * 1000); // 2 hours from now

      // Find pending appointments
      const pendingAppointments = await prisma.appointment.findMany({
        where: {
          status: 'pending'
        },
        include: {
          customer: true,
          business: true,
          service: true,
          motorcycle: true,
          notifications: {
            where: {
              type: 'WHATSAPP'
            }
          }
        }
      });

      for (const app of pendingAppointments) {
        // Skip if already has a WhatsApp notification sent
        if (app.notifications.length > 0) continue;

        // Parse date and time
        const [h, m] = app.time.split(':').map(Number);
        const appDateTime = new Date(app.date);
        appDateTime.setUTCHours(h, m, 0, 0);

        // Send confirmation if inside the 2-hour window and has not started yet
        if (appDateTime > now && appDateTime <= futureLimit) {
          const message = `Hola ${app.customer.name}, WeWash te recuerda tu cita en "${app.business.name}" para hoy a las ${app.time} (en 2 horas). Por favor, confirma tu asistencia respondiendo a este mensaje con CONFIRMAR o haciendo clic en: http://localhost:3000/confirm/${app.token}`;
          
          console.log(`[WHATSAPP AUTOMÁTICO] Enviando confirmación de cita a ${app.customer.phone}: "${message}"`);

          await prisma.notification.create({
            data: {
              appointmentId: app.id,
              type: 'WHATSAPP',
              recipient: app.customer.phone,
              message,
              status: 'sent',
              sentAt: new Date()
            }
          });
        }
      }
    } catch (error: any) {
      console.error('[WHATSAPP SCHEDULER ERROR] Error running automatic check:', error.message);
    }
  }

  // Poll notifications check every 30 seconds (only in non-serverless environments)
  if (!process.env.VERCEL) {
    setInterval(() => {
      runWhatsAppNotificationCheck();
    }, 30000);
  }

  /**
   * 14. POST /api/v1/leads
   * Public onboarding inquiries (survey) for setting up a business store.
   */
  api.post('/leads', async (req, res) => {
    try {
      const { name, email, phone, businessName, city, washesPerDay, baysCount, licenseTier, additionalNotes } = req.body;
      if (!name || !email || !phone || !businessName || !city) {
        return res.status(400).json({ error: 'Nombre, Email, Teléfono, Ciudad y Nombre de Negocio son obligatorios.' });
      }

      const lead = await prisma.lead.create({
        data: {
          name,
          email,
          phone,
          businessName,
          city,
          washesPerDay,
          baysCount: baysCount ? parseInt(baysCount) : 1,
          licenseTier: licenseTier || 'Básico',
          additionalNotes,
          status: 'pending'
        }
      });

      res.status(201).json({ success: true, lead });
    } catch (err: any) {
      console.error('[LEADS CREATION ERROR]:', err);
      res.status(500).json({ error: 'Error al enviar la solicitud de onboarding.', details: err.message });
    }
  });

  /**
   * 15. GET /api/v1/leads
   * Fetch all onboarding leads / registrations (Admin only).
   */
  api.get('/leads', authenticate, async (req: any, res) => {
    try {
      const leads = await prisma.lead.findMany({
        orderBy: { createdAt: 'desc' }
      });
      res.json(leads);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al obtener leads.', details: err.message });
    }
  });

  /**
   * 16. PATCH /api/v1/leads/:id
   * Update lead status or perform approval (Admin only).
   */
  api.patch('/leads/:id', authenticate, async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      if (!status) return res.status(400).json({ error: 'Estado requerido.' });

      const updatedLead = await prisma.lead.update({
        where: { id },
        data: { status }
      });

      res.json(updatedLead);
    } catch (err: any) {
      res.status(500).json({ error: 'Error al actualizar estado del lead.', details: err.message });
    }
  });

  /**
   * 17. POST /api/v1/leads/:id/approve-launch
   * Custom action that auto-approves the lead, and actually configures/creates the Business with a demo user,
   * sending licensing agreement details.
   */
  api.post('/leads/:id/approve-launch', authenticate, async (req: any, res) => {
    try {
      const { id } = req.params;
      const lead = await prisma.lead.findUnique({ where: { id } });
      if (!lead) return res.status(404).json({ error: 'Solicitud no encontrada.' });

      // Generate a unique slug based on business name
      const slug = lead.businessName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');

      // Check if business slug already exists
      const existingBusiness = await prisma.business.findUnique({ where: { slug } });
      const finalSlug = existingBusiness ? `${slug}-${Math.floor(Math.random() * 900 + 100)}` : slug;

      // Check if user email registered
      const existingUser = await prisma.user.findUnique({ where: { email: lead.email } });
      if (existingUser) {
        return res.status(400).json({ error: 'Ya existe un usuario con este correo administrador en el SaaS.' });
      }

      // Default temporary password: wewash2026
      const tempPassword = 'wewash2026';
      const hash = await bcrypt.hash(tempPassword, 10);

      const business = await prisma.$transaction(async (tx) => {
        // Create business
        const b = await tx.business.create({
          data: {
            name: lead.businessName,
            slug: finalSlug,
            phone: lead.phone,
            email: lead.email,
            description: `Lavadero de motos profesional en ${lead.city}. Licencia de uso: ${lead.licenseTier || 'Premium'}.`,
            bufferTime: 15,
          }
        });

        // Set Business Hours Mon-Sat
        for (let day = 1; day <= 6; day++) {
          await tx.businessHours.create({
            data: { businessId: b.id, dayOfWeek: day, openTime: '08:00', closeTime: '18:00', isClosed: false }
          });
        }
        await tx.businessHours.create({
          data: { businessId: b.id, dayOfWeek: 0, openTime: '09:00', closeTime: '13:00', isClosed: true }
        });

        // Create subscription
        await tx.subscription.create({
          data: { businessId: b.id, plan: lead.licenseTier || 'Premium', status: 'active', endsAt: new Date('2028-05-25T00:00:00.000Z') }
        });

        // Create standard services
        await tx.service.create({
          data: { businessId: b.id, name: 'Lavado General de Moto', price: 16000, duration: 45, description: 'Limpieza exhaustiva con cadena lubricada y cera protectora.' }
        });

        // Create initial staff operator
        await tx.staff.create({
          data: { businessId: b.id, name: lead.name, specialty: 'Detallado de pintura' }
        });

        // Create owner admin user
        await tx.user.create({
          data: { name: lead.name, email: lead.email, passwordHash: hash, role: 'admin', active: true, businessId: b.id }
        });

        // Mark lead as approved
        await tx.lead.update({
          where: { id: lead.id },
          data: { status: 'approved' }
        });

        return b;
      });

      res.status(201).json({ success: true, business, tempPassword, slug: finalSlug });
    } catch (err: any) {
      res.status(500).json({ error: 'Error al aprovisionar automáticamente el lavadero.', details: err.message });
    }
  });

  app.use('/api/v1', api);

  // Vite preview / distribution build middleware for Cloud Run / Dev
  if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  import('vite')
    .then(({ createServer: createViteServer }) => {
      return createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
    })
    .then((vite) => {
      app.use(vite.middlewares);
    })
    .catch((err) => {
      console.error('Error starting Vite dev server middleware:', err);
    });
  } else {
    if (!process.env.VERCEL) {
      const distPath = path.join(process.cwd(), 'dist');
      app.use(express.static(distPath));
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'));
      });
    }
  }

  if (!process.env.VERCEL) {
    const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  }

export default app;
