import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Search, Hash, TrendingUp, Users, Video } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import VideoPlayer from "./VideoPlayer";

type VideoWithAuthor = Tables<"videos"> & { profiles: Tables<"profiles"> | null };

const ExplorePage = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState<"trending" | "hashtags" | "search">("trending");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<"videos" | "users" | "hashtags">("videos");
  const [trendingVideos, setTrendingVideos] = useState<VideoWithAuthor[]>([]);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [hashtags, setHashtags] = useState<{ id: string; name: string; video_count: number }[]>([]);
  const [hashtagVideos, setHashtagVideos] = useState<VideoWithAuthor[]>([]);
  const [selectedHashtag, setSelectedHashtag] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerVideos, setPlayerVideos] = useState<VideoWithAuthor[] | null>(null);
  const [playerIndex, setPlayerIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver>();
  const PAGE_SIZE = 12;

  // Fetch trending
  useEffect(() => {
    const fetchTrending = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("videos")
        .select("*, profiles(*)")
        .order("acknowledges", { ascending: false })
        .order("views_count", { ascending: false })
        .range(0, PAGE_SIZE - 1);
      setTrendingVideos((data as unknown as VideoWithAuthor[]) || []);
      setHasMore((data?.length || 0) >= PAGE_SIZE);
      setLoading(false);
    };
    fetchTrending();
  }, []);

  // Fetch hashtags
  useEffect(() => {
    const fetchHashtags = async () => {
      const { data } = await supabase.from("hashtags").select("*").order("video_count", { ascending: false }).limit(20);
      setHashtags(data || []);
    };
    fetchHashtags();
  }, []);

  // Search
  useEffect(() => {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    const timeout = setTimeout(async () => {
      const q = searchQuery.trim().toLowerCase();
      if (searchType === "videos") {
        const { data } = await supabase.from("videos").select("*, profiles(*)").or(`title.ilike.%${q}%,description.ilike.%${q}%`).order("created_at", { ascending: false }).limit(20);
        setSearchResults(data || []);
      } else if (searchType === "users") {
        const { data } = await supabase.from("profiles").select("*").or(`name.ilike.%${q}%,username.ilike.%${q}%`).limit(20);
        setSearchResults(data || []);
      } else {
        const { data } = await supabase.from("hashtags").select("*").ilike("name", `%${q}%`).limit(20);
        setSearchResults(data || []);
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery, searchType]);

  // Hashtag videos
  useEffect(() => {
    if (!selectedHashtag) { setHashtagVideos([]); return; }
    const fetchHashtagVideos = async () => {
      const { data: junctions } = await supabase.from("video_hashtags").select("video_id").eq("hashtag_id", selectedHashtag);
      if (!junctions?.length) { setHashtagVideos([]); return; }
      const videoIds = junctions.map((j) => j.video_id);
      const { data } = await supabase.from("videos").select("*, profiles(*)").in("id", videoIds).order("created_at", { ascending: false });
      setHashtagVideos((data as unknown as VideoWithAuthor[]) || []);
    };
    fetchHashtagVideos();
  }, [selectedHashtag]);

  // Infinite scroll
  const lastVideoRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!hasMore) return;
    observerRef.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        const nextPage = page + 1;
        setPage(nextPage);
        supabase
          .from("videos")
          .select("*, profiles(*)")
          .order("acknowledges", { ascending: false })
          .range(nextPage * PAGE_SIZE, (nextPage + 1) * PAGE_SIZE - 1)
          .then(({ data }) => {
            if (data && data.length > 0) {
              setTrendingVideos((prev) => [...prev, ...(data as unknown as VideoWithAuthor[])]);
              setHasMore(data.length >= PAGE_SIZE);
            } else {
              setHasMore(false);
            }
          });
      }
    });
    if (node) observerRef.current.observe(node);
  }, [hasMore, page]);

  const openPlayer = (videos: VideoWithAuthor[], index: number) => {
    setPlayerVideos(videos);
    setPlayerIndex(index);
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4">
      <h2 className="text-2xl font-display font-bold text-foreground mb-4 tracking-tight">Explore</h2>

      {/* Search bar */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => { setSearchQuery(e.target.value); setTab("search"); }}
          onFocus={() => setTab("search")}
          placeholder="Search videos, users, or #hashtags..."
          className="pl-9 font-body"
        />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-accent rounded-md p-1 mb-6">
        <button onClick={() => { setTab("trending"); setSearchQuery(""); }} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "trending" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <TrendingUp size={14} /> Trending
        </button>
        <button onClick={() => setTab("hashtags")} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "hashtags" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Hash size={14} /> Hashtags
        </button>
        <button onClick={() => setTab("search")} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "search" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Search size={14} /> Search
        </button>
      </div>

      {/* Trending */}
      {tab === "trending" && (
        <div>
          {loading ? (
            <p className="text-center text-muted-foreground font-display py-12">Loading trending...</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {trendingVideos.map((v, i) => (
                <motion.div
                  key={v.id}
                  ref={i === trendingVideos.length - 1 ? lastVideoRef : undefined}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="cursor-pointer group"
                  onClick={() => openPlayer(trendingVideos, i)}
                >
                  <div className="relative aspect-[9/16] bg-secondary rounded-lg overflow-hidden">
                    {v.thumbnail_url ? (
                      <img src={v.thumbnail_url} alt={v.title} className="w-full h-full object-cover" />
                    ) : (
                      <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                    )}
                    <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-ink/70 to-transparent">
                      <p className="text-xs font-display font-medium text-primary-foreground line-clamp-1">{v.title}</p>
                      <p className="text-[10px] text-primary-foreground/70 font-display">{v.profiles?.name} · {v.acknowledges} ❤</p>
                    </div>
                    {i < 3 && (
                      <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-display font-bold">
                        {i + 1}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
          {!hasMore && trendingVideos.length > 0 && (
            <p className="text-center text-xs text-muted-foreground font-display py-4">You've seen it all!</p>
          )}
        </div>
      )}

      {/* Hashtags */}
      {tab === "hashtags" && (
        <div>
          {!selectedHashtag ? (
            <div className="space-y-2">
              {hashtags.length === 0 && <p className="text-center text-muted-foreground font-body text-sm py-12">No hashtags yet. Start tagging your content!</p>}
              {hashtags.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHashtag(h.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-foreground/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Hash size={18} className="text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-display font-semibold text-foreground">#{h.name}</p>
                    <p className="text-xs text-muted-foreground font-display">{h.video_count} video{h.video_count !== 1 ? "s" : ""}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div>
              <button onClick={() => setSelectedHashtag(null)} className="text-sm font-display text-primary hover:opacity-80 mb-4">← All hashtags</button>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {hashtagVideos.map((v, i) => (
                  <div key={v.id} className="cursor-pointer group" onClick={() => openPlayer(hashtagVideos, i)}>
                    <div className="relative aspect-[9/16] bg-secondary rounded-lg overflow-hidden">
                      <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-ink/70 to-transparent">
                        <p className="text-xs font-display font-medium text-primary-foreground line-clamp-1">{v.title}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {hashtagVideos.length === 0 && <p className="text-center text-muted-foreground font-body text-sm py-12">No videos with this hashtag yet.</p>}
            </div>
          )}
        </div>
      )}

      {/* Search */}
      {tab === "search" && (
        <div>
          <div className="flex gap-2 mb-4">
            {(["videos", "users", "hashtags"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSearchType(t)}
                className={`px-3 py-1.5 text-xs font-display font-medium rounded-full border transition-colors flex items-center gap-1 ${
                  searchType === t ? "bg-foreground text-background border-foreground" : "text-muted-foreground border-border hover:text-foreground"
                }`}
              >
                {t === "videos" ? <Video size={12} /> : t === "users" ? <Users size={12} /> : <Hash size={12} />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {!searchQuery.trim() && <p className="text-center text-muted-foreground font-body text-sm py-12">Type to search...</p>}

          {searchQuery.trim() && searchResults.length === 0 && (
            <p className="text-center text-muted-foreground font-body text-sm py-12">No results found.</p>
          )}

          {searchType === "videos" && searchResults.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {searchResults.map((v: VideoWithAuthor, i: number) => (
                <div key={v.id} className="cursor-pointer group" onClick={() => openPlayer(searchResults as VideoWithAuthor[], i)}>
                  <div className="relative aspect-[9/16] bg-secondary rounded-lg overflow-hidden">
                    <video src={v.video_url} className="w-full h-full object-cover" muted preload="metadata" />
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-ink/70 to-transparent">
                      <p className="text-xs font-display font-medium text-primary-foreground line-clamp-1">{v.title}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchType === "users" && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((p: Tables<"profiles">) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-border">
                  {p.avatar_url ? (
                    <img src={p.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-semibold text-secondary-foreground">{p.name.charAt(0)}</div>
                  )}
                  <div>
                    <p className="text-sm font-display font-semibold text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground font-display">@{p.username} · {p.department}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchType === "hashtags" && searchResults.length > 0 && (
            <div className="space-y-2">
              {searchResults.map((h: any) => (
                <button
                  key={h.id}
                  onClick={() => { setTab("hashtags"); setSelectedHashtag(h.id); }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg border border-border hover:border-foreground/20 transition-colors"
                >
                  <Hash size={18} className="text-primary" />
                  <div className="text-left">
                    <p className="text-sm font-display font-semibold text-foreground">#{h.name}</p>
                    <p className="text-xs text-muted-foreground">{h.video_count} videos</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Video Player overlay */}
      <AnimatePresence>
        {playerVideos && (
          <VideoPlayer videos={playerVideos} startIndex={playerIndex} onClose={() => setPlayerVideos(null)} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExplorePage;
