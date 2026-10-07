/**
 * get_my_academic_insights — Placeholder for a future composite analysis tool.
 *
 * This tool combines verified academic records, subject performance, GPA,
 * and attendance into a single response that an AI agent can reason over.
 *
 * NOTE: All academic calculations are deterministic — the AI uses these
 * results for interpretation/recommendations, but MUST NOT recalculate
 * official academic values (SGPA, CGPA, grades).
 */
import type { McpServer } from '@modelcontextprotocol/server';
import type { AuthContext } from '../auth.js';
import { logToolCall } from '../logger.js';

// Deterministic GPA helpers (same as academics.ts)
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

export function registerAnalysisTools(
  server: McpServer,
  auth: AuthContext,
): void {
  server.registerTool(
    'get_my_academic_insights',
    {
      description:
        'Return a comprehensive academic snapshot for the authenticated user, combining verified academic records, subject performance, GPA history, attendance, and achievements into one response. Designed for AI-driven multi-step reasoning and personalized recommendations. Academic calculations are deterministic and official — the AI should interpret results but MUST NOT recalculate SGPA/CGPA.',
    },
    async () => {
      const start = Date.now();
      try {
        // Parallel fetch of all data sources
        const [semResult, achResult, docResult, profileResult] = await Promise.all([
          auth.supabase
            .from('semester_records')
            .select('semester_no, sgpa, credits, attendance, status, subject_marks(course_code, course_name, marks, grade, grade_points, credits)')
            .eq('student_id', auth.userId)
            .order('semester_no'),
          auth.supabase
            .from('achievements')
            .select('title, kind, issuer, status, achieved_on')
            .eq('student_id', auth.userId)
            .order('created_at', { ascending: false }),
          auth.supabase
            .from('documents')
            .select('title, category, status')
            .eq('student_id', auth.userId),
          auth.supabase
            .from('profiles')
            .select('full_name, register_no, department, batch, current_semester')
            .eq('id', auth.userId)
            .maybeSingle(),
        ]);

        if (semResult.error || achResult.error || docResult.error || profileResult.error) {
          const errMsg = [semResult.error, achResult.error, docResult.error, profileResult.error]
            .filter(Boolean)
            .map((e) => e?.message)
            .join('; ');
          logToolCall('get_my_academic_insights', auth.userId, false, Date.now() - start, errMsg);
          return { content: [{ type: 'text', text: 'Failed to retrieve academic insights.' }], isError: true };
        }

        const semesters = semResult.data ?? [];
        const achievements = achResult.data ?? [];
        const documents = docResult.data ?? [];
        const profile = profileResult.data;

        // Build GPA history
        const gpaHistory = semesters.map((sem) => {
          const subjects = sem.subject_marks as Array<{ credits: number | null; grade_points: number | null }>;
          const calculatedSgpa = sgpaFromSubjects(subjects);
          return {
            semester: sem.semester_no,
            sgpa: sem.sgpa ?? calculatedSgpa,
            credits: sem.credits,
            verificationStatus: sem.status,
          };
        });

        const cgpa = computeCgpa(gpaHistory);
        const verifiedCgpa = computeCgpa(gpaHistory.filter((s) => s.verificationStatus === 'verified'));

        // Subject-level analysis
        const allSubjects = semesters.flatMap((sem) =>
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

        // Attendance summary
        const attendanceEntries = semesters
          .filter((s) => s.attendance != null)
          .map((s) => ({
            semester: s.semester_no,
            attendancePercentage: s.attendance,
          }));

        const insights = {
          profile: profile ? {
            name: profile.full_name,
            registerNumber: profile.register_no,
            department: profile.department,
            batch: profile.batch,
            currentSemester: profile.current_semester,
          } : null,
          gpa: {
            history: gpaHistory,
            overallCgpa: cgpa,
            verifiedCgpa,
          },
          subjects: {
            all: allSubjects,
            totalCount: allSubjects.length,
          },
          attendance: {
            entries: attendanceEntries,
            available: attendanceEntries.length > 0,
          },
          achievements: {
            items: achievements.map((a) => ({
              title: a.title,
              category: a.kind,
              organization: a.issuer,
              verificationStatus: a.status,
              achievedOn: a.achieved_on,
            })),
            total: achievements.length,
            verified: achievements.filter((a) => a.status === 'verified').length,
          },
          documents: {
            total: documents.length,
            verified: documents.filter((d) => d.status === 'verified').length,
            byCategory: documents.reduce((acc, d) => {
              acc[d.category] = (acc[d.category] ?? 0) + 1;
              return acc;
            }, {} as Record<string, number>),
          },
          note: 'All academic values (SGPA, CGPA, grades) are computed deterministically by AcademicFlow. The AI should interpret and provide recommendations but MUST NOT recalculate official academic metrics.',
        };

        logToolCall('get_my_academic_insights', auth.userId, true, Date.now() - start);
        return {
          content: [{ type: 'text', text: JSON.stringify(insights, null, 2) }],
        };
      } catch (err) {
        logToolCall('get_my_academic_insights', auth.userId, false, Date.now() - start, String(err));
        return { content: [{ type: 'text', text: 'An unexpected error occurred.' }], isError: true };
      }
    },
  );
}
