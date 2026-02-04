import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orderId?: string;
      key?: string;
      contentType?: string;
      size?: number;
    };

    const { orderId, key, contentType, size } = body;

    if (!orderId || !key || !contentType || typeof size !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!key.startsWith(`orders/${orderId}/`)) {
      return NextResponse.json({ error: "Invalid key" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        uploadKey: key,
        uploadMime: contentType,
        uploadSize: size,
        status: "uploaded",
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (error) {
    console.error("order/attach-upload", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
