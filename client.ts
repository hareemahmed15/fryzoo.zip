import { createBrowserClient } from "@supabase/ssr";

// Browser client: uses ONLY the public URL + publishable key (safe to expose).
// What users can do is controlled by Row Level Security in the database.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  );
}
