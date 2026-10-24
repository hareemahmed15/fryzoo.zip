export interface CheckoutValues {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutValues, string>>;

// Pakistani mobile numbers: 0300 1234567, 03001234567, +92 300 1234567, 923001234567
const PK_MOBILE = /^(?:\+92|0092|92|0)?3\d{9}$/;

/** Returns the number as 03XXXXXXXXX, or null if it is not a valid Pakistani mobile number. */
export function toLocalPhone(raw: string): string | null {
  const cleaned = raw.replace(/[\s\-()]/g, "");
  if (!PK_MOBILE.test(cleaned)) return null;
  return "0" + cleaned.slice(-10);
}

export function validateCheckout(v: CheckoutValues): CheckoutErrors {
  const errors: CheckoutErrors = {};
  const name = v.name.trim();
  const address = v.address.trim();

  if (name.length < 2) errors.name = "Please enter your name.";
  else if (name.length > 80) errors.name = "Name is too long (80 characters max).";

  if (!toLocalPhone(v.phone)) errors.phone = "Enter a valid mobile number, e.g. 0300 1234567.";

  if (address.length < 10) errors.address = "Please enter your full address (house, street, area).";
  else if (address.length > 300) errors.address = "Address is too long (300 characters max).";

  if (v.notes.trim().length > 300) errors.notes = "Notes are too long (300 characters max).";

  return errors;
}
