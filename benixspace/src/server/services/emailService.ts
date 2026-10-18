import https from 'https';
import nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static resendApiKey = process.env.RESEND_API_KEY;
  private static fromEmail = process.env.EMAIL_FROM || 'BenixSpace <noreply@benix.space>';

  private static smtpHost = process.env.SMTP_HOST;
  private static smtpPort = Number(process.env.SMTP_PORT) || 587;
  private static smtpUser = process.env.SMTP_USER;
  private static smtpPass = process.env.SMTP_PASS;

  /**
   * Sends email via Resend API, SMTP with user & pass, or logs fallback
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    let from = options.from || this.fromEmail;
    if (from.includes('onboarding@resend.dev') || from.includes('onboarding')) {
      from = 'BenixSpace <noreply@benix.space>';
    }
    const { to, subject, html } = options;

    // 1. Try Resend API if key is configured
    if (this.resendApiKey && !this.resendApiKey.startsWith('re_mock') && this.resendApiKey.length > 5) {
      try {
        const resendResult = await this.sendViaResend(from, to, subject, html);
        return { success: true, messageId: resendResult.id };
      } catch (err: any) {
        console.warn('Resend API dispatch failed, trying SMTP fallback:', err.message);
      }
    }

    // 2. Try Standard SMTP Relay if configured with Host, User, and Password
    if (this.smtpHost && this.smtpUser && this.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: this.smtpHost,
          port: this.smtpPort,
          secure: this.smtpPort === 465,
          auth: {
            user: this.smtpUser,
            pass: this.smtpPass
          }
        });

        const info = await transporter.sendMail({
          from,
          to,
          subject,
          html
        });

        console.log(`✅ [SMTP DISPATCH] Sent to ${to} via ${this.smtpHost} (messageId: ${info.messageId})`);
        return { success: true, messageId: info.messageId };
      } catch (smtpErr: any) {
        console.warn('SMTP transport failed:', smtpErr.message);
      }
    }

    // 3. Fallback Logging for Local/Development
    console.log(`\n📧 [EMAIL DISPATCH via LOCAL FALLBACK]`);
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}\n`);

    return { success: true, messageId: `msg_${Date.now()}` };
  }

  private static sendViaResend(
    from: string,
    to: string,
    subject: string,
    html: string
  ): Promise<{ id: string }> {
    return new Promise((resolve, reject) => {
      const payload = JSON.stringify({
        from,
        to: [to],
        subject,
        html
      });

      const req = https.request(
        {
          hostname: 'api.resend.com',
          path: '/emails',
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.resendApiKey}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (c) => (body += c));
          res.on('end', () => {
            try {
              const parsed = JSON.parse(body);
              if (parsed.id) {
                resolve(parsed);
              } else {
                reject(new Error(parsed.message || 'Resend API error'));
              }
            } catch (e) {
              reject(e);
            }
          });
        }
      );

      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }
}
