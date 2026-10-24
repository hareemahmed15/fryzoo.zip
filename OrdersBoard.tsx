"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatPKR } from "@/lib/format";
import type { Order, OrderStatus } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

type Filter = "active" | "completed" | "closed" | "all";
type Tone = "primary" | "danger";

const FILTERS: { key: Filter; label: string; statuses: OrderStatus[] | null }[] = [
  { key: "active", label: "Active", statuses: ["pending", "accepted", "preparing", "ready"] },
  { key: "completed", label: "Completed", statuses: ["completed"] },
  { key: "closed", label: "Rejected / cancelled", statuses: ["rejected", "cancelled"] },
  { key: "all", label: "All", statuses: null },
];

const ACTIONS: Record<OrderStatus, { label: string; next: OrderStatus; tone: Tone; confirm?: string }[]> = {
  pending: [
    { label: "Accept", next: "accepted", tone: "primary" },
    { label: "Reject", next: "rejected", tone: "danger", confirm: "Reject this order?" },
  ],
  accepted: [
    { label: "Mark preparing", next: "preparing", tone: "primary" },
    { label: "Cancel", next: "cancelled", tone: "danger", confirm: "Cancel this order?" },
  ],
  preparing: [
    { label: "Mark ready", next: "ready", tone: "primary" },
    { label: "Cancel", next: "cancelled", tone: "danger", confirm: "Cancel this order?" },
  ],
  ready: [
    { label: "Mark completed", next: "completed", tone: "primary" },
    { label: "Cancel", next: "cancelled", tone: "danger", confirm: "Cancel this order?" },
  ],
  completed: [],
  rejected: [],
  cancelled: [],
};

function beep() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.value = 0.08;
    osc.start();
    setTimeout(() => {
      osc.stop();
      void ctx.close();
    }, 350);
  } catch {
    // Browsers may block sound until the page has been clicked once. Safe to ignore.
  }
}

export default function OrdersBoard() {
  const supabase = useMemo(() => createClient(), []);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("active");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("orders")
      .select("*, order_items(id, item_name, quantity, unit_price)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (err) setError(err.message);
    else {
      setError(null);
      setOrders((data ?? []) as Order[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
    });
    const channel = supabase
      .channel("admin-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setFlash("New order received!");
          beep();
        }
        void load();
      })
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    const poll = setInterval(() => void load(), 30000);
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 6000);
    return () => clearTimeout(t);
  }, [flash]);

  async function changeStatus(order: Order, next: OrderStatus, confirmText?: string) {
    if (confirmText && !window.confirm(`${confirmText} (${order.order_number})`)) return;
    setBusyId(order.id);
    setError(null);
    const { data, error: err } = await supabase.from("orders").update({ status: next }).eq("id", order.id).select("id");
    if (err) setError(err.message);
    else if (!data || data.length === 0) setError("The order was not updated. Check that this account is an admin.");
    await load();
    setBusyId(null);
  }

  const current = FILTERS.find((f) => f.key === filter)!;
  const visible = orders.filter((o) => current.statuses === null || current.statuses.includes(o.status));
  const countFor = (f: (typeof FILTERS)[number]) =>
    f.statuses === null ? orders.length : orders.filter((o) => f.statuses!.includes(o.status)).length;

  return (
    <div>
      {flash && (
        <p role="status" className="mb-4 rounded-2xl bg-sun-400 p-4 text-sm font-extrabold">🔔 {flash}</p>
      )}
      {error && (
        <p role="alert" className="mb-4 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-800">{error}</p>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Order filters">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${filter === f.key ? "bg-ink-900 text-white" : "bg-white hover:bg-sun-100"}`}
            >
              {f.label} ({countFor(f)})
            </button>
          ))}
        </div>
        <span className={`text-xs font-bold ${live ? "text-green-700" : "text-ink-900/50"}`}>
          {live ? "● Live updates on" : "Refreshing every 30 seconds"}
        </span>
      </div>

      {loading ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2" aria-busy="true">
          {[0, 1].map((i) => <div key={i} className="h-64 animate-pulse rounded-2xl bg-ink-900/10" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-ink-900/20 bg-white p-10 text-center">
          <p className="text-4xl">🧾</p>
          <p className="mt-2 text-lg font-extrabold">No orders here</p>
          <p className="text-sm text-ink-900/70">New orders will appear automatically.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {visible.map((o) => (
            <article key={o.id} className="panel flex flex-col">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-2xl font-extrabold">{o.order_number}</h2>
                  <p className="text-xs text-ink-900/60">{formatDateTime(o.created_at)}</p>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="mt-4 text-sm">
                <p className="font-extrabold">{o.customer_name}</p>
                <a href={`tel:${o.customer_phone}`} className="font-bold text-brand-700 underline">{o.customer_phone}</a>
                <p className="mt-1 text-ink-900/80">{o.delivery_address}</p>
              </div>

              <ul className="mt-4 divide-y divide-ink-900/10 rounded-xl bg-sun-50 px-3 text-sm">
                {(o.order_items ?? []).map((it) => (
                  <li key={it.id} className="flex justify-between gap-3 py-2">
                    <span><span className="font-extrabold">{it.quantity} ×</span> {it.item_name}</span>
                    <span className="font-bold">{formatPKR(it.unit_price * it.quantity)}</span>
                  </li>
                ))}
              </ul>

              {o.notes && (
                <p className="mt-3 rounded-xl bg-sun-100 p-3 text-sm"><span className="font-extrabold">Notes: </span>{o.notes}</p>
              )}

              <div className="mt-4 flex items-end justify-between border-t-2 border-ink-900/10 pt-3 text-sm">
                <div className="text-ink-900/70">
                  <p>Subtotal {formatPKR(o.subtotal)}</p>
                  <p>Delivery {formatPKR(o.delivery_fee)}</p>
                </div>
                <p className="text-right"><span className="block text-xs font-bold text-ink-900/60">Collect (cash)</span>
                  <span className="font-display text-2xl font-extrabold">{formatPKR(o.total)}</span></p>
              </div>

              {ACTIONS[o.status].length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {ACTIONS[o.status].map((a) => (
                    <button
                      key={a.next}
                      type="button"
                      disabled={busyId === o.id}
                      onClick={() => changeStatus(o, a.next, a.confirm)}
                      className={a.tone === "primary" ? "btn-primary px-4 py-2.5" : "btn-danger px-4 py-2.5"}
                    >
                      {busyId === o.id ? "Saving..." : a.label}
                    </button>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
