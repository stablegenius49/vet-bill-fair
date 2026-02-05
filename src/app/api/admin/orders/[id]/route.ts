import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = (await req.json()) as { status?: string };
    const status = body.status?.trim();

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json({ order });
  } catch (error) {
    console.error("admin/orders/:id", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
