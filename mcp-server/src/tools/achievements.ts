/**
 * get_my_achievements — Returns the authenticated user's achievements.
 *
 * Only returns achievements belonging to the current user (enforced by RLS).
 */
import type { McpServer } from '@modelcontextprotocol/server';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

export function registerAchievementTools(
  server: McpServer,
  auth: AuthContext,
): void {
  server.registerTool(
    'get_my_achievements',
    {
      description:
        'Return the authenticated user\'s achievements including title, category, organization, date, description, and verification status. Only returns achievements belonging to the current user.',
    },
    async () => {
      const start = Date.now();
      try {
        const { data, error } = await auth.supabase
          .from('achievements')
          .select('title, kind, issuer, description, achieved_on, link, status, feedback, verified_at, created_at')
          .eq('student_id', auth.userId)
          .order('created_at', { ascending: false });

        if (error) {
          logToolCall('get_my_achievements', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to retrieve achievements.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('get_my_achievements', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No achievements have been recorded yet.',
              }),
            }],
          };
        }

        const achievements = data.map((a) => ({
          title: a.title,
          category: a.kind,
          organization: a.issuer,
          achievedOn: a.achieved_on,
          description: a.description,
          link: a.link,
          verificationStatus: a.status,
          feedback: a.feedback,
          verifiedAt: a.verified_at,
          createdAt: a.created_at,
        }));

        // Summary stats
        const verified = achievements.filter((a) => a.verificationStatus === 'verified').length;
        const pending = achievements.filter((a) => a.verificationStatus === 'pending').length;
        const rejected = achievements.filter((a) => a.verificationStatus === 'rejected').length;

        logToolCall('get_my_achievements', auth.userId, true, Date.now() - start);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              achievements,
              summary: {
                total: achievements.length,
                verified,
                pending,
                rejected,
              },
            }, null, 2),
          }],
        };
      } catch (err) {
        logToolCall('get_my_achievements', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );
}
