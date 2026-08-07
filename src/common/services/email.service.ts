import { BrevoClient, BrevoError } from '@getbrevo/brevo';
import {
  BREVO_API_KEY,
  EMAIL_FROM,
  EMAIL_FROM_NAME,
  OTP_EXPIRES_IN_MINUTES,
} from '../../config/config';
import { ServiceUnavailableException } from '../exceptions';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Reusable branded layout. Inline styles only — most email clients ignore
// <style> blocks, so everything is inlined per-element.
const emailLayout = (body: string): string => `
  <div style="margin:0;padding:0;background-color:#f4f5f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;">
            <!-- Brand header -->
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <span style="font-size:22px;font-weight:700;color:#111827;letter-spacing:0.5px;">Shop<b style="color:#14b8a6;">Space</b></span>
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background-color:#ffffff;border-radius:12px;padding:32px 28px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
                ${body}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding-top:24px;font-size:12px;color:#9ca3af;line-height:18px;">
                If you didn't request this, you can safely ignore this email.<br/>
                © ${new Date().getFullYear()} ShopSpace. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </div>
`;

const otpCodeBox = (otpCode: string): string => `
  <p style="margin:0 0 8px;font-size:14px;color:#374151;">Your verification code is:</p>
  <div style="margin:0 0 24px;padding:16px;background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:8px;text-align:center;">
    <span style="font-size:32px;font-weight:700;color:#0f766e;letter-spacing:8px;">${otpCode}</span>
  </div>
  <p style="margin:0;font-size:13px;color:#6b7280;line-height:20px;">
    This code expires in <b>${OTP_EXPIRES_IN_MINUTES} minutes</b>. For your security, never share it with anyone.
  </p>
`;

// Single place responsible for sending transactional emails
// (OTP codes, password-reset links, etc.) via Brevo.
class EmailService {
  private brevo: BrevoClient;

  constructor() {
    this.brevo = new BrevoClient({
      apiKey: BREVO_API_KEY,
    });
  }

  async send({ to, subject, html }: SendEmailOptions): Promise<void> {
    try {
      await this.brevo.transactionalEmails.sendTransacEmail({
        sender: {
          email: EMAIL_FROM,
          name: EMAIL_FROM_NAME,
        },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      });
    } catch (error) {
      if (error instanceof BrevoError) {
        console.error('Brevo email API error', {
          statusCode: error.statusCode,
          message: error.message,
          body: error.body,
        });
      } else {
        console.error('Unexpected Brevo email error', error);
      }

      throw new ServiceUnavailableException('Email delivery failed. Please try again later.', error);
    }
  }

  async sendOtpEmail(to: string, otpCode: string, purpose: 'verify_account' | 'reset_password'): Promise<void> {
    const isVerify = purpose === 'verify_account';

    const subject = isVerify
      ? 'Verify your ShopSpace account'
      : 'Reset your ShopSpace password';

    const title = isVerify
      ? 'Welcome to ShopSpace 👋'
      : 'Password reset request';

    const body = `
      <h1 style="margin:0 0 16px;font-size:20px;color:#111827;line-height:1.3;">${title}</h1>
      <p style="margin:0 0 24px;font-size:14px;color:#374151;line-height:1.6;">
        ${isVerify
          ? 'You are one step away from activating your account. Enter the code below to complete your registration:'
          : 'We received a request to reset your password. Enter the code below to set a new one:'}
      </p>
      ${otpCodeBox(otpCode)}
    `;

    await this.send({ to, subject, html: emailLayout(body) });
  }
}

export const emailService = new EmailService();
