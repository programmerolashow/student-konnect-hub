import { currentUser } from "@/lib/mock-data";
import { useState } from "react";
import { Camera, Edit3, Save, X } from "lucide-react";
import { motion } from "framer-motion";

const ProfileView = () => {
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({ ...currentUser });

  const handleSave = () => {
    setEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Avatar & header */}
        <div className="flex items-start gap-5 mb-8">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-2xl font-display font-bold text-secondary-foreground">
              {profile.name.charAt(0)}
            </div>
            <button className="absolute inset-0 rounded-full bg-ink/0 group-hover:bg-ink/40 flex items-center justify-center transition-colors">
              <Camera size={20} className="text-primary-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between">
              {editing ? (
                <input
                  value={profile.name}
                  onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                  className="text-2xl font-display font-bold text-foreground bg-transparent border-b-2 border-primary focus:outline-none"
                />
              ) : (
                <h2 className="text-2xl font-display font-bold text-foreground">{profile.name}</h2>
              )}
              {editing ? (
                <div className="flex gap-2">
                  <button onClick={() => setEditing(false)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                  <button onClick={handleSave} className="p-2 text-primary hover:opacity-80 transition-opacity">
                    <Save size={18} />
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditing(true)} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
                  <Edit3 size={18} />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground font-display">@{profile.username}</p>
          </div>
        </div>

        {/* Bio */}
        <section className="mb-6">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Bio</label>
          {editing ? (
            <textarea
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              rows={3}
              className="w-full mt-2 px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
            />
          ) : (
            <p className="mt-1 text-sm font-body text-foreground leading-relaxed">{profile.bio}</p>
          )}
        </section>

        {/* Academic details */}
        <section className="space-y-4">
          <label className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Academic Details</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
            <DetailField label="School" value={profile.school} editing={editing} onChange={(v) => setProfile((p) => ({ ...p, school: v }))} />
            <DetailField label="Faculty" value={profile.faculty} editing={editing} onChange={(v) => setProfile((p) => ({ ...p, faculty: v }))} />
            <DetailField label="Department" value={profile.department} editing={editing} onChange={(v) => setProfile((p) => ({ ...p, department: v }))} />
            <DetailField label="Username" value={profile.username} editing={editing} onChange={(v) => setProfile((p) => ({ ...p, username: v }))} />
          </div>
        </section>

        {/* Stats */}
        <section className="mt-8 grid grid-cols-3 gap-4">
          <StatBox label="Connections" value="128" />
          <StatBox label="Videos" value="12" />
          <StatBox label="Groups" value="5" />
        </section>
      </motion.div>
    </div>
  );
};

const DetailField = ({
  label,
  value,
  editing,
  onChange,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
}) => (
  <div>
    <p className="text-xs font-display text-muted-foreground mb-1">{label}</p>
    {editing ? (
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm font-display text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
    ) : (
      <p className="text-sm font-display font-medium text-foreground">{value}</p>
    )}
  </div>
);

const StatBox = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-accent rounded-lg p-4 text-center">
    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
    <p className="text-xs font-display text-muted-foreground mt-1">{label}</p>
  </div>
);

export default ProfileView;
