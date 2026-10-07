import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { ArrowRight, Award, BookOpen, Brain, Download, FileText, GraduationCap, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")(  {
  head: () => ({
    meta: [
      { title: "CS&BS AcademicFlow — Your verified academic profile" },
      { name: "description", content: "Store semester marks, certificates and projects in one verified academic profile for the CS&BS department." },
      { property: "og:title", content: "CS&BS AcademicFlow" },
      { property: "og:description", content: "One verified academic profile for CS&BS students, faculty and HOD." },
    ],
  }),
  component: Welcome,
});

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };

function Welcome() {
  const navigate = useNavigate();
  const [installEvt, setInstallEvt] = useState<BIPEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [standalone, setStandalone] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
    const h = (e: Event) => { e.preventDefault(); setInstallEvt(e as BIPEvent); };
    window.addEventListener("beforeinstallprompt", h);
    setIsIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    setStandalone(window.matchMedia("(display-mode: standalone)").matches);
    return () => window.removeEventListener("beforeinstallprompt", h);
  }, [navigate]);

  const features = [
    { icon: FileText, title: "Academic Records", desc: "Marks, GPA, Results", color: "bg-blue-50 text-blue-600", dotColor: "bg-blue-500" },
    { icon: Award, title: "Achievements", desc: "Certificates, Awards", color: "bg-amber-50 text-amber-600", dotColor: "bg-amber-500" },
    { icon: BookOpen, title: "Digital Documents", desc: "Store, Search, Share", color: "bg-purple-50 text-purple-600", dotColor: "bg-purple-500" },
    { icon: Brain, title: "Academic AI Assistant", desc: "Coming soon", color: "bg-indigo-50 text-indigo-600", dotColor: "bg-indigo-500" },
  ];

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-white flex items-center justify-center px-4">
      {/* Subtle gradient background */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-purple-50/40 via-white to-indigo-50/30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-md mx-auto flex flex-col justify-center max-h-full py-4"
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-5 mt-2">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden shadow-sm mb-3">
            <img src="/new logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 leading-tight">
            <span className="text-purple-600">CS&BS</span> AcademicFlow
          </h1>
          <p className="mt-1.5 text-gray-600 text-sm leading-relaxed">
            Your Complete Academic Journey<br />in One Place
          </p>
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-2.5">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="feature-card flex items-center gap-3 cursor-default"
            >
              <div className={`flex items-center justify-center w-9 h-9 rounded-xl ${f.color}`}>
                <f.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-gray-900 leading-tight">{f.title}</div>
                <div className="text-[11px] text-gray-500 leading-tight">{f.desc}</div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Hero character section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="relative mt-4 rounded-2xl bg-gradient-to-br from-purple-50 via-indigo-50 to-blue-50 p-4 overflow-hidden"
        >
          <div className="flex items-center gap-3">
            {/* Verified-data badge — intentionally no sample academic values. */}
            <div className="flex-shrink-0">
              <div className="bg-white rounded-2xl shadow-md p-3 text-center">
                <ShieldCheck className="mx-auto h-5 w-5 text-emerald-500" />
                <div className="mt-1 text-[10px] font-semibold text-gray-700">Verified</div>
                <div className="text-[10px] text-gray-400">your records</div>
              </div>
            </div>
            {/* Student illustration */}
            <div className="flex-1 flex justify-center">
              <img src="/student-hero.png" alt="Student" className="h-28 object-contain drop-shadow-lg" />
            </div>
          </div>

          {/* Floating badges */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute top-4 right-4 bg-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5"
          >
            <Award className="h-3.5 w-3.5 text-amber-500" />
            <span className="text-xs font-semibold text-gray-700">Marksheets</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
            className="absolute bottom-4 right-4 bg-white rounded-full px-3 py-1.5 shadow-md flex items-center gap-1.5"
          >
            <FileText className="h-3.5 w-3.5 text-purple-500" />
            <span className="text-xs font-semibold text-gray-700">Certificates</span>
          </motion.div>
        </motion.div>

        {/* Tagline */}
        <p className="mt-4 text-center text-xs font-medium text-gray-400 tracking-wide">
          Build • Store • Search • Analyze • Grow
        </p>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-3 shrink-0"
        >
          <Button asChild size="lg" className="w-full h-14 text-base font-semibold rounded-2xl btn-gradient relative group">
            <Link to="/auth" className="flex items-center justify-center gap-2">
              Get Started
              <div className="absolute right-4 flex items-center justify-center w-8 h-8 rounded-full bg-white/20 group-hover:bg-white/30 transition-colors">
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          </Button>
          {!standalone && installEvt && (
            <Button size="lg" variant="outline" className="w-full mt-2 h-12 rounded-2xl border-gray-200 text-gray-600" onClick={async () => { await installEvt.prompt(); setInstallEvt(null); }}>
              <Download className="h-4 w-4" /> Install App
            </Button>
          )}
          {!standalone && isIos && !installEvt && (
            <p className="mt-3 text-xs text-center text-gray-400">On iPhone: tap Share → "Add to Home Screen" to install.</p>
          )}
        </motion.div>

        {/* Footer */}
        <div className="mt-4 mb-2 text-center shrink-0">
          <p className="text-[10px] text-gray-400">A Department Academic Digital Platform</p>
          <p className="text-[10px] font-medium text-purple-500">A trusted academic workspace</p>
        </div>
      </motion.div>
    </div>
  );
}
