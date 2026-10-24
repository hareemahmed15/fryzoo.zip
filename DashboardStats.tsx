"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime, formatPKR } from "@/lib/format";
import type { Order } from "@/lib/types";
import StatusBadge from "@/components/StatusBadge";

type Row = Pick<Order, "id" | "order_number" | "customer_name" | "total" | "status" | "created_at">;

export default function DashboardStats() {
  const supabase = useMemo(() => createClient(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [live, setLive] = useState(false);

  const load = useCallback(async () => {
    const { data, error: err, count } = await supabase
      .from("orders")
      .select("id, order_number, customer_name, total, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(1000);
    if (err) setError(err.message);
    else {
      setError(null);
      setRows((data ?? []) as Row[]);
      setTotalCount(count ?? (data?.length ?? 0));
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) supabase.realtime.setAuth(data.session.access_token);
    });
    const channel = supabase
      .channel("admin-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => void load())
      .subscribe((s) => setLive(s === "SUBSCRIBED"));
    const poll = setInterval(() => void load(), 30000);
    return () => {
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [load, supabase]);

  const count = (...s: string[]) => rows.filter((r) => s.includes(r.status)).length;

  const cards = [
    { label: "New orders", value: count("pending"), tone: "bg-sun-400 text-ink-900", note: "Waiting for you" },
    { label: "Being prepared", value: count("accepted", "preparing"), tone: "bg-white", note: "Accepted + preparing" },
    { label: "Ready", value: count("ready"), tone: "bg-white", note: "Waiting for the rider" },
    { label: "Completed", value: count("completed"), tone: "bg-white", note: "Delivered" },
    { label: "Total orders", value: totalCount, tone: "bg-ink-900 text-white", note: "All time" },
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5" aria-busy="true">
        {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-ink-900/10" />)}
      </div>
    );
  }

  return (
    <>
      {error && <p role="alert" className="mb-4 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-800">Could not load orders: {error}</p>}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {cards.map((c) => (
          <div key={c.label} className={`rounded-2xl border-2 border-ink-900/10 p-4 ${c.tone}`}>
            <p className="text-sm font-bold">{c.label}</p>
            <p className="mt-1 font-display text-4xl font-extrabold">{c.value}</p>
            <p className="mt-1 text-xs opacity-70">{c.note}</p>
          </div>
        ))}
      </div>

      <div className="panel mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-extrabold">Latest orders</h2>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold ${live ? "text-green-700" : "text-ink-900/50"}`}>{live ? "● Live" : "Refreshing every 30s"}</span>
            <Link href="/admin/orders" className="btn-dark px-4 py-2">Manage orders</Link>
          </div>
        </div>
        {rows.length === 0 ? (
          <p className="mt-6 rounded-2xl border-2 border-dashed border-ink-900/20 p-8 text-center text-ink-900/70">
            No orders yet. They will show up here the moment a customer orders.
          </p>
        ) : (
          <ul className="mt-4 divide-y-2 divide-ink-900/10">
            {rows.slice(0, 6).map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm">
                <div>
                  <p className="font-extrabold">{r.order_number}</p>
                  <p className="text-ink-900/60">{r.customer_name} · {formatDateTime(r.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold">{formatPKR(r.total)}</span>
                  <StatusBadge status={r.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
