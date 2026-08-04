import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import whatsappRoutes from './routes/whatsapp.routes';
import aiRoutes from './routes/ai.routes';
import logRoutes from './routes/log.routes';
import contactRoutes from './routes/contact.routes';
import adminRoutes from './routes/admin.routes';
import { whatsappService } from './services/whatsapp.service';
import { prisma } from './prisma';
import { AppError } from './errors';

dotenv.config();

// Safety net: a single rejected promise (e.g. a transient Neon timeout inside a
// WhatsApp event handler) must never take the whole server down. Log and keep running.
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
});

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(s => s.trim())
    : ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true,
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/whatsapp', whatsappRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/contacts', contactRoutes);
app.use('/api/admin', adminRoutes);

// Liveness probe — deliberately touches nothing (no DB, no auth) so it answers
// the instant the process is up. The frontend pings this as soon as the login
// page loads: on a host that sleeps idle instances, that starts the cold boot
// while the user is still typing, instead of on submit where the wait turns
// into a failed signup.
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ ok: true, uptime: process.uptime() });
});

// Public endpoint — no auth required
app.get('/api/public/developer-profile', async (req: Request, res: Response) => {
  let profile = await prisma.developerProfile.findFirst();
  if (!profile) profile = await prisma.developerProfile.create({ data: {} });
  res.json(profile);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const status = err instanceof AppError ? err.statusCode : 500;
  // Expected rejections (a duplicate email, a bad password) are normal traffic —
  // only log the stack for genuine faults, so real errors stay visible in logs.
  if (status >= 500) console.error(err.stack);
  res.status(status).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  // Restore all WhatsApp sessions from the database — no QR re-scan needed after restart.
  //
  // Held back briefly: on a small instance that has just cold-started, the
  // request that woke it (often a signup) is waiting right now, and opening
  // every WhatsApp socket at once steals the CPU it needs. Serve that first,
  // then reconnect.
  const startupDelay = Number(process.env.RECONNECT_STARTUP_DELAY_MS) || 10_000;
  setTimeout(() => {
    whatsappService.reconnectAll().catch((err) => {
      console.error('reconnectAll failed:', err);
    });
  }, startupDelay);
});
