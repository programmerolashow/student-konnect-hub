import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Comment {
  id: string;
  text: string;
  user_id: string;
  created_at: string;
  profile?: { name: string; avatar_url: string | null };
}

interface VideoCommentsProps {
  videoId: string;
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const VideoComments = ({ videoId, onClose, onCountChange }: VideoCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComments = async () => {
      const { data } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", videoId)
        .order("created_at", { ascending: true });

      if (data) {
        const userIds = [...new Set(data.map((c) => c.user_id))];
        const { data: profiles } = await supabase.from("profiles").select("user_id, name, avatar_url").in("user_id", userIds);
        const profileMap = new Map(profiles?.map((p) => [p.user_id, p]));
        setComments(data.map((c) => ({ ...c, profile: profileMap.get(c.user_id) || undefined })));
      }
      setLoading(false);
    };
    fetchComments();

    const channel = supabase
      .channel(`comments-${videoId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "comments", filter: `video_id=eq.${videoId}` }, async (payload) => {
        const c = payload.new as any;
        const { data: profile } = await supabase.from("profiles").select("user_id, name, avatar_url").eq("user_id", c.user_id).single();
        setComments((prev) => {
          const updated = [...prev, { ...c, profile: profile || undefined }];
          onCountChange(updated.length);
          return updated;
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [videoId]);

  const handleSend = async () => {
    if (!newComment.trim() || !user) return;
    await supabase.from("comments").insert({ video_id: videoId, user_id: user.id, text: newComment.trim() });
    setNewComment("");
  };

  return (
    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-border">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-display font-semibold text-foreground">Comments ({comments.length})</p>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={16} /></button>
        </div>

        <div className="max-h-48 overflow-y-auto space-y-3 mb-3">
          {loading && <p className="text-xs text-muted-foreground">Loading...</p>}
          {!loading && comments.length === 0 && <p className="text-xs text-muted-foreground font-body">No comments yet. Be the first!</p>}
          <AnimatePresence>
            {comments.map((c) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-start gap-2">
                {c.profile?.avatar_url ? (
                  <img src={c.profile.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[10px] font-display font-semibold text-secondary-foreground flex-shrink-0">
                    {c.profile?.name?.charAt(0) || "?"}
                  </div>
                )}
                <div>
                  <p className="text-xs font-display font-medium text-foreground">{c.profile?.name || "Unknown"} <span className="text-muted-foreground font-normal">· {getTimeAgo(c.created_at)}</span></p>
                  <p className="text-sm font-body text-foreground">{c.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {user && (
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Write a comment..."
              className="flex-1 px-3 py-2 bg-accent border-none rounded-md text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleSend} disabled={!newComment.trim()} className="p-2 text-primary hover:opacity-80 disabled:opacity-30 transition-opacity">
              <Send size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const diffH = Math.floor(diffMs / 3600000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  return `${Math.floor(diffH / 24)}d ago`;
}

export default VideoComments;
