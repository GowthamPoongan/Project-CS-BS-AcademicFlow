import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Plus, Sparkles, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { extractMarksheet } from "@/lib/ai.functions";
import { GRADE_POINTS, sgpaFromSubjects, uploadFile, type SemesterRecord } from "@/lib/academic";

type Row = { course_code: string; course_name: string; credits: string; grade: string; marks: string };
const empty = (): Row => ({ course_code: "", course_name: "", credits: "", grade: "", marks: "" });

function fileToDataUrl(f: File) {
  return new Promise<string>((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(f);
  });
}

export function SemesterEditor({
  userId,
  existing,
  defaultSemester,
  onSaved,
}: {
  userId: string;
  existing?: SemesterRecord | undefined;
  defaultSemester?: number | undefined;
  onSaved: () => void;
}) {
  const extract = useServerFn(extractMarksheet);
  const [sem, setSem] = useState(String(existing?.semester_no ?? defaultSemester ?? 1));
  const [sgpaOverride, setSgpaOverride] = useState(existing?.sgpa != null ? String(existing.sgpa) : "");
  const [rows, setRows] = useState<Row[]>(
    existing?.subject_marks?.length
      ? existing.subject_marks.map((s) => ({
          course_code: s.course_code ?? "",
          course_name: s.course_name,
          credits: s.credits != null ? String(s.credits) : "",
          grade: s.grade ?? "",
          marks: s.marks != null ? String(s.marks) : "",
        }))
      : [empty()],
  );
  const [file, setFile] = useState<File | null>(null);
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);

  const parsed = rows
    .filter((r) => r.course_name.trim())
    .map((r) => ({
      course_code: r.course_code.trim() || null,
      course_name: r.course_name.trim(),
      credits: r.credits ? Number(r.credits) : null,
      grade: r.grade.trim().toUpperCase() || null,
      grade_points: r.grade ? GRADE_POINTS[r.grade.trim().toUpperCase()] ?? null : null,
      marks: r.marks ? Number(r.marks) : null,
    }));
  const computed = sgpaFromSubjects(parsed);
  const totalCredits = parsed.reduce((a, r) => a + (r.credits ?? 0), 0);

  async function runExtract() {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.info("Auto-read works with photos/screenshots. For PDFs, enter marks below.");
      return;
    }
    setExtracting(true);
    try {
      const out = await extract({ data: { dataUrl: await fileToDataUrl(file) } });
      if (out.semester_no) setSem(String(out.semester_no));
      if (out.sgpa) setSgpaOverride(String(out.sgpa));
      if (out.subjects?.length)
        setRows(
          out.subjects.map((s) => ({
            course_code: s.course_code ?? "",
            course_name: s.course_name,
            credits: s.credits != null ? String(s.credits) : "",
            grade: s.grade ?? "",
            marks: s.marks != null ? String(s.marks) : "",
          })),
        );
      toast.success(`Read ${out.subjects?.length ?? 0} subjects — please review them.`);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setExtracting(false);
    }
  }

  async function save() {
    const semNo = Number(sem);
    if (!(semNo >= 1 && semNo <= 8)) { toast.error("Semester must be 1–8"); return; }
    if (!parsed.length && !sgpaOverride) { toast.error("Add at least one subject or a GPA"); return; }

    const invalidSubject = parsed.find(p => !p.course_name || p.credits === null || p.credits <= 0);
    if (invalidSubject) { toast.error("All subjects must have a valid name and positive credits."); return; }

    const subjectCodes = parsed.map(p => p.course_code).filter(Boolean);
    const duplicates = subjectCodes.filter((item, index) => subjectCodes.indexOf(item) !== index);
    if (duplicates.length > 0) {
      toast.error(`Duplicate subject codes found: ${duplicates.join(", ")}`);
      return;
    }

    setSaving(true);
    try {
      let document_id = existing?.document_id ?? null;
      if (file) {
        const path = await uploadFile(userId, file);
        const { data: d, error } = await supabase
          .from("documents")
          .insert({ student_id: userId, title: `Semester ${semNo} marksheet`, category: "marksheet", semester_no: semNo, file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size })
          .select("id")
          .single();
        if (error) throw error;
        document_id = d.id;
      }
      const payload = {
        student_id: userId,
        semester_no: semNo,
        sgpa: sgpaOverride ? Number(sgpaOverride) : computed,
        credits: totalCredits || null,
        status: "pending" as const,
        feedback: null,
        document_id,
      };
      const { data: rec, error } = await supabase.from("semester_records").upsert(payload, { onConflict: "student_id,semester_no" }).select("id").single();
      if (error) throw error;
      await supabase.from("subject_marks").delete().eq("semester_record_id", rec.id);
      if (parsed.length) {
        const { error: e2 } = await supabase.from("subject_marks").insert(parsed.map((p) => ({ ...p, semester_record_id: rec.id, student_id: userId })));
        if (e2) throw e2;
      }
      toast.success(`Semester ${semNo} saved and sent for verification`);
      onSaved();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  const upd = (i: number, k: keyof Row, v: string) => setRows((rs) => rs.map((r, j) => (j === i ? { ...r, [k]: v } : r)));

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-dashed border-primary/40 bg-primary/5 p-4">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Marksheet (Optional, required for verification)</Label>
        <div className="mt-2 flex flex-col gap-2 sm:flex-row">
          <label className="flex flex-1 cursor-pointer items-center gap-2 rounded-lg border border-input bg-background px-3 py-2.5 text-sm">
            <Upload className="h-4 w-4 text-primary" />
            <span className="truncate">{file ? file.name : "Choose file…"}</span>
            <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button type="button" variant="secondary" disabled={!file || extracting} onClick={runExtract}>
            {extracting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
            Auto-read marks
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Semester</Label>
          <Input type="number" min={1} max={8} value={sem} onChange={(e) => setSem(e.target.value)} disabled={!!existing} />
        </div>
        <div>
          <Label>GPA</Label>
          <Input type="number" step="0.01" value={sgpaOverride} onChange={(e) => setSgpaOverride(e.target.value)} placeholder={computed != null ? String(computed) : "auto"} />
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <Label>Subjects — review before saving</Label>
          <span className="font-mono text-xs text-muted-foreground">
            {totalCredits} cr · calc GPA {computed ?? "—"}
          </span>
        </div>
        <div className="space-y-2">
          {rows.map((r, i) => (
            <div key={i} className="grid grid-cols-12 gap-2">
              <Input className="col-span-3 sm:col-span-2" placeholder="Code" value={r.course_code} onChange={(e) => upd(i, "course_code", e.target.value)} />
              <Input className="col-span-9 sm:col-span-5" placeholder="Course name" value={r.course_name} onChange={(e) => upd(i, "course_name", e.target.value)} />
              <Input className="col-span-3 sm:col-span-1" placeholder="Cr" value={r.credits} onChange={(e) => upd(i, "credits", e.target.value)} />
              <Input className="col-span-3 sm:col-span-1" placeholder="Grade" value={r.grade} onChange={(e) => upd(i, "grade", e.target.value)} />
              <Input className="col-span-4 sm:col-span-2" placeholder="Marks" value={r.marks} onChange={(e) => upd(i, "marks", e.target.value)} />
              <Button type="button" variant="ghost" size="icon" className="col-span-2 sm:col-span-1" onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
        <Button type="button" variant="ghost" size="sm" className="mt-2" onClick={() => setRows((rs) => [...rs, empty()])}>
          <Plus className="h-4 w-4" /> Add subject
        </Button>
      </div>

      <Button className="w-full" size="lg" onClick={save} disabled={saving}>
        {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save semester
      </Button>
    </div>
  );
}
