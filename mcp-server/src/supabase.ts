/**
 * Supabase client factory for the MCP server.
 *
 * Two client types:
 * 1. Admin client — uses SERVICE_ROLE_KEY, bypasses RLS. Used ONLY for
 *    resolving user identity from access tokens.
 * 2. Per-user client — uses PUBLISHABLE_KEY + the user's access token as
 *    the Authorization header. All queries go through RLS, so the DB
 *    enforces the same row-level policies the frontend relies on.
 */
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Re-export the Database type from the frontend-generated types.
// We copy the type interface inline to avoid a cross-package import that
// would couple the MCP server build to the Vite/TanStack frontend.
// Keep this in sync with src/integrations/supabase/types.ts in the main app.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type VerificationStatus = 'pending' | 'verified' | 'rejected';
export type AppRole = 'student' | 'faculty' | 'hod';

// ─── Environment helpers ────────────────────────────────────────────────────

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

// ─── Admin client (service role — bypasses RLS) ─────────────────────────────

let _adminClient: SupabaseClient | undefined;

export function getAdminClient(): SupabaseClient {
  if (!_adminClient) {
    const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'] || process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!serviceKey) {
      throw new Error('Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY');
    }
    _adminClient = createClient(
      requireEnv('SUPABASE_URL'),
      serviceKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    );
  }
  return _adminClient;
}

// ─── Per-user client (publishable key + user's JWT — respects RLS) ──────────

export function getUserClient(accessToken: string): SupabaseClient {
  return createClient(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_PUBLISHABLE_KEY'),
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}
