"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/config";
import { formatPKR } from "@/lib/format";
import type { MenuItem } from "@/lib/types";
import FoodImage from "@/components/menu/FoodImage";

interface FormState {
  id?: string;
  name: string;
  description: string;
  price: string;
  category: string;
  image_url: string;
  available: boolean;
  is_featured: boolean;
}

const EMPTY: FormState = {
  name: "", description: "", price: "", category: CATEGORIES[0], image_url: "", available: true, is_featured: false,
};

export default function MenuManager() {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("All");
  const [form, setForm] = useState<FormState | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("menu_items")
      .select("*")
      .order("category", { ascending: true })
      .order("created_at", { ascending: true });
    if (err) setError(err.message);
    else {
      setError(null);
      setItems((data ?? []) as MenuItem[]);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  function openNew() {
    setFormError(null);
    setForm({ ...EMPTY });
  }

  function openEdit(item: MenuItem) {
    setFormError(null);
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      price: String(item.price),
      category: item.category,
      image_url: item.image_url ?? "",
      available: item.available,
      is_featured: item.is_featured,
    });
  }

  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!form || saving) return;

    const name = form.name.trim();
    const price = Number(form.price);
    const image = form.image_url.trim();

    if (name.length < 2) return setFormError("Enter a name (at least 2 characters).");
    if (!form.price.trim() || !Number.isFinite(price) || price < 0) return setFormError("Enter a valid price in PKR, e.g. 650.");
    if (form.description.length > 300) return setFormError("Description is too long (300 characters max).");
    if (image && !/^https?:\/\//i.test(image)) return setFormError("Image link must start with http:// or https://");

    const payload = {
      name,
      description: form.description.trim(),
      price,
      category: form.category,
      image_url: image || null,
      available: form.available,
      is_featured: form.is_featured,
    };

    setSaving(true);
    setFormError(null);
    const result = form.id
      ? await supabase.from("menu_items").update(payload).eq("id", form.id).select("id")
      : await supabase.from("menu_items").insert(payload).select("id");
    setSaving(false);

    if (result.error) return setFormError(result.error.message);
    if (!result.data || result.data.length === 0) return setFormError("Nothing was saved. Check that this account is an admin.");

    setForm(null);
    await load();
  }

  async function toggleAvailable(item: MenuItem) {
    setBusyId(item.id);
    const { data, error: err } = await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id).select("id");
    if (err) setError(err.message);
    else if (!data || data.length === 0) setError("Could not update. Check that this account is an admin.");
    await load();
    setBusyId(null);
  }

  async function remove(item: MenuItem) {
    if (!window.confirm(`Delete "${item.name}" from the menu? Old orders keep their history.`)) return;
    setBusyId(item.id);
    const { data, error: err } = await supabase.from("menu_items").delete().eq("id", item.id).select("id");
    if (err) setError(err.message);
    else if (!data || data.length === 0) setError("Could not delete. Check that this account is an admin.");
    await load();
    setBusyId(null);
  }

  const visible = items.filter((i) => filter === "All" || i.category === filter);

  return (
    <div>
      {error && <p role="alert" className="mb-4 rounded-2xl bg-brand-50 p-4 text-sm font-bold text-brand-800">{error}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map((c) => (
            <button key={c} onClick={() => setFilter(c)}
              className={`rounded-full px-4 py-2 text-sm font-bold ${filter === c ? "bg-ink-900 text-white" : "bg-white hover:bg-sun-100"}`}>
              {c}
            </button>
          ))}
        </div>
        <button type="button" onClick={openNew} className="btn-primary">Add item</button>
      </div>

      {loading ? (
        <div className="mt-6 space-y-3" aria-busy="true">
          {[0, 1, 2].map((i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-ink-900/10" />)}
        </div>
      ) : visible.length === 0 ? (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-ink-900/20 bg-white p-10 text-center">
          <p className="text-4xl">🍔</p>
          <p className="mt-2 text-lg font-extrabold">No menu items here yet</p>
          <p className="text-sm text-ink-900/70">Click “Add item” to create one.</p>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {visible.map((item) => (
            <li key={item.id} className="panel flex flex-wrap items-center gap-4 !p-3 sm:!p-4">
              <FoodImage src={item.image_url} alt={item.name} category={item.category} className="h-20 w-20 shrink-0 rounded-xl" />
              <div className="min-w-0 flex-1 basis-48">
                <p className="truncate text-lg font-extrabold">
                  {item.name} {item.is_featured && <span className="ml-1 rounded-full bg-sun-400 px-2 py-0.5 text-xs">Featured</span>}
                </p>
                <p className="text-sm text-ink-900/60">{item.category} · {formatPKR(item.price)}</p>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm font-bold">
                <input type="checkbox" checked={item.available} disabled={busyId === item.id}
                  onChange={() => toggleAvailable(item)} className="h-5 w-5 accent-brand-600" />
                {item.available ? "Available" : "Sold out"}
              </label>
              <div className="flex gap-2">
                <button type="button" onClick={() => openEdit(item)} className="btn-outline px-4 py-2">Edit</button>
                <button type="button" onClick={() => remove(item)} disabled={busyId === item.id} className="btn-danger px-4 py-2">Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {form && (
        <div className="fixed inset-0 z-50 grid place-items-end bg-ink-900/60 sm:place-items-center" role="dialog" aria-modal="true" aria-label={form.id ? "Edit item" : "Add item"}>
          <form onSubmit={save} noValidate className="max-h-[92vh] w-full overflow-y-auto rounded-t-3xl bg-white p-6 sm:max-w-lg sm:rounded-3xl">
            <h2 className="text-2xl font-extrabold">{form.id ? "Edit item" : "Add item"}</h2>

            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="m-name" className="label">Name</label>
                <input id="m-name" className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label htmlFor="m-desc" className="label">Description</label>
                <textarea id="m-desc" rows={3} className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="m-price" className="label">Price (PKR)</label>
                  <input id="m-price" inputMode="decimal" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="650" />
                </div>
                <div>
                  <label htmlFor="m-cat" className="label">Category</label>
                  <select id="m-cat" className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="m-img" className="label">Image link <span className="font-normal text-ink-900/50">(optional)</span></label>
                <input id="m-img" className="input" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://..." />
              </div>
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} />
                  Available to order
                </label>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <input type="checkbox" className="h-5 w-5 accent-brand-600" checked={form.is_featured} onChange={(e) => setForm({ ...form, is_featured: e.target.checked })} />
                  Show in Featured
                </label>
              </div>
            </div>

            {formError && <p role="alert" className="field-error mt-4">{formError}</p>}

            <div className="mt-6 flex gap-3">
              <button type="button" onClick={() => setForm(null)} className="btn-outline flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving..." : "Save item"}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
