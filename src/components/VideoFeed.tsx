import { videoPosts, VideoPost } from "@/lib/mock-data";
import { useState } from "react";
import { motion } from "framer-motion";
import { Play, MessageSquare, Circle, ChevronRight } from "lucide-react";

const VideoFeed = () => {
  const [page, setPage] = useState(1);
  const postsPerPage = 3;
  const visiblePosts = videoPosts.slice(0, page * postsPerPage);
  const hasMore = visiblePosts.length < videoPosts.length;

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h2 className="text-2xl font-display font-bold text-foreground mb-6 tracking-tight">
        The Quad
      </h2>

      <div className="space-y-8">
        {visiblePosts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.3 }}
          >
            <VideoCard post={post} />
          </motion.div>
        ))}
      </div>

      {hasMore && (
        <div className="mt-10 text-center">
          <button
            onClick={() => setPage((p) => p + 1)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-accent-foreground font-display font-medium text-sm rounded-md hover:bg-secondary transition-colors"
          >
            See More <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

const VideoCard = ({ post }: { post: VideoPost }) => {
  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <article className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Video thumbnail */}
      <div className="relative aspect-video bg-concrete flex items-center justify-center cursor-pointer group">
        <div className="w-16 h-16 rounded-full bg-ink/70 flex items-center justify-center group-hover:bg-primary transition-colors">
          <Play size={28} className="text-primary-foreground ml-1" />
        </div>
        <div className="absolute bottom-3 left-3 bg-ink/70 px-2 py-0.5 rounded text-xs font-display text-primary-foreground">
          4:32
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
            {post.author.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-display font-medium text-foreground">{post.author.name}</p>
            <p className="text-xs text-muted-foreground font-display">{post.author.department} · {timeAgo}</p>
          </div>
        </div>

        <h3 className="text-lg font-display font-semibold text-foreground mb-1">{post.title}</h3>
        <p className="text-sm font-body text-muted-foreground leading-relaxed">{post.description}</p>

        {/* Actions */}
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border">
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary font-display transition-colors">
            <Circle size={14} />
            <span>Acknowledge</span>
          </button>
          <button className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground font-display transition-colors">
            <MessageSquare size={14} />
            <span>{post.comments} comments</span>
          </button>
        </div>
      </div>
    </article>
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
