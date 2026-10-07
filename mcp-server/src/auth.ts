/**
 * Authentication module for the AcademicFlow MCP server.
 *
 * Verifies Bearer tokens from AI clients against Supabase Auth.
 * The user identity is resolved server-side from the verified JWT —
 * never from tool arguments supplied by the AI.
 */
import { getAdminClient, getUserClient, type AppRole } from './supabase.js';
import type { SupabaseClient } from '@supabase/supabase-js';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AuthContext {
  /** Supabase user ID (UUID) — resolved from the verified JWT */
  userId: string;
  /** User's email from auth metadata */
  email: string | undefined;
  /** The raw access token for creating per-user Supabase clients */
  accessToken: string;
  /** Resolved AcademicFlow role */
  role: AppRole;
  /** Supabase client scoped to this user's RLS context */
  supabase: SupabaseClient;
}

// ─── Scopes ─────────────────────────────────────────────────────────────────

export const READ_SCOPES = [
  'academicflow.profile.read',
  'academicflow.academics.read',
  'academicflow.attendance.read',
  'academicflow.achievements.read',
  'academicflow.documents.read',
] as const;

export const WRITE_SCOPES = [
  'academicflow.achievements.write',
  'academicflow.documents.write',
  'academicflow.verification.request',
] as const;

// Phase 1: only read scopes are active
export const ACTIVE_SCOPES: readonly string[] = READ_SCOPES;

// ─── Token verification ────────────────────────────────────────────────────

export async function verifyAccessToken(token: string): Promise<AuthContext> {
  if (!token) {
    throw new AuthError('Authentication required.', 401);
  }

  // Validate token format (must be a JWT with 3 parts)
  if (token.split('.').length !== 3) {
    throw new AuthError('Invalid token format.', 401);
  }

  // Use the admin client to verify the token and extract user identity
  const adminClient = getAdminClient();
  const { data: userData, error: userError } = await adminClient.auth.getUser(token);

  if (userError || !userData?.user) {
    throw new AuthError('Invalid or expired access token.', 401);
  }

  const userId = userData.user.id;
  const email = userData.user.email;

  // Resolve the user's AcademicFlow role
  const role = await resolveRole(userId);

  // Create a per-user Supabase client that respects RLS
  const supabase = getUserClient(token);

  return {
    userId,
    email,
    accessToken: token,
    role,
    supabase,
  };
}

// ─── Role resolution ────────────────────────────────────────────────────────

async function resolveRole(userId: string): Promise<AppRole> {
  const adminClient = getAdminClient();
  const { data: roles, error } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId);

  if (error) {
    console.error('[MCP Auth] Failed to resolve role:', error.message);
    // Default to student if role lookup fails — most restrictive
    return 'student';
  }

  const roleNames = (roles ?? []).map((r: { role: string }) => r.role);
  if (roleNames.includes('hod')) return 'hod';
  if (roleNames.includes('faculty')) return 'faculty';
  return 'student';
}

// ─── Custom error class ─────────────────────────────────────────────────────

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}
