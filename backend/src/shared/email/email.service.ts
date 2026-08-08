import { Resend } from 'resend';
import pino from 'pino';

const logger = pino({ name: 'email-service' });

let resendClient: Resend | null = null;

function getClient(apiKey: string): Resend {
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export interface SendVerificationEmailParams {
  to: string;
  code: string;
  apiKey: string;
  from: string;
}

export async function sendVerificationEmail({ to, code, apiKey, from }: SendVerificationEmailParams): Promise<boolean> {
  const client = getClient(apiKey);

  try {
    const { error } = await client.emails.send({
      from,
      to,
      subject: 'Código de verificação - Workspace',
      html: `
        <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 24px;">
          <h2 style="color: #1a1a1a; margin-bottom: 16px;">Verificação de email</h2>
          <p style="color: #4a4a4a; margin-bottom: 24px;">
            Use o código abaixo para verificar seu email no Workspace:
          </p>
          <div style="background: #f4f4f5; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 6px; color: #1a1a1a;">${code}</span>
          </div>
          <p style="color: #71717a; font-size: 14px;">
            Este código expira em 15 minutos. Se você não solicitou, ignore este email.
          </p>
        </div>
      `,
    });

    if (error) {
      logger.error({ err: error, to }, 'Failed to send verification email');
      return false;
    }

    logger.info({ to }, 'Verification email sent');
    return true;
  } catch (error) {
    logger.error({ err: error, to }, 'Failed to send verification email');
    return false;
  }
}
