const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, 'schema.prisma');
let schema = fs.readFileSync(schemaPath, 'utf8');

const dbUrl = process.env.DATABASE_URL || '';

if (dbUrl.includes('postgresql://') || dbUrl.includes('postgres://')) {
  console.log('[VERCEL-DB-PREP] Detected PostgreSQL in DATABASE_URL. Switching Prisma provider to "postgresql".');
  schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
} else {
  console.log('[VERCEL-DB-PREP] Using default SQLite provider in Prisma schema.');
}

fs.writeFileSync(schemaPath, schema, 'utf8');
