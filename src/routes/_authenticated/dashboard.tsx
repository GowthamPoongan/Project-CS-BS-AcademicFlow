import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  Award, BookOpen, Calendar, ChevronRight, Clock, Eye,
  FileText, Loader2, Share2, TrendingUp, Sparkles, X, UserRound, Plus, Upload
} from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { StatusBadge } from "@/components/app/status-badge";
import { Button } from "@/components/ui/button";
import { computeCgpa, fetchStudentData } from "@/lib/academic";
import { homeFor, useMe } from "@/lib/use-me";
import { calculateProfileCompletion } from "@/lib/profile-completion";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — AcademicFlow" }] }),
  component: Dashboard,
});

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good Morning";
  if (h < 17) return "Good Afternoon";
  return "Good Evening";
}

const BAR_COLORS = ["#6C5CE7", "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#14B8A6"];

function Dashboard() {
  const me = useMe();
  const uid = me.data?.user.id;
  const data = useQuery({ queryKey: ["student", uid], queryFn: () => fetchStudentData(uid!), enabled: !!uid && me.data?.role === "student" });
  const [hideBanner, setHideBanner] = useState(false);

  if (me.isLoading) return <Loading />;
  if (!me.data) return <Navigate to="/auth" />;
  if (me.data.role !== "student") return <Navigate to={homeFor(me.data.role)} replace />;
  if (!me.data.profile?.onboarded) return <Navigate to="/onboarding" replace />;
  if (data.isLoading || !data.data) return <Loading />;

  const { semesters, documents, achievements, profile } = data.data;
  const verifiedSems = semesters.filter((s) => s.status === "verified");
  const cgpa = computeCgpa(verifiedSems);
  const verifiedAch = achievements.filter((a) => a.status === "verified").length;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  const completion = calculateProfileCompletion(data.data);

  return (
    <AppShell title="Dashboard">
      {/* ── Welcome Banner ── */}
      <div className="relative rounded-[1.4rem] bg-[#26205f] p-6 md:p-8 text-white overflow-hidden mb-6 shadow-[0_20px_48px_-24px_rgba(48,35,124,.72)]">
        <img src="/campus-bg.png" alt="" className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#25205f] via-[#2a2673]/90 to-[#4331a2]/40" />
        <div className="absolute right-0 top-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
        <div className="absolute right-20 bottom-0 w-32 h-32 bg-indigo-400/10 rounded-full blur-2xl translate-y-1/2" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-5">
          <ProfileAvatar name={profile?.full_name} path={profile?.profile_photo_path} className="h-16 w-16 rounded-2xl border-2 border-white/90 md:h-20 md:w-20" imageClassName="bg-white" showStatus />
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {getGreeting()}, {firstName}! <span className="inline-block animate-wave">&#128075;</span>
            </h1>
            <p className="mt-1.5 text-purple-200/80 text-sm md:text-base font-medium">Keep learning, keep growing.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {profile?.current_semester && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-white/10"><BookOpen className="h-3 w-3" /> {romanize(profile.current_semester)} Year</span>}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-white/10"><Award className="h-3 w-3" /> CS&BS</span>
              {profile?.current_semester && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-white/10">Semester {profile.current_semester}</span>}
              {profile?.batch && <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-xs font-semibold text-purple-100 border border-white/10"><Calendar className="h-3 w-3" /> {profile.batch}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Completion Banner ── */}
      {completion.percentage < 100 && !hideBanner && (
        <div className="relative rounded-2xl bg-white border border-purple-100 p-5 mb-6 shadow-sm overflow-hidden flex flex-col md:flex-row md:items-center gap-5">
          <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-400" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2"><Sparkles className="h-4 w-4 text-amber-500" /> Complete your Academic Profile</h3>
              <button onClick={() => setHideBanner(true)} className="text-gray-400 hover:text-gray-600 p-1 md:hidden"><X className="h-4 w-4" /></button>
            </div>
            <p className="text-xs text-gray-500 mb-3 md:mb-0">Your profile is {completion.percentage}% complete. {completion.nextRecommendedAction ? `Add your ${(completion.missingItems[0] ?? "profile details").replace('_', ' ')} to unlock your full AcademicFlow.` : "Great job so far!"}</p>
            <div className="w-full md:hidden h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4"><div className="h-full bg-amber-400 transition-all" style={{ width: `${completion.percentage}%` }} /></div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col gap-1.5 min-w-[140px]">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-600"><span>Progress</span><span>{completion.percentage}%</span></div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-amber-400 transition-all" style={{ width: `${completion.percentage}%` }} /></div>
            </div>
            {completion.nextRecommendedAction && (
              <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl whitespace-nowrap">
                <Link to={completion.nextRecommendedAction.route}>Continue Setup <ChevronRight className="h-3.5 w-3.5 ml-1" /></Link>
              </Button>
            )}
            <button onClick={() => setHideBanner(true)} className="hidden md:block text-gray-400 hover:text-gray-600 p-1"><X className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      {/* ── Agentic AI Hero Video Banner (Visible below greeting on desktop & mobile) ── */}
      <div className="mb-6">
        <AgenticAiCard className="min-h-[140px] md:min-h-[150px]" />
      </div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5 mb-6">
        <StatCard 
          icon={TrendingUp} label="CGPA" 
          value={verifiedSems.length === 0 ? "—" : (cgpa?.toFixed(2) ?? "—")} 
          hint={verifiedSems.length === 0 ? "Add semester record" : "Verified records"} 
          color="purple" 
          link={verifiedSems.length === 0 ? "/records" : undefined}
        />
        <StatCard 
          icon={BookOpen} label="Semesters" 
          value={verifiedSems.length === 0 ? "0" : verifiedSems.length} 
          hint={verifiedSems.length === 0 ? "Add academic record" : "Verified"} 
          color="blue" 
          link="/records"
        />
        <StatCard 
          icon={Award} label="Achievements" 
          value={achievements.length === 0 ? "0" : verifiedAch} 
          hint={achievements.length === 0 ? "Add achievement" : "Verified"} 
          color="green" 
          link="/profile"
        />
        <StatCard 
          icon={FileText} label="Documents" 
          value={documents.length === 0 ? "0" : documents.length} 
          hint={documents.length === 0 ? "Upload document" : "Total"} 
          color="amber" 
          link="/records"
        />
        <Link to="/calendar" className="col-span-2 lg:col-span-1 block">
          <Card className="h-full flex flex-col items-center justify-center !py-4 hover:border-purple-200 transition-colors cursor-pointer group">
            <Calendar className="h-5 w-5 text-gray-400 group-hover:text-purple-500 mb-1.5 transition-colors" />
            <div className="text-xs font-semibold text-gray-400 group-hover:text-purple-600 uppercase tracking-wider transition-colors">Calendar</div>
            <div className="text-[11px] text-purple-600 font-medium mt-1 bg-purple-50 px-2 py-0.5 rounded-full">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
          </Card>
        </Link>
      </div>

      {/* ── Charts Row ── */}
      <div className="grid gap-4 lg:grid-cols-2 mb-6">
        <AcademicPerformanceChart semesters={semesters} />
        <CgpaTrendChart semesters={semesters} />
      </div>

      {/* ── Bottom Row: Documents + Achievements + Upcoming ── */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Recent Documents */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-[15px]">Recent Documents</h3>
            <Link to="/records" className="text-xs font-semibold text-purple-600 hover:text-purple-700">View All</Link>
          </div>
          <div className="space-y-3">
            {documents.length > 0 ? documents.slice(0, 4).map((d) => (
              <div key={d.id} className="flex items-center gap-3 group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${d.category === "marksheet" ? "bg-blue-50 text-blue-500" : d.category === "certificate" ? "bg-amber-50 text-amber-500" : d.category === "research" ? "bg-purple-50 text-purple-500" : "bg-gray-50 text-gray-500"}`}>
                  <FileText className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{d.title}</div>
                  <div className="text-[11px] text-gray-400">{d.mime_type?.split("/").pop()?.toUpperCase()} &middot; {d.size_bytes ? `${(d.size_bytes / 1024 / 1024).toFixed(1)} MB` : ""}</div>
                </div>
                <StatusBadge status={d.status} />
              </div>
            )) : <EmptyState text="No documents uploaded yet." link="/records" linkText="Upload document →" />}
          </div>
        </Card>

        {/* Recent Achievements */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-[15px]">Recent Achievements</h3>
            <Link to="/profile" className="text-xs font-semibold text-purple-600 hover:text-purple-700">View All</Link>
          </div>
          <div className="space-y-3">
            {achievements.length > 0 ? achievements.slice(0, 4).map((a) => (
              <div key={a.id} className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${a.kind === "certificate" ? "bg-amber-50 text-amber-500" : a.kind === "event" ? "bg-red-50 text-red-500" : a.kind === "project" ? "bg-blue-50 text-blue-500" : "bg-purple-50 text-purple-500"}`}>
                  <Award className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800 truncate">{a.title}</div>
                  <div className="text-[11px] text-gray-400">{a.issuer || a.kind}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            )) : <EmptyState text="No achievements added yet." link="/profile" linkText="Add achievement →" />}
          </div>
        </Card>

        {/* Profile Completion Overview */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900 text-[15px]">Profile Status</h3>
            <Link to="/profile/completion" className="text-xs font-semibold text-purple-600 hover:text-purple-700">View Details</Link>
          </div>
          <div className="py-2">
            <div className="flex items-end gap-2 mb-2">
              <span className="text-3xl font-black text-gray-900 leading-none">{completion.percentage}%</span>
              <span className="text-xs font-semibold text-gray-500 mb-1">Complete</span>
            </div>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-5">
              <div className="h-full bg-purple-500 transition-all" style={{ width: `${completion.percentage}%` }} />
            </div>
            
            <div className="space-y-2.5">
              <CompletionRow label="Basic Info" done={completion.breakdown.personal && completion.breakdown.academic} />
              <CompletionRow label="Profile Photo" done={completion.breakdown.profilePhoto} />
              <CompletionRow label="Academic Records" done={completion.breakdown.records} />
              <CompletionRow label="Achievements" done={completion.breakdown.achievements} />
              <CompletionRow label="Documents" done={completion.breakdown.documents} />
            </div>
          </div>
        </Card>
      </div>
    </AppShell>
  );
}

function CompletionRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-gray-600">{label}</span>
      {done ? <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">DONE</span> : <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">PENDING</span>}
    </div>
  );
}

function AcademicPerformanceChart({ semesters }: { semesters: any[] }) {
  const sortedSems = [...semesters].sort((a, b) => a.semester_no - b.semester_no);
  const semOptions = sortedSems.map((s) => s.semester_no);
  // Default to the highest semester that actually has subject marks, or just the highest if none have marks
  const defaultSem = sortedSems.slice().reverse().find(s => s.subject_marks && s.subject_marks.length > 0)?.semester_no 
    ?? (semOptions.length ? semOptions[semOptions.length - 1] : null);
  
  const [selectedSem, setSelectedSem] = useState<number | null>(defaultSem);

  const sem = semesters.find((s) => s.semester_no === selectedSem);
  const subjects = sem?.subject_marks ?? [];
  const chartData = subjects.map((m: any) => ({
    name: m.course_code || m.course_name?.split(" ").map((w: string) => w[0]).join("") || "?",
    fullName: m.course_name,
    marks: m.marks ?? (m.grade_points ? m.grade_points * 10 : 0),
  }));

  const semGpa = sem?.sgpa ?? sem?.gpa;

  return (
    <Card className="lg:col-span-1">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-gray-900 text-[15px]">Academic Performance</h3>
          {sem && <StatusBadge status={sem.status} />}
        </div>
        {semOptions.length > 0 && (
          <select value={selectedSem ?? ""} onChange={(e) => setSelectedSem(Number(e.target.value))} className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300">
            {semOptions.map((n) => <option key={n} value={n}>Semester {n}</option>)}
          </select>
        )}
      </div>
      {chartData.length > 0 ? (
        <div className="h-52">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: -10, bottom: 0 }} barSize={32}>
              <CartesianGrid stroke="#F0EEF9" vertical={false} />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }} />
              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={30} />
              <Tooltip cursor={{ fill: "rgba(108, 92, 231, 0.04)" }} contentStyle={{ borderRadius: 12, border: "1px solid #E5E1F5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12 }} formatter={(value: number, _: string, props: any) => [`${value}%`, props.payload.fullName]} />
              <Bar dataKey="marks" radius={[6, 6, 0, 0]}>
                {chartData.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : sem ? (
        <div className="py-8 px-4 bg-purple-50/40 border border-purple-100 rounded-2xl flex flex-col items-center justify-center text-center min-h-[200px]">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Semester {sem.semester_no} Grade</span>
            {semGpa != null && (
              <span className="text-sm font-black text-purple-700 bg-purple-100 px-3 py-0.5 rounded-full">
                {Number(semGpa).toFixed(2)} GPA
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-4 max-w-sm">
            Semester {sem.semester_no} record is saved ({sem.status}). Upload your marksheet or add subject-level scores to visualize your course breakdown chart.
          </p>
          <Button asChild size="sm" className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs">
            <Link to="/records">Upload Marksheet / Add Subjects →</Link>
          </Button>
        </div>
      ) : (
        <EmptyState text="No semester records yet." link="/records" linkText="Add Semester →" />
      )}
    </Card>
  );
}

import { LineChart, Line, PieChart, Pie, Legend } from "recharts";

function CgpaTrendChart({ semesters }: { semesters: any[] }) {
  const [metric, setMetric] = useState<"cgpa" | "gpa">("cgpa");
  const [chartType, setChartType] = useState<"area" | "bar" | "line">("area");
  const sorted = [...semesters].sort((a, b) => a.semester_no - b.semester_no);
  const trendData = sorted.filter((s) => s.gpa != null || s.sgpa != null).map((s) => ({ 
    sem: `S${s.semester_no}`, 
    gpa: Number(s.gpa ?? s.sgpa),
    status: s.status
  }));

  let totalWeighted = 0, totalCredits = 0;
  const withCgpa = trendData.map((d, i) => {
    const s = sorted[i];
    const cr = Number(s.credits ?? 20);
    totalWeighted += d.gpa * cr;
    totalCredits += cr;
    return { ...d, cgpa: Math.round((totalWeighted / totalCredits) * 100) / 100 };
  });

  return (
    <Card className="lg:col-span-1">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <h3 className="font-bold text-gray-900 text-[15px]">Grade Trend</h3>
        <div className="flex gap-2">
          <select value={chartType} onChange={(e) => setChartType(e.target.value as any)} className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 rounded-lg px-2 py-1.5 focus:outline-none">
            <option value="area">Area Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
          </select>
          <select value={metric} onChange={(e) => setMetric(e.target.value as any)} className="text-xs font-semibold text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-purple-300">
            <option value="cgpa">CGPA (Overall)</option>
            <option value="gpa">GPA (Per Semester)</option>
          </select>
        </div>
      </div>
      {withCgpa.length > 0 ? (
        <div className="h-52">
          <ResponsiveContainer>
            {chartType === "area" ? (
              <AreaChart data={withCgpa} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradeGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#6C5CE7" stopOpacity={0.3} /><stop offset="100%" stopColor="#6C5CE7" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid stroke="#F0EEF9" vertical={false} />
                <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={30} />
                <Tooltip formatter={(value: number, name: string, props: any) => [value, `${metric === "cgpa" ? "CGPA" : "GPA"} (${props.payload.status})`]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E1F5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12, textTransform: "capitalize" }} />
                <Area type="monotone" dataKey={metric} stroke="#6C5CE7" strokeWidth={2.5} fill="url(#gradeGrad)" dot={{ r: 4, fill: "#6C5CE7", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 6, fill: "#6C5CE7" }} />
              </AreaChart>
            ) : chartType === "bar" ? (
              <BarChart data={withCgpa} margin={{ top: 10, right: 10, left: -10, bottom: 0 }} barSize={32}>
                <CartesianGrid stroke="#F0EEF9" vertical={false} />
                <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={30} />
                <Tooltip formatter={(value: number, name: string, props: any) => [value, `${metric === "cgpa" ? "CGPA" : "GPA"} (${props.payload.status})`]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E1F5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12, textTransform: "capitalize" }} />
                <Bar dataKey={metric} radius={[6, 6, 0, 0]}>
                  {withCgpa.map((_: any, i: number) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                </Bar>
              </BarChart>
            ) : (
              <LineChart data={withCgpa} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid stroke="#F0EEF9" vertical={false} />
                <XAxis dataKey="sem" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#6B7280", fontWeight: 600 }} />
                <YAxis domain={[0, 10]} axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#9CA3AF" }} width={30} />
                <Tooltip formatter={(value: number, name: string, props: any) => [value, `${metric === "cgpa" ? "CGPA" : "GPA"} (${props.payload.status})`]} contentStyle={{ borderRadius: 12, border: "1px solid #E5E1F5", boxShadow: "0 4px 12px rgba(0,0,0,0.08)", fontSize: 12, textTransform: "capitalize" }} />
                <Line type="monotone" dataKey={metric} stroke="#F59E0B" strokeWidth={3} dot={{ r: 5, fill: "#F59E0B", stroke: "#fff", strokeWidth: 2 }} activeDot={{ r: 7, fill: "#F59E0B" }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      ) : (
        <EmptyState text="Add semester records to see your academic trend." link="/records" linkText="Add Semester →" />
      )}
    </Card>
  );
}

function StatCard({ icon: Icon, label, value, hint, color, link }: { icon: typeof TrendingUp; label: string; value: string | number; hint?: string | undefined; color: string; link?: string | undefined }) {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string }> = {
    purple: { bg: "bg-purple-50", text: "text-purple-600", iconBg: "bg-purple-100" },
    blue: { bg: "bg-blue-50", text: "text-blue-600", iconBg: "bg-blue-100" },
    green: { bg: "bg-emerald-50", text: "text-emerald-600", iconBg: "bg-emerald-100" },
    amber: { bg: "bg-amber-50", text: "text-amber-600", iconBg: "bg-amber-100" },
  };
  const c = colorMap[color] ?? colorMap["purple"]!;

  if (value === "0" || value === "—") {
    const CenterIcon = label === "Documents" ? Upload : Plus;
    const content = (
      <Card className="h-full flex flex-col items-center justify-center !py-4 hover:border-purple-200 hover:shadow-md transition-all cursor-pointer group bg-gray-50/40 border-dashed">
        <CenterIcon className={`h-5 w-5 ${c.text} opacity-60 group-hover:opacity-100 mb-1.5 transition-all group-hover:scale-110`} />
        <div className={`text-[11px] font-bold ${c.text} uppercase tracking-wider transition-colors`}>{hint}</div>
      </Card>
    );
    return link ? <Link to={link} className="block h-full">{content}</Link> : content;
  }

  const content = (
    <Card className="!p-4 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer group h-full">
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 rounded-xl ${c.iconBg} flex items-center justify-center`}><Icon className={`h-5 w-5 ${c.text}`} /></div>
        <ChevronRight className="h-4 w-4 text-gray-300 group-hover:text-purple-400 transition-colors" />
      </div>
      <div className="mt-3">
        <div className="text-2xl font-bold text-gray-900 tracking-tight">{value}</div>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className={`text-xs font-semibold ${link ? "text-purple-600 group-hover:text-purple-700" : "text-gray-400"}`}>{hint}</span>
        </div>
      </div>
    </Card>
  );

  return link ? <Link to={link} className="block h-full">{content}</Link> : content;
}

function romanize(sem: number) { return ["I", "II", "III", "IV", "V"][Math.ceil(sem / 2) - 1] || `${Math.ceil(sem / 2)}`; }

function EmptyState({ text, link, linkText }: { text: string; link?: string; linkText?: string }) {
  return (
    <div className="py-8 flex flex-col items-center justify-center text-center h-full min-h-[120px]">
      <p className="text-sm text-gray-400 mb-3">{text}</p>
      {link && linkText && <Button asChild variant="outline" size="sm" className="rounded-xl"><Link to={link}>{linkText}</Link></Button>}
    </div>
  );
}

export function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F0EEF9]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
        <p className="text-sm font-medium text-gray-400">Loading your dashboard...</p>
      </div>
    </div>
  );
}

function AgenticAiCard({ className = "" }: { className?: string }) {
  return (
    <Link to="/ai" className={`block relative group rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all border border-purple-500/20 ${className}`}>
      <video 
        src="/Agent%20video.mp4" 
        autoPlay 
        loop 
        muted 
        playsInline 
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
      />
      <div className="absolute inset-0 bg-gradient-to-r from-gray-950/90 via-gray-900/60 to-gray-950/40 md:to-transparent" />
      
      <div className="flex flex-col md:flex-row md:items-center justify-between h-full p-4 md:p-6 relative z-10 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-lg border border-white/20">
            <Sparkles className="h-5 w-5 md:h-6 md:w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-base md:text-lg font-bold text-white drop-shadow-md leading-none">Agentic AI Assistants</h3>
              <span className="text-[9px] font-black tracking-wider bg-purple-500/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-full shadow-sm uppercase">NEW</span>
            </div>
            <p className="text-xs md:text-sm text-purple-200/90 font-medium">Connect with Claude, ChatGPT, Gemini & OpenClaw seamlessly</p>
          </div>
        </div>
        
        <div className="flex justify-start md:justify-end">
          <div className="bg-white text-gray-900 text-xs md:text-sm font-bold px-6 py-2.5 rounded-full shadow-xl flex items-center gap-1.5 hover:scale-105 transition-transform active:scale-95 whitespace-nowrap">
            Create Your Agent <ChevronRight className="w-4 h-4 text-purple-600" />
          </div>
        </div>
      </div>
    </Link>
  );
}

