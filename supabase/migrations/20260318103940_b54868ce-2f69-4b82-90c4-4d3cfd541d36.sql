
-- Hashtags table
CREATE TABLE public.hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  video_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Hashtags viewable by everyone" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert hashtags" ON public.hashtags FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated can update hashtags" ON public.hashtags FOR UPDATE TO authenticated USING (true);

-- Video-hashtag junction
CREATE TABLE public.video_hashtags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  UNIQUE(video_id, hashtag_id)
);
ALTER TABLE public.video_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Video hashtags viewable by everyone" ON public.video_hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert video hashtags" ON public.video_hashtags FOR INSERT TO authenticated WITH CHECK (true);

-- Video views tracking
CREATE TABLE public.video_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id uuid NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(video_id, user_id)
);
ALTER TABLE public.video_views ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Views viewable by everyone" ON public.video_views FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert views" ON public.video_views FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Add views_count to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views_count integer NOT NULL DEFAULT 0;

-- Reports table
CREATE TABLE public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid NOT NULL,
  reported_user_id uuid,
  reported_video_id uuid,
  reason text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create reports" ON public.reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "Users can view own reports" ON public.reports FOR SELECT TO authenticated USING (auth.uid() = reporter_id);

-- Blocks table
CREATE TABLE public.blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid NOT NULL,
  blocked_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);
ALTER TABLE public.blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blocks" ON public.blocks FOR ALL TO authenticated USING (auth.uid() = blocker_id) WITH CHECK (auth.uid() = blocker_id);

-- Mutes table
CREATE TABLE public.mutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  muter_id uuid NOT NULL,
  muted_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(muter_id, muted_id)
);
ALTER TABLE public.mutes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own mutes" ON public.mutes FOR ALL TO authenticated USING (auth.uid() = muter_id) WITH CHECK (auth.uid() = muter_id);

-- Add message status field
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'sent';
