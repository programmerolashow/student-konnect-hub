import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, MessageSquare, Share2, ChevronUp, ChevronDown, X, Volume2, VolumeX, Play, Pause, Flag } from "lucide-react";
import VideoComments from "./VideoComments";
import ReportDialog from "./ReportDialog";
import FollowButton from "./FollowButton";

type VideoWithAuthor = Tables<"videos"> & { profiles: Tables<"profiles"> | null };

interface VideoPlayerProps {
  videos: VideoWithAuthor[];
  startIndex?: number;
  onClose: () => void;
}

const VideoPlayer = ({ videos, startIndex = 0, onClose }: VideoPlayerProps) => {
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(startIndex);
  const [acknowledgedIds, setAcknowledgedIds] = useState<Set<string>>(new Set());
  const [showComments, setShowComments] = useState(false);
  const [muted, setMuted] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [showReport, setShowReport] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartY = useRef(0);

  const video = videos[currentIndex];
  const nextVideo = currentIndex < videos.length - 1 ? videos[currentIndex + 1] : null;

  useEffect(() => {
    if (!user) return;
    supabase.from("video_acknowledges").select("video_id").eq("user_id", user.id).then(({ data }) => {
      setAcknowledgedIds(new Set(data?.map((a) => a.video_id) || []));
    });
  }, [user]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.load();
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    }
    // Track view
    if (user && video) {
      supabase.from("video_views").upsert({ video_id: video.id, user_id: user.id }, { onConflict: "video_id,user_id" }).then(() => {
        supabase.from("videos").update({ views_count: (video.views_count || 0) + 1 }).eq("id", video.id);
      });
    }
  }, [currentIndex]);

  // Preload next video
  useEffect(() => {
    if (nextVideo && nextVideoRef.current) {
      nextVideoRef.current.src = nextVideo.video_url;
      nextVideoRef.current.preload = "auto";
    }
  }, [nextVideo?.id]);

  const navigate = useCallback((dir: "up" | "down") => {
    if (dir === "up" && currentIndex > 0) setCurrentIndex((i) => i - 1);
    if (dir === "down" && currentIndex < videos.length - 1) setCurrentIndex((i) => i + 1);
    setShowComments(false);
  }, [currentIndex, videos.length]);

  const handleTouchStart = (e: React.TouchEvent) => { touchStartY.current = e.touches[0].clientY; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 80) navigate(diff > 0 ? "down" : "up");
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp") navigate("up");
      else if (e.key === "ArrowDown") navigate("down");
      else if (e.key === "Escape") onClose();
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [navigate, onClose]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) { videoRef.current.play(); setPlaying(true); }
    else { videoRef.current.pause(); setPlaying(false); }
  };

  const handleAcknowledge = async () => {
    if (!user || !video) return;
    if (acknowledgedIds.has(video.id)) {
      await supabase.from("video_acknowledges").delete().eq("video_id", video.id).eq("user_id", user.id);
      setAcknowledgedIds((prev) => { const n = new Set(prev); n.delete(video.id); return n; });
    } else {
      await supabase.from("video_acknowledges").insert({ video_id: video.id, user_id: user.id });
      setAcknowledgedIds((prev) => new Set(prev).add(video.id));
      // Notify video owner
      if (video.user_id !== user.id) {
        await supabase.from("notifications").insert({
          user_id: video.user_id,
          type: "like",
          title: "New Like",
          body: `Someone liked your video "${video.title}"`,
          reference_id: video.id,
        });
      }
    }
  };

  if (!video) return null;

  const isLiked = acknowledgedIds.has(video.id);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 bg-background flex items-center justify-center" ref={containerRef}>
      {/* Hidden preload element */}
      <video ref={nextVideoRef} className="hidden" muted preload="auto" />

      <button onClick={onClose} className="absolute top-4 right-4 z-50 p-2 bg-background/80 rounded-full text-foreground hover:bg-background transition-colors">
        <X size={24} />
      </button>

      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-2">
        <button onClick={() => navigate("up")} disabled={currentIndex === 0} className="p-2 bg-background/60 rounded-full text-foreground disabled:opacity-20 hover:bg-background/80 transition-colors">
          <ChevronUp size={20} />
        </button>
        <button onClick={() => navigate("down")} disabled={currentIndex === videos.length - 1} className="p-2 bg-background/60 rounded-full text-foreground disabled:opacity-20 hover:bg-background/80 transition-colors">
          <ChevronDown size={20} />
        </button>
      </div>

      <div className="relative w-full h-full max-w-[450px] max-h-[100vh] mx-auto flex items-center justify-center" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} onClick={togglePlay}>
        <AnimatePresence mode="wait">
          <motion.div key={video.id} initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -100 }} transition={{ duration: 0.3 }} className="relative w-full h-full">
            <video ref={videoRef} src={video.video_url} className="w-full h-full object-contain bg-ink" loop playsInline muted={muted} autoPlay />

            {!playing && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-background/30 flex items-center justify-center">
                  <Play size={32} className="text-foreground ml-1" />
                </div>
              </div>
            )}

            <div className="absolute bottom-0 left-0 right-16 p-4 bg-gradient-to-t from-ink/80 to-transparent pointer-events-none">
              <div className="flex items-center gap-2 mb-2 pointer-events-auto">
                {video.profiles?.avatar_url ? (
                  <img src={video.profiles.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-primary-foreground">
                    {video.profiles?.name?.charAt(0) || "?"}
                  </div>
                )}
                <span className="text-sm font-display font-semibold text-primary-foreground">{video.profiles?.name}</span>
                <FollowButton targetUserId={video.user_id} targetName={video.profiles?.name || undefined} />
              </div>
              <p className="text-sm font-display text-primary-foreground/90 mb-1">{video.title}</p>
              <p className="text-xs font-body text-primary-foreground/70 line-clamp-2">
                {video.description.replace(/^\[(VIDEO|SHORT|SKIT|REEL)\]\s*/, "")}
              </p>
            </div>

            <div className="absolute right-3 bottom-24 flex flex-col items-center gap-5 pointer-events-auto" onClick={(e) => e.stopPropagation()}>
              <button onClick={handleAcknowledge} className="flex flex-col items-center gap-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isLiked ? "bg-primary" : "bg-background/30"}`}>
                  <Heart size={20} className={isLiked ? "text-primary-foreground fill-current" : "text-primary-foreground"} />
                </div>
                <span className="text-xs font-display text-primary-foreground">{video.acknowledges}</span>
              </button>
              <button onClick={() => setShowComments(true)} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center">
                  <MessageSquare size={20} className="text-primary-foreground" />
                </div>
                <span className="text-xs font-display text-primary-foreground">{video.comments_count}</span>
              </button>
              <button className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center">
                  <Share2 size={20} className="text-primary-foreground" />
                </div>
              </button>
              <button onClick={() => setMuted(!muted)} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center">
                  {muted ? <VolumeX size={20} className="text-primary-foreground" /> : <Volume2 size={20} className="text-primary-foreground" />}
                </div>
              </button>
              <button onClick={() => setShowReport(true)} className="flex flex-col items-center gap-1">
                <div className="w-10 h-10 rounded-full bg-background/30 flex items-center justify-center">
                  <Flag size={16} className="text-primary-foreground" />
                </div>
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showComments && (
          <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl max-h-[60vh] overflow-hidden z-50" onClick={(e) => e.stopPropagation()}>
            <VideoComments videoId={video.id} onClose={() => setShowComments(false)} onCountChange={() => {}} />
          </motion.div>
        )}
      </AnimatePresence>

      {showReport && (
        <ReportDialog type="video" targetId={video.id} targetUserId={video.user_id} onClose={() => setShowReport(false)} />
      )}

      <div className="absolute top-4 left-4 z-40 text-sm font-display text-foreground/60">
        {currentIndex + 1} / {videos.length}
      </div>
    </motion.div>
  );
};

export default VideoPlayer;
