import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, VideoIcon, StopCircle, X, Film, Clapperboard, Sparkles, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface VideoUploadProps {
  onComplete: () => void;
}

type ContentType = "video" | "short" | "skit" | "reel";

const CONTENT_TYPES: { value: ContentType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "video", label: "Video", icon: <VideoIcon size={14} />, desc: "Standard video post" },
  { value: "short", label: "Short", icon: <Film size={14} />, desc: "Under 60s vertical" },
  { value: "skit", label: "Skit", icon: <Clapperboard size={14} />, desc: "Comedy & skits" },
  { value: "reel", label: "Reel", icon: <Sparkles size={14} />, desc: "Creative content" },
];

const VideoUpload = ({ onComplete }: VideoUploadProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "upload" | "record">("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState<ContentType>("video");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [isShort, setIsShort] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setVideoFile(file);
    setVideoPreviewUrl(URL.createObjectURL(file));
    setMode("upload");
  };

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const file = new File([blob], `recording-${Date.now()}.webm`, { type: "video/webm" });
        setVideoFile(file);
        setVideoPreviewUrl(URL.createObjectURL(blob));
        stream.getTracks().forEach((t) => t.stop());
        if (videoRef.current) videoRef.current.srcObject = null;
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      toast.error("Camera access denied.");
    }
  }, []);

  const stopRecording = useCallback(() => { mediaRecorderRef.current?.stop(); setRecording(false); }, []);

  const handlePreviewLoadedMetadata = () => {
    if (previewVideoRef.current) {
      const dur = previewVideoRef.current.duration;
      if (dur && dur <= 60) { setIsShort(true); if (contentType === "video") setContentType("short"); }
      else setIsShort(false);
    }
  };

  const addHashtag = () => {
    const tag = hashtagInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
    if (tag && !hashtags.includes(tag) && hashtags.length < 10) {
      setHashtags((prev) => [...prev, tag]);
    }
    setHashtagInput("");
  };

  const removeHashtag = (tag: string) => setHashtags((prev) => prev.filter((t) => t !== tag));

  const handleUpload = async () => {
    if (!videoFile || !user || !title.trim()) { toast.error("Please add a title and video."); return; }
    setUploading(true);
    try {
      const ext = videoFile.name.split(".").pop() || "webm";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(path, videoFile);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(path);
      const duration = previewVideoRef.current?.duration ? Math.round(previewVideoRef.current.duration) : null;
      const descWithTag = `[${contentType.toUpperCase()}] ${description.trim()}`;

      const { data: video, error: insertError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title.trim(),
        description: descWithTag,
        video_url: publicUrl,
        duration,
      }).select().single();
      if (insertError) throw insertError;

      // Save hashtags
      if (hashtags.length > 0 && video) {
        for (const tag of hashtags) {
          // Upsert hashtag
          const { data: existing } = await supabase.from("hashtags").select("id").eq("name", tag).single();
          let hashtagId: string;
          if (existing) {
            hashtagId = existing.id;
            await supabase.from("hashtags").update({ video_count: (existing as any).video_count + 1 } as any).eq("id", hashtagId);
          } else {
            const { data: created } = await supabase.from("hashtags").insert({ name: tag, video_count: 1 } as any).select().single();
            hashtagId = created!.id;
          }
          await supabase.from("video_hashtags").insert({ video_id: video.id, hashtag_id: hashtagId } as any);
        }
      }

      const label = contentType === "short" ? "Short" : contentType === "skit" ? "Skit" : contentType === "reel" ? "Reel" : "Video";
      toast.success(`${label} posted! 🎬`);
      onComplete();
    } catch (error) {
      toast.error(error?.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setMode("choose"); setVideoFile(null); setVideoPreviewUrl(null); setTitle(""); setDescription(""); setContentType("video"); setIsShort(false); setHashtags([]); setHashtagInput("");
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  const isVertical = contentType === "short" || contentType === "reel" || isShort;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6 tracking-tight">Share Content</h2>

        {mode === "choose" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-2">What are you posting?</label>
              <div className="flex flex-wrap gap-2">
                {CONTENT_TYPES.map((ct) => (
                  <button key={ct.value} onClick={() => setContentType(ct.value)} className={`flex items-center gap-1.5 px-3 py-2 text-sm font-display rounded-lg border transition-colors ${contentType === ct.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:border-foreground/30"}`}>
                    {ct.icon} {ct.label}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground font-body mt-1.5">{CONTENT_TYPES.find((c) => c.value === contentType)?.desc}</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <button onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors group">
                <Upload size={32} className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-display font-semibold text-foreground">Upload File</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Select a video from your device</p>
              </button>
              <button onClick={() => { setMode("record"); startRecording(); }} className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors group">
                <VideoIcon size={32} className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
                <p className="font-display font-semibold text-foreground">Record Live</p>
                <p className="text-xs text-muted-foreground font-body mt-1">Use your camera to record</p>
              </button>
              <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
            </div>
          </div>
        )}

        {mode === "record" && !videoPreviewUrl && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-ink rounded-lg overflow-hidden">
              <video ref={videoRef} className="w-full h-full object-cover" muted />
              {recording && (
                <div className="absolute top-3 left-3 flex items-center gap-2 bg-destructive/90 text-primary-foreground px-3 py-1 rounded-full text-xs font-display font-medium">
                  <div className="w-2 h-2 rounded-full bg-primary-foreground animate-pulse" /> Recording
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="font-display">Cancel</Button>
              {recording && <Button onClick={stopRecording} variant="destructive" className="font-display gap-2"><StopCircle size={16} /> Stop Recording</Button>}
            </div>
          </div>
        )}

        {videoPreviewUrl && (
          <div className="space-y-4">
            <div className={`relative bg-ink rounded-lg overflow-hidden ${isVertical ? "aspect-[9/16] max-h-[400px] max-w-[225px] mx-auto" : "aspect-video"}`}>
              <video ref={previewVideoRef} src={videoPreviewUrl} className="w-full h-full object-cover" controls onLoadedMetadata={handlePreviewLoadedMetadata} />
              <button onClick={reset} className="absolute top-3 right-3 p-1.5 bg-ink/70 rounded-full text-primary-foreground hover:bg-ink transition-colors"><X size={16} /></button>
              <Badge className="absolute top-3 left-3 text-[10px] font-display font-bold">{contentType.toUpperCase()}</Badge>
            </div>

            <div className="flex flex-wrap gap-2">
              {CONTENT_TYPES.map((ct) => (
                <button key={ct.value} onClick={() => setContentType(ct.value)} className={`flex items-center gap-1 px-2.5 py-1 text-xs font-display rounded-full border transition-colors ${contentType === ct.value ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"}`}>
                  {ct.icon} {ct.label}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-1.5">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your content a title" className="font-body" />
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-1.5">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this about? Use @username to mention someone" rows={3} className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
            </div>

            {/* Hashtags */}
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-1.5 flex items-center gap-1"><Hash size={14} /> Hashtags</label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={hashtagInput}
                  onChange={(e) => setHashtagInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addHashtag(); } }}
                  placeholder="Type a hashtag and press Enter"
                  className="font-body text-sm"
                />
                <Button type="button" variant="secondary" size="sm" onClick={addHashtag} className="font-display">Add</Button>
              </div>
              {hashtags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {hashtags.map((tag) => (
                    <Badge key={tag} variant="outline" className="cursor-pointer font-display text-xs gap-1" onClick={() => removeHashtag(tag)}>
                      #{tag} <X size={10} />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="font-display">Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !title.trim()} className="font-display gap-2">
                {uploading ? "Uploading..." : `Post ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoUpload;
