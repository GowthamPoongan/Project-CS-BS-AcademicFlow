import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Award, BookOpen, FileText, Search as SearchIcon, UserRound, Download, Eye, Share2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getDocumentUrl, openDocument, shareDocument } from "@/lib/academic";

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({ meta: [{ title: "Search \u2014 AcademicFlow" }, { name: "description", content: "Universal academic search." }] }),
  component: SearchPage,
});

function SearchPage() {
  const [q, setQ] = useState("");
  const [term, setTerm] = useState("");
  const [viewer, setViewer] = useState<{ open: boolean; url?: string; title?: string }>({ open: false });
  
  useEffect(() => { const t = setTimeout(() => setTerm(q.trim().replace(/[%,()]/g, "")), 250); return () => clearTimeout(t); }, [q]);

  async function handleView(path: string, title: string) {
    try {
      const url = await getDocumentUrl(path);
      setViewer({ open: true, url, title });
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  const res = useQuery({
    queryKey: ["search", term],
    enabled: term.length >= 2,
    queryFn: async () => {
      const like = `%${term}%`;
      const [docs, ach, subj, people] = await Promise.all([
        supabase.from("documents").select("*").or(`title.ilike.${like},category.ilike.${like},file_name.ilike.${like}`).limit(20),
        supabase.from("achievements").select("*").or(`title.ilike.${like},issuer.ilike.${like},kind.ilike.${like}`).limit(20),
        supabase.from("subject_marks").select("*").or(`course_name.ilike.${like},course_code.ilike.${like}`).limit(30),
        supabase.from("profiles").select("*").or(`full_name.ilike.${like},register_no.ilike.${like},batch.ilike.${like}`).limit(20),
      ]);
      return { docs: docs.data ?? [], ach: ach.data ?? [], subj: subj.data ?? [], people: people.data ?? [] };
    },
  });
  const d = res.data;

  return (
    <AppShell title="Universal search" subtitle="Courses, marks, documents, achievements and people.">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <Input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder='Try "DBMS", "certificate", "semester 3"\u2026' className="h-14 rounded-2xl pl-12 text-base border-gray-200 bg-white focus:border-purple-400 focus:ring-purple-100 shadow-sm" />
      </div>
      {d && (
        <div className="mt-6 space-y-6">
          <Section title="Subjects & marks" icon={BookOpen} n={d.subj.length}>
            {d.subj.map((s) => <Card key={s.id} className="flex justify-between p-3"><span className="text-sm text-gray-700">{s.course_code} {s.course_name}</span><span className="font-mono text-sm text-gray-900">{s.grade ?? "\u2014"} {s.marks != null ? `\u00b7 ${s.marks}` : ""}</span></Card>)}
          </Section>
          <Section title="Documents" icon={FileText} n={d.docs.length}>
            {d.docs.map((x) => (
              <Card key={x.id} className="flex flex-wrap items-center justify-between gap-2 p-3">
                <div className="truncate text-sm font-medium text-gray-700 max-w-[200px] sm:max-w-xs">{x.title}</div>
                <div className="flex items-center gap-1">
                  <StatusBadge status={x.status} />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => handleView(x.file_path, x.title)}><Eye className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={() => openDocument(x.file_path, true).catch((e) => toast.error(e.message))}><Download className="h-4 w-4" /></Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-gray-400 hover:text-purple-600" onClick={async () => { const r = await shareDocument(x.file_path, x.title); if (r === "copied") toast.success("7-day link copied"); }}><Share2 className="h-4 w-4" /></Button>
                </div>
              </Card>
            ))}
          </Section>
          <Section title="Achievements" icon={Award} n={d.ach.length}>
            {d.ach.map((x) => <Card key={x.id} className="flex items-center justify-between p-3"><span className="text-sm text-gray-700">{x.title}</span><StatusBadge status={x.status} /></Card>)}
          </Section>
          <Section title="People" icon={UserRound} n={d.people.length}>
            {d.people.map((p) => <Card key={p.id} className="p-3 text-sm text-gray-700">{p.full_name} <span className="text-gray-400">&middot; {p.register_no ?? "\u2014"} &middot; {p.batch ?? ""}</span></Card>)}
          </Section>
        </div>
      )}

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

function Section({ title, icon: Icon, n, children }: { title: string; icon: typeof FileText; n: number; children: React.ReactNode }) {
  if (!n) return null;
  return <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-500"><Icon className="h-4 w-4 text-purple-500" />{title} ({n})</div><div className="space-y-2">{children}</div></div>;
}
