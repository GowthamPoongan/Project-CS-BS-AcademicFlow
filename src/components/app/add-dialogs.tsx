import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENT_KINDS, DOC_CATEGORIES, uploadFile } from "@/lib/academic";

const selectCls = "h-9 w-full rounded-md border border-input bg-background px-3 text-sm";

export function AddDocumentDialog({ userId, trigger, onDone }: { userId: string; trigger: React.ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("certificate");
  const [sem, setSem] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { toast.error("Choose a file"); return; }
    setBusy(true);
    try {
      const path = await uploadFile(userId, file);
      const { error } = await supabase.from("documents").insert({
        student_id: userId, title: title || file.name, category, semester_no: sem ? Number(sem) : null,
        file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size,
      });
      if (error) throw error;
      toast.success("Document uploaded for verification");
      setOpen(false); setTitle(""); setFile(null); setSem("");
      onDone();
    } catch (err) {
      toast.error((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Upload document</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div><Label>Title</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. AWS Cloud Practitioner" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Category</Label>
              <select className={selectCls} value={category} onChange={(e) => setCategory(e.target.value)}>
                {DOC_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><Label>Semester (optional)</Label><Input type="number" min={1} max={8} value={sem} onChange={(e) => setSem(e.target.value)} /></div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-4 text-sm">
            <Upload className="h-4 w-4 text-primary" /><span className="truncate">{file ? file.name : "Choose PDF or image (max 20MB)"}</span>
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Upload</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function AddAchievementDialog({ userId, trigger, onDone }: { userId: string; trigger: React.ReactNode; onDone: () => void }) {
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ kind: "certificate", title: "", issuer: "", description: "", achieved_on: "", link: "" });
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.title.trim()) { toast.error("Add a title"); return; }
    setBusy(true);
    try {
      let document_id: string | null = null;
      if (file) {
        const path = await uploadFile(userId, file);
        const { data, error } = await supabase.from("documents").insert({
          student_id: userId, title: f.title, category: f.kind === "research" ? "research" : f.kind === "project" ? "project" : "certificate",
          file_path: path, file_name: file.name, mime_type: file.type, size_bytes: file.size,
        }).select("id").single();
        if (error) throw error;
        document_id = data.id;
      }
      const { error } = await supabase.from("achievements").insert({
        student_id: userId, kind: f.kind, title: f.title.trim(), issuer: f.issuer || null, description: f.description || null,
        achieved_on: f.achieved_on || null, link: f.link || null, document_id,
      });
      if (error) throw error;
      toast.success("Added — awaiting faculty verification");
      setOpen(false); setF({ kind: "certificate", title: "", issuer: "", description: "", achieved_on: "", link: "" }); setFile(null);
      onDone();
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Add achievement</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Type</Label>
              <select className={selectCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}>
                {ACHIEVEMENT_KINDS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div><Label>Date</Label><Input type="date" value={f.achieved_on} onChange={(e) => setF({ ...f, achieved_on: e.target.value })} /></div>
          </div>
          <div><Label>Title</Label><Input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div><Label>Issuer / Organisation</Label><Input value={f.issuer} onChange={(e) => setF({ ...f, issuer: e.target.value })} /></div>
          <div><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} /></div>
          <div><Label>Link (optional)</Label><Input value={f.link} onChange={(e) => setF({ ...f, link: e.target.value })} placeholder="https://" /></div>
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-3 text-sm">
            <Upload className="h-4 w-4 text-primary" /><span className="truncate">{file ? file.name : "Attach proof (optional)"}</span>
            <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <Button type="submit" className="w-full" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Save</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
