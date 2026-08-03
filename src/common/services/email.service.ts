import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../../config/config';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Single place responsible for sending transactional emails
// (OTP codes, password-reset links, etc.) via Gmail SMTP.
class EmailService {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true for port 465, false for 587
      auth: {
        user: config.email.user,
        pass: config.email.pass, // Gmail App Password, not the real account password
      },
    });
  }

  async send({ to, subject, html }: SendEmailOptions): Promise<void> {
    await this.transporter.sendMail({
      from: config.email.from,
      to,
      subject,
      html,
    });
  }

  async sendOtpEmail(to: string, otpCode: string, purpose: 'verify_account' | 'reset_password'): Promise<void> {
    const subject =
      purpose === 'verify_account' ? 'Verify your ShopSpace account' : 'Reset your ShopSpace password';

    const html = `
      <div style="font-family: sans-serif; max-width: 480px; margin: auto;">
        <h2>ShopSpace</h2>
        <p>Your verification code is:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${otpCode}</p>
        <p>This code expires in ${config.otp.expiresInMinutes} minutes. If you didn't request this, you can ignore this email.</p>
      </div>
    `;

    await this.send({ to, subject, html });
  }
}

export const emailService = new EmailService();
