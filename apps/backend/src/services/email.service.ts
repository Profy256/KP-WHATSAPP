import { Resend } from 'resend';

export class EmailService {
  private resend: Resend;
  private from: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.from = process.env.RESEND_FROM || 'KP WhatsApp Automation <noreply@yourdomain.com>';
  }

  async sendWelcomeEmail(to: string, name?: string) {
    if (!process.env.RESEND_API_KEY) return;

    const displayName = name || to.split('@')[0];

    await this.resend.emails.send({
      from: this.from,
      to,
      subject: 'Welcome to KP WhatsApp Automation',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #0f0f1a; color: #e2e8f0;">
          <h1 style="font-size: 28px; font-weight: 700; margin-bottom: 8px; color: #ffffff;">
            Welcome to <span style="color: #5254f8;">KP WhatsApp Automation</span>
          </h1>
          <p style="color: #94a3b8; margin-bottom: 24px;">Hi ${displayName}, your account is ready.</p>

          <div style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 24px; margin-bottom: 24px;">
            <h2 style="font-size: 16px; font-weight: 600; margin-bottom: 16px; color: #ffffff;">Get started in 3 steps</h2>
            <ol style="color: #94a3b8; padding-left: 20px; line-height: 1.8;">
              <li>Connect your WhatsApp by scanning the QR code on the dashboard.</li>
              <li>Configure your AI assistant with your business context and pricing rules.</li>
              <li>Watch the inbox — your AI will start handling customers automatically.</li>
            </ol>
          </div>

          <p style="color: #64748b; font-size: 13px; margin-top: 32px;">
            If you did not create this account, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  }
}
