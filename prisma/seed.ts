import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

// Detect database type
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

async function main() {
  console.log('Clearing old database records...');
  // Delete in order of dependencies to avoid constraint violations
  await prisma.notification.deleteMany({});
  await prisma.review.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.motorcycle.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.staff.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.businessHours.deleteMany({});
  await prisma.subscription.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.business.deleteMany({});

  console.log('Seeding businesses...');
  
  // 1. Business 1: MotoSpa Premium
  const business1 = await prisma.business.create({
    data: {
      name: 'MotoSpa Premium',
      slug: 'motospapremium',
      logoUrl: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=150&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
      address: 'Calle 45 #12-34, Bogotá',
      phone: '+57 312 456 7890',
      email: 'contacto@motospa.com',
      description: 'El mejor centro de estética y lavado para tu motocicleta. Tratamiento con agua desmineralizada, espumas de pH neutro y cera de alta protección.',
      bufferTime: 15,
    }
  });

  console.log('Seeding business hours...');
  for (let day = 1; day <= 6; day++) { // Monday to Saturday
    await prisma.businessHours.create({
      data: {
        businessId: business1.id,
        dayOfWeek: day,
        openTime: '08:00',
        closeTime: '18:00',
        isClosed: false,
      }
    });
  }
  // Sunday (Closed or half day)
  await prisma.businessHours.create({
    data: {
      businessId: business1.id,
      dayOfWeek: 0, // Sunday
      openTime: '09:00',
      closeTime: '13:00',
      isClosed: false,
    }
  });

  console.log('Seeding subscriptions...');
  await prisma.subscription.create({
    data: {
      businessId: business1.id,
      plan: 'Premium',
      status: 'active',
      endsAt: new Date('2027-12-31T23:59:59Z'),
    }
  });

  console.log('Seeding owners/admin users...');
  const passwordHash = await bcrypt.hash('admin123', 10);
  const passwordHashSuper = await bcrypt.hash('superadmin123', 10);

  // Seeding SuperAdmin
  await prisma.user.create({
    data: {
      name: 'Super Creator',
      email: 'superadmin@motowash.com',
      passwordHash: passwordHashSuper,
      role: 'superadmin',
      active: true,
      businessId: null,
    }
  });

  // Seeding User SuperAdmin
  await prisma.user.create({
    data: {
      name: 'Soporte CC Grupo',
      email: 'lider.soporteinfra@ccgrupo.com.co',
      passwordHash: passwordHash,
      role: 'superadmin',
      active: true,
      businessId: null,
    }
  });
  
  await prisma.user.create({
    data: {
      name: 'Admin MotoSpa',
      email: 'admin@motowash.com',
      passwordHash,
      role: 'admin',
      active: true,
      businessId: business1.id,
    }
  });

  await prisma.user.create({
    data: {
      name: 'Pedro Velásquez',
      email: 'rapido@motowash.com',
      passwordHash,
      role: 'operator',
      active: true,
      businessId: business1.id,
    }
  });

  console.log('Seeding services...');
  // Services for MotoSpa Premium
  const s1 = await prisma.service.create({
    data: {
      businessId: business1.id,
      name: 'Lavado Básico',
      price: 18000,
      duration: 30,
      description: 'Lavado con espuma activa, limpieza de rines, secado con microfibra y lubricación de cadena básica.',
    }
  });
  const s2 = await prisma.service.create({
    data: {
      businessId: business1.id,
      name: 'Lavado Premium',
      price: 28000,
      duration: 60,
      description: 'Lavado profundo con desengrasado de motor, remoción de asfalto, aplicación de cera de carnauba y abrillantador de piezas plásticas.',
    }
  });
  const s3 = await prisma.service.create({
    data: {
      businessId: business1.id,
      name: 'Lavado + Encerado Completo',
      price: 45000,
      duration: 90,
      description: 'El servicio premium por excelencia. Lavado minucioso de chasis, pulido manual de tanques, encerado protector sellante y teflonado de rines.',
    }
  });
  const s4 = await prisma.service.create({
    data: {
      businessId: business1.id,
      name: 'Lavado Detallado de Motor',
      price: 25000,
      duration: 45,
      description: 'Limpieza con desengrasantes ecológicos dieléctricos para proteger la electrónica exterior del motor, terminado con silicón protector de alta temperatura.',
    }
  });

  // Note: Services for Rápido Wash removed to keep only MotoSpa Premium

  console.log('Seeding staff...');
  const staff1 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      name: 'Carlos "El Rayo"',
      specialty: 'Detallado & Encerado',
      photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  });
  const staff2 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      name: 'Juan "Reflejos"',
      specialty: 'Motores & Desengrase',
      photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  });
  const staff3 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      name: 'Mateo "Spark"',
      specialty: 'Motos Eléctricas y Scooter',
      photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  });

  const rStaff1 = await prisma.staff.create({
    data: {
      businessId: business1.id,
      name: 'Pedro Velásquez',
      specialty: 'Lavado Express General',
      photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=100&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
    }
  });

  console.log('Seeding customers & motorcycles...');
  const customer1 = await prisma.customer.create({
    data: {
      name: 'Andrea Gómez',
      phone: '+573103216547',
      email: 'andrea.gomez@gmail.com'
    }
  });
  const customer2 = await prisma.customer.create({
    data: {
      name: 'Felipe Restrepo',
      phone: '+573159998877',
      email: 'felipe.restrepo@example.com'
    }
  });

  const moto1 = await prisma.motorcycle.create({
    data: {
      brand: 'Yamaha',
      model: 'MT-09',
      plate: 'XYZ99E',
      color: 'Azul Eléctrico / Negro',
      customerId: customer1.id,
    }
  });

  const moto2 = await prisma.motorcycle.create({
    data: {
      brand: 'KTM',
      model: 'Duke 390',
      plate: 'ABC45F',
      color: 'Naranja Mate',
      customerId: customer2.id,
    }
  });

  console.log('Seeding static & real-time appointments...');
  
  // Date definitions
  const today = new Date();
  const indexToday = today.toISOString().split('T')[0];
  
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  const indexYesterday = yesterday.toISOString().split('T')[0];

  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);
  const indexTomorrow = tomorrow.toISOString().split('T')[0];

  // Appointment 1: Yesterday, Completed (Andrea Gomez, MT-09)
  const app1 = await prisma.appointment.create({
    data: {
      businessId: business1.id,
      serviceId: s2.id, // Lavado Premium
      staffId: staff1.id,
      customerId: customer1.id,
      motorcycleId: moto1.id,
      date: new Date(indexYesterday + 'T10:00:00.000Z'),
      time: '10:00',
      status: 'completed',
      notes: 'Dejar bien limpios los rines azules.',
      token: 'token_yesterday_1',
    }
  });

  // Review for Appointment 1
  await prisma.review.create({
    data: {
      businessId: business1.id,
      appointmentId: app1.id,
      customerId: customer1.id,
      rating: 5,
      comment: '¡Quedó espectacular! El trato de Carlos fue fabuloso, cuidó cada detalle de mi MT-09. Regresaré sin duda.',
    }
  });

  // Appointment 2: Today, Pending (Felipe Restrepo, Duke)
  await prisma.appointment.create({
    data: {
      businessId: business1.id,
      serviceId: s3.id, // Lavado + Encerado
      staffId: staff2.id,
      customerId: customer2.id,
      motorcycleId: moto2.id,
      date: new Date(indexToday + 'T14:30:00.000Z'),
      time: '14:30',
      status: 'pending',
      notes: 'Por favor cuidar mucho el tablero TFT, no mojarlo directamente.',
      token: 'token_today_1',
    }
  });

  // Appointment 3: Tomorrow, Pending (Andrea, MT-09 booking a quick check / basic wash)
  await prisma.appointment.create({
    data: {
      businessId: business1.id,
      serviceId: s1.id, // Básico
      staffId: staff1.id,
      customerId: customer1.id,
      motorcycleId: moto1.id,
      date: new Date(indexTomorrow + 'T09:00:00.000Z'),
      time: '09:00',
      status: 'pending',
      notes: 'Limpieza de barro de viaje.',
      token: 'token_tomorrow_1',
    }
  });

  console.log('Database seeded successfully!');
  console.log(`- SuperAdmin: superadmin@motowash.com / superadmin123`);
  console.log(`- Business 1: MotoSpa Premium (slug: motospapremium) -> Admin: admin@motowash.com / admin123 | Operator: rapido@motowash.com / admin123`);
}

main()
  .catch((e) => {
    console.error('Error seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
