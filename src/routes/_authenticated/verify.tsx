import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Eye, X } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { openDocument } from "@/lib/academic";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/verify")({
  head: () => ({ meta: [{ title: "Verification \u2014 AcademicFlow" }, { name: "description", content: "Review submitted records." }] }),
  component: Verify,
});

type Table = "semester_records" | "documents" | "achievements";

function Verify() {
  const me = useMe();
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["pending"],
    enabled: me.data?.role === "faculty" || me.data?.role === "hod",
    queryFn: async () => {
      const [s, d, a, p] = await Promise.all([
        supabase.from("semester_records").select("*, subject_marks(*)").eq("status", "pending").order("created_at"),
        supabase.from("documents").select("*").eq("status", "pending").order("created_at"),
        supabase.from("achievements").select("*").eq("status", "pending").order("created_at"),
        supabase.from("profiles").select("id, full_name, register_no, batch"),
      ]);
      const people = Object.fromEntries((p.data ?? []).map((x) => [x.id, x]));
      return { sems: s.data ?? [], docs: d.data ?? [], ach: a.data ?? [], people };
    },
  });

  async function decide(table: Table, id: string, status: "verified" | "rejected", feedback: string) {
    if (status === "rejected" && !feedback.trim()) { toast.error("Add feedback when rejecting"); return; }
    const { error } = await supabase.from(table).update({ status, feedback: feedback || null, verified_by: me.data!.user.id, verified_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(status === "verified" ? "Verified" : "Rejected with feedback");
    qc.invalidateQueries({ queryKey: ["pending"] });
  }

  if (me.data && me.data.role === "student") return <AppShell title="Verification"><p className="text-gray-400">Faculty only.</p></AppShell>;
  const d = q.data;
  const who = (id: string) => { const p = d?.people[id]; return p ? `${p.full_name || "Unnamed"} \u00b7 ${p.register_no ?? "\u2014"}` : "Student"; };

  return (
    <AppShell title="Verification queue" subtitle="Review student submissions and verify or reject with feedback.">
      <Tabs defaultValue="sem">
        <TabsList className="bg-gray-100 rounded-xl">
          <TabsTrigger value="sem" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Semesters ({d?.sems.length ?? 0})</TabsTrigger>
          <TabsTrigger value="doc" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Documents ({d?.docs.length ?? 0})</TabsTrigger>
          <TabsTrigger value="ach" className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">Achievements ({d?.ach.length ?? 0})</TabsTrigger>
        </TabsList>
        <TabsContent value="sem" className="mt-4 space-y-3">
          {d?.sems.map((s) => (
            <Item key={s.id} title={`Semester ${s.semester_no} \u2014 GPA ${s.sgpa ?? "\u2014"}`} sub={who(s.student_id)} onDecide={(st, fb) => decide("semester_records", s.id, st, fb)}
              extra={<>
                <div className="mt-2 grid gap-1 text-sm text-gray-700">{s.subject_marks.map((m) => <div key={m.id} className="flex justify-between"><span>{m.course_code} {m.course_name}</span><span className="font-mono">{m.credits}cr &middot; {m.grade}</span></div>)}</div>
                {s.document_id && <DocBtn id={s.document_id} />}
              </>} />
          ))}
          {!d?.sems.length && <EmptyQ />}
        </TabsContent>
        <TabsContent value="doc" className="mt-4 space-y-3">
          {d?.docs.map((x) => <Item key={x.id} title={x.title} sub={`${who(x.student_id)} \u00b7 ${x.category}`} onDecide={(st, fb) => decide("documents", x.id, st, fb)}
            extra={<Button size="sm" variant="outline" className="mt-2 rounded-lg border-gray-200 text-gray-600 hover:text-purple-600" onClick={() => openDocument(x.file_path).catch((e) => toast.error(e.message))}><Eye className="h-4 w-4" />View file</Button>} />)}
          {!d?.docs.length && <EmptyQ />}
        </TabsContent>
        <TabsContent value="ach" className="mt-4 space-y-3">
          {d?.ach.map((x) => <Item key={x.id} title={x.title} sub={`${who(x.student_id)} \u00b7 ${x.kind}${x.issuer ? ` \u00b7 ${x.issuer}` : ""}`} onDecide={(st, fb) => decide("achievements", x.id, st, fb)}
            extra={<>{x.description && <p className="mt-2 text-sm text-gray-500">{x.description}</p>}{x.document_id && <DocBtn id={x.document_id} />}</>} />)}
          {!d?.ach.length && <EmptyQ />}
        </TabsContent>
      </Tabs>
    </AppShell>
  );
}

function DocBtn({ id }: { id: string }) {
  return <Button size="sm" variant="outline" className="mt-2 rounded-lg border-gray-200 text-gray-600 hover:text-purple-600" onClick={async () => {
    const { data } = await supabase.from("documents").select("file_path").eq("id", id).maybeSingle();
    if (data) openDocument(data.file_path).catch((e) => toast.error(e.message));
  }}><Eye className="h-4 w-4" />View proof</Button>;
}

function Item({ title, sub, extra, onDecide }: { title: string; sub: string; extra?: React.ReactNode; onDecide: (s: "verified" | "rejected", fb: string) => void }) {
  const [fb, setFb] = useState("");
  return (
    <Card>
      <div className="font-semibold text-gray-900">{title}</div>
      <div className="text-xs text-gray-500">{sub}</div>
      {extra}
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <Input placeholder="Feedback (required to reject)" value={fb} onChange={(e) => setFb(e.target.value)} className="h-10 rounded-xl border-gray-200 bg-gray-50/50 focus:border-purple-400" />
        <div className="flex gap-2">
          <Button className="bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl" onClick={() => onDecide("verified", fb)}><Check className="h-4 w-4" />Verify</Button>
          <Button className="bg-red-500 text-white hover:bg-red-600 rounded-xl" onClick={() => onDecide("rejected", fb)}><X className="h-4 w-4" />Reject</Button>
        </div>
      </div>
    </Card>
  );
}
function EmptyQ() { return <p className="py-10 text-center text-sm text-gray-400">All caught up.</p>; }
