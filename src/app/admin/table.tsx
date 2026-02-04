"use client";

import { useEffect, useState } from "react";
import styles from "./admin.module.css";

type Order = {
  id: string;
  email: string;
  petName: string | null;
  notes: string | null;
  status: string;
  uploadKey: string | null;
  stripeSessionId: string | null;
  stripePaymentIntentId: string | null;
  createdAt: string;
};

export default function AdminTable() {
  const [token, setToken] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchOrders() {
    setLoading(true);
    setMessage(null);
    try {
      const response = await fetch("/api/admin/orders", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error ?? "Failed to load orders");
      }
      const data = (await response.json()) as { orders: Order[] };
      setOrders(data.orders);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Request failed");
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(orderId: string) {
    const status = statusUpdates[orderId];
    if (!status) return;

    const response = await fetch(`/api/admin/orders/${orderId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Status update failed");
      return;
    }

    await fetchOrders();
  }

  async function openInvoice(orderId: string) {
    const response = await fetch(`/api/admin/orders/${orderId}/invoice-url`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) {
      const data = await response.json();
      setMessage(data.error ?? "Could not fetch invoice");
      return;
    }

    const data = (await response.json()) as { url: string };
    window.open(data.url, "_blank");
  }

  useEffect(() => {
    if (token) {
      fetchOrders();
    }
  }, [token]);

  return (
    <div className={styles.card}>
      <div className={styles.toolbar}>
        <input
          type="password"
          placeholder="Admin token"
          value={token}
          onChange={(event) => setToken(event.target.value)}
        />
        <button type="button" onClick={fetchOrders} disabled={!token || loading}>
          {loading ? "Loading" : "Refresh"}
        </button>
      </div>

      {message && <div className={styles.message}>{message}</div>}

      <div className={styles.table}>
        <div className={styles.tableHeader}>
          <span>Order</span>
          <span>Status</span>
          <span>Upload</span>
          <span>Actions</span>
        </div>
        {orders.map((order) => (
          <div className={styles.tableRow} key={order.id}>
            <div>
              <strong>{order.email}</strong>
              <div className={styles.meta}>
                {order.petName ?? "No pet name"}
              </div>
              <div className={styles.meta}>{order.id}</div>
            </div>
            <div>
              <div>{order.status}</div>
              <input
                type="text"
                placeholder="Update status"
                value={statusUpdates[order.id] ?? ""}
                onChange={(event) =>
                  setStatusUpdates((prev) => ({
                    ...prev,
                    [order.id]: event.target.value,
                  }))
                }
              />
            </div>
            <div>
              {order.uploadKey ? (
                <button type="button" onClick={() => openInvoice(order.id)}>
                  View invoice
                </button>
              ) : (
                "No upload"
              )}
            </div>
            <div>
              <button type="button" onClick={() => updateStatus(order.id)}>
                Save
              </button>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className={styles.empty}>No orders yet.</div>
        )}
      </div>
    </div>
  );
}
