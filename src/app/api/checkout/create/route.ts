import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { orderId?: string };
    const orderId = body.orderId;

    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const priceId = process.env.STRIPE_PRICE_ID;
    const appUrl = process.env.APP_URL;

    if (!priceId || !appUrl) {
      return NextResponse.json({ error: "Missing Stripe config" }, { status: 500 });
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: order.email,
      metadata: { orderId },
      success_url: `${appUrl}/success?orderId=${orderId}`,
      cancel_url: `${appUrl}/upload?orderId=${orderId}`,
    });

    if (!session.url) {
      return NextResponse.json({ error: "Missing checkout url" }, { status: 500 });
    }

    await prisma.order.update({
      where: { id: orderId },
      data: {
        stripeSessionId: session.id,
        status: "checkout_created",
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("checkout/create", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
