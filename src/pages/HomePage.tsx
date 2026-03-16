import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Directory from "@/components/Directory";
import VideoFeed from "@/components/VideoFeed";
import MessagingView from "@/components/MessagingView";
import ProfileView from "@/components/ProfileView";
import ConnectionsView from "@/components/ConnectionsView";
import VideoUpload from "@/components/VideoUpload";
import Stacks from "@/components/Stacks";
import NotificationsPanel from "@/components/NotificationsPanel";
import ThemeToggle from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { Video, MessageCircle, User, Users, Upload, LogOut, Menu, X } from "lucide-react";

type View = "feed" | "messages" | "connections" | "profile" | "upload";

const HomePage = () => {
  const [view, setView] = useState<View>("feed");
  const [activeChatUserId, setActiveChatUserId] = useState<string | undefined>();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { profile, signOut } = useAuth();

  const handleSelectChat = (userId: string) => {
    setActiveChatUserId(userId);
    setView("messages");
    setMobileMenuOpen(false);
  };

  const handleNavChange = (navView: string) => {
    setView(navView as View);
    setMobileMenuOpen(false);
  };

  const stacksContext = view === "messages" ? "chat" : view === "profile" ? "profile" : "feed";
  const displayName = profile?.name || "User";

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
        <h1 className="text-base font-display font-bold text-foreground">Student Konnect</h1>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NotificationsPanel />
          <button onClick={() => setView("profile")}>
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
              {displayName.charAt(0)}
            </div>
          </button>
        </div>
      </div>

      {/* Mobile menu overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="lg:hidden fixed inset-0 z-40 pt-14"
          >
            <div className="h-full w-72 bg-background">
              <Directory onSelectChat={handleSelectChat} activeChat={activeChatUserId} onNavChange={handleNavChange} />
            </div>
            <div className="absolute inset-0 -z-10 bg-foreground/20" onClick={() => setMobileMenuOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop: Left Column - Directory */}
      <div className="hidden lg:block w-60 flex-shrink-0">
        <Directory onSelectChat={handleSelectChat} activeChat={activeChatUserId} onNavChange={handleNavChange} />
      </div>

      {/* Center Column */}
      <div className="flex-1 flex flex-col min-w-0 pt-14 lg:pt-0">
        {/* Nav bar */}
        <div className="border-b border-border px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <NavTab icon={<Video size={16} />} label="Feed" active={view === "feed"} onClick={() => setView("feed")} />
            <NavTab icon={<Upload size={16} />} label="Upload" active={view === "upload"} onClick={() => setView("upload")} />
            <NavTab icon={<MessageCircle size={16} />} label="Messages" active={view === "messages"} onClick={() => { setView("messages"); setActiveChatUserId(undefined); }} />
            <NavTab icon={<Users size={16} />} label="Connect" active={view === "connections"} onClick={() => setView("connections")} />
            <NavTab icon={<User size={16} />} label="Profile" active={view === "profile"} onClick={() => setView("profile")} />
          </div>
          <div className="hidden lg:flex items-center gap-2">
            <ThemeToggle />
            <NotificationsPanel />
            <button onClick={() => setView("profile")} className="flex items-center gap-1.5 text-sm font-display text-muted-foreground hover:text-foreground transition-colors">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
                  {displayName.charAt(0)}
                </div>
              )}
              <span className="text-sm">{displayName.split(" ")[0]}</span>
            </button>
            <button
              onClick={signOut}
              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
              title="Sign out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            <motion.div
              key={view}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="h-full"
            >
              {view === "feed" && <VideoFeed />}
              {view === "upload" && <VideoUpload onComplete={() => setView("feed")} />}
              {view === "messages" && <MessagingView activeChatUserId={activeChatUserId} onBack={() => setActiveChatUserId(undefined)} />}
              {view === "connections" && <ConnectionsView />}
              {view === "profile" && <ProfileView />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column */}
      <div className="hidden xl:block w-72 flex-shrink-0">
        <Stacks context={stacksContext} />
      </div>
    </div>
  );
};

const NavTab = ({
  icon,
  label,
  active,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 text-sm font-display font-medium rounded-md transition-colors ${
      active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
    }`}
  >
    {icon}
    {label}
  </button>
);

export default HomePage;
