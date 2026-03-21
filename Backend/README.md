# Backend — Student Konnect

This folder documents all backend logic powering Student Konnect. The backend runs on **Lovable Cloud** (Supabase under the hood).

## Architecture

- **Database**: PostgreSQL with Row-Level Security (RLS)
- **Auth**: Supabase Auth (email/password with email verification)
- **Storage**: Supabase Storage (avatars, videos, chat-media buckets)
- **Realtime**: Supabase Realtime (messaging, comments, notifications, typing indicators)

## Database Schema

See `schema.sql` for the complete database schema including all tables, RLS policies, triggers, and functions.

## Tables

| Table | Description |
|-------|-------------|
| `profiles` | User profiles (name, bio, avatar, academic details) |
| `videos` | Uploaded video content with metadata |
| `comments` | Video comments with @mention support |
| `video_acknowledges` | Like/acknowledge system for videos |
| `video_views` | View tracking per user per video |
| `video_hashtags` | Many-to-many junction: videos ↔ hashtags |
| `hashtags` | Hashtag registry with video counts |
| `connections` | Peer connection requests (pending/accepted) |
| `followers` | Follow/unfollow relationships |
| `messages` | Direct messages with media and voice notes |
| `notifications` | In-app notifications (likes, follows, mentions, messages) |
| `blocks` | User blocking |
| `mutes` | User muting |
| `reports` | Content/user reports |

## Storage Buckets

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | Profile pictures |
| `videos` | Yes | Uploaded video files |
| `chat-media` | No | DM images and voice notes |

## Key Features

- **RLS Policies**: Every table has row-level security ensuring users can only access/modify their own data
- **Auto-profile creation**: Database trigger creates a profile when a new user signs up
- **Realtime subscriptions**: Messages, comments, and notifications update instantly
- **Optimistic UI**: Frontend inserts appear immediately, backend syncs in background
- **@Mentions**: Comments parse @username and send notifications to mentioned users
- **Follow/Unfollow**: Independent from the connection system
