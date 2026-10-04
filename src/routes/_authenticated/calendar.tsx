import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon, Clock, MapPin, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app/app-shell";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/calendar")({
  head: () => ({ meta: [{ title: "Calendar — AcademicFlow" }] }),
  component: CalendarPage,
});

// Helper to calculate date strings YYYY-MM-DD relative to today
const getRelativeDateStr = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const EXAM_SCHEDULE = [
  { id: "1", date: getRelativeDateStr(2), time: "09:30 AM", subject: "Database Management Systems", code: "CSB301", venue: "Block A - Room 302", type: "Final Exam", color: "bg-purple-500" },
  { id: "2", date: getRelativeDateStr(5), time: "10:00 AM", subject: "Software Engineering", code: "CSB302", venue: "Block B - Room 104", type: "Final Exam", color: "bg-blue-500" },
  { id: "3", date: getRelativeDateStr(10), time: "09:30 AM", subject: "Operating Systems", code: "CSB303", venue: "Block A - Room 305", type: "Final Exam", color: "bg-indigo-500" },
  { id: "4", date: getRelativeDateStr(14), time: "02:00 PM", subject: "Discrete Mathematics", code: "CSB304", venue: "Block C - Room 201", type: "Final Exam", color: "bg-pink-500" },
];

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarPage() {
  // Always initialize to current date
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => new Date());

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

  const prevMonth = () => setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  const goToToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedDate(today);
  };

  // Calendar Grid Cells
  const cells = [];
  for (let i = 0; i < firstDayOfMonth; i++) cells.push(null);
  for (let i = 1; i <= daysInMonth; i++) cells.push(new Date(currentYear, currentMonth, i));

  // Find exams for a specific date
  const getExamsForDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const dateStr = `${year}-${month}-${day}`;
    return EXAM_SCHEDULE.filter((e) => e.date === dateStr);
  };

  // Selected Date Exams
  const selectedExams = selectedDate ? getExamsForDate(selectedDate) : EXAM_SCHEDULE;

  // Years options for selector centered on current year
  const availableYears = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 3 + i);

  return (
    <AppShell title="Academic Calendar" subtitle="Plan and track your exam schedules globally.">
      <div className="relative">
        {/* Decorative Background for Glassmorphism */}
        <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[-50px] w-72 h-72 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-20 pointer-events-none" />

        <div className="grid lg:grid-cols-3 gap-6 relative z-10">
          
          {/* Main Calendar View */}
          <div className="lg:col-span-2">
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-purple-900/5 rounded-3xl p-6">
              
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-2">
                  <select 
                    value={currentMonth} 
                    onChange={(e) => setCurrentDate(new Date(currentYear, Number(e.target.value), 1))}
                    className="text-xl font-black text-gray-900 bg-white/50 border border-white/60 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-sm"
                  >
                    {Array.from({length: 12}).map((_, i) => (
                      <option key={i} value={i}>{new Date(0, i).toLocaleString('default', { month: 'long' })}</option>
                    ))}
                  </select>
                  <select 
                    value={currentYear}
                    onChange={(e) => setCurrentDate(new Date(Number(e.target.value), currentMonth, 1))}
                    className="text-xl font-black text-purple-600 bg-white/50 border border-white/60 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer shadow-sm"
                  >
                    {availableYears.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={goToToday}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/90 hover:bg-purple-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 border border-purple-400/50"
                  >
                    Today
                  </button>
                  <button onClick={prevMonth} className="p-2 rounded-full bg-white/50 hover:bg-white/80 border border-white/50 text-gray-700 transition-all shadow-sm">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button onClick={nextMonth} className="p-2 rounded-full bg-white/50 hover:bg-white/80 border border-white/50 text-gray-700 transition-all shadow-sm">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-2 mb-2 text-center">
                {WEEKDAYS.map(day => (
                  <div key={day} className="text-xs font-bold text-gray-400 uppercase tracking-wider">{day}</div>
                ))}
              </div>

              {/* Grid */}
              <div className="grid grid-cols-7 gap-2">
                {cells.map((date, i) => {
                  if (!date) return <div key={`empty-${i}`} className="min-h-[100px]" />;
                  
                  const exams = getExamsForDate(date);
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isToday = new Date().toDateString() === date.toDateString();

                  return (
                    <div 
                      key={i} 
                      onClick={() => setSelectedDate(date)}
                      className={`min-h-[100px] p-2 rounded-2xl border transition-all cursor-pointer flex flex-col gap-1 relative overflow-hidden group
                        ${isSelected ? 'bg-purple-600/10 border-purple-400 shadow-md scale-[1.02]' : 'bg-white/30 border-white/50 hover:bg-white/60'}
                        ${isToday ? 'border-blue-400 bg-blue-50/30' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start">
                        <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-full
                          ${isSelected ? 'bg-purple-600 text-white' : isToday ? 'bg-blue-500 text-white' : 'text-gray-700'}
                        `}>
                          {date.getDate()}
                        </span>
                        {exams.length > 0 && <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 mr-1" />}
                      </div>

                      {exams.map((exam, idx) => (
                        <div key={idx} className={`text-[10px] font-semibold text-white px-1.5 py-1 rounded-md truncate shadow-sm transition-transform group-hover:-translate-y-0.5 ${exam.color}`}>
                          {exam.code}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Details / Agenda Sidebar */}
          <div className="flex flex-col gap-4">
            <div className="bg-white/40 backdrop-blur-xl border border-white/60 shadow-xl shadow-purple-900/5 rounded-3xl p-6 h-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedDate ? selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }) : "All Exams"}
                </h3>
                {selectedDate && (
                  <button onClick={() => setSelectedDate(null)} className="text-[10px] font-bold uppercase text-purple-600 bg-purple-100 px-2 py-1 rounded-full hover:bg-purple-200 transition-colors">
                    Clear
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <AnimatePresence mode="popLayout">
                  {selectedExams.map((exam) => (
                    <motion.div 
                      key={exam.id}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="bg-white/60 backdrop-blur-md border border-white/80 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden"
                    >
                      <div className={`absolute top-0 left-0 w-1 h-full ${exam.color}`} />
                      <div className="flex justify-between items-start mb-2 pl-2">
                        <span className={`text-[9px] font-black uppercase tracking-wider text-white px-2 py-0.5 rounded-full ${exam.color}`}>{exam.type}</span>
                        <span className="text-[10px] font-mono font-bold text-gray-500">{exam.code}</span>
                      </div>
                      <h4 className="font-bold text-gray-900 leading-snug pl-2 mb-3">{exam.subject}</h4>
                      <div className="space-y-1.5 pl-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <CalendarIcon className="w-3.5 h-3.5 text-gray-400" />
                          {new Date(exam.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          {exam.time}
                        </div>
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span className="truncate">{exam.venue}</span>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {selectedExams.length === 0 && (
                    <motion.div 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="flex flex-col items-center justify-center text-center py-12 text-gray-400"
                    >
                      <CalendarIcon className="w-12 h-12 mb-3 text-gray-300" />
                      <p className="text-sm font-medium">No exams scheduled for this date.</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AppShell>
  );
}
