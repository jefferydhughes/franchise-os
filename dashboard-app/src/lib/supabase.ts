import { createClient, SupabaseClient } from '@supabase/supabase-js';

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
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });
}

/**
 * Org-scoped Supabase client for RLS brand isolation.
 *
 * Sets `app.current_org_id` so that RLS policies can enforce
 * tenant isolation using:
 *   current_setting('app.current_org_id', true)
 *
 * Must be called with the Clerk org ID from the authenticated session.
 */
export async function getOrgScopedClient(clerkOrgId: string): Promise<SupabaseClient> {
  const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  const client = createClient(url, serviceRoleKey, {
    auth: { persistSession: false },
  });

  // Set the org context for RLS policies (transaction-local)
  await client.rpc('set_config', {
    setting: 'app.current_org_id',
    value: clerkOrgId,
    is_local: true,
  });

  return client;
}
