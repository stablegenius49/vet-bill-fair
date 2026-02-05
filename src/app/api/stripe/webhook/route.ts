import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import prisma from "@/lib/prisma";
import Stripe from "stripe";
import { buildPaymentReceivedEmail, getEmailFrom, getEmailReplyTo, getResendClient } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const stripe = getStripeClient();
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    console.error("stripe/webhook verify", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;

      if (orderId) {
        const order = await prisma.order.update({
          where: { id: orderId },
          data: {
            status: "paid",
            stripeSessionId: session.id,
            stripePaymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id,
          },
        });

        // Send confirmation email once (idempotent).
        if (!order.confirmationEmailSentAt) {
          try {
            const resend = getResendClient();
            const from = getEmailFrom();
            const replyTo = getEmailReplyTo();
            const appUrl = process.env.APP_URL || "";

            const { subject, text } = buildPaymentReceivedEmail({
              appUrl,
              orderId: order.id,
            });

            const sent = await resend.emails.send({
              from,
              to: order.email,
              subject,
              text,
              replyTo,
            });

            await prisma.order.update({
              where: { id: order.id },
              data: {
                confirmationEmailId: sent.data?.id ?? null,
                confirmationEmailSentAt: new Date(),
              },
            });
          } catch (err) {
            // Don't fail the webhook if email fails; log and continue.
            console.error("stripe/webhook email", err);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("stripe/webhook handler", error);
    return NextResponse.json({ error: "Webhook error" }, { status: 500 });
  }
}
