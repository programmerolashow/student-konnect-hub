import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { X, Flag, Ban, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

interface ReportDialogProps {
  type: "video" | "user";
  targetId: string;
  targetUserId: string;
  onClose: () => void;
}

const REASONS = [
  "Spam or misleading",
  "Harassment or bullying",
  "Inappropriate content",
  "Violence or dangerous acts",
  "Copyright violation",
  "Other",
];

const ReportDialog = ({ type, targetId, targetUserId, onClose }: ReportDialogProps) => {
  const { user } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleReport = async () => {
    if (!user || !reason) return;
    setSubmitting(true);
    await supabase.from("reports").insert({
      reporter_id: user.id,
      reported_user_id: targetUserId,
      reported_video_id: type === "video" ? targetId : null,
      reason,
    } as any);
    toast.success("Report submitted. Thank you for keeping our community safe.");
    setSubmitting(false);
    onClose();
  };

  const handleBlock = async () => {
    if (!user) return;
    await supabase.from("blocks").insert({ blocker_id: user.id, blocked_id: targetUserId } as any);
    toast.success("User blocked.");
    onClose();
  };

  const handleMute = async () => {
    if (!user) return;
    await supabase.from("mutes").insert({ muter_id: user.id, muted_id: targetUserId } as any);
    toast.success("User muted.");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-ink/50" />
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative bg-card border border-border rounded-lg p-5 w-full max-w-sm mx-4 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-display font-bold text-foreground">Report</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X size={18} /></button>
        </div>

        <div className="space-y-2 mb-4">
          {REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-3 py-2 text-sm font-display rounded-md border transition-colors ${
                reason === r ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={handleReport} disabled={!reason || submitting} className="gap-2 font-display">
            <Flag size={14} /> {submitting ? "Submitting..." : "Submit Report"}
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleBlock} className="flex-1 gap-1 font-display text-xs">
              <Ban size={12} /> Block User
            </Button>
            <Button variant="secondary" onClick={handleMute} className="flex-1 gap-1 font-display text-xs">
              <VolumeX size={12} /> Mute User
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default ReportDialog;
