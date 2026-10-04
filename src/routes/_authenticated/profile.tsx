import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Printer, Share2 } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { computeCgpa, fetchStudentData } from "@/lib/academic";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Academic profile \u2014 AcademicFlow" }, { name: "description", content: "Your academic portfolio." }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const me = useMe();
  const uid = me.data?.user.id;
  const q = useQuery({ queryKey: ["student", uid], queryFn: () => fetchStudentData(uid!), enabled: !!uid });
  const p = q.data?.profile ?? me.data?.profile;
  const isStudent = me.data?.role === "student";
  const sems = q.data?.semesters ?? [];
  const cgpa = computeCgpa(sems.filter((s) => s.status === "verified"));

  async function share() {
    const text = `${p?.full_name} (${p?.register_no}) \u2014 CS&BS, Batch ${p?.batch}\nVerified CGPA: ${cgpa ?? "\u2014"}\n` +
      sems.map((s) => `Sem ${s.semester_no}: GPA ${s.sgpa ?? "\u2014"} (${s.status})`).join("\n") +
      "\nAchievements:\n" + (q.data?.achievements ?? []).filter((a) => a.status === "verified").map((a) => `\u2022 ${a.title}`).join("\n");
    if (navigator.share) await navigator.share({ title: "Academic profile", text }).catch(() => {});
    else { await navigator.clipboard.writeText(text); toast.success("Profile summary copied"); }
  }

  return (
    <AppShell title="Academic profile" subtitle={isStudent ? "Your verified portfolio \u2014 print or share it." : "Your account"}
      actions={isStudent ? <><Button variant="outline" className="rounded-xl border-gray-200" onClick={() => window.print()}><Printer className="h-4 w-4" />Save as PDF</Button><Button onClick={share} className="rounded-xl btn-gradient"><Share2 className="h-4 w-4" />Share</Button></> : undefined}>
      <Card>
        <div className="flex items-center gap-4">
          <ProfileAvatar name={p?.full_name} path={p?.profile_photo_path} className="h-16 w-16 rounded-2xl ring-2 ring-purple-100" showStatus />
          <div>
            <div className="text-2xl font-bold text-gray-900">{p?.full_name || me.data?.user.email}</div>
            <div className="mt-1 text-sm text-gray-500">{p?.email} &middot; {me.data?.role === "hod" ? "Head of Department" : me.data?.role} &middot; {p?.department}</div>
          </div>
        </div>
        {isStudent && <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 text-sm">
          <div><div className="text-xs text-gray-400">Register no.</div><span className="font-medium text-gray-900">{p?.register_no ?? "\u2014"}</span></div>
          <div><div className="text-xs text-gray-400">Batch</div><span className="font-medium text-gray-900">{p?.batch ?? "\u2014"}</span></div>
          <div><div className="text-xs text-gray-400">Semester</div><span className="font-medium text-gray-900">{p?.current_semester ?? "\u2014"}</span></div>
          <div><div className="text-xs text-gray-400">Verified CGPA</div><span className="font-mono text-lg font-bold text-purple-600">{cgpa?.toFixed(2) ?? "\u2014"}</span></div>
        </div>}
      </Card>
      {isStudent && <>
        <Card className="mt-4"><h3 className="font-bold text-gray-900">Semester record</h3>
          <div className="mt-3 divide-y divide-gray-100">{sems.map((s) => <div key={s.id} className="flex items-center justify-between py-2.5 text-sm"><span className="text-gray-700">Semester {s.semester_no}</span><span className="flex items-center gap-3 font-mono text-gray-900">{s.sgpa ?? "\u2014"}<StatusBadge status={s.status} /></span></div>)}</div>
        </Card>
        <Card className="mt-4"><h3 className="font-bold text-gray-900">Achievements</h3>
          <div className="mt-3 space-y-2">{(q.data?.achievements ?? []).map((a) => <div key={a.id} className="flex items-center justify-between text-sm"><span className="text-gray-700">{a.title} <span className="text-gray-400 capitalize">&middot; {a.kind}</span></span><StatusBadge status={a.status} /></div>)}</div>
        </Card>
      </>}
    </AppShell>
  );
}
