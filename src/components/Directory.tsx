import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { MessageCircle, Users, Video, User, Compass, Upload, LogOut } from "lucide-react";

interface DirectoryProps {
  onSelectChat: (userId: string) => void;
  activeChat?: string;
  onNavChange?: (view: string) => void;
}

const Directory = ({ onSelectChat, activeChat, onNavChange }: DirectoryProps) => {
  const { user, signOut } = useAuth();
  const [friends, setFriends] = useState<Tables<"profiles">[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetchConnections = async () => {
      const { data: connections } = await supabase
        .from("connections")
        .select("*")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted");
      const partnerIds = connections?.map((c) => (c.requester_id === user.id ? c.addressee_id : c.requester_id)) || [];
      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", partnerIds);
        setFriends(profiles || []);
      }
    };
    fetchConnections();
  }, [user]);

  const onlineFriends = friends.filter((u) => u.online);
  const offlineFriends = friends.filter((u) => !u.online);

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-display font-bold text-sidebar-foreground tracking-tight">Student Konnect</h2>
      </div>

      <nav className="p-3 space-y-1">
        <NavItem icon={<Video size={16} />} label="Feed" onClick={() => onNavChange?.("feed")} />
        <NavItem icon={<Compass size={16} />} label="Explore" onClick={() => onNavChange?.("explore")} />
        <NavItem icon={<Upload size={16} />} label="Upload" onClick={() => onNavChange?.("upload")} />
        <NavItem icon={<MessageCircle size={16} />} label="Messages" onClick={() => onNavChange?.("messages")} />
        <NavItem icon={<Users size={16} />} label="Connections" onClick={() => onNavChange?.("connections")} />
        <NavItem icon={<User size={16} />} label="Profile" onClick={() => onNavChange?.("profile")} />
      </nav>

      <div className="px-3 mt-5 flex-1 overflow-y-auto">
        <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Friends ({friends.length})
        </p>
        <div className="space-y-0.5">
          {onlineFriends.map((u) => (
            <FriendItem key={u.id} profile={u} active={activeChat === u.user_id} onClick={() => onSelectChat(u.user_id)} />
          ))}
          {offlineFriends.map((u) => (
            <FriendItem key={u.id} profile={u} active={activeChat === u.user_id} onClick={() => onSelectChat(u.user_id)} />
          ))}
          {friends.length === 0 && (
            <p className="text-xs text-muted-foreground font-body px-2 py-4">No connections yet. Visit the Connect tab to find students!</p>
          )}
        </div>
      </div>

      <div className="p-3 border-t border-sidebar-border">
        <button onClick={signOut} className="w-full flex items-center gap-2.5 px-2 py-2 text-sm font-display font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) => (
  <button onClick={onClick} className="w-full flex items-center gap-2.5 px-2 py-2 text-sm font-display font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors">
    {icon}
    {label}
  </button>
);

const FriendItem = ({ profile, active, onClick }: { profile: Tables<"profiles">; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-sm font-display rounded transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
  >
    <div className="relative">
      {profile.avatar_url ? (
        <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
      ) : (
        <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground">{profile.name.charAt(0)}</div>
      )}
      {profile.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-sidebar" />}
    </div>
    <span className="truncate">{profile.name}</span>
  </button>
);

export default Directory;
