import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ChevronRight, Circle, ArrowRight } from "lucide-react";
import { AppShell, Card } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { useMe } from "@/lib/use-me";
import { fetchStudentData } from "@/lib/academic";
import { calculateProfileCompletion } from "@/lib/profile-completion";
import { Loading } from "./dashboard";

export const Route = createFileRoute("/_authenticated/profile/completion")({
  head: () => ({ meta: [{ title: "Profile Completion — AcademicFlow" }] }),
  component: ProfileCompletionPage,
});

function ProfileCompletionPage() {
  const me = useMe();
  const uid = me.data?.user.id;
  const data = useQuery({ 
    queryKey: ["student", uid], 
    queryFn: () => fetchStudentData(uid!), 
    enabled: !!uid && me.data?.role === "student" 
  });

  if (me.isLoading || data.isLoading) return <Loading />;
  if (!data.data) return null;

  const completion = calculateProfileCompletion(data.data);
  const bd = completion.breakdown;

  return (
    <AppShell title="Profile Completion" subtitle="Track your profile setup progress.">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header Card */}
        <Card className="text-center p-8 bg-gradient-to-br from-white to-purple-50/50">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white shadow-sm border border-purple-100 mb-4">
            <span className="text-3xl font-black text-purple-600">{completion.percentage}%</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Profile Complete</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            {completion.percentage === 100 
              ? "Amazing! Your AcademicFlow profile is fully set up." 
              : "Complete the remaining sections below to unlock your full AcademicFlow experience."}
          </p>
          
          <div className="mt-6 h-2 bg-gray-100 rounded-full overflow-hidden max-w-md mx-auto">
            <div className="h-full bg-purple-600 transition-all duration-1000 ease-out" style={{ width: `${completion.percentage}%` }} />
          </div>
        </Card>

        {/* Next Action Box */}
        {completion.nextRecommendedAction && (
          <div className="bg-purple-600 text-white rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg shadow-purple-200">
            <div>
              <div className="text-purple-200 text-xs font-bold uppercase tracking-wider mb-1">Recommended Next Step</div>
              <h3 className="font-semibold text-lg">{completion.nextRecommendedAction.label}</h3>
            </div>
            <Button asChild className="bg-white text-purple-600 hover:bg-purple-50 rounded-xl whitespace-nowrap">
              <Link to={completion.nextRecommendedAction.route}>
                Continue <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}

        {/* Checklist */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            <ChecklistItem 
              title="Personal Information" 
              desc="Name, Phone Number" 
              done={bd.personal} 
              route="/settings" 
            />
            <ChecklistItem 
              title="Academic Information" 
              desc="Register Number, Batch, Department, Semester" 
              done={bd.academic} 
              route="/settings" 
            />
            <ChecklistItem
              title="Profile Photo"
              desc="Add a profile photo to personalize your academic profile"
              done={bd.profilePhoto}
              route="/settings"
            />
            <ChecklistItem 
              title="Academic Records" 
              desc="Add your verified semester marks" 
              done={bd.records} 
              route="/records" 
            />
            <ChecklistItem 
              title="Achievements" 
              desc="Add certificates & extracurricular achievements" 
              done={bd.achievements} 
              route="/profile" 
            />
            <ChecklistItem 
              title="Documents" 
              desc="Upload important documents and marksheets" 
              done={bd.documents} 
              route="/records" 
            />
          </div>
        </div>

      </div>
    </AppShell>
  );
}

function ChecklistItem({ title, desc, done, route }: { title: string; desc: string; done: boolean; route: string }) {
  return (
    <Link to={route} className="flex items-center gap-4 p-5 hover:bg-gray-50 transition-colors group">
      {done ? (
        <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
      ) : (
        <Circle className="h-6 w-6 text-gray-300 shrink-0" />
      )}
      <div className="flex-1">
        <h4 className={`font-semibold ${done ? "text-gray-900" : "text-gray-700"}`}>{title}</h4>
        <p className="text-sm text-gray-500 mt-0.5">{desc}</p>
      </div>
      <ChevronRight className={`h-5 w-5 ${done ? "text-gray-300" : "text-purple-400"} group-hover:text-purple-600 transition-colors`} />
    </Link>
  );
}
