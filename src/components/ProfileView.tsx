import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useRef } from "react";
import { Camera, Edit3, Save, X, LogOut } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const ProfileView = () => {
  const { profile, refreshProfile, signOut, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: profile?.name || "",
    username: profile?.username || "",
    bio: profile?.bio || "",
    school: profile?.school || "",
    faculty: profile?.faculty || "",
    department: profile?.department || "",
  });
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update(form)
      .eq("user_id", user.id);
    if (error) {
      toast.error("Failed to save profile.");
      return;
    }
    await refreshProfile();
    setEditing(false);
    toast.success("Profile updated!");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(path, file, { upsert: true });
    if (uploadError) {
      toast.error("Failed to upload avatar.");
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
    await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("user_id", user.id);
    await refreshProfile();
    setUploading(false);
    toast.success("Avatar updated!");
  };

  if (!profile) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground font-display">Loading profile...</p></div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        {/* Avatar & header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="relative group">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-20 h-20 rounded-full object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-display font-bold text-secondary-foreground">
                {profile.name.charAt(0) || "?"}
              </div>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-colors"
            >
              <Camera size={20} className="text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            {uploading && <div className="absolute inset-0 rounded-full bg-ink/50 flex items-center justify-center"><div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /></div>}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              {editing ? (
                <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="text-2xl font-display font-bold text-foreground bg-transparent border-b-2 border-primary focus:outline-none" />
              ) : (
                <h2 className="text-2xl font-display font-bold text-foreground">{profile.name || "Set your name"}</h2>
              )}
              {editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
                  <button onClick={handleSave} className="p-2 text-primary hover:opacity-80 transition-opacity"><Save size={18} /></button>
                </div>
              ) : (
                <button onClick={() => { setEditing(true); setForm({ name: profile.name, username: profile.username, bio: profile.bio, school: profile.school, faculty: profile.faculty, department: profile.department }); }} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 size={18} />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-display">@{profile.username || "username"}</p>
          </div>
        </div>

        {/* Bio */}
        <section className="mb-6">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
          {editing ? (
            <textarea value={form.bio} onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))} rows={3} className="w-full mt-2 px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          ) : (
            <p className="mt-1 text-sm font-body text-foreground leading-relaxed">{profile.bio || "No bio yet."}</p>
          )}
        </section>

        {/* Academic details */}
        <section className="space-y-4">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Academic Details</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <DetailField label="School" value={editing ? form.school : profile.school} editing={editing} onChange={(v) => setForm((p) => ({ ...p, school: v }))} />
            <DetailField label="Faculty" value={editing ? form.faculty : profile.faculty} editing={editing} onChange={(v) => setForm((p) => ({ ...p, faculty: v }))} />
            <DetailField label="Department" value={editing ? form.department : profile.department} editing={editing} onChange={(v) => setForm((p) => ({ ...p, department: v }))} />
            <DetailField label="Username" value={editing ? form.username : profile.username} editing={editing} onChange={(v) => setForm((p) => ({ ...p, username: v }))} />
          </div>
        </section>

        {/* Sign out */}
        <div className="mt-8 lg:hidden">
          <button onClick={signOut} className="flex items-center gap-2 px-4 py-2 text-sm font-display text-muted-foreground hover:text-foreground transition-colors">
            <LogOut size={16} /> Sign Out
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const DetailField = ({ label, value, editing, onChange }: { label: string; value: string; editing: boolean; onChange: (v: string) => void }) => (
  <div>
    <p className="text-xs font-display text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <input value={value} onChange={(e) => onChange(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-display text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
    ) : (
      <p className="text-sm font-display font-medium text-foreground">{value || "—"}</p>
    )}
  </div>
);

export default ProfileView;
