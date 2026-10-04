import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  Award, BarChart3, Bell, BookOpen, Calendar, ChevronRight, FileText,
  FolderOpen, GraduationCap, LayoutDashboard, LogOut, Search,
  Settings, ShieldCheck, Sparkles, UserRound,
} from "lucide-react";
import { useMe, useSignOut } from "@/lib/use-me";
import type { Role } from "@/lib/academic";
import { ProfileAvatar } from "@/components/app/profile-avatar";

/* ── Navigation config per role ── */
type NavItem = { to: string; label: string; icon: typeof Search; badge?: string };

const STUDENT_NAV: NavItem[] = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/records", label: "Academics", icon: BookOpen },
  { to: "/search", label: "Search", icon: Search },
  { to: "/ai", label: "AI Assistant", icon: Sparkles },
];

const FACULTY_NAV: NavItem[] = [
  { to: "/verify", label: "Verify", icon: ShieldCheck },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const HOD_NAV: NavItem[] = [
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/verify", label: "Verify", icon: ShieldCheck },
  { to: "/search", label: "Search", icon: Search },
  { to: "/profile", label: "Profile", icon: UserRound },
];

const NAV: Record<Role, NavItem[]> = { student: STUDENT_NAV, faculty: FACULTY_NAV, hod: HOD_NAV };

/* ── Mobile bottom nav ── */
const MOBILE_NAV: Record<Role, NavItem[]> = {
  student: [
    { to: "/dashboard", label: "Home", icon: LayoutDashboard },
    { to: "/records", label: "Academics", icon: BookOpen },
    { to: "/search", label: "Search", icon: Search },
    { to: "/ai", label: "AI Assistant", icon: Sparkles },
  ],
  faculty: FACULTY_NAV,
  hod: HOD_NAV,
};

/* ── Logo ── */
export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center justify-center w-10 h-10 rounded-xl overflow-hidden shadow-lg shadow-purple-900/30">
        <img src="/new logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
      </div>
      {!collapsed && (
        <div className="leading-tight">
          <div className="text-[11px] font-bold uppercase tracking-[0.15em] text-purple-300/80">CS&BS</div>
          <div className="font-display text-[15px] font-bold text-white tracking-tight">AcademicFlow</div>
        </div>
      )}
    </div>
  );
}

import { useRouter, useLocation } from "@tanstack/react-router";

