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

// Public endpoint — no auth required
app.get('/api/public/developer-profile', async (req: Request, res: Response) => {
  let profile = await prisma.developerProfile.findFirst();
  if (!profile) profile = await prisma.developerProfile.create({ data: {} });
  res.json(profile);
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  // Restore all WhatsApp sessions from the database — no QR re-scan needed after restart
  whatsappService.reconnectAll().catch((err) => {
    console.error('reconnectAll failed:', err);
  });
});
