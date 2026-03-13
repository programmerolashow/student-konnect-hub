import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Megaphone, Users, BookOpen, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StacksProps {
  context: "feed" | "chat" | "profile";
}

const Stacks = ({ context }: StacksProps) => {
  const { user, profile } = useAuth();
  const [suggested, setSuggested] = useState<Tables<"profiles">[]>([]);
  const [announcements, setAnnouncements] = useState<{ id: string; title: string; source: string; date: string }[]>([
    { id: "a1", title: "Mid-semester exams start March 20", source: "Academic Office", date: "2026-03-10" },
    { id: "a2", title: "Hackathon registration open", source: "CS Department", date: "2026-03-09" },
    { id: "a3", title: "Library hours extended during exams", source: "University Library", date: "2026-03-08" },
  ]);

  useEffect(() => {
    const fetchSuggested = async () => {
      if (!user) return;
      // Get connected user IDs to exclude
      const { data: connections } = await supabase
        .from("connections")
        .select("requester_id, addressee_id")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);
      
      const connectedIds = new Set<string>();
      connections?.forEach((c) => {
        connectedIds.add(c.requester_id === user.id ? c.addressee_id : c.requester_id);
      });

      const { data } = await supabase.from("profiles").select("*").neq("user_id", user.id).limit(20);
      // Filter out already connected, prioritize same department/school
      const unconnected = (data || []).filter((p) => !connectedIds.has(p.user_id));
      
      // Sort: same department first, then same school
      unconnected.sort((a, b) => {
        const aScore = (a.department === profile?.department ? 2 : 0) + (a.school === profile?.school ? 1 : 0);
        const bScore = (b.department === profile?.department ? 2 : 0) + (b.school === profile?.school ? 1 : 0);
        return bScore - aScore;
      });

      setSuggested(unconnected.slice(0, 5));
    };
    fetchSuggested();
  }, [user, profile]);

  const handleConnect = async (profileUserId: string) => {
    if (!user) return;
    await supabase.from("connections").insert({ requester_id: user.id, addressee_id: profileUserId, status: "pending" });
    await supabase.from("notifications").insert({ user_id: profileUserId, type: "connection_request", title: "New Connection Request", body: "Someone wants to connect with you!" });
    setSuggested((prev) => prev.filter((p) => p.user_id !== profileUserId));
    toast.success("Connection request sent!");
  };

  return (
    <div className="h-full bg-sidebar border-l border-sidebar-border p-4 space-y-6 overflow-y-auto">
      {context === "feed" && (
        <>
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Megaphone size={14} className="text-primary" />
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Announcements</h3>
            </div>
            <div className="space-y-3">
              {announcements.map((a) => (
                <div key={a.id} className="p-3 bg-accent rounded-md">
                  <p className="text-sm font-display font-medium text-foreground">{a.title}</p>
                  <p className="text-xs text-muted-foreground font-display mt-1">{a.source} · {a.date}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-primary" />
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">People you may know</h3>
            </div>
            <div className="space-y-2">
              {suggested.map((p) => (
                <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors group">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">{p.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-display">{p.department}</p>
                  </div>
                  <button onClick={() => handleConnect(p.user_id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary hover:opacity-80" title="Send connection request">
                    <UserPlus size={14} />
                  </button>
                </div>
              ))}
              {suggested.length === 0 && <p className="text-xs text-muted-foreground font-body">No suggestions right now.</p>}
            </div>
          </section>
        </>
      )}

      {context === "chat" && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={14} className="text-primary" />
            <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Shared Media</h3>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-secondary rounded-sm" />
            ))}
          </div>
        </section>
      )}

      {context === "profile" && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Users size={14} className="text-primary" />
            <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Suggested Connections</h3>
          </div>
          <div className="space-y-2">
            {suggested.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors group">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">{p.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-display font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-display">{p.school}</p>
                </div>
                <button onClick={() => handleConnect(p.user_id)} className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-primary hover:opacity-80" title="Connect">
                  <UserPlus size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Stacks;