/* ── Main App Shell ── */
export function AppShell({ title, subtitle, actions, centerHeader = false, children }: { title: string; subtitle?: string; actions?: ReactNode; centerHeader?: boolean; children: ReactNode }) {
  const router = useRouter();
  const location = useLocation();
  const me = useMe();
  const signOut = useSignOut();
  const role = me.data?.role ?? "student";
  const items = NAV[role];
  const mobileItems = MOBILE_NAV[role];
  const [searchFocused, setSearchFocused] = useState(false);

  const profileName = me.data?.profile?.full_name || me.data?.user.email?.split("@")[0] || "User";

  return (
    <div className="min-h-screen bg-[#F0EEF9] flex overflow-x-clip">

      {/* ── Desktop Sidebar ── */}
      <aside className="no-print hidden lg:flex fixed inset-y-0 left-0 z-40 w-[240px] flex-col bg-[#1E1B4B] overflow-hidden">
        {/* Logo */}
        <div className="relative px-6 pt-7 pb-6">
          <div className="pointer-events-none absolute -left-10 top-0 h-28 w-28 rounded-full bg-purple-400/20 blur-3xl" />
          <Logo />
        </div>

        {/* Nav items */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {items.map((i) => (
            <Link
              key={i.to + i.label}
              to={i.to}
              className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-200/70 transition-all hover:bg-white/8 hover:text-white"
              activeProps={{ className: "!bg-[#7C5CFC] !text-white shadow-lg shadow-purple-900/30" }}
            >
              <i.icon className="h-[18px] w-[18px] shrink-0" />
              <span>{i.label}</span>
              {i.badge && <span className="ml-auto text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full">{i.badge}</span>}
            </Link>
          ))}

          {/* Divider */}
          <div className="!mt-5 !mb-3 h-px bg-white/8 mx-2" />

          {/* Coming Soon items */}
          <div className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-200/40 cursor-default">
            <FolderOpen className="h-[18px] w-[18px] shrink-0" />
            <span>Attendance</span>
            <span className="ml-auto text-[9px] bg-white/5 text-purple-300/50 px-2 py-0.5 rounded-full">Soon</span>
          </div>
          <Link to="/calendar" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-200/70 transition-all hover:bg-white/8 hover:text-white" activeProps={{ className: "!bg-[#7C5CFC] !text-white" }}>
            <Calendar className="h-[18px] w-[18px] shrink-0" />
            <span>Calendar</span>
          </Link>

          {/* Divider */}
          <div className="!mt-3 !mb-3 h-px bg-white/8 mx-2" />

          {/* Profile & Settings */}
          <Link
            to="/profile"
            className="group flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-200/70 transition-all hover:bg-white/8 hover:text-white"
            activeProps={{ className: "!bg-[#7C5CFC] !text-white" }}
          >
            <UserRound className="h-[18px] w-[18px] shrink-0" />
            <span>Profile</span>
          </Link>
          <Link to="/settings" className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-[13px] font-medium text-purple-200/70 transition-all hover:bg-white/8 hover:text-white" activeProps={{ className: "!bg-[#7C5CFC] !text-white" }}>
            <Settings className="h-[18px] w-[18px] shrink-0" />
            <span>Settings</span>
          </Link>
        </nav>

        {/* Bottom CTA card */}
        <div className="p-4">
          <div className="relative rounded-2xl bg-gradient-to-br from-[#8B7CFF]/30 to-[#3f2d9b]/30 p-4 border border-purple-300/15 overflow-hidden">
            <img src="/student-hero.png" alt="" className="pointer-events-none absolute -right-7 -bottom-6 h-32 w-32 object-cover object-top opacity-35 mix-blend-screen" />
            <div className="relative z-10">
              <p className="text-[13px] font-bold text-white leading-snug">Build Your Future<br/>With AcademicFlow</p>
              <div className="mt-3 flex items-center gap-2">
                <ProfileAvatar name={profileName} path={me.data?.profile?.profile_photo_path} className="h-8 w-8 rounded-full ring-1 ring-white/30" />
                <button
                  onClick={signOut}
                  className="text-[11px] text-purple-300/70 hover:text-red-400 transition-colors font-medium flex items-center gap-1"
                >
                  <LogOut className="h-3 w-3" /> Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 lg:ml-[240px] flex flex-col min-h-screen">

        {/* ── Top Bar ── */}
        <header className={`no-print sticky top-0 z-30 transition-all ${location.pathname.startsWith('/ai') ? 'bg-transparent border-transparent shadow-none lg:bg-[#F0EEF9]/75 lg:backdrop-blur-2xl lg:border-b lg:border-white/70 lg:shadow-[0_1px_0_rgba(124,92,252,.06)]' : 'bg-[#F0EEF9]/75 backdrop-blur-2xl border-b border-white/70 shadow-[0_1px_0_rgba(124,92,252,.06)]'}`}>
          <div className="flex items-center justify-between px-4 py-3 lg:px-8 lg:py-4">

            {/* Mobile logo */}
            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center shadow-sm">
                <img src="/new logo.jpeg" alt="Logo" className="w-full h-full object-cover" />
              </div>
              <span className={`font-display text-sm font-bold ${location.pathname.startsWith('/ai') ? 'text-white' : 'text-gray-900'}`}>CS&BS AcademicFlow</span>
            </div>

            {/* Search bar */}
            <div className={`hidden lg:flex items-center flex-1 max-w-xl relative transition-all ${searchFocused ? "max-w-2xl" : ""}`}>
              <Search className="absolute left-4 h-4 w-4 text-gray-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Search marksheets, certificates, GPA, documents, subjects..."
                className="w-full h-11 pl-11 pr-20 rounded-xl bg-white border border-purple-100 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-300 transition-all shadow-sm cursor-text"
                onFocus={() => router.navigate({ to: "/search" })}
              />
              <div className="absolute right-3 flex items-center gap-1 text-[11px] text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono border border-gray-200 text-[10px]">⌘</kbd>
                <kbd className="px-1.5 py-0.5 bg-gray-100 rounded font-mono border border-gray-200 text-[10px]">K</kbd>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2 lg:gap-4">
              {/* Notification bell */}
              <button type="button" disabled aria-label="Notifications coming soon" title="Notifications coming soon" className="relative w-9 h-9 rounded-xl bg-white border border-purple-100 flex items-center justify-center text-gray-400 shadow-sm disabled:cursor-not-allowed">
                <Bell className="h-4 w-4" />
              </button>

              {/* Profile */}
              <div className="flex items-center gap-3 pl-2 lg:pl-4 lg:border-l border-purple-100">
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-gray-900 leading-none">{profileName.split(" ")[0] ?? profileName} {profileName.split(" ")[1]?.charAt(0) ? profileName.split(" ")[1]!.charAt(0) + "." : ""}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{me.data?.profile?.batch ? `${me.data.profile.batch.split("-")[0]} Year` : ""} &middot; CS&BS</div>
                </div>
                <Link to="/profile" aria-label="Open profile"><ProfileAvatar name={profileName} path={me.data?.profile?.profile_photo_path} className="h-10 w-10 rounded-full ring-2 ring-white shadow-md shadow-purple-500/20" showStatus /></Link>
                <ChevronRight className="hidden sm:block h-4 w-4 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* ── Page Content ── */}
        <main className="flex-1 px-4 pb-28 pt-4 lg:px-8 lg:pb-10 lg:pt-6 min-w-0 w-full overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.2, 0.8, 0.2, 1] }}
            className="min-w-0 w-full"
          >
            {/* Page header (hidden for Dashboard since it has its own welcome banner) */}
            {title !== "Dashboard" && title !== "" && (
              <div className={`mb-6 flex flex-wrap items-end ${centerHeader ? "justify-center text-center mx-auto" : "justify-between"} gap-3 min-w-0 w-full`}>
                <div className={`min-w-0 max-w-full ${centerHeader ? "text-center mx-auto" : ""}`}>
                  <h1 className="text-xl font-bold text-gray-900 md:text-3xl tracking-tight leading-tight">{title}</h1>
                  {subtitle && <p className={`mt-1 text-xs sm:text-sm text-gray-500 break-words max-w-2xl leading-normal ${centerHeader ? "mx-auto text-center" : ""}`}>{subtitle}</p>}
                </div>
                {actions && <div className="no-print flex flex-wrap gap-2">{actions}</div>}
              </div>
            )}
            {children}
          </motion.div>
        </main>
      </div>

      {/* ── Mobile Bottom Nav (Curved Glass) ── */}
      <div className="no-print fixed inset-x-0 bottom-4 z-50 px-4 lg:hidden pointer-events-none">
        <nav className="pointer-events-auto relative flex justify-around items-center rounded-3xl bg-white/70 backdrop-blur-xl border border-white/40 shadow-[0_8px_32px_rgba(108,92,231,0.15)] px-2 py-2">
          {mobileItems.map((i) => {
            const isActive = location.pathname.startsWith(i.to);
            return (
              <Link
                key={i.to + i.label}
                to={i.to}
                className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors z-10 ${isActive ? "text-purple-700" : "text-gray-500 hover:text-gray-800"}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-bubble"
                    className="absolute inset-0 bg-white shadow-sm rounded-2xl -z-10 border border-purple-100/50"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <i.icon className={`h-[22px] w-[22px] transition-transform ${isActive ? "scale-110" : ""}`} />
                <span className="text-[9px] font-bold tracking-wide">{i.label}</span>
              </Link>
            );
          })}
          <Link
            to="/settings"
            className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-1.5 transition-colors z-10 ${location.pathname.startsWith("/settings") ? "text-purple-700" : "text-gray-500 hover:text-gray-800"}`}
          >
            {location.pathname.startsWith("/settings") && (
              <motion.div
                layoutId="mobile-nav-bubble"
                className="absolute inset-0 bg-white shadow-sm rounded-2xl -z-10 border border-purple-100/50"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <Settings className={`h-[22px] w-[22px] transition-transform ${location.pathname.startsWith("/settings") ? "scale-110" : ""}`} />
            <span className="text-[9px] font-bold tracking-wide">More</span>
          </Link>
        </nav>
      </div>
    </div>
  );
}

/* ── Reusable Card ── */
export function Card({ className = "", children }: { className?: string; children: ReactNode }) {
  return <div className={`bg-white/90 backdrop-blur-sm rounded-2xl border border-white shadow-[0_10px_32px_-18px_rgba(66,45,150,.25)] p-5 transition-shadow duration-300 hover:shadow-[0_14px_34px_-18px_rgba(66,45,150,.32)] ${className}`}>{children}</div>;
}
