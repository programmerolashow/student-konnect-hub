# API Reference — Student Konnect

All data access uses the **Supabase JS client** (`@supabase/supabase-js`). No custom REST/GraphQL layer is needed.

## Authentication

```typescript
// Sign Up
supabase.auth.signUp({ email, password, options: { data: { name, username, school, faculty, department } } })

// Sign In
supabase.auth.signInWithPassword({ email, password })

// Sign Out
supabase.auth.signOut()

// Password Reset
supabase.auth.resetPasswordForEmail(email, { redirectTo: `${origin}/reset-password` })

// Update Password
supabase.auth.updateUser({ password: newPassword })
```

## Profiles

```typescript
// Get profile
supabase.from("profiles").select("*").eq("user_id", userId).single()

// Update profile
supabase.from("profiles").update({ name, bio, ... }).eq("user_id", userId)

// Upload avatar
supabase.storage.from("avatars").upload(path, file, { upsert: true })
```

## Videos

```typescript
// Fetch feed (paginated)
supabase.from("videos").select("*, profiles(*)").order("created_at", { ascending: false }).range(from, to)

// Upload video
supabase.storage.from("videos").upload(path, file)
supabase.from("videos").insert({ user_id, title, description, video_url, duration })

// Delete own video
supabase.from("videos").delete().eq("id", videoId).eq("user_id", userId)

// Trending (by engagement)
supabase.from("videos").select("*, profiles(*)").order("acknowledges", { ascending: false }).order("views_count", { ascending: false })
```

## Follow System

```typescript
// Follow
supabase.from("followers").insert({ follower_id: myId, following_id: targetId })

// Unfollow
supabase.from("followers").delete().eq("follower_id", myId).eq("following_id", targetId)

// Get follower count
supabase.from("followers").select("*", { count: "exact", head: true }).eq("following_id", userId)

// Get following count
supabase.from("followers").select("*", { count: "exact", head: true }).eq("follower_id", userId)
```

## Messages

```typescript
// Send message (text/image/voice)
supabase.from("messages").insert({ sender_id, receiver_id, text, image_url?, voice_note_url? })

// Fetch conversation
supabase.from("messages").select("*").or(`and(sender_id.eq.${a},receiver_id.eq.${b}),and(sender_id.eq.${b},receiver_id.eq.${a})`).order("created_at")

// Mark as read
supabase.from("messages").update({ read: true, status: "seen" }).eq("id", msgId)

// Realtime subscription
supabase.channel("messages-xxx").on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, callback).subscribe()
```

## Notifications

```typescript
// Fetch notifications
supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false })

// Mark all read
supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false)

// Realtime
supabase.channel("notifications").on("postgres_changes", { event: "INSERT", ... }, callback).subscribe()
```

## Comments (with @mentions)

```typescript
// Post comment
supabase.from("comments").insert({ video_id, user_id, text })

// Parse mentions and notify
const mentions = text.match(/@(\w+)/g)
// For each @username, look up profile and insert notification
```
