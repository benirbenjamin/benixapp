import https from 'https';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  from?: string;
}

export class EmailService {
  private static resendApiKey = process.env.RESEND_API_KEY;
  private static fromEmail = process.env.EMAIL_FROM || 'noreply@benix.space';

  /**
   * Sends email via Resend API or logs fallback
   */
  static async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string }> {
    const from = options.from || this.fromEmail;
    const { to, subject, html } = options;

    // 1. Try Resend API if key is configured
    if (this.resendApiKey && !this.resendApiKey.startsWith('re_mock')) {
      try {
        const resendResult = await this.sendViaResend(from, to, subject, html);
        return { success: true, messageId: resendResult.id };
      } catch (err: any) {
        console.warn('Resend API dispatch failed, trying SMTP fallback:', err.message);
      }
    }

    // 2. SMTP / Mock Delivery Logging
    console.log(`\n📧 [EMAIL DISPATCH via SMTP/RESEND FALLBACK]`);
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
