import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { motion } from "framer-motion";
import { Play, MessageSquare, Circle, CheckCircle, ChevronRight } from "lucide-react";

type VideoWithAuthor = Tables<"videos"> & { profiles: Tables<"profiles"> };

const VideoFeed = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithAuthor[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles!videos_user_id_fkey(*)")
        .order("created_at", { ascending: false });
      setVideos((data as VideoWithAuthor[]) || []);

      if (user) {
        const { data: acks } = await supabase.from("video_acknowledges").select("video_id").eq("user_id", user.id);
        setAcknowledgedIds(new Set(acks?.map((a) => a.video_id) || []));
      }
      setLoading(false);
    };
    fetchVideos();
  }, [user]);

  const handleAcknowledge = async (videoId: string) => {
    if (!user) return;
    if (acknowledgedIds.has(videoId)) {
      await supabase.from("video_acknowledges").delete().eq("video_id", videoId).eq("user_id", user.id);
      setAcknowledgedIds((prev) => { const n = new Set(prev); n.delete(videoId); return n; });
      setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, acknowledges: v.acknowledges - 1 } : v));
    } else {
      await supabase.from("video_acknowledges").insert({ video_id: videoId, user_id: user.id });
      setAcknowledgedIds((prev) => new Set(prev).add(videoId));
      setVideos((prev) => prev.map((v) => v.id === videoId ? { ...v, acknowledges: v.acknowledges + 1 } : v));
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground font-display">Loading feed...</p></div>;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-display font-bold text-foreground mb-6 tracking-tight">The Quad</h2>
      {videos.length === 0 && (
        <div className="text-center py-16">
          <p className="text-muted-foreground font-body text-sm">No videos yet. Be the first to share something!</p>
          <p className="text-xs text-muted-foreground font-display mt-2">Click "Upload" in the nav to post a video.</p>
        </div>
      )}
      <div className="space-y-8">
        {videos.map((video, i) => (
          <motion.div key={video.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.3 }}>
            <article className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="relative aspect-video bg-concrete flex items-center justify-center cursor-pointer group">
                {video.thumbnail_url ? (
                  <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : null}
                <video
                  src={video.video_url}
                  className="absolute inset-0 w-full h-full object-cover"
                  controls
                  preload="metadata"
                />
              </div>
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-3">
                  {video.profiles?.avatar_url ? (
                    <img src={video.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
                      {video.profiles?.name?.charAt(0) || "?"}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-display font-medium text-foreground">{video.profiles?.name}</p>
                    <p className="text-xs text-muted-foreground font-display">{video.profiles?.department} · {getTimeAgo(video.created_at)}</p>
                  </div>
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-1">{video.title}</h3>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">{video.description}</p>
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                  <button onClick={() => handleAcknowledge(video.id)} className={`flex items-center gap-1.5 text-sm font-display transition-colors ${acknowledgedIds.has(video.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                    {acknowledgedIds.has(video.id) ? <CheckCircle size={14} /> : <Circle size={14} />}
                    <span>{video.acknowledges} Acknowledge{video.acknowledges !== 1 ? "s" : ""}</span>
                  </button>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-display transition-colors">
                    <MessageSquare size={14} />
                    <span>{video.comments_count} comments</span>
                  </button>
                </div>
              </div>
            </article>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffH = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  return `${diffD}d ago`;
}

export default VideoFeed;
