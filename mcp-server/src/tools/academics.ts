/**
 * Academic record tools:
 *   - get_my_academic_records
 *   - get_my_subject_performance
 *   - get_my_gpa_history
 *
 * All queries go through the RLS-scoped Supabase client.
 * GPA calculations reuse the same deterministic logic from the frontend
 * (sgpaFromSubjects, computeCgpa from src/lib/academic.ts).
 */
import type { McpServer } from '@modelcontextprotocol/server';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

// ─── Deterministic GPA helpers (mirrored from src/lib/academic.ts) ──────────

function sgpaFromSubjects(rows: { credits: number | null; grade_points: number | null }[]): number | null {
  let c = 0;
  let p = 0;
  for (const r of rows) {
    const cr = Number(r.credits ?? 0);
    if (cr > 0 && r.grade_points != null) {
      c += cr;
      p += cr * Number(r.grade_points);
    }
  }
  return c > 0 ? Math.round((p / c) * 100) / 100 : null;
}

function computeCgpa(sems: { sgpa: number | null; credits: number | null }[]): number | null {
  const valid = sems.filter((s) => s.sgpa != null);
  if (!valid.length) return null;
  const withCredits = valid.every((s) => (s.credits ?? 0) > 0);
  if (withCredits) {
    const c = valid.reduce((a, s) => a + Number(s.credits), 0);
    return Math.round(
      (valid.reduce((a, s) => a + Number(s.sgpa) * Number(s.credits), 0) / c) * 100,
    ) / 100;
  }
  return Math.round((valid.reduce((a, s) => a + Number(s.sgpa), 0) / valid.length) * 100) / 100;
}

// ─── Tool registrations ─────────────────────────────────────────────────────

export function registerAcademicTools(
  server: McpServer,
  auth: AuthContext,
): void {
  // ── get_my_academic_records ─────────────────────────────────────────────
  server.registerTool(
    'get_my_academic_records',
    {
      description:
        'Return the authenticated user\'s semester academic records including semester number, SGPA, credits, verification status, and timestamps. Verified records are official; pending/rejected records are clearly marked.',
    },
    async () => {
      const start = Date.now();
      try {
        const { data, error } = await auth.supabase
          .from('semester_records')
          .select('semester_no, sgpa, credits, attendance, status, feedback, verified_at, created_at')
          .eq('student_id', auth.userId)
          .order('semester_no');

        if (error) {
          logToolCall('get_my_academic_records', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to retrieve academic records.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('get_my_academic_records', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No academic records are currently available.',
              }),
            }],
          };
        }

        const records = data.map((r) => ({
          semester: r.semester_no,
          sgpa: r.sgpa,
          credits: r.credits,
          attendance: r.attendance,
          verificationStatus: r.status,
          verifiedAt: r.verified_at,
          createdAt: r.created_at,
          feedback: r.feedback,
        }));

        logToolCall('get_my_academic_records', auth.userId, true, Date.now() - start);
        return {
          content: [{ type: 'text', text: JSON.stringify({ records, totalSemesters: records.length }, null, 2) }],
        };
      } catch (err) {
        logToolCall('get_my_academic_records', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );

  // ── get_my_subject_performance ──────────────────────────────────────────
  server.registerTool(
    'get_my_subject_performance',
    {
      description:
        'Return the authenticated user\'s subject-wise academic performance across all semesters, including course code, name, marks, grade, grade points, credits, and verification status of the parent semester.',
    },
    async () => {
      const start = Date.now();
      try {
        // Fetch semester records with their subject marks in one query
        const { data, error } = await auth.supabase
          .from('semester_records')
          .select('semester_no, status, subject_marks(course_code, course_name, marks, grade, grade_points, credits)')
          .eq('student_id', auth.userId)
          .order('semester_no');

        if (error) {
          logToolCall('get_my_subject_performance', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to retrieve subject performance.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('get_my_subject_performance', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No subject performance data is currently available.',
              }),
            }],
          };
        }

        const subjects = data.flatMap((sem) =>
          (sem.subject_marks as Array<{
            course_code: string | null;
            course_name: string;
            marks: number | null;
            grade: string | null;
            grade_points: number | null;
            credits: number | null;
          }>).map((s) => ({
            semester: sem.semester_no,
            courseCode: s.course_code,
            courseName: s.course_name,
            marks: s.marks,
            grade: s.grade,
            gradePoints: s.grade_points,
            credits: s.credits,
            semesterVerificationStatus: sem.status,
          })),
        );

        logToolCall('get_my_subject_performance', auth.userId, true, Date.now() - start);
        return {
          content: [{ type: 'text', text: JSON.stringify({ subjects, totalSubjects: subjects.length }, null, 2) }],
        };
      } catch (err) {
        logToolCall('get_my_subject_performance', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );

  // ── get_my_gpa_history ──────────────────────────────────────────────────
  server.registerTool(
    'get_my_gpa_history',
    {
      description:
        'Return the authenticated user\'s SGPA and cumulative CGPA history. Uses the same deterministic calculation as the AcademicFlow application. The application is the source of truth for GPA — do NOT recalculate from raw marks.',
    },
    async () => {
      const start = Date.now();
      try {
        const { data, error } = await auth.supabase
          .from('semester_records')
          .select('semester_no, sgpa, credits, status, subject_marks(credits, grade_points)')
          .eq('student_id', auth.userId)
          .order('semester_no');

        if (error) {
          logToolCall('get_my_gpa_history', auth.userId, false, Date.now() - start, error.message);
          return { content: [{ type: 'text', text: 'Failed to retrieve GPA history.' }], isError: true };
        }

        if (!data || data.length === 0) {
          logToolCall('get_my_gpa_history', auth.userId, true, Date.now() - start);
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                status: 'NO_DATA',
                message: 'No academic records are available to compute GPA history.',
              }),
            }],
          };
        }

        // Build GPA history with deterministic calculations
        const semesters = data.map((sem) => {
          const subjects = sem.subject_marks as Array<{ credits: number | null; grade_points: number | null }>;
          const calculatedSgpa = sgpaFromSubjects(subjects);
          return {
            semester: sem.semester_no,
            sgpa: sem.sgpa ?? calculatedSgpa,
            credits: sem.credits,
            verificationStatus: sem.status,
          };
        });

        const cgpa = computeCgpa(semesters);

        // Separate verified vs unverified for clarity
        const verifiedSemesters = semesters.filter((s) => s.verificationStatus === 'verified');
        const verifiedCgpa = computeCgpa(verifiedSemesters);

        logToolCall('get_my_gpa_history', auth.userId, true, Date.now() - start);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              semesters,
              overallCgpa: cgpa,
              verifiedCgpa,
              note: 'verifiedCgpa is calculated from verified records only. overallCgpa includes all records.',
            }, null, 2),
          }],
        };
      } catch (err) {
        logToolCall('get_my_gpa_history', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );
}
