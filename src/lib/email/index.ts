import { Resend } from "resend";

// Lazy initialize Resend client
let resend: Resend | null = null;

function getResendClient(): Resend | null {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

// Email sender configuration
const FROM_EMAIL = process.env.EMAIL_FROM || "JTF翻訳祭2026 <noreply@jtf.jp>";
const REPLY_TO = process.env.EMAIL_REPLY_TO || "info@jtf.jp";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}

/**
 * Send an email using Resend
 */
export async function sendEmail(options: SendEmailOptions) {
  const { to, subject, html, text, replyTo = REPLY_TO } = options;

  // Check if Resend is configured
  const client = getResendClient();
  if (!client) {
    console.warn("[Email] RESEND_API_KEY not configured. Email not sent.");
    console.log("[Email] Would send to:", to);
    console.log("[Email] Subject:", subject);
    return { success: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    const { data, error } = await client.emails.send({
      from: FROM_EMAIL,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
      text,
      replyTo,
    });

    if (error) {
      console.error("[Email] Send error:", error);
      return { success: false, error: error.message };
    }

    console.log("[Email] Sent successfully:", data?.id);
    return { success: true, id: data?.id };
  } catch (error) {
    console.error("[Email] Unexpected error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export * from "./templates";
