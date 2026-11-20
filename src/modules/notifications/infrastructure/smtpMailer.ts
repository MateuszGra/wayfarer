import nodemailer from 'nodemailer';
import type { Mailer } from '../domain/ports.js';

export interface SmtpSettings {
  readonly host: string;
  readonly port: number;
  readonly user: string;
  readonly password: string;
  /** The sender, e.g. `Wayfarer <noreply@mgrabowski.eu>`. */
  readonly from: string;
}

export function createSmtpMailer(settings: SmtpSettings): Mailer {
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    // Port 465 speaks TLS from the start; 587 upgrades with STARTTLS.
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.password },
  });
  return {
    async send(mail) {
      await transport.sendMail({ from: settings.from, to: mail.to, subject: mail.subject, text: mail.text });
    },
  };
}
