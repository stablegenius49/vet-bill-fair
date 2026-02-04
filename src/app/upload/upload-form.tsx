"use client";

import { useEffect, useMemo, useState } from "react";
import styles from "./upload.module.css";
import { useSearchParams } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    onTurnstileCallback?: (token: string) => void;
  }
}

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export default function UploadForm() {
  const searchParams = useSearchParams();
  const existingOrderId = searchParams.get("orderId");

  const [email, setEmail] = useState("");
  const [petName, setPetName] = useState("");
  const [notes, setNotes] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    window.onTurnstileCallback = (token: string) => {
      setTurnstileToken(token);
    };
  }, []);

  const fileInfo = useMemo(() => {
    if (!file) return "No file selected";
    return `${file.name} (${Math.round(file.size / 1024)} KB)`;
  }, [file]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);

    if (!file) {
      setMessage("Please select a file.");
      return;
    }

    if (!turnstileToken) {
      setMessage("Complete the Turnstile check.");
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      setMessage("File is too large (10MB max).");
      return;
    }

    setBusy(true);

    try {
      const orderId =
        existingOrderId ??
        (await createOrder({ email, petName, notes })).orderId;

      const presign = await fetch("/api/upload/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          filename: file.name,
          contentType: file.type || "application/octet-stream",
          size: file.size,
          turnstileToken,
        }),
      });

      if (!presign.ok) {
        const data = await presign.json();
        throw new Error(data.error ?? "Presign failed");
      }

      const { key, uploadUrl } = (await presign.json()) as {
        key: string;
        uploadUrl: string;
      };

      const uploadResponse = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadResponse.ok) {
        throw new Error("Upload failed");
      }

      const attach = await fetch("/api/order/attach-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId,
          key,
          contentType: file.type || "application/octet-stream",
          size: file.size,
        }),
      });

      if (!attach.ok) {
        const data = await attach.json();
        throw new Error(data.error ?? "Attach failed");
      }

      const checkoutResponse = await fetch("/api/checkout/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      if (!checkoutResponse.ok) {
        const data = await checkoutResponse.json();
        throw new Error(data.error ?? "Checkout failed");
      }

      const { url } = (await checkoutResponse.json()) as { url: string };
      window.location.assign(url);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Something went wrong";
      setMessage(message);
      setBusy(false);
    }
  }

  async function createOrder(payload: {
    email: string;
    petName?: string;
    notes?: string;
  }) {
    const response = await fetch("/api/order/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error ?? "Order creation failed");
    }

    return (await response.json()) as { orderId: string };
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.formHeader}>
        <h1>Upload your vet bill</h1>
        <p>
          We will review your invoice and guide you to the next best step. Files
          are encrypted in transit.
        </p>
      </div>

      <div className={styles.fieldRow}>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@email.com"
            required
          />
        </label>
        <label>
          Pet name
          <input
            type="text"
            value={petName}
            onChange={(event) => setPetName(event.target.value)}
            placeholder="Optional"
          />
        </label>
      </div>

      <label>
        Tell us what happened
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Brief context helps us move faster."
          rows={4}
        />
      </label>

      <label className={styles.fileInput}>
        Upload invoice (PDF, JPG, PNG)
        <input
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        />
        <span>{fileInfo}</span>
      </label>

      <div className={styles.turnstileWrap}>
        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="afterInteractive"
          async
          defer
        />
        <div
          className="cf-turnstile"
          data-sitekey={siteKey ?? ""}
          data-callback="onTurnstileCallback"
        />
        {!siteKey && (
          <p className={styles.message}>Missing Turnstile site key.</p>
        )}
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <button className={styles.submit} type="submit" disabled={busy}>
        {busy ? "Working..." : "Continue to checkout"}
      </button>
    </form>
  );
}
