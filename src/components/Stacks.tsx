import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Megaphone, Users, BookOpen } from "lucide-react";
import { announcements } from "@/lib/mock-data";

interface StacksProps {
  context: "feed" | "chat" | "profile";
}

const Stacks = ({ context }: StacksProps) => {
  const { user } = useAuth();
  const [suggested, setSuggested] = useState<Tables<"profiles">[]>([]);

  useEffect(() => {
    const fetchSuggested = async () => {
      const { data } = await supabase.from("profiles").select("*").neq("user_id", user?.id || "").limit(5);
      setSuggested(data || []);
    };
    fetchSuggested();
  }, [user]);

  return (
    <div className="h-full bg-sidebar border-l border-sidebar-border p-4 space-y-6">
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
                <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">{p.name.charAt(0)}</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-display">{p.department}</p>
                  </div>
                </div>
              ))}
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
              <div key={i} className="aspect-square bg-concrete rounded-sm" />
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
              <div key={p.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">{p.name.charAt(0)}</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-display font-medium text-foreground truncate">{p.name}</p>
                  <p className="text-xs text-muted-foreground font-display">{p.school}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default Stacks;
