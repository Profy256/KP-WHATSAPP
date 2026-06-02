import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { AiService } from './ai.service';
import { useDbAuthState } from '../auth/db-auth-state';

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'CONNECTED'
  | 'FAILED';

export interface ConnectionState {
  status: ConnectionStatus;
  /** Human-readable explanation, shown to the user on failure. */
  reason?: string;
  qr?: string;
}

// How many times we retry a *transient* drop (connection lost, service
// unavailable) before giving up and reporting FAILED.
const MAX_RECONNECT_ATTEMPTS = 5;

export class WhatsappService {
  private sessions: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private states: Map<string, ConnectionState> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  private aiService: AiService = new AiService();

  private setState(businessId: string, patch: Partial<ConnectionState>) {
    const current = this.states.get(businessId) || { status: 'DISCONNECTED' };
    this.states.set(businessId, { ...current, ...patch });
  }

  /** Tear down any existing socket so we never have two fighting over one number. */
  private async destroySocket(businessId: string) {
    const existing = this.sessions.get(businessId);
    if (existing) {
      try {
        existing.ev.removeAllListeners('connection.update');
        existing.ev.removeAllListeners('creds.update');
        existing.ev.removeAllListeners('messages.upsert');
        existing.end(undefined);
      } catch (err) {
        console.error(`Error tearing down socket for business ${businessId}:`, err);
      }
      this.sessions.delete(businessId);
    }
    const timer = this.reconnectTimers.get(businessId);
    if (timer) {
      clearTimeout(timer);
      this.reconnectTimers.delete(businessId);
    }
  }

  /** Maps a Baileys disconnect status code to a message the end-user can act on. */
  private describeDisconnect(statusCode: number | undefined): string {
    switch (statusCode) {
      case DisconnectReason.loggedOut:
        return 'You logged out from your phone. Scan the QR code again to reconnect.';
      case DisconnectReason.badSession:
        return 'The saved session is no longer valid. Please scan the QR code again.';
      case DisconnectReason.connectionReplaced:
        return 'This account was opened on another device or browser tab. Close the other session, then reconnect here.';
      case DisconnectReason.multideviceMismatch:
        return 'Multi-device version mismatch. Update WhatsApp on your phone, then scan again.';
      case DisconnectReason.forbidden:
        return 'WhatsApp refused this connection. The number may be banned or restricted.';
      case DisconnectReason.timedOut:
        return 'The connection timed out.';
      case DisconnectReason.unavailableService:
        return 'WhatsApp service is temporarily unavailable.';
      default:
        return 'The connection to WhatsApp was lost.';
    }
  }

  /** Called on server startup — reconnects every business that has saved credentials. */
  async reconnectAll() {
    const sessions = await prisma.session.findMany({
      where: { creds: { not: Prisma.DbNull } },
    });

    if (sessions.length === 0) return;
    console.log(`Auto-reconnecting ${sessions.length} WhatsApp session(s)...`);

    for (const session of sessions) {
      this.connectBusiness(session.businessId).catch((err) => {
        console.error(`Failed to reconnect business ${session.businessId}:`, err);
      });
    }
  }

