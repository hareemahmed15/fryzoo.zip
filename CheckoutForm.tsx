"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useCart } from "@/components/cart/CartProvider";
import { createClient } from "@/lib/supabase/client";
import { formatPKR } from "@/lib/format";
import { toLocalPhone, validateCheckout, type CheckoutErrors, type CheckoutValues } from "@/lib/validation";

export default function CheckoutForm() {
  const router = useRouter();
  const { items, hydrated, subtotal, deliveryFee, total, clear } = useCart();

  const [values, setValues] = useState<CheckoutValues>({ name: "", phone: "", address: "", notes: "" });
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [placed, setPlaced] = useState(false);

  function update(field: keyof CheckoutValues, value: string) {
    setValues((v) => ({ ...v, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (submitting) return;

    const found = validateCheckout(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    setServerError(null);

    const supabase = createClient();
    const { data, error } = await supabase.rpc("place_order", {
      p_customer_name: values.name.trim(),
      p_customer_phone: toLocalPhone(values.phone),
      p_delivery_address: values.address.trim(),
      p_notes: values.notes.trim() || null,
      p_items: items.map((i) => ({ menu_item_id: i.id, quantity: i.quantity })),
    });

    if (error || !data) {
      // P0001 = a friendly message we raised ourselves inside the database function
      setServerError(
        error?.code === "P0001"
          ? error.message
          : "We could not place your order. Please check your connection and try again."
      );
      setSubmitting(false);
      return;
    }

    const result = data as { order_id: string; order_number: string };
    setPlaced(true);
    clear();
    router.push(`/order/${result.order_id}`);
  }

  if (!hydrated || placed) {
    return (
      <div className="container-x py-20 text-center" aria-busy="true">
        <p className="text-5xl">🍟</p>
        <p className="mt-4 text-xl font-extrabold">{placed ? "Order placed. Taking you to your receipt..." : "Loading..."}</p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container-x py-20 text-center">
        <p className="text-6xl">🛒</p>
        <h1 className="mt-4 text-3xl font-extrabold">Nothing to check out yet</h1>
        <p className="mt-2 text-ink-900/70">Your cart is empty.</p>
        <Link href="/menu" className="btn-primary mt-6 px-8 py-4 text-base">Browse the menu</Link>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <h1 className="text-4xl font-extrabold">Checkout</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          <div>
            <label htmlFor="name" className="label">Your name</label>
            <input id="name" autoComplete="name" value={values.name} onChange={(e) => update("name", e.target.value)}
              className={`input ${errors.name ? "input-error" : ""}`} placeholder="Ali Khan" />
            {errors.name && <p className="field-error" role="alert">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="phone" className="label">Mobile number</label>
            <input id="phone" type="tel" inputMode="tel" autoComplete="tel" value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
              className={`input ${errors.phone ? "input-error" : ""}`} placeholder="0300 1234567" />
            {errors.phone && <p className="field-error" role="alert">{errors.phone}</p>}
          </div>

          <div>
            <label htmlFor="address" className="label">Delivery address</label>
            <textarea id="address" rows={3} autoComplete="street-address" value={values.address}
              onChange={(e) => update("address", e.target.value)}
              className={`input ${errors.address ? "input-error" : ""}`}
              placeholder="House 12, Street 4, Block C, Johar Town, Lahore" />
            {errors.address && <p className="field-error" role="alert">{errors.address}</p>}
          </div>

          <div>
            <label htmlFor="notes" className="label">Notes for the kitchen or rider <span className="font-normal text-ink-900/50">(optional)</span></label>
            <textarea id="notes" rows={2} value={values.notes} onChange={(e) => update("notes", e.target.value)}
              className={`input ${errors.notes ? "input-error" : ""}`} placeholder="Extra spicy, no onions, ring the bell twice..." />
            {errors.notes && <p className="field-error" role="alert">{errors.notes}</p>}
          </div>

          <fieldset>
            <legend className="label">Payment method</legend>
            <label className="flex items-center gap-3 rounded-2xl border-2 border-ink-900 bg-sun-50 p-4">
              <input type="radio" name="payment" checked readOnly className="h-5 w-5 accent-brand-600" />
              <span>
                <span className="block font-extrabold">Cash on delivery</span>
                <span className="block text-sm text-ink-900/70">Pay the rider in cash when your order arrives.</span>
              </span>
            </label>
          </fieldset>

          {serverError && (
            <p role="alert" className="rounded-2xl border-2 border-brand-600 bg-brand-50 p-4 text-sm font-bold text-brand-800">
              {serverError}
            </p>
          )}

          <button type="submit" disabled={submitting} className="btn-primary w-full py-4 text-base">
            {submitting ? "Placing your order..." : `Place order · ${formatPKR(total)}`}
          </button>
        </form>

        <aside className="h-fit rounded-3xl border-2 border-ink-900 p-6 lg:sticky lg:top-24">
          <h2 className="text-xl font-extrabold">Your order</h2>
          <ul className="mt-4 space-y-2 text-sm">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span>{i.quantity} × {i.name}</span>
                <span className="font-bold">{formatPKR(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 border-t-2 border-ink-900/10 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="font-bold">{formatPKR(subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery fee</dt><dd className="font-bold">{formatPKR(deliveryFee)}</dd></div>
            <div className="flex justify-between text-lg"><dt className="font-extrabold">Total</dt><dd className="font-extrabold">{formatPKR(total)}</dd></div>
          </dl>
          <Link href="/cart" className="mt-4 block text-center text-sm font-bold underline">Edit cart</Link>
        </aside>
      </div>
    </div>
  );
}
