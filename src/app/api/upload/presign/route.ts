import { NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import prisma from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { getR2Client } from "@/lib/r2";
import crypto from "crypto";

export const runtime = "nodejs";

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

function sanitizeFilename(name: string) {
  const cleaned = name.replace(/[^a-zA-Z0-9._-]/g, "-");
  return cleaned.length > 0 ? cleaned.slice(0, 64) : "upload";
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      orderId?: string;
      filename?: string;
      contentType?: string;
      size?: number;
      turnstileToken?: string;
    };

    const { orderId, filename, contentType, size, turnstileToken } = body;

    if (
      !orderId ||
      !filename ||
      !contentType ||
      typeof size !== "number" ||
      !turnstileToken
    ) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(contentType)) {
      return NextResponse.json({ error: "Unsupported file type" }, { status: 400 });
    }

    if (size <= 0 || size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: "File too large" }, { status: 400 });
    }

    const forwardedFor = req.headers.get("x-forwarded-for");
    const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";

    const rate = checkRateLimit(`presign:${ip}`);
    if (!rate.allowed) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const turnstile = await verifyTurnstile(turnstileToken, ip);
    if (!turnstile.success) {
      return NextResponse.json({ error: "Turnstile failed" }, { status: 403 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const bucket = process.env.R2_BUCKET_NAME;
    if (!bucket) {
      return NextResponse.json({ error: "Missing R2 bucket" }, { status: 500 });
    }

    const key = `orders/${orderId}/${crypto.randomUUID()}-${sanitizeFilename(
      filename
    )}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: contentType,
      ContentLength: size,
    });

    const uploadUrl = await getSignedUrl(getR2Client(), command, {
      expiresIn: 60 * 5,
    });

    return NextResponse.json({ key, uploadUrl });
  } catch (error) {
    console.error("upload/presign", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
