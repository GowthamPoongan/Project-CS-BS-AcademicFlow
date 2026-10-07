/**
 * get_my_attendance — Returns the authenticated user's attendance information.
 *
 * Attendance data comes from the `attendance` column in `semester_records`.
 * If no attendance data exists, returns an appropriate empty state.
 */
import type { McpServer } from '@modelcontextprotocol/server';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

export function registerAttendanceTools(
  server: McpServer,
  auth: AuthContext,
): void {
  server.registerTool(
    'get_my_attendance',
    {
      description:
        'Return the authenticated user\'s attendance information per semester. If no attendance data exists, returns an empty state with an appropriate message.',
    },
    async () => {
      const start = Date.now();
      try {
        const { data, error } = await auth.supabase
          .from('semester_records')
          .select('semester_no, attendance, status, subject_marks(course_code, course_name)')
          .eq('student_id', auth.userId)
          .order('semester_no');

        if (error) {
          logToolCall('get_my_attendance', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to retrieve attendance records.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('get_my_attendance', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No attendance records are currently available.',
              }),
            }],
          };
        }

        // Check if any semester has attendance data
        const hasAttendance = data.some((r) => r.attendance != null);

        if (!hasAttendance) {
          logToolCall('get_my_attendance', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'Semester records exist but no attendance data has been recorded yet.',
                semestersOnRecord: data.map((r) => r.semester_no),
              }),
            }],
          };
        }

        const attendance = data
          .filter((r) => r.attendance != null)
          .map((r) => {
            const subjects = r.subject_marks as Array<{
              course_code: string | null;
              course_name: string;
            }>;
            return {
              semester: r.semester_no,
              attendancePercentage: r.attendance,
              verificationStatus: r.status,
              subjectCount: subjects.length,
              subjects: subjects.map((s) => ({
                courseCode: s.course_code,
                courseName: s.course_name,
              })),
            };
          });

        logToolCall('get_my_attendance', auth.userId, true, Date.now() - start);
        return {
          content: [{ type: 'text', text: JSON.stringify({ attendance }, null, 2) }],
        };
      } catch (err) {
        logToolCall('get_my_attendance', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );
}
