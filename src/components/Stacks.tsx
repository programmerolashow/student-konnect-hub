import { announcements, users, departmentGroups } from "@/lib/mock-data";
import { Megaphone, Users, BookOpen } from "lucide-react";

interface StacksProps {
  context: "feed" | "chat" | "profile";
}

const Stacks = ({ context }: StacksProps) => {
  return (
    <div className="h-full bg-sidebar border-l border-sidebar-border p-4 space-y-6">
      {context === "feed" && (
        <>
          {/* Announcements */}
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

          {/* Suggested connections */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Users size={14} className="text-primary" />
              <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">People you may know</h3>
            </div>
            <div className="space-y-2">
              {users.slice(3, 6).map((user) => (
                <div key={user.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
                    {user.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-display font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground font-display">{user.department}</p>
                  </div>
                  <button className="text-xs font-display font-semibold text-primary hover:opacity-80 transition-opacity">
                    Connect
                  </button>
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
            <h3 className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider">Mutual Connections</h3>
          </div>
          <div className="space-y-2">
            {users.slice(0, 3).map((user) => (
              <div key={user.id} className="flex items-center gap-2.5 p-2 rounded-md hover:bg-accent transition-colors">
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
                  {user.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-display font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground font-display">{user.school}</p>
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
