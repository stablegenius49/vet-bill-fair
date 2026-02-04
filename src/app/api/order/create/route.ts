import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      email?: string;
      petName?: string;
      notes?: string;
    };

    const email = body.email?.trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Valid email required" }, { status: 400 });
    }

    const order = await prisma.order.create({
      data: {
        email,
        petName: body.petName?.trim() || null,
        notes: body.notes?.trim() || null,
        status: "created",
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("order/create", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
