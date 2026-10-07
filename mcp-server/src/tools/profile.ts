/**
 * get_my_profile — Returns the authenticated user's AcademicFlow profile.
 *
 * Uses the RLS-scoped Supabase client so only the authenticated user's
 * own profile row is returned.
 */
import type { McpServer } from '@modelcontextprotocol/server';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

export function registerProfileTools(
  server: McpServer,
  auth: AuthContext,
): void {
  server.registerTool(
    'get_my_profile',
    {
      description:
        'Return the currently authenticated user\'s AcademicFlow profile including name, register number, department, batch, and current semester.',
    },
    async () => {
      const start = Date.now();
      try {
        const { data, error } = await auth.supabase
          .from('profiles')
          .select('full_name, register_no, email, department, batch, current_semester, phone, onboarded, profile_photo_path')
          .eq('id', auth.userId)
          .maybeSingle();

        if (error) {
          logToolCall('get_my_profile', auth.userId, false, Date.now() - start, error.message);
          return {
            content: [{ type: 'text', text: 'Failed to retrieve profile.' }],
            isError: true,
          };
        }

        if (!data) {
          logToolCall('get_my_profile', auth.userId, true, Date.now() - start);
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  status: 'NO_DATA',
                  message: 'No profile found. The user may not have completed onboarding.',
                }),
              },
            ],
          };
        }

        const profile = {
          name: data.full_name,
          registerNumber: data.register_no,
          collegeEmail: data.email,
          department: data.department,
          batch: data.batch,
          currentSemester: data.current_semester,
          phone: data.phone,
          onboarded: data.onboarded,
          hasProfilePhoto: !!data.profile_photo_path,
          role: auth.role,
        };

        logToolCall('get_my_profile', auth.userId, true, Date.now() - start);
        return {
          content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
        };
      } catch (err) {
        logToolCall('get_my_profile', auth.userId, false, Date.now() - start, String(err));
        return {
          content: [{ type: 'text', text: 'An unexpected error occurred.' }],
          isError: true,
        };
      }
    },
  );
}
