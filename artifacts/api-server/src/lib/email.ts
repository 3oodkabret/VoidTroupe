import { Resend } from "resend";
import { logger } from "./logger";

type SendPasswordResetEmailInput = {
  to: string;
  name: string;
  resetUrl: string;
};

function getAppUrl(): string {
  return (process.env["APP_URL"] ?? "http://localhost:5173").replace(/\/$/, "");
}

function getResendConfig(): { apiKey: string; from: string } | null {
  const apiKey = process.env["RESEND_API_KEY"]?.trim();
  const from = process.env["EMAIL_FROM"]?.trim();

  if (!apiKey || !from) {
    return null;
  }

  return { apiKey, from };
}

export function buildPasswordResetUrl(token: string): string {
  return `${getAppUrl()}/reset-password?token=${encodeURIComponent(token)}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function buildResetEmailHtml(name: string, resetUrl: string): string {
  const safeName = escapeHtml(name);
  const safeResetUrl = escapeHtml(resetUrl);

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Reset your Void Troupe password</title>
  </head>
  <body style="margin:0;padding:0;background:#09090b;color:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09090b;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111114;border:1px solid rgba(168,85,247,0.35);border-radius:24px;overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 16px;text-align:center;background:radial-gradient(circle at top, rgba(168,85,247,0.18), rgba(17,17,20,0));">
                <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.24em;text-transform:uppercase;color:#c4b5fd;">Void Troupe</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#ffffff;">Reset your password</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 0;color:#d4d4d8;font-size:16px;line-height:1.7;">
                <p style="margin:0 0 16px;">Hi ${safeName},</p>
                <p style="margin:0 0 16px;">
                  We received a request to reset your password. Click the button below to choose a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:24px 32px 8px;">
                <a
                  href="${safeResetUrl}"
                  style="display:inline-block;padding:14px 28px;background:#a855f7;color:#09090b;text-decoration:none;border-radius:999px;font-size:16px;font-weight:700;"
                >
                  Reset Password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:8px 32px 24px;color:#a1a1aa;font-size:14px;line-height:1.7;">
                <p style="margin:0 0 12px;">This link expires in 1 hour.</p>
                <p style="margin:0 0 12px;">If the button does not work, copy and paste this URL into your browser:</p>
                <p style="margin:0;word-break:break-all;">
                  <a href="${safeResetUrl}" style="color:#c4b5fd;text-decoration:underline;">${safeResetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 32px;color:#71717a;font-size:13px;line-height:1.6;">
                If you did not request a password reset, you can safely ignore this email.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `.trim();
}

async function sendViaResend(input: SendPasswordResetEmailInput): Promise<boolean> {
  const config = getResendConfig();
  if (!config) {
    return false;
  }

  const resend = new Resend(config.apiKey);
  const { error } = await resend.emails.send({
    from: config.from,
    to: [input.to],
    subject: "Reset your Void Troupe password",
    html: buildResetEmailHtml(input.name, input.resetUrl),
  });

  if (error) {
    throw new Error(`Resend email failed: ${error.message}`);
  }

  return true;
}

async function sendViaSmtp(input: SendPasswordResetEmailInput): Promise<boolean> {
  const host = process.env["SMTP_HOST"]?.trim();
  const user = process.env["SMTP_USER"]?.trim();
  const pass = process.env["SMTP_PASS"]?.trim();
  const from = process.env["EMAIL_FROM"]?.trim() ?? user;
  const port = Number(process.env["SMTP_PORT"] ?? "587");

  if (!host || !user || !pass || !from) {
    return false;
  }

  const nodemailer = await import("nodemailer");
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: "Reset your Void Troupe password",
    html: buildResetEmailHtml(input.name, input.resetUrl),
  });

  return true;
}

export async function sendPasswordResetEmail(input: SendPasswordResetEmailInput): Promise<void> {
  if (await sendViaResend(input)) {
    logger.info({ to: input.to }, "Password reset email sent via Resend");
    return;
  }

  if (await sendViaSmtp(input)) {
    logger.info({ to: input.to }, "Password reset email sent via SMTP");
    return;
  }

  if (process.env["NODE_ENV"] !== "production") {
    logger.warn(
      { to: input.to, resetUrl: input.resetUrl },
      "Email provider not configured. Password reset link logged for local development.",
    );
    console.log("\n[DEV PASSWORD RESET LINK]");
    console.log(input.resetUrl);
    console.log("[END DEV PASSWORD RESET LINK]\n");
    return;
  }

  throw new Error(
    "Email service is not configured. Set RESEND_API_KEY + EMAIL_FROM or SMTP_HOST/SMTP_USER/SMTP_PASS.",
  );
}
