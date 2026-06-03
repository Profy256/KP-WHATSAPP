import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// pg doesn't understand Prisma's ?schema= query parameter — strip it
const connectionString = (process.env.DATABASE_URL || '').replace(/[?&]schema=[^&]*/g, '').replace(/[?&]$/, '');

// Pool sizing matters here: every inbound WhatsApp message triggers several
// queries plus per-message Baileys signal-key writes, so the default pool of 10
// is exhausted quickly under concurrent tenants. Make it tunable per
// environment (a pooled provider like Neon/PgBouncer wants a smaller max).
const pool = new Pool({
  connectionString,
  max: Number(process.env.DB_POOL_MAX) || 20,
  idleTimeoutMillis: Number(process.env.DB_POOL_IDLE_MS) || 30_000,
  connectionTimeoutMillis: Number(process.env.DB_POOL_CONN_TIMEOUT_MS) || 10_000,
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
