import { User, users } from "@/lib/mock-data";
import { MessageCircle, Users, Hash } from "lucide-react";

interface DirectoryProps {
  onSelectChat: (userId: string) => void;
  activeChat?: string;
}

const Directory = ({ onSelectChat, activeChat }: DirectoryProps) => {
  const onlineFriends = users.filter((u) => u.online);
  const offlineFriends = users.filter((u) => !u.online);

  return (
    <div className="h-full flex flex-col bg-sidebar border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <h2 className="text-lg font-display font-bold text-sidebar-foreground tracking-tight">
          Student Konnect
        </h2>
      </div>

      {/* Navigation */}
      <nav className="p-3 space-y-1">
        <NavItem icon={<Hash size={16} />} label="Feed" />
        <NavItem icon={<MessageCircle size={16} />} label="Messages" />
        <NavItem icon={<Users size={16} />} label="Connections" />
      </nav>

      {/* Department Groups */}
      <div className="px-3 mt-4">
        <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Groups
        </p>
        <div className="space-y-0.5">
          <GroupItem name="CS Department" count={142} />
          <GroupItem name="Engineering Faculty" count={340} />
          <GroupItem name="Study Group — Algo" count={12} />
        </div>
      </div>

      {/* Friends */}
      <div className="px-3 mt-5 flex-1 overflow-y-auto">
        <p className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
          Friends
        </p>
        <div className="space-y-0.5">
          {onlineFriends.map((user) => (
            <FriendItem
              key={user.id}
              user={user}
              active={activeChat === user.id}
              onClick={() => onSelectChat(user.id)}
            />
          ))}
          {offlineFriends.map((user) => (
            <FriendItem
              key={user.id}
              user={user}
              active={activeChat === user.id}
              onClick={() => onSelectChat(user.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

const NavItem = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <button className="w-full flex items-center gap-2.5 px-2 py-2 text-sm font-display font-medium text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors">
    {icon}
    {label}
  </button>
);

const GroupItem = ({ name, count }: { name: string; count: number }) => (
  <button className="w-full flex items-center justify-between px-2 py-1.5 text-sm font-display text-sidebar-foreground hover:bg-sidebar-accent rounded transition-colors">
    <span className="truncate">{name}</span>
    <span className="text-xs text-muted-foreground">{count}</span>
  </button>
);

const FriendItem = ({ user, active, onClick }: { user: User; active: boolean; onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-2.5 px-2 py-1.5 text-sm font-display rounded transition-colors ${
      active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent"
    }`}
  >
    <div className="relative">
      <div className="w-7 h-7 rounded-full bg-concrete flex items-center justify-center text-xs font-semibold text-foreground">
        {user.name.charAt(0)}
      </div>
      {user.online && (
        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-sidebar" />
      )}
    </div>
    <span className="truncate">{user.name}</span>
  </button>
);

export default Directory;
