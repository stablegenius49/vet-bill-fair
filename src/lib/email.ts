import { Resend } from "resend";

let resend: Resend | null = null;

export function getResendClient() {
  if (resend) return resend;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Missing RESEND_API_KEY");

  resend = new Resend(apiKey);
  return resend;
}

export function getEmailFrom() {
  const from = process.env.EMAIL_FROM;
  if (!from) throw new Error("Missing EMAIL_FROM");
  return from;
}

export function getEmailReplyTo() {
  return process.env.EMAIL_REPLY_TO || undefined;
}

export function buildPaymentReceivedEmail(params: {
  appUrl: string;
  orderId: string;
}) {
  const { appUrl, orderId } = params;

  const subject = "Payment received — Vet Bill Fairness Report";

  const text = `We received your payment and invoice.\n\nWhat happens next:\n- We review your invoice and generate a plain-English breakdown\n- You’ll receive your report within 12–24 hours\n\nIf you want a more accurate interpretation, reply with:\n- Your ZIP code (optional)\n- Whether this was routine vs emergency\n\nOrder ID: ${orderId}\n\nThanks,\nVet Bill Fair\n${appUrl}`;

  return { subject, text };
}
