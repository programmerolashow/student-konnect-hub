
-- Create followers table
CREATE TABLE public.followers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

ALTER TABLE public.followers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view followers" ON public.followers FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.followers FOR INSERT TO authenticated WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.followers FOR DELETE TO authenticated USING (auth.uid() = follower_id);
