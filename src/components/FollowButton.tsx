import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserPlus, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  targetName?: string;
}

const FollowButton = ({ targetUserId, targetName }: FollowButtonProps) => {
  const { user } = useAuth();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.id === targetUserId) { setLoading(false); return; }
    supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", targetUserId)
      .then(({ data }) => {
        setIsFollowing((data?.length || 0) > 0);
        setLoading(false);
      });
  }, [user, targetUserId]);

  const toggleFollow = async () => {
    if (!user) return;
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("following_id", targetUserId);
      setIsFollowing(false);
      toast.info("Unfollowed.");
    } else {
      await supabase.from("followers").insert({ follower_id: user.id, following_id: targetUserId });
      setIsFollowing(true);
      await supabase.from("notifications").insert({
        user_id: targetUserId,
        type: "follow",
        title: "New Follower",
        body: `${targetName || "Someone"} started following you!`,
      });
      toast.success("Following!");
    }
  };

  if (!user || user.id === targetUserId || loading) return null;

  return (
    <Button size="sm" variant={isFollowing ? "secondary" : "default"} className="text-xs font-display h-8 gap-1" onClick={toggleFollow}>
      {isFollowing ? <><UserCheck size={14} /> Following</> : <><UserPlus size={14} /> Follow</>}
    </Button>
  );
};

export default FollowButton;
