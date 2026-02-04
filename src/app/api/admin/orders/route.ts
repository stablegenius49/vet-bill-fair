import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("admin/orders", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
