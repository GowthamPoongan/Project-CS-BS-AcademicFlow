import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/app/app-shell";
import { SemesterEditor } from "@/components/app/semester-editor";
import { supabase } from "@/integrations/supabase/client";
import { useMe } from "@/lib/use-me";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({ meta: [{ title: "Set up your profile — AcademicFlow" }, { name: "description", content: "Academic profile setup." }] }),
  component: Onboarding,
});

const STEPS = ["Profile", "Semester records", "Finish"];

function Onboarding() {
  const me = useMe();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<number[]>([]);
  const [f, setF] = useState({ full_name: "", register_no: "", batch: "", current_semester: "", phone: "" });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const p = me.data?.profile;
    if (p) setF({ full_name: p.full_name ?? "", register_no: p.register_no ?? "", batch: p.batch ?? "", current_semester: p.current_semester ? String(p.current_semester) : "", phone: p.phone ?? "" });
  }, [me.data?.profile]);

  if (!me.data) return <div className="flex min-h-screen items-center justify-center bg-white"><Loader2 className="h-6 w-6 animate-spin text-purple-600" /></div>;
  const uid = me.data.user.id;

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!f.full_name || !f.register_no || !f.batch || !f.current_semester) { toast.error("Fill all required fields"); return; }
    setBusy(true);
    const { error } = await supabase.from("profiles").update({
      full_name: f.full_name, register_no: f.register_no.trim().toUpperCase(), batch: f.batch, current_semester: Number(f.current_semester), phone: f.phone || null,
    }).eq("id", uid);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setStep(1);
  }

  async function finish() {
    setBusy(true);
    const { error } = await supabase.from("profiles").update({ onboarded: true }).eq("id", uid);
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    await qc.invalidateQueries();
    navigate({ to: "/dashboard", replace: true });
  }

  const nextSem = (saved.length ? Math.max(...saved) : 0) + 1;

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="mx-auto max-w-2xl px-4 py-6 md:py-10">
        <Logo />
        <div className="mt-8 flex items-center gap-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-1 items-center gap-2">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < step ? "bg-emerald-500 text-white" : i === step ? "bg-purple-600 text-white" : "bg-gray-100 text-gray-400"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`hidden text-xs font-medium sm:inline ${i === step ? "text-gray-900" : "text-gray-400"}`}>{s}</span>
              {i < STEPS.length - 1 && <div className={`h-px flex-1 ${i < step ? "bg-emerald-400" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 md:p-7">
            {step === 0 && (
              <form onSubmit={saveProfile} className="space-y-4">
                <div><h2 className="text-xl font-bold text-gray-900">Tell us about you</h2><p className="text-sm text-gray-500">This forms the header of your academic profile.</p></div>
                <div><Label className="text-sm font-semibold text-gray-700">Full name *</Label><Input value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label className="text-sm font-semibold text-gray-700">Register number *</Label><Input value={f.register_no} onChange={(e) => setF({ ...f, register_no: e.target.value })} className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" /></div>
                  <div><Label className="text-sm font-semibold text-gray-700">Batch *</Label><Input placeholder="2022-2026" value={f.batch} onChange={(e) => setF({ ...f, batch: e.target.value })} className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" /></div>
                  <div><Label className="text-sm font-semibold text-gray-700">Current semester *</Label><Input type="number" min={1} max={8} value={f.current_semester} onChange={(e) => setF({ ...f, current_semester: e.target.value })} className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" /></div>
                  <div><Label className="text-sm font-semibold text-gray-700">Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" /></div>
                </div>
                <Button type="submit" size="lg" className="w-full h-12 rounded-2xl btn-gradient" disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Continue</Button>
              </form>
            )}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Add completed semesters</h2>
                  <p className="text-sm text-gray-500">Upload a marksheet photo and we'll read the grades for you to review. Saved: {saved.length ? saved.map((s) => `S${s}`).join(", ") : "none yet"}.</p>
                </div>
                <SemesterEditor key={nextSem} userId={uid} defaultSemester={nextSem} onSaved={() => setSaved((s) => [...s, nextSem])} />
                <Button variant="ghost" className="w-full text-gray-500 hover:text-purple-600" onClick={() => setStep(2)}>{saved.length ? "Done adding semesters" : "Skip for now"}</Button>
              </div>
            )}
            {step === 2 && (
              <div className="py-6 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50"><Check className="h-7 w-7 text-emerald-600" /></div>
                <h2 className="mt-4 text-xl font-bold text-gray-900">Profile ready</h2>
                <p className="mx-auto mt-2 max-w-sm text-sm text-gray-500">Your records are queued for faculty verification. Your dashboard is generated from what you've submitted.</p>
                <Button size="lg" className="mt-6 rounded-2xl btn-gradient" onClick={finish} disabled={busy}>{busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}Open my dashboard</Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
