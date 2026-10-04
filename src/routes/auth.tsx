import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, BookOpen, Eye, EyeOff, GraduationCap, Loader2, Lock, Mail, ShieldCheck, Sparkles, Star, Target, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import type { Role } from "@/lib/academic";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — CS&BS AcademicFlow" },
      { name: "description", content: "Sign in or create your CS&BS AcademicFlow account." },
      { property: "og:title", content: "Sign in — CS&BS AcademicFlow" },
      { property: "og:description", content: "Access your verified academic profile." },
    ],
  }),
  component: AuthPage,
});

const ROLES: { v: Role; label: string; icon: typeof BookOpen; color: string; bgColor: string }[] = [
  { v: "student", label: "Student", icon: GraduationCap, color: "text-purple-600", bgColor: "bg-purple-100" },
  { v: "faculty", label: "Faculty / Staff", icon: BookOpen, color: "text-emerald-600", bgColor: "bg-emerald-100" },
  { v: "hod", label: "HOD", icon: ShieldCheck, color: "text-amber-600", bgColor: "bg-amber-100" },
];

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [role, setRole] = useState<Role>("student");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { if (data.session) navigate({ to: "/dashboard", replace: true }); });
    const { data } = supabase.auth.onAuthStateChange((_e, s) => { if (s) navigate({ to: "/dashboard", replace: true }); });
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin + "/dashboard", data: { full_name: name, role } },
        });
        if (error) throw error;
        if (!data.session) setSent(true);
      }
    } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  }

  async function google() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth` },
    });
    if (error) toast.error(error.message || "Google sign-in failed");
  }

  async function resetPassword() {
    if (!email) {
      toast.error("Enter your email address first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth`,
    });
    setBusy(false);
    if (error) toast.error(error.message);
    else toast.success("If an account uses that address, a reset link is on its way.");
  }

  const highlights = [
    { icon: Target, text: "Track your progress" },
    { icon: BookOpen, text: "Access your academic records" },
    { icon: Star, text: "Showcase your achievements" },
    { icon: Sparkles, text: "AI insights coming soon" },
  ];

  return (
    <div className="relative min-h-screen bg-white flex">
      {/* Left Panel: Auth form */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center justify-center w-9 h-9 bg-purple-100 rounded-xl">
                <img src="/new logo.jpeg" alt="Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
              <div className="leading-tight">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-400">CS&BS</div>
                <div className="text-sm font-bold text-gray-900">AcademicFlow</div>
              </div>
            </div>
            {mode === "login" ? (
              <div className="text-sm text-gray-500">
                New here?{" "}
                <button onClick={() => setMode("register")} className="font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                  Create account
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Have an account?{" "}
                <button onClick={() => setMode("login")} className="font-semibold text-purple-600 hover:text-purple-700 transition-colors">
                  Sign in
                </button>
              </div>
            )}
          </div>

          {sent ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <Mail className="h-7 w-7 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Check your email</h1>
              <p className="mt-3 text-sm text-gray-500 max-w-xs mx-auto">We sent a confirmation link to <b className="text-gray-700">{email}</b>. Open it to activate your account.</p>
              <Button variant="ghost" className="mt-6 text-purple-600" onClick={() => { setSent(false); setMode("login"); }}>Back to sign in</Button>
            </div>
          ) : (
            <>
              {/* Welcome text */}
              <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                  {mode === "login" ? "Welcome Back 👋" : "Get Started 🚀"}
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  {mode === "login" ? "Sign in to continue your academic journey" : "Create your academic profile"}
                </p>
              </div>

              {/* Role selector */}
              <div className="flex gap-2 p-1 mb-6 bg-gray-50 rounded-2xl">
                {ROLES.map((r) => (
                  <button
                    key={r.v}
                    type="button"
                    onClick={() => setRole(r.v)}
                    className={`flex-1 flex flex-col items-center gap-1.5 rounded-xl py-3 px-2 transition-all duration-200 ${
                      role === r.v
                        ? "bg-purple-600 text-white shadow-md shadow-purple-200"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <r.icon className={`h-5 w-5 ${role === r.v ? "text-white" : r.color}`} />
                    <span className="text-xs font-semibold">{r.label}</span>
                  </button>
                ))}
              </div>

              <form onSubmit={submit} className="space-y-4">
                {mode === "register" && (
                  <div>
                    <Label className="text-sm font-semibold text-gray-700">Full Name</Label>
                    <div className="mt-1.5 relative">
                      <Input
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your full name"
                        className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400 focus:ring-purple-100 transition-all"
                      />
                      <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-sm font-semibold text-gray-700">
                    {mode === "login" ? "Register Number / Email" : "Email"}
                  </Label>
                  <div className="mt-1.5 relative">
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your register number or email"
                      className="h-12 pl-10 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400 focus:ring-purple-100 transition-all"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold text-gray-700">Password</Label>
                  <div className="mt-1.5 relative">
                    <Input
                      type={showPwd ? "text" : "password"}
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="h-12 pl-10 pr-12 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400 focus:ring-purple-100 transition-all"
                    />
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPwd ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                    </button>
                  </div>
                </div>

                {mode === "login" && (
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-600">Remember me</span>
                    </label>
                    <button type="button" onClick={() => void resetPassword()} disabled={busy} className="text-sm font-medium text-purple-600 hover:text-purple-700 transition-colors disabled:opacity-50">
                      Forgot password?
                    </button>
                  </div>
                )}

                {role === "hod" && mode === "register" && (
                  <p className="text-[11px] text-gray-500 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                    ⚠️ Only one HOD account is allowed per department; additional requests become student accounts.
                  </p>
                )}

                <Button type="submit" size="lg" className="w-full h-14 text-base font-semibold rounded-2xl btn-gradient relative group" disabled={busy}>
                  {busy && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  {mode === "login" ? "Sign In" : "Create Account"}
                  <div className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </Button>
              </form>

              {/* Divider */}
              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-xs font-medium text-gray-400 uppercase">OR</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Google sign in */}
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 rounded-2xl border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300 font-medium transition-all"
                onClick={google}
              >
                <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Continue with Google
              </Button>

              <p className="mt-3 text-center text-[11px] text-gray-400">Google sign-in creates a student account.</p>
            </>
          )}
        </motion.div>
      </div>

      {/* Right Panel: Motivational sidebar (hidden on mobile) */}
      <motion.div
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 0.2 }}
        className="hidden lg:flex w-[420px] flex-col bg-gradient-to-b from-purple-50/80 via-white to-purple-50/60 border-l border-gray-100 p-10 justify-between"
      >
        <div>
          <motion.blockquote
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-2xl font-bold text-gray-800 leading-snug"
          >
            "Organize today<br />for a brighter tomorrow."
          </motion.blockquote>

          <div className="mt-8 space-y-4">
            {highlights.map((h, i) => (
              <motion.div
                key={h.text}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg bg-purple-100">
                  <h.icon className="h-4 w-4 text-purple-600" />
                </div>
                <span className="text-sm text-gray-600 font-medium">{h.text}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Campus image */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
          className="mt-10 relative rounded-2xl overflow-hidden shadow-lg"
        >
          <img src="/campus-bg.png" alt="Campus" className="w-full h-48 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-white">Academic Excellence</div>
                <div className="text-[11px] text-white/80">with Intelligence</div>
              </div>
            </div>
          </div>
          {/* CS&BS watermark */}
          <div className="absolute top-3 right-3 text-2xl font-bold text-white/15 tracking-wider">CS&BS</div>
        </motion.div>
      </motion.div>
    </div>
  );
}
