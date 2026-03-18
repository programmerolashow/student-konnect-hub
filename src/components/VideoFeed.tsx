import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Circle, CheckCircle, Play } from "lucide-react";
import VideoComments from "./VideoComments";
import VideoPlayer from "./VideoPlayer";

type VideoWithAuthor = Tables<"videos"> & { profiles: Tables<"profiles"> | null };

const PAGE_SIZE = 10;

const VideoFeed = () => {
  const { user } = useAuth();
  const [videos, setVideos] = useState<VideoWithAuthor[]>([]);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [openCommentsId, setOpenCommentsId] = useState<string | null>(null);
  const [playerOpen, setPlayerOpen] = useState<{ videos: VideoWithAuthor[]; index: number } | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver>();

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(*)")
        .order("created_at", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      setVideos((data as unknown as VideoWithAuthor[]) || []);
      setHasMore((data?.length || 0) >= PAGE_SIZE);

      if (user) {
        const { data: acks } = await supabase.from("video_acknowledges").select("video_id").eq("user_id", user.id);
        setAcknowledgedIds(new Set(acks?.map((a) => a.video_id) || []));
      }
      setLoading(false);
    };
    fetchVideos();
  }, [user]);

  // Infinite scroll
  const lastVideoRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore || loading) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const nextPage = page + 1;
        setPage(nextPage);
        supabase
          .from("videos")
          .select("*, profiles(*)")
          .order("created_at", { ascending: false })
          .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setVideos((prev) => [...prev, ...(data as unknown as VideoWithAuthor[])]);
              setHasMore(data.length >= PAGE_SIZE);
            } else {
              setHasMore(false);
            }
          });
      }
    });
    if (node) observerRef.current.observe(node);
  }, [hasMore, page, loading]);

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
        {videos.map((video, i) => {
          const isShort = video.duration && video.duration <= 60;
          const contentTag = video.description.match(/^\[(VIDEO|SHORT|SKIT|REEL)\]/)?.[1] || (isShort ? "SHORT" : "VIDEO");
          const cleanDesc = video.description.replace(/^\[(VIDEO|SHORT|SKIT|REEL)\]\s*/, "");
          const isVertical = contentTag === "SHORT" || contentTag === "REEL" || isShort;
          return (
            <motion.div
              key={video.id}
              ref={i === videos.length - 1 ? lastVideoRef : undefined}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3 }}
            >
              <article className="bg-card border border-border rounded-lg overflow-hidden">
                <div
                  className={`relative bg-ink flex items-center justify-center cursor-pointer group ${isVertical ? "aspect-[9/16] max-h-[500px] mx-auto max-w-[280px]" : "aspect-video"}`}
                  onClick={() => setPlayerOpen({ videos, index: i })}
                >
                  {video.thumbnail_url && !isVertical ? (
                    <img src={video.thumbnail_url} alt={video.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : null}
                  <video src={video.video_url} className="absolute inset-0 w-full h-full object-cover" preload="metadata" />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-background/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={24} className="text-primary-foreground ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-primary text-primary-foreground text-[10px] font-display font-bold rounded-full">
                    {contentTag}
                  </div>
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
                  <p className="text-sm font-body text-muted-foreground leading-relaxed">{cleanDesc}</p>
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
                    <button onClick={() => handleAcknowledge(video.id)} className={`flex items-center gap-1.5 text-sm font-display transition-colors ${acknowledgedIds.has(video.id) ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
                      {acknowledgedIds.has(video.id) ? <CheckCircle size={14} /> : <Circle size={14} />}
                      <span>{video.acknowledges} Acknowledge{video.acknowledges !== 1 ? "s" : ""}</span>
                    </button>
                    <button onClick={() => setOpenCommentsId(openCommentsId === video.id ? null : video.id)} className={`flex items-center gap-1.5 text-sm font-display transition-colors ${openCommentsId === video.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                      <MessageSquare size={14} />
                      <span>{video.comments_count} comments</span>
                    </button>
                  </div>
                </div>
                <AnimatePresence>
                  {openCommentsId === video.id && (
                    <VideoComments videoId={video.id} onClose={() => setOpenCommentsId(null)} onCountChange={(count) => setVideos((prev) => prev.map((v) => v.id === video.id ? { ...v, comments_count: count } : v))} />
                  )}
                </AnimatePresence>
              </article>
            </motion.div>
          );
        })}
      </div>
      {!hasMore && videos.length > 0 && <p className="text-center text-xs text-muted-foreground font-display py-6">You've reached the end!</p>}

      {/* Full-screen player */}
      <AnimatePresence>
        {playerOpen && (
          <VideoPlayer videos={playerOpen.videos} startIndex={playerOpen.index} onClose={() => setPlayerOpen(null)} />
        )}
      </AnimatePresence>
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
