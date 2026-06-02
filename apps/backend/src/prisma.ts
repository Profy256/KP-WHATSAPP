import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// pg doesn't understand Prisma's ?schema= query parameter — strip it
const connectionString = (process.env.DATABASE_URL || '').replace(/[?&]schema=[^&]*/g, '').replace(/[?&]$/, '');

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
