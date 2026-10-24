"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatPKR } from "@/lib/format";
import type { OrderStatus, PublicOrder } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";
import { CheckIcon } from "@/components/ui/Icons";

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: "pending", label: "Order placed" },
  { status: "accepted", label: "Accepted" },
  { status: "preparing", label: "Preparing" },
  { status: "ready", label: "Ready" },
  { status: "completed", label: "Completed" },
];

const MESSAGES: Record<OrderStatus, string> = {
  pending: "We have received your order. The restaurant will confirm it shortly.",
  accepted: "The restaurant accepted your order and will start cooking soon.",
  preparing: "Your food is being prepared right now.",
  ready: "Your order is ready and will reach you very soon.",
  completed: "Your order is complete. Enjoy your meal!",
  rejected: "Sorry, the restaurant could not accept this order. Please call us to order again.",
  cancelled: "This order was cancelled. Please call us if you have questions.",
};

export default function OrderTracker({ initialOrder }: { initialOrder: PublicOrder }) {
  const supabase = useMemo(() => createClient(), []);
  const orderId = initialOrder.id;
  const [order, setOrder] = useState<PublicOrder>(initialOrder);
  const [live, setLive] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase.rpc("get_order_public", { p_order_id: orderId });
    if (data) setOrder(data as PublicOrder);
  }, [supabase, orderId]);

  // Instant updates: the database broadcasts to a channel named after this order's id
  useEffect(() => {
    const channel = supabase
      .channel(`order:${orderId}`)
      .on("broadcast", { event: "status" }, () => {
        void refresh();
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, orderId, refresh]);

  // Safety net: also check every 10 seconds (stops once the order is finished)
  const finished = order.status === "completed" || order.status === "rejected" || order.status === "cancelled";
  useEffect(() => {
    if (finished) return;
    const timer = setInterval(() => void refresh(), 10000);
    return () => clearInterval(timer);
  }, [finished, refresh]);

  const stepIndex = STEPS.findIndex((s) => s.status === order.status);
  const failed = order.status === "rejected" || order.status === "cancelled";

  return (
    <div className="container-x max-w-3xl py-10">
      <div className="rounded-3xl bg-brand-600 p-6 text-white sm:p-8">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-sun-400 text-ink-900"><CheckIcon /></span>
          <p className="text-lg font-bold">Thank you, {order.customer_name.split(" ")[0]}!</p>
        </div>
        <p className="mt-4 text-sm text-white/80">Your order number</p>
        <p className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">{order.order_number}</p>
        <p className="mt-3 text-white/90">{MESSAGES[order.status]}</p>
      </div>

      <section className="panel mt-6" aria-label="Order status">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl font-extrabold">Order status</h2>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${live ? "text-green-700" : "text-ink-900/50"}`}>
              {live ? "● Live updates on" : "Checking every 10 seconds"}
            </span>
            <StatusBadge status={order.status} />
          </div>
        </div>

        {failed ? (
          <p className="mt-4 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-800">{MESSAGES[order.status]}</p>
        ) : (
          <ol className="mt-5 grid grid-cols-5 gap-1">
            {STEPS.map((s, i) => {
              const done = i <= stepIndex;
              return (
                <li key={s.status} className="text-center">
                  <div className={`mx-auto grid h-9 w-9 place-items-center rounded-full text-sm font-extrabold ${done ? "bg-brand-600 text-white" : "bg-ink-900/10 text-ink-900/50"}`}>
                    {done ? <CheckIcon className="h-4 w-4" /> : i + 1}
                  </div>
                  <p className={`mt-2 text-[11px] font-bold leading-tight sm:text-xs ${done ? "" : "text-ink-900/50"}`}>{s.label}</p>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section className="panel mt-6" aria-label="Items">
        <h2 className="text-xl font-extrabold">Your items</h2>
        <ul className="mt-4 divide-y-2 divide-ink-900/10">
          {order.items.map((it, idx) => (
            <li key={idx} className="flex justify-between gap-3 py-3 text-sm">
              <span><span className="font-extrabold">{it.quantity} ×</span> {it.name}</span>
              <span className="font-bold">{formatPKR(it.unit_price * it.quantity)}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-2 border-t-2 border-ink-900/10 pt-4 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-bold">{formatPKR(order.subtotal)}</dd></div>
          <div className="flex justify-between"><dt>Delivery fee</dt><dd className="font-bold">{formatPKR(order.delivery_fee)}</dd></div>
          <div className="flex justify-between text-lg"><dt className="font-extrabold">Total to pay</dt><dd className="font-extrabold">{formatPKR(order.total)}</dd></div>
        </dl>
      </section>

      <section className="panel mt-6" aria-label="Delivery details">
        <h2 className="text-xl font-extrabold">Delivery details</h2>
        <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
          <div><dt className="font-bold text-ink-900/60">Name</dt><dd className="font-bold">{order.customer_name}</dd></div>
          <div><dt className="font-bold text-ink-900/60">Phone</dt><dd className="font-bold">{order.customer_phone}</dd></div>
          <div className="sm:col-span-2"><dt className="font-bold text-ink-900/60">Address</dt><dd className="font-bold">{order.delivery_address}</dd></div>
          {order.notes && <div className="sm:col-span-2"><dt className="font-bold text-ink-900/60">Notes</dt><dd className="font-bold">{order.notes}</dd></div>}
          <div><dt className="font-bold text-ink-900/60">Payment</dt><dd className="font-bold">Cash on delivery</dd></div>
          <div><dt className="font-bold text-ink-900/60">Placed at</dt><dd className="font-bold">{formatDateTime(order.created_at)}</dd></div>
        </dl>
      </section>

      <p className="mt-6 text-center text-sm text-ink-900/60">Keep this page open or bookmark it to follow your order.</p>
      <div className="mt-4 text-center"><Link href="/menu" className="btn-outline">Order something else</Link></div>
    </div>
  );
}
