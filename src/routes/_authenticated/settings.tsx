import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Camera, Loader2, Save, LogOut, Info, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { AppShell, Card } from "@/components/app/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useMe, useSignOut } from "@/lib/use-me";
import { supabase } from "@/integrations/supabase/client";
import { ProfileAvatar } from "@/components/app/profile-avatar";
import { uploadProfilePhoto } from "@/lib/profile";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — AcademicFlow" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const me = useMe();
  const signOut = useSignOut();
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  
  // Local state for the form
  const [f, setF] = useState({
    full_name: me.data?.profile?.full_name || "",
    phone: me.data?.profile?.phone || "",
    register_no: me.data?.profile?.register_no || "",
    batch: me.data?.profile?.batch || "",
  });

  if (!me.data) return null;
  const currentUser = me.data;

  async function handlePhoto(file?: File) {
    if (!file) return;
    setPhotoBusy(true);
    try {
      const profile_photo_path = await uploadProfilePhoto(currentUser.user.id, file);
      const { error } = await supabase.from("profiles").update({ profile_photo_path }).eq("id", currentUser.user.id);
      if (error) throw error;
      await me.refetch();
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not upload profile photo");
    } finally { setPhotoBusy(false); }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!f.full_name) {
      toast.error("Full name is required");
      return;
    }
    
    setBusy(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: f.full_name,
        phone: f.phone,
        register_no: f.register_no,
        batch: f.batch,
      })
      .eq("id", currentUser.user.id);
      
    setBusy(false);
    
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Settings saved successfully!");
      me.refetch();
    }
  }

  return (
    <AppShell title="Settings" subtitle="Manage your account preferences and personal information.">
      <div className="max-w-2xl">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Personal Information</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex items-center gap-4 rounded-2xl border border-purple-100 bg-gradient-to-r from-purple-50/70 to-indigo-50/60 p-4">
              <ProfileAvatar name={f.full_name} path={me.data.profile?.profile_photo_path} className="h-16 w-16 rounded-2xl ring-2 ring-white" showStatus />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900">Profile photo</p>
                <p className="mt-0.5 text-xs text-gray-500">JPG, PNG, or WebP · up to 5 MB</p>
              </div>
              <label className="inline-flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-purple-200 bg-white px-3 text-sm font-semibold text-purple-700 shadow-sm transition hover:border-purple-300 hover:bg-purple-50">
                {photoBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                {photoBusy ? "Uploading" : "Change"}
                <input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" disabled={photoBusy} onChange={(e) => { void handlePhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} />
              </label>
            </div>
            <div>
              <Label className="text-sm font-semibold text-gray-700">Full name *</Label>
              <Input 
                value={f.full_name} 
                onChange={(e) => setF({ ...f, full_name: e.target.value })} 
                className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" 
              />
            </div>
            
            {me.data.role === "student" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Register Number</Label>
                  <Input 
                    value={f.register_no} 
                    onChange={(e) => setF({ ...f, register_no: e.target.value })} 
                    className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" 
                  />
                </div>
                <div>
                  <Label className="text-sm font-semibold text-gray-700">Batch</Label>
                  <Input 
                    placeholder="2022-2026"
                    value={f.batch} 
                    onChange={(e) => setF({ ...f, batch: e.target.value })} 
                    className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" 
                  />
                </div>
              </div>
            )}
            
            <div>
              <Label className="text-sm font-semibold text-gray-700">Phone</Label>
              <Input 
                value={f.phone} 
                onChange={(e) => setF({ ...f, phone: e.target.value })} 
                className="mt-1.5 h-11 rounded-xl border-gray-200 bg-gray-50/50 focus:bg-white focus:border-purple-400" 
              />
            </div>
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={busy} className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl h-10 px-6">
                {busy ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </div>
          </form>
        </Card>

        {/* ── System & Support ── */}
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4 px-1">System & Support</h2>
          <Card className="p-2 overflow-hidden">
            <div className="divide-y divide-gray-100">
              <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50/50 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900 text-sm">Terms and Conditions</div>
                    <div className="text-xs text-gray-500">Read our usage policies</div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 transition-colors" />
              </button>
              
              <button onClick={() => void signOut()} className="w-full flex items-center justify-between p-4 hover:bg-red-50/50 transition-colors text-left group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                    <LogOut className="w-4 h-4 text-red-600" />
                  </div>
                  <div>
                    <div className="font-semibold text-red-600 text-sm">Sign Out</div>
                    <div className="text-xs text-gray-500">Log out of your account</div>
                  </div>
                </div>
              </button>
            </div>
            
            <div className="bg-gray-50 border-t border-gray-100 p-4 flex flex-col items-center justify-center text-center">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 mb-0.5">
                <Info className="w-3.5 h-3.5" />
                CS&BS AcademicFlow
              </div>
              <div className="text-[10px] text-gray-400 font-mono">Version 1.0.0</div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
