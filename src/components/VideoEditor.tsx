import { useState, useRef, useEffect, useCallback } from "react";
import { Scissors, Type, Palette, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";

interface VideoEditorProps {
  videoUrl: string;
  duration: number;
  onApply: (edits: VideoEdits) => void;
  onCancel: () => void;
}

export interface VideoEdits {
  trimStart: number;
  trimEnd: number;
  caption: string;
  captionPosition: "top" | "center" | "bottom";
  filter: string;
}

const FILTERS = [
  { name: "None", value: "none", css: "" },
  { name: "Warm", value: "warm", css: "sepia(0.3) saturate(1.4) brightness(1.05)" },
  { name: "Cool", value: "cool", css: "saturate(0.8) hue-rotate(15deg) brightness(1.05)" },
  { name: "B&W", value: "bw", css: "grayscale(1)" },
  { name: "Vintage", value: "vintage", css: "sepia(0.5) contrast(1.1) brightness(0.95)" },
  { name: "Vivid", value: "vivid", css: "saturate(1.6) contrast(1.1)" },
];

const VideoEditor = ({ videoUrl, duration, onApply, onCancel }: VideoEditorProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [tab, setTab] = useState<"trim" | "caption" | "filter">("trim");
  const [trimStart, setTrimStart] = useState(0);
  const [trimEnd, setTrimEnd] = useState(duration);
  const [caption, setCaption] = useState("");
  const [captionPosition, setCaptionPosition] = useState<"top" | "center" | "bottom">("bottom");
  const [filter, setFilter] = useState("none");
  const [currentTime, setCurrentTime] = useState(0);

  const effectiveDuration = duration || 60;

  useEffect(() => {
    setTrimEnd(effectiveDuration);
  }, [effectiveDuration]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    const onTime = () => setCurrentTime(v.currentTime);
    v.addEventListener("timeupdate", onTime);
    return () => v.removeEventListener("timeupdate", onTime);
  }, []);

  const seekTo = useCallback((time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
    }
  }, []);

  const handleTrimChange = (values: number[]) => {
    setTrimStart(values[0]);
    setTrimEnd(values[1]);
    seekTo(values[0]);
  };

  const selectedFilter = FILTERS.find((f) => f.value === filter);
  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className="space-y-4">
      {/* Video preview */}
      <div className="relative rounded-lg overflow-hidden bg-ink">
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full max-h-[350px] object-contain"
          style={{ filter: selectedFilter?.css || undefined }}
          controls
          muted
        />
        {caption && (
          <div
            className={`absolute left-0 right-0 px-4 py-2 text-center pointer-events-none ${
              captionPosition === "top" ? "top-4" : captionPosition === "center" ? "top-1/2 -translate-y-1/2" : "bottom-12"
            }`}
          >
            <span className="bg-ink/70 text-primary-foreground px-3 py-1.5 rounded-md text-sm font-display font-semibold">
              {caption}
            </span>
          </div>
        )}
      </div>

      {/* Editor tabs */}
      <div className="flex gap-1 bg-accent rounded-md p-1">
        <button onClick={() => setTab("trim")} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "trim" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Scissors size={14} /> Trim
        </button>
        <button onClick={() => setTab("caption")} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "caption" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Type size={14} /> Caption
        </button>
        <button onClick={() => setTab("filter")} className={`flex-1 py-2 text-xs font-display font-medium rounded flex items-center justify-center gap-1.5 transition-colors ${tab === "filter" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}>
          <Palette size={14} /> Filter
        </button>
      </div>

      {/* Trim controls */}
      {tab === "trim" && (
        <div className="space-y-3">
          <p className="text-xs font-display text-muted-foreground">Drag to set start and end points</p>
          <Slider
            min={0}
            max={effectiveDuration}
            step={0.1}
            value={[trimStart, trimEnd]}
            onValueChange={handleTrimChange}
            className="w-full"
          />
          <div className="flex justify-between text-xs font-display text-muted-foreground">
            <span>Start: {fmt(trimStart)}</span>
            <span className="text-foreground font-semibold">Duration: {fmt(trimEnd - trimStart)}</span>
            <span>End: {fmt(trimEnd)}</span>
          </div>
        </div>
      )}

      {/* Caption controls */}
      {tab === "caption" && (
        <div className="space-y-3">
          <Input
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Add a text overlay..."
            className="font-body"
            maxLength={100}
          />
          <div className="flex gap-2">
            {(["top", "center", "bottom"] as const).map((pos) => (
              <button
                key={pos}
                onClick={() => setCaptionPosition(pos)}
                className={`flex-1 py-2 text-xs font-display font-medium rounded border transition-colors capitalize ${
                  captionPosition === pos ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
                }`}
              >
                {pos}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filter controls */}
      {tab === "filter" && (
        <div className="grid grid-cols-3 gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`relative rounded-lg overflow-hidden border-2 transition-colors ${
                filter === f.value ? "border-primary" : "border-border"
              }`}
            >
              <div className="aspect-video bg-secondary">
                <video
                  src={videoUrl}
                  className="w-full h-full object-cover"
                  style={{ filter: f.css || undefined }}
                  muted
                  preload="metadata"
                />
              </div>
              <p className="text-[10px] font-display font-medium text-center py-1 bg-card">{f.name}</p>
              {filter === f.value && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                  <Check size={10} className="text-primary-foreground" />
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onCancel} className="font-display gap-1.5">
          <RotateCcw size={14} /> Reset
        </Button>
        <Button onClick={() => onApply({ trimStart, trimEnd, caption, captionPosition, filter })} className="font-display gap-1.5">
          <Check size={14} /> Apply Edits
        </Button>
      </div>
    </div>
  );
};

export default VideoEditor;
