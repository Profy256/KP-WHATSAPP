import makeWASocket, { DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import { Boom } from '@hapi/boom';
import { Prisma } from '@prisma/client';
import { prisma } from '../prisma';
import { AiService } from './ai.service';
import { useDbAuthState } from '../auth/db-auth-state';
import { businessCache, aiConfigCache } from '../cache';

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'QR_READY'
  | 'PAIRING_CODE_READY'
  | 'CONNECTED'
  | 'FAILED';

export interface ConnectionState {
  status: ConnectionStatus;
  /** Human-readable explanation, shown to the user on failure. */
  reason?: string;
  qr?: string;
  /** 8-char code the user types into WhatsApp ("Link with phone number"). */
  pairingCode?: string;
}

// How many times we retry a *transient* drop (connection lost, service
// unavailable) before giving up and reporting FAILED.
const MAX_RECONNECT_ATTEMPTS = 5;

// Grace period after a customer message before the bot replies. If the owner
// reads or answers the chat within this window, the auto-reply is cancelled.
const AUTO_REPLY_DELAY_MS = 20_000;

export class WhatsappService {
  private sessions: Map<string, ReturnType<typeof makeWASocket>> = new Map();
  private states: Map<string, ConnectionState> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private reconnectTimers: Map<string, NodeJS.Timeout> = new Map();
  // Tracks the most recent in-flight credential write per business so the
  // post-scan restart can flush it before reloading creds from the DB.
  private credsSaves: Map<string, Promise<void>> = new Map();
  // Auto-replies are deferred so the owner gets first crack at the chat.
  // Keyed by `${businessId}:${remoteJid}`; cancelled if the owner reads or
  // replies within the grace window. See scheduleAutoReply().
  private pendingReplies: Map<string, NodeJS.Timeout> = new Map();
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
        existing.ev.removeAllListeners('chats.update');
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
    // Drop any auto-replies queued against the socket we're tearing down.
    for (const [key, pending] of this.pendingReplies) {
      if (key.startsWith(`${businessId}:`)) {
        clearTimeout(pending);
        this.pendingReplies.delete(key);
      }
    }
  }

  /**
   * Pulls plain text out of an inbound Baileys message, unwrapping the
   * containers WhatsApp now routinely uses (disappearing/ephemeral messages,
   * view-once, document-with-caption). Without this, anything but a bare
   * `conversation`/`extendedTextMessage` silently yields no text — and no reply.
   */
  private extractText(message: any): string | undefined {
    if (!message) return undefined;

    // Unwrap the common "envelope" message types, then re-read the inner content.
    const inner =
      message.ephemeralMessage?.message ||
      message.viewOnceMessage?.message ||
      message.viewOnceMessageV2?.message ||
      message.viewOnceMessageV2Extension?.message ||
      message.documentWithCaptionMessage?.message ||
      message.editedMessage?.message;
    if (inner) return this.extractText(inner);

    return (
      message.conversation ||
      message.extendedTextMessage?.text ||
      message.imageMessage?.caption ||
      message.videoMessage?.caption ||
      message.buttonsResponseMessage?.selectedDisplayText ||
      message.listResponseMessage?.title ||
      message.templateButtonReplyMessage?.selectedDisplayText ||
      undefined
    );
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

    // Reconnecting every session at once is a thundering herd: a simultaneous
    // socket-open + history-sync storm against WhatsApp and a burst of DB
    // writes. Reconnect in small batches with a gap between them so boot load
    // stays flat as the number of sessions grows.
    const batchSize = Number(process.env.RECONNECT_BATCH_SIZE) || 5;
    const batchDelayMs = Number(process.env.RECONNECT_BATCH_DELAY_MS) || 3000;

    for (let i = 0; i < sessions.length; i += batchSize) {
      const batch = sessions.slice(i, i + batchSize);
      for (const session of batch) {
        this.connectBusiness(session.businessId).catch((err) => {
          console.error(`Failed to reconnect business ${session.businessId}:`, err);
        });
      }
      if (i + batchSize < sessions.length) {
        await new Promise((resolve) => setTimeout(resolve, batchDelayMs));
      }
    }
  }

  /**
   * Opens a WhatsApp connection for a business.
   *
   * Default (no `pairingPhone`) shows a QR to scan. If `pairingPhone` is given
   * (digits, international format) and the business isn't already registered, we
   * request an 8-char pairing code instead — the "Link with phone number" flow,
   * which sidesteps QR camera/rotation/stale-ref problems entirely.
   */
  async connectBusiness(businessId: string, pairingPhone?: string): Promise<ConnectionState> {
    // Always start from a clean slate — kill any prior socket/timer first.
    await this.destroySocket(businessId);
    this.setState(businessId, {
      status: 'CONNECTING',
      reason: undefined,
      qr: undefined,
      pairingCode: undefined,
    });

    const { state, saveCreds } = await useDbAuthState(businessId);
    const wasRegistered = Boolean(state.creds?.registered);

    // Pairing-code mode: we request the code the moment Baileys signals the
    // socket is ready (its first `qr` event — which only fires once the noise
    // handshake is complete and it can actually send). Requesting any earlier
    // throws "Connection Closed" (428). This flag fires that request once.
    let pairingCodeRequested = false;

    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: 'silent' }) as any,
      // Keep each QR ref valid for 60s (Baileys' default) rather than 30s. The
      // refs are single-use and rotate; a short life meant a user who scanned a
      // ref a moment after it rotated hit a code WhatsApp had already retired,
      // so the phone said "keep scanning" and pairing never started (408). A
      // longer life — paired with the dashboard showing only the freshest ref —
      // gives the scan a much wider window to land on a live code.
      qrTimeout: 60_000,
    });

    // Record each credential write so other paths (notably the 515 restart
    // right after a QR scan) can await the latest persistence before reloading
    // creds from the DB. The promise is stored synchronously, before any await,
    // so it's guaranteed visible to the `connection: 'close'` handler that
    // Baileys emits immediately after `creds.update`.
    sock.ev.on('creds.update', () => {
      const p = saveCreds().catch((err) => {
        console.error(`Failed to persist credentials for business ${businessId}:`, err);
      });
      this.credsSaves.set(businessId, p);
      return p;
    });

    sock.ev.on('connection.update', async (update) => {
      // Wrapped so a transient DB/network error never becomes an unhandled
      // rejection that crashes the whole server.
      try {
        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          if (pairingPhone) {
            // Pairing-code mode: the socket is now ready to send. Request the
            // 8-char code once instead of showing the QR.
            if (!pairingCodeRequested) {
              pairingCodeRequested = true;
              this.generatePairingCode(businessId, sock, pairingPhone).catch((err) =>
                console.error(`generatePairingCode failed for ${businessId}:`, err),
              );
            }
          } else {
            console.log(`New QR for business ${businessId}`);
            this.setState(businessId, { status: 'QR_READY', qr, reason: undefined });
          }
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
        // 'notify' = genuinely new messages. 'append'/'prepend' are history
        // sync on (re)connect — replying to those would spam old chats.
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (!msg.message) continue;

          const remoteJid = msg.key.remoteJid;
          // Skip groups, status broadcasts and newsletters — auto-reply is 1:1.
          if (!remoteJid || remoteJid === 'status@broadcast' || remoteJid.endsWith('@g.us') || remoteJid.endsWith('@newsletter')) {
            continue;
          }

          // The owner replied (from the phone or another linked device) — they're
          // handling this chat, so drop any auto-reply we had queued for it.
          if (msg.key.fromMe) {
            this.cancelPendingReply(businessId, remoteJid, 'owner replied');
            continue;
          }

          const messageText = this.extractText(msg.message);
          if (!messageText) {
            console.log(
              `No text extracted for business ${businessId} from ${remoteJid} (type: ${Object.keys(msg.message).join(',')})`,
            );
            continue;
          }

          await this.handleInboundText(businessId, remoteJid, messageText, msg.key.id || `${Date.now()}`);
        }
      } catch (err) {
        console.error(`messages.upsert handler failed for business ${businessId}:`, err);
      }
    });

    // When the owner opens/reads a chat on their phone, WhatsApp syncs the
    // read state to this linked device as a chat update with unreadCount 0.
    // Treat that as "the owner has seen it" and cancel the queued auto-reply.
    sock.ev.on('chats.update', (updates) => {
      for (const u of updates) {
        if (u.id && u.unreadCount === 0) {
          this.cancelPendingReply(businessId, u.id, 'owner read the chat');
        }
      }
    });

    this.sessions.set(businessId, sock);

    // Wait for the socket to actually produce something useful (a QR, a pairing
    // code, or a live connection) rather than returning a blind fixed delay.
    // In pairing-code mode the code is requested from the `qr` event above.
    await this.waitForQrOrOpen(businessId);
    return this.states.get(businessId) || { status: 'CONNECTING' };
  }

  /**
   * Requests an 8-char pairing code and stores it in state for the dashboard.
   * Called from the `qr` event, so the socket is already past its handshake and
   * able to send — but the link can still drop mid-request (WhatsApp throttles
   * device-linking after repeated attempts), so we retry a few times.
   */
  private async generatePairingCode(
    businessId: string,
    sock: ReturnType<typeof makeWASocket>,
    pairingPhone: string,
  ) {
    const digits = pairingPhone.replace(/\D/g, '');
    if (digits.length < 8) {
      this.setState(businessId, {
        status: 'FAILED',
        reason: 'That phone number looks too short. Include the country code, e.g. 256700123456.',
      });
      return;
    }

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const code = await sock.requestPairingCode(digits);
        const pretty = code.length === 8 ? `${code.slice(0, 4)}-${code.slice(4)}` : code;
        console.log(`Pairing code for business ${businessId}: ${pretty}`);
        this.setState(businessId, {
          status: 'PAIRING_CODE_READY',
          pairingCode: pretty,
          qr: undefined,
          reason: undefined,
        });
        return;
      } catch (err) {
        console.error(`requestPairingCode attempt ${attempt}/3 failed for ${businessId}:`, err);
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500));
      }
    }

    this.setState(businessId, {
      status: 'FAILED',
      reason: 'WhatsApp would not issue a pairing code right now. This usually means too many recent link attempts — wait about 15 minutes and try again, or use the QR code.',
    });
  }

  /** Logs an inbound customer message and queues a (deferred) auto-reply. */
  private async handleInboundText(
    businessId: string,
    remoteJid: string,
    messageText: string,
    messageId: string,
  ) {
    try {
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

      const business = await businessCache.getOrLoad(businessId, () =>
        prisma.business.findUnique({ where: { id: businessId } }),
      );
      const isAiPackage =
        business?.selectedPackage === 'AI_AUTOMATION' || business?.selectedPackage === 'FULL';

      // AI and keyword modes evaluate every message individually. The no-AI /
      // no-keyword case sends an identical canned reply, so collapse a burst to
      // one reply per contact (per grace window) to avoid spamming.
      const config = await aiConfigCache.getOrLoad(businessId, () =>
        prisma.aiConfig.findUnique({ where: { businessId } }),
      );
      const hasKeywords =
        Array.isArray(config?.rules) && (config!.rules as unknown[]).length > 0;
      const perMessage = isAiPackage || hasKeywords;

      // Don't reply right away — give the owner the grace window to handle it.
      this.scheduleAutoReply(
        businessId,
        remoteJid,
        messageText,
        isNewContact,
        isAiPackage,
        perMessage,
        messageId,
      );
    } catch (err) {
      console.error(`handleInboundText failed for business ${businessId}:`, err);
    }
  }

  /**
   * Queues an auto-reply to fire after AUTO_REPLY_DELAY_MS, cancelled if the
   * owner reads the chat or replies first (see cancelPendingReply).
   *
   * When `perMessage` (AI packages, or no-AI with keywords), each message
   * queues its own reply so every unseen message is evaluated. Otherwise
   * (no-AI with no keywords → identical canned reply) at most one reply is
   * queued per contact, honouring the first message's `isNewContact`.
   */
  private scheduleAutoReply(
    businessId: string,
    remoteJid: string,
    messageText: string,
    isNewContact: boolean,
    allowAi: boolean,
    perMessage: boolean,
    messageId: string,
  ) {
    const contactPrefix = `${businessId}:${remoteJid}`;
    // Deduped mode: one reply per contact — bail if one is already queued.
    if (!perMessage && this.pendingReplies.has(contactPrefix)) return;
    // Per-message mode: a message-scoped key lets several replies queue per contact.
    const key = perMessage ? `${contactPrefix}:${messageId}` : contactPrefix;

    const timer = setTimeout(async () => {
      this.pendingReplies.delete(key);
      try {
        await this.aiService.handleIncomingMessage(
          businessId,
          remoteJid,
          messageText,
          isNewContact,
          allowAi,
          async (replyText, source) => {
            // Resolve the live socket at send time — a reconnect may have
            // replaced the one that received the message.
            const sock = this.sessions.get(businessId);
            if (!sock) {
              console.log(`No live socket for business ${businessId}; dropping auto-reply to ${remoteJid}`);
              return;
            }
            console.log(`Auto-reply (${source}) for business ${businessId} -> ${remoteJid}: ${replyText}`);
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
        console.error(`Auto-reply failed for business ${businessId} -> ${remoteJid}:`, err);
      }
    }, AUTO_REPLY_DELAY_MS);

    this.pendingReplies.set(key, timer);
    console.log(
      `Auto-reply for ${remoteJid} queued in ${AUTO_REPLY_DELAY_MS}ms (cancels if owner reads/replies)`,
    );
  }

  /**
   * Cancels every queued auto-reply for a contact because the owner is handling
   * the chat. Matches both the WhatsApp-bot key (`${biz}:${jid}`) and the AI
   * per-message keys (`${biz}:${jid}:${msgId}`).
   */
  private cancelPendingReply(businessId: string, remoteJid: string, reason: string) {
    const exact = `${businessId}:${remoteJid}`;
    const perMessagePrefix = `${exact}:`;
    let cancelled = 0;
    for (const [key, timer] of this.pendingReplies) {
      if (key === exact || key.startsWith(perMessagePrefix)) {
        clearTimeout(timer);
        this.pendingReplies.delete(key);
        cancelled++;
      }
    }
    if (cancelled > 0) {
      console.log(`Cancelled ${cancelled} queued auto-reply(ies) for ${remoteJid} (${reason})`);
    }
  }

  /** Polls in-memory state until something useful is ready (QR / pairing code / open / failed), or ~15s elapse. */
  private async waitForQrOrOpen(businessId: string): Promise<void> {
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      const status = this.states.get(businessId)?.status;
      if (
        status === 'QR_READY' ||
        status === 'PAIRING_CODE_READY' ||
        status === 'CONNECTED' ||
        status === 'FAILED'
      ) {
        return;
      }
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
        //
        // The pairing `creds.update` fires moments before this close, but its
        // DB write is async. We MUST let it finish before reconnecting, or
        // `connectBusiness` reloads the stale pre-pairing creds (registered:
        // false), shows a fresh QR, and the phone "fails to connect after
        // scanning". Flush the pending write first.
        console.log(`Restart required for business ${businessId}, reconnecting...`);
        await this.credsSaves.get(businessId)?.catch(() => {});
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
        inMemory.status === 'PAIRING_CODE_READY' ||
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

  /**
   * Start linking via the "Link with phone number" flow: a fresh connection
   * that requests an 8-char pairing code for `phoneNumber` instead of a QR.
   */
  async startPairingCode(businessId: string, phoneNumber: string): Promise<ConnectionState> {
    this.reconnectAttempts.delete(businessId);
    return this.connectBusiness(businessId, phoneNumber);
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
