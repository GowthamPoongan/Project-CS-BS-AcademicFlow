import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell, Card } from "@/components/app/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { computeCgpa } from "@/lib/academic";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Department analytics \u2014 AcademicFlow" }, { name: "description", content: "HOD analytics." }] }),
  component: Analytics,
});

function Analytics() {
  const me = useMe();
  const q = useQuery({
    queryKey: ["analytics"],
    enabled: me.data?.role === "hod" || me.data?.role === "faculty",
    queryFn: async () => {
      const [p, r, s, m, d, a] = await Promise.all([
        supabase.from("profiles").select("*"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("semester_records").select("student_id, sgpa, credits, status"),
        supabase.from("subject_marks").select("grade_points"),
        supabase.from("documents").select("status"),
        supabase.from("achievements").select("status"),
      ]);
      const studentIds = new Set((r.data ?? []).filter((x) => x.role === "student").map((x) => x.user_id));
      const students = (p.data ?? []).filter((x) => studentIds.has(x.id)).map((st) => ({ ...st, cgpa: computeCgpa((s.data ?? []).filter((x) => x.student_id === st.id)) }));
      const pending = [...(s.data ?? []), ...(d.data ?? []), ...(a.data ?? [])].filter((x) => x.status === "pending").length;
      const gp = (m.data ?? []).filter((x) => x.grade_points != null);
      const pass = gp.length ? Math.round((gp.filter((x) => Number(x.grade_points) > 0).length / gp.length) * 100) : null;
      return { students, pending, pass };
    },
  });
  if (!q.data) return <AppShell title="Department analytics"><p className="text-gray-400">{me.data?.role === "student" ? "HOD only." : "Loading\u2026"}</p></AppShell>;
  const { students, pending, pass } = q.data;
  const withC = students.filter((x) => x.cgpa != null);
  const avg = withC.length ? (withC.reduce((a, x) => a + x.cgpa!, 0) / withC.length).toFixed(2) : "\u2014";
  const buckets = ["<6", "6\u20137", "7\u20138", "8\u20139", "9+"].map((label, i) => ({ label, count: withC.filter((x) => { const c = x.cgpa!; return i === 0 ? c < 6 : i === 4 ? c >= 9 : c >= 5 + i && c < 6 + i; }).length }));
  const batches = Object.entries(withC.reduce<Record<string, number[]>>((acc, x) => { (acc[x.batch ?? "\u2014"] ??= []).push(x.cgpa!); return acc; }, {}))
    .map(([batch, v]) => ({ batch, avg: Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 }));
  const top = [...withC].sort((a, b) => b.cgpa! - a.cgpa!).slice(0, 8);
  const tt = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.05)" };

  return (
    <AppShell title="Department analytics" subtitle="Live from verified and submitted student records.">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {([["Students", students.length], ["Avg CGPA", avg], ["Pass rate", pass != null ? `${pass}%` : "\u2014"], ["Pending reviews", pending]] as const).map(([l, v]) => (
          <Card key={l as string} className="p-4 hover:shadow-md transition-shadow">
            <div className="text-xs uppercase tracking-wider text-gray-400 font-semibold">{l}</div>
            <div className="mt-2 font-mono text-3xl font-bold text-gray-900">{v}</div>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card><h3 className="font-bold text-gray-900">CGPA distribution</h3><div className="mt-4 h-56"><ResponsiveContainer><BarChart data={buckets}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="label" stroke="#94a3b8" fontSize={12} /><YAxis allowDecimals={false} stroke="#94a3b8" fontSize={12} width={28} /><Tooltip contentStyle={tt} /><Bar dataKey="count" fill="#6C5CE7" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card><h3 className="font-bold text-gray-900">Batch-wise average CGPA</h3><div className="mt-4 h-56"><ResponsiveContainer><BarChart data={batches}><CartesianGrid stroke="#f1f5f9" vertical={false} /><XAxis dataKey="batch" stroke="#94a3b8" fontSize={12} /><YAxis domain={[0, 10]} stroke="#94a3b8" fontSize={12} width={28} /><Tooltip contentStyle={tt} /><Bar dataKey="avg" fill="#7C5CFC" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card className="mt-4"><h3 className="font-bold text-gray-900">Top performers</h3>
        <div className="mt-3 divide-y divide-gray-100">{top.map((s, i) => <div key={s.id} className="flex justify-between py-2.5 text-sm"><span className="text-gray-700"><span className="mr-3 font-mono text-gray-400">{i + 1}</span>{s.full_name} <span className="text-gray-400">&middot; {s.register_no}</span></span><span className="font-mono font-bold text-purple-600">{s.cgpa!.toFixed(2)}</span></div>)}
          {!top.length && <p className="py-6 text-center text-sm text-gray-400">No student records yet.</p>}</div>
      </Card>
    </AppShell>
  );
}