  async connectBusiness(businessId: string): Promise<ConnectionState> {
    // Always start from a clean slate — kill any prior socket/timer first.
    await this.destroySocket(businessId);
    this.setState(businessId, { status: 'CONNECTING', reason: undefined, qr: undefined });

    const { state, saveCreds } = await useDbAuthState(businessId);
    const wasRegistered = Boolean(state.creds?.registered);

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }) as any,
      // Rotate each QR every 30s; Baileys emits a fresh `qr` we forward to the client.
      qrTimeout: 30_000,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', async (update) => {
      // Wrapped so a transient DB/network error never becomes an unhandled
      // rejection that crashes the whole server.
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          console.log(`New QR for business ${businessId}`);
          this.setState(businessId, { status: 'QR_READY', qr, reason: undefined });
        }

        if (connection === 'connecting') {
          // Don't clobber a QR we're already showing.
          if (this.states.get(businessId)?.status !== 'QR_READY') {
            this.setState(businessId, { status: 'CONNECTING' });
          }
        } else if (connection === 'open') {
          console.log(`Connection opened for business ${businessId}`);
          this.reconnectAttempts.delete(businessId);
          this.setState(businessId, { status: 'CONNECTED', qr: undefined, reason: undefined });
          await prisma.session.updateMany({
            where: { businessId },
            data: { status: 'CONNECTED' },
          });
        } else if (connection === 'close') {
          const statusCode = (lastDisconnect?.error as Boom)?.output?.statusCode;
          console.log(`Connection closed for business ${businessId} (code ${statusCode})`);

          await prisma.session.updateMany({
            where: { businessId },
            data: { status: 'DISCONNECTED' },
          });

          await this.handleClose(businessId, statusCode, wasRegistered);
        }
      } catch (err) {
        console.error(`connection.update handler failed for business ${businessId}:`, err);
      }
    });

    sock.ev.on('messages.upsert', async (m) => {
      try {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        const messageText =
          msg.message.conversation || msg.message.extendedTextMessage?.text;

        if (!remoteJid || !messageText) return;

        console.log(`Message for business ${businessId} from ${remoteJid}: ${messageText}`);

        await prisma.messageLog.create({
          data: {
            businessId,
            remoteJid,
            direction: 'INCOMING',
            content: messageText,
            source: 'CUSTOMER',
          },
        });

        const existingContact = await prisma.contact.findUnique({
          where: { businessId_remoteJid: { businessId, remoteJid } },
        });
        const isNewContact = !existingContact;

        const contact = await prisma.contact.upsert({
          where: { businessId_remoteJid: { businessId, remoteJid } },
          update: {},
          create: { businessId, remoteJid },
        });

        if (contact.isAiPaused) {
          console.log(`Skipping AI for paused contact ${remoteJid}`);
          return;
        }

        await this.aiService.handleIncomingMessage(
          businessId,
          remoteJid,
          messageText,
          isNewContact,
          async (replyText, source) => {
            await sock.sendMessage(remoteJid, { text: replyText });
            await prisma.messageLog.create({
              data: {
                businessId,
                remoteJid,
                direction: 'OUTGOING',
                content: replyText,
                source: source || 'SYSTEM',
              },
            });
          },
        );
      } catch (err) {
        console.error(`messages.upsert handler failed for business ${businessId}:`, err);
      }
    });

    this.sessions.set(businessId, sock);

    // Wait for the socket to actually produce something useful (a QR to scan,
    // or a live connection) rather than returning a blind fixed delay. This is
    // what makes the QR appear quickly instead of "taking long".
    await this.waitForQrOrOpen(businessId);
    return this.states.get(businessId) || { status: 'CONNECTING' };
  }

  /** Polls in-memory state until a QR is ready / connection opens / it fails, or ~10s elapse. */
  private async waitForQrOrOpen(businessId: string): Promise<void> {
    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
      const status = this.states.get(businessId)?.status;
      if (status === 'QR_READY' || status === 'CONNECTED' || status === 'FAILED') return;
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
  }

  /** Decides what to do after a socket closes, and records a clear reason. */
  private async handleClose(
    businessId: string,
    statusCode: number | undefined,
    wasRegistered: boolean,
  ) {
    await this.destroySocket(businessId);

    // The credentials are no longer usable — wipe them so the user gets a fresh QR.
    const wipeCreds = async () => {
      await prisma.session.updateMany({
        where: { businessId },
        data: { creds: Prisma.DbNull },
      });
      await prisma.sessionKey.deleteMany({ where: { businessId } });
    };

    switch (statusCode) {
      case DisconnectReason.restartRequired:
        // Expected immediately after a successful QR scan — just reconnect,
        // keeping the freshly saved credentials. Not a failure.
        console.log(`Restart required for business ${businessId}, reconnecting...`);
        this.connectBusiness(businessId).catch((err) =>
          console.error(`Restart reconnect failed for ${businessId}:`, err),
        );
        return;

      case DisconnectReason.loggedOut:
      case DisconnectReason.badSession:
      case DisconnectReason.multideviceMismatch:
        await wipeCreds();
        this.reconnectAttempts.delete(businessId);
        this.setState(businessId, {
          status: 'FAILED',
          qr: undefined,
          reason: this.describeDisconnect(statusCode),
        });
        return;

      case DisconnectReason.connectionReplaced:
      case DisconnectReason.forbidden:
        // Reconnecting would either fight the other session or get refused again.
        this.reconnectAttempts.delete(businessId);
        this.setState(businessId, {
          status: 'FAILED',
          qr: undefined,
          reason: this.describeDisconnect(statusCode),
        });
        return;

      default: {
        // Transient drop (timed out, connection lost/closed, service unavailable).
        if (!wasRegistered) {
          // We were still in the QR phase and nobody scanned in time.
          this.setState(businessId, {
            status: 'FAILED',
            qr: undefined,
            reason: 'The QR code expired before it was scanned. Click retry to generate a new one.',
          });
          return;
        }

        const attempts = (this.reconnectAttempts.get(businessId) || 0) + 1;
        if (attempts > MAX_RECONNECT_ATTEMPTS) {
          this.reconnectAttempts.delete(businessId);
          this.setState(businessId, {
            status: 'FAILED',
            qr: undefined,
            reason: `${this.describeDisconnect(statusCode)} Could not reconnect after several attempts.`,
          });
          return;
        }

        this.reconnectAttempts.set(businessId, attempts);
        const delay = Math.min(attempts * 2000, 10_000);
        console.log(
          `Reconnecting business ${businessId} in ${delay}ms (attempt ${attempts}/${MAX_RECONNECT_ATTEMPTS})`,
        );
        this.setState(businessId, {
          status: 'CONNECTING',
          reason: `${this.describeDisconnect(statusCode)} Reconnecting...`,
        });
        const timer = setTimeout(() => {
          this.reconnectTimers.delete(businessId);
          this.connectBusiness(businessId).catch((err) =>
            console.error(`Reconnect failed for ${businessId}:`, err),
          );
        }, delay);
        this.reconnectTimers.set(businessId, timer);
      }
    }
  }

  /**
   * Returns the current connection state, kicking off a connection attempt if
   * one isn't already running and the business isn't connected.
   */
  async getConnectionState(businessId: string): Promise<ConnectionState> {
    const inMemory = this.states.get(businessId);

    // An attempt is already underway or live (connecting, showing a QR, or open),
    // or a terminal failure is being shown — report it as-is. Never spawn a second
    // socket on top of one of these, and never auto-restart a FAILED state (the
    // user must hit retry so they actually see the reason).
    if (
      inMemory &&
      (inMemory.status === 'CONNECTING' ||
        inMemory.status === 'QR_READY' ||
        inMemory.status === 'CONNECTED' ||
        inMemory.status === 'FAILED')
    ) {
      return inMemory;
    }

    // Nothing running — start a fresh attempt and hand back the result.
    return this.connectBusiness(businessId);
  }

  /** Force a brand-new connection attempt (used by the "Retry" button). */
  async retry(businessId: string): Promise<ConnectionState> {
    this.reconnectAttempts.delete(businessId);
    return this.connectBusiness(businessId);
  }

  async getStatus(businessId: string): Promise<ConnectionState> {
    const inMemory = this.states.get(businessId);
    if (inMemory) return inMemory;

    const session = await prisma.session.findUnique({ where: { businessId } });
    return { status: (session?.status as ConnectionStatus) || 'DISCONNECTED' };
  }

  async sendMessage(businessId: string, remoteJid: string, text: string): Promise<boolean> {
    const sock = this.sessions.get(businessId);
    if (!sock) return false;

    await sock.sendMessage(remoteJid, { text });
    await prisma.messageLog.create({
      data: {
        businessId,
        remoteJid,
        direction: 'OUTGOING',
        content: text,
        source: 'SYSTEM',
      },
    });
    return true;
  }
}

// Singleton — ensures only one set of active sockets per process
export const whatsappService = new WhatsappService();
