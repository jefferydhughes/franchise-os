import { createClient } from '@supabase/supabase-js';

/**
 * Browser-side Supabase client (uses public anon key).
 * Safe to call from Client Components.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, anonKey);
}

/**
 * Server-side Supabase client (uses service-role key).
 * Only call from Server Components, Route Handlers, or Server Actions.
 */
export function createServerClient() {
  const url = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}
