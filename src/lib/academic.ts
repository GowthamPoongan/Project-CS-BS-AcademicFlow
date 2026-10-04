import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Role = "student" | "faculty" | "hod";
export type Status = "pending" | "verified" | "rejected";
export type Profile = Tables<"profiles">;
export type SemesterRecord = Tables<"semester_records"> & { subject_marks: Tables<"subject_marks">[] };
export type DocumentRow = Tables<"documents">;
export type Achievement = Tables<"achievements">;

export const BUCKET = "academic-docs";

export const GRADE_POINTS: Record<string, number> = {
  O: 10, "A+": 9, A: 8, "B+": 7, B: 6, C: 5, P: 5, U: 0, F: 0, RA: 0, AB: 0,
};

export const DOC_CATEGORIES = [
  { value: "marksheet", label: "Marksheet" },
  { value: "certificate", label: "Certificate" },
  { value: "project", label: "Project" },
  { value: "research", label: "Research paper" },
  { value: "id", label: "ID / Admission" },
  { value: "other", label: "Other" },
];

export const ACHIEVEMENT_KINDS = [
  { value: "certificate", label: "Certification" },
  { value: "project", label: "Project" },
  { value: "research", label: "Research" },
  { value: "award", label: "Award" },
  { value: "internship", label: "Internship" },
  { value: "event", label: "Event / Hackathon" },
];

export function sgpaFromSubjects(rows: { credits: number | null; grade_points: number | null }[]) {
  let c = 0, p = 0;
  for (const r of rows) {
    const cr = Number(r.credits ?? 0);
    if (cr > 0 && r.grade_points != null) {
      c += cr;
      p += cr * Number(r.grade_points);
    }
  }
  return c > 0 ? Math.round((p / c) * 100) / 100 : null;
}

export function computeCgpa(sems: { sgpa: number | null; credits: number | null }[]) {
  const valid = sems.filter((s) => s.sgpa != null);
  if (!valid.length) return null;
  const withCredits = valid.every((s) => (s.credits ?? 0) > 0);
  if (withCredits) {
    const c = valid.reduce((a, s) => a + Number(s.credits), 0);
    return Math.round((valid.reduce((a, s) => a + Number(s.sgpa) * Number(s.credits), 0) / c) * 100) / 100;
  }
  return Math.round((valid.reduce((a, s) => a + Number(s.sgpa), 0) / valid.length) * 100) / 100;
}

export async function fetchStudentData(studentId: string) {
  const [sems, docs, ach, prof] = await Promise.all([
    supabase.from("semester_records").select("*, subject_marks(*)").eq("student_id", studentId).order("semester_no"),
    supabase.from("documents").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("achievements").select("*").eq("student_id", studentId).order("created_at", { ascending: false }),
    supabase.from("profiles").select("*").eq("id", studentId).maybeSingle(),
  ]);
  for (const r of [sems, docs, ach, prof]) if (r.error) throw r.error;
  return {
    profile: prof.data as Profile | null,
    semesters: (sems.data ?? []) as SemesterRecord[],
    documents: (docs.data ?? []) as DocumentRow[],
    achievements: (ach.data ?? []) as Achievement[],
  };
}

export async function getDocumentUrl(path: string, download = false) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600, download ? { download: true } : undefined);
  if (error) throw error;
  return data.signedUrl;
}

export async function openDocument(path: string, download = false) {
  const url = await getDocumentUrl(path, download);
  window.open(url, "_blank", "noopener");
}

export async function shareDocument(path: string, title: string) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60 * 24 * 7);
  if (error) throw error;
  if (navigator.share) {
    await navigator.share({ title, url: data.signedUrl }).catch(() => {});
    return "shared";
  }
  await navigator.clipboard.writeText(data.signedUrl);
  return "copied";
}

export async function uploadFile(userId: string, file: File) {
  const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${Date.now()}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}
