import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Download, Eye, Plus, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { SemesterEditor } from "@/components/app/semester-editor";
import { AddAchievementDialog, AddDocumentDialog } from "@/components/app/add-dialogs";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchStudentData, getDocumentUrl, openDocument, shareDocument, type SemesterRecord } from "@/lib/academic";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/records")({
  head: () => ({ meta: [{ title: "Records \u2014 AcademicFlow" }, { name: "description", content: "Your academic records." }] }),
  component: Records,
});

function Records() {
  const me = useMe();
  const uid = me.data?.user.id;
  const q = useQuery({ queryKey: ["student", uid], queryFn: () => fetchStudentData(uid!), enabled: !!uid });
  const [edit, setEdit] = useState<{ open: boolean; rec?: SemesterRecord }>({ open: false });
  const [viewer, setViewer] = useState<{ open: boolean; url?: string; title?: string }>({ open: false });
  
  if (!uid || !q.data) return <AppShell title="Records"><div /></AppShell>;
  const { semesters, documents, achievements } = q.data;
  const refresh = () => q.refetch();
  const next = (semesters.length ? Math.max(...semesters.map((s) => s.semester_no)) : 0) + 1;

  async function handleView(path: string, title: string) {
    try {
      const url = await getDocumentUrl(path);
      setViewer({ open: true, url, title });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  return (
    <AppShell title="Academic records" subtitle="Everything you submit is verified by faculty."
      actions={<>
        <Button onClick={() => setEdit({ open: true })} className="rounded-xl btn-gradient"><Plus className="h-4 w-4" />Semester</Button>
        <AddDocumentDialog userId={uid} onDone={refresh} trigger={<Button variant="outline" className="rounded-xl border-gray-200">Document</Button>} />
        <AddAchievementDialog userId={uid} onDone={refresh} trigger={<Button variant="outline" className="rounded-xl border-gray-200">Achievement</Button>} />
      </>}>
      <h2 className="mb-3 text-lg font-bold text-gray-900">Semesters</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {semesters.map((s) => (
          <Card key={s.id}>
            <div className="flex items-center justify-between"><div className="font-semibold text-gray-900">Semester {s.semester_no}</div><StatusBadge status={s.status} /></div>
            <div className="mt-1 font-mono text-xs text-gray-500">GPA {s.sgpa ?? "\u2014"} &middot; {s.credits ?? 0} credits</div>
            {s.feedback && <p className="mt-2 text-xs text-red-500">&ldquo;{s.feedback}&rdquo;</p>}
            <div className="mt-3 space-y-1 text-sm text-gray-700">
              {s.subject_marks.map((m) => <div key={m.id} className="flex justify-between gap-2"><span className="truncate">{m.course_code} {m.course_name}</span><span className="font-mono">{m.grade ?? "\u2014"}</span></div>)}
            </div>
            {s.status !== "verified" && <Button size="sm" variant="ghost" className="mt-3 text-purple-600 hover:text-purple-700" onClick={() => setEdit({ open: true, rec: s })}>Edit</Button>}
          </Card>
        ))}
        {!semesters.length && <p className="text-sm text-gray-400">No semesters yet.</p>}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">Documents</h2>
      <div className="space-y-2">
        {documents.map((d) => (
          <Card key={d.id} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <div className="min-w-0"><div className="truncate font-semibold text-gray-900">{d.title}</div><div className="text-xs capitalize text-gray-500">{d.category}{d.semester_no ? ` \u00b7 S${d.semester_no}` : ""}</div></div>
            <div className="flex items-center gap-1">
              <StatusBadge status={d.status} />
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-purple-600" onClick={() => handleView(d.file_path, d.title)}><Eye className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-purple-600" onClick={() => openDocument(d.file_path, true).catch((e) => toast.error(e.message))}><Download className="h-4 w-4" /></Button>
              <Button size="icon" variant="ghost" className="text-gray-400 hover:text-purple-600" onClick={async () => { const r = await shareDocument(d.file_path, d.title); if (r === "copied") toast.success("7-day link copied"); }}><Share2 className="h-4 w-4" /></Button>
            </div>
          </Card>
        ))}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-bold text-gray-900">Achievements</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {achievements.map((a) => (
          <Card key={a.id}>
            <div className="flex items-center justify-between gap-2"><div className="font-semibold text-gray-900">{a.title}</div><StatusBadge status={a.status} /></div>
            <div className="text-xs capitalize text-gray-500">{a.kind}{a.issuer ? ` \u00b7 ${a.issuer}` : ""}{a.achieved_on ? ` \u00b7 ${a.achieved_on}` : ""}</div>
            {a.description && <p className="mt-2 text-sm text-gray-500">{a.description}</p>}
          </Card>
        ))}
      </div>

      <Dialog open={edit.open} onOpenChange={(o) => setEdit({ open: o })}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-white">
          <DialogHeader><DialogTitle className="text-gray-900">{edit.rec ? `Edit semester ${edit.rec.semester_no}` : "Add semester"}</DialogTitle></DialogHeader>
          <SemesterEditor userId={uid} existing={edit.rec} defaultSemester={next} onSaved={() => { setEdit({ open: false }); refresh(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={viewer.open} onOpenChange={(o) => setViewer({ open: o, url: undefined, title: undefined })}>
        <DialogContent className="max-h-[90vh] max-w-4xl w-[95vw] h-[85vh] flex flex-col bg-white overflow-hidden p-0">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 truncate pr-4">{viewer.title}</h3>
          </div>
          <div className="flex-1 bg-gray-50 overflow-hidden relative">
            {viewer.url ? (
              <iframe src={viewer.url} className="absolute inset-0 w-full h-full border-0" title={viewer.title} />
            ) : (
              <div className="flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}
