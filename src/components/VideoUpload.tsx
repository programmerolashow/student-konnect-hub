import { useState, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Upload, VideoIcon, StopCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface VideoUploadProps {
  onComplete: () => void;
}

const VideoUpload = ({ onComplete }: VideoUploadProps) => {
  const { user } = useAuth();
  const [mode, setMode] = useState<"choose" | "upload" | "record">("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
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
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
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
      toast.error("Camera access denied. Please allow camera permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }, []);

  const handleUpload = async () => {
    if (!videoFile || !user || !title.trim()) {
      toast.error("Please add a title and video.");
      return;
    }
    setUploading(true);
    try {
      const ext = videoFile.name.split(".").pop() || "webm";
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("videos").upload(path, videoFile);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("videos").getPublicUrl(path);

      const { error: insertError } = await supabase.from("videos").insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim(),
        video_url: publicUrl,
      });
      if (insertError) throw insertError;

      toast.success("Video posted!");
      onComplete();
    } catch (err: any) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const reset = () => {
    setMode("choose");
    setVideoFile(null);
    setVideoPreviewUrl(null);
    setTitle("");
    setDescription("");
    streamRef.current?.getTracks().forEach((t) => t.stop());
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <h2 className="text-2xl font-display font-bold text-foreground mb-6 tracking-tight">Share a Video</h2>

        {mode === "choose" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors group"
            >
              <Upload size={32} className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-display font-semibold text-foreground">Upload Video</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Select a video file from your device</p>
            </button>
            <button
              onClick={() => { setMode("record"); startRecording(); }}
              className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors group"
            >
              <VideoIcon size={32} className="mx-auto mb-3 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="font-display font-semibold text-foreground">Record Video</p>
              <p className="text-xs text-muted-foreground font-body mt-1">Use your camera to record live</p>
            </button>
            <input ref={fileInputRef} type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
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
              {recording && (
                <Button onClick={stopRecording} variant="destructive" className="font-display gap-2">
                  <StopCircle size={16} /> Stop Recording
                </Button>
              )}
            </div>
          </div>
        )}

        {videoPreviewUrl && (
          <div className="space-y-4">
            <div className="relative aspect-video bg-ink rounded-lg overflow-hidden">
              <video src={videoPreviewUrl} className="w-full h-full object-cover" controls />
              <button onClick={reset} className="absolute top-3 right-3 p-1.5 bg-ink/70 rounded-full text-primary-foreground hover:bg-ink transition-colors">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-1.5">Title *</label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Give your video a title" className="font-body" />
            </div>
            <div>
              <label className="block text-sm font-display font-medium text-foreground mb-1.5">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's this video about?"
                rows={3}
                className="w-full px-3 py-2.5 bg-background border border-border rounded-md text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={reset} className="font-display">Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !title.trim()} className="font-display gap-2">
                {uploading ? "Uploading..." : "Post Video"}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default VideoUpload;
