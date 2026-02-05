import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { getR2Client } from "@/lib/r2";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isAdminRequest(req)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const order = await prisma.order.findUnique({ where: { id } });

    if (!order || !order.uploadKey) {
      return NextResponse.json({ error: "Upload not found" }, { status: 404 });
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ error: "Missing R2 bucket" }, { status: 500 });
    }

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: order.uploadKey,
    });

    const url = await getSignedUrl(getR2Client(), command, {
      expiresIn: 60 * 10,
    });

    return NextResponse.json({ url });
  } catch (error) {
    console.error("admin/orders/:id/invoice-url", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
