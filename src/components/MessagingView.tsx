import { useState, useRef, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Send, Mic, MicOff, Image, ArrowLeft, Check, CheckCheck, Eye, Play, Pause, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface MessagingViewProps {
  activeChatUserId?: string;
  onBack?: () => void;
}

type ChatPartner = Tables<"profiles">;
type MessageRow = Tables<"messages">;

const MessagingView = ({ activeChatUserId, onBack }: MessagingViewProps) => {
  const { user } = useAuth();
  const [partners, setPartners] = useState<(ChatPartner & { lastMessage?: string; unread: number })[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<ChatPartner | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  // Voice note state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout>();

  // Fetch chat partners
  useEffect(() => {
    if (!user) return;
    const fetchPartners = async () => {
      const { data: sent } = await supabase.from("messages").select("receiver_id").eq("sender_id", user.id);
      const { data: received } = await supabase.from("messages").select("sender_id").eq("receiver_id", user.id);
      const partnerIds = [...new Set([...(sent?.map((m) => m.receiver_id) || []), ...(received?.map((m) => m.sender_id) || [])])];

      if (partnerIds.length > 0) {
        const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", partnerIds);
        const partnersWithMeta = await Promise.all(
          (profiles || []).map(async (p) => {
            const { data: lastMsg } = await supabase.from("messages").select("text, created_at").or(`and(sender_id.eq.${user.id},receiver_id.eq.${p.user_id}),and(sender_id.eq.${p.user_id},receiver_id.eq.${user.id})`).order("created_at", { ascending: false }).limit(1).single();
            const { count } = await supabase.from("messages").select("*", { count: "exact", head: true }).eq("sender_id", p.user_id).eq("receiver_id", user.id).eq("read", false);
            return { ...p, lastMessage: lastMsg?.text || "", unread: count || 0 };
          })
        );
        setPartners(partnersWithMeta);
      }

      if (activeChatUserId) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", activeChatUserId).single();
        if (profile) setSelectedPartner(profile);
      }
    };
    fetchPartners();
  }, [user, activeChatUserId]);

  // Fetch messages + realtime + typing
  useEffect(() => {
    if (!user || !selectedPartner) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      await supabase.from("messages").update({ read: true, status: "seen" } as any).eq("sender_id", selectedPartner.user_id).eq("receiver_id", user.id).eq("read", false);
    };
    fetchMessages();

    const channel = supabase
      .channel(`messages-${selectedPartner.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as MessageRow;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedPartner.user_id) || (msg.sender_id === selectedPartner.user_id && msg.receiver_id === user.id)) {
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          if (msg.sender_id === selectedPartner.user_id) {
            supabase.from("messages").update({ read: true, status: "seen" } as any).eq("id", msg.id);
          }
        }
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, (payload) => {
        const updated = payload.new as MessageRow;
        setMessages((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      })
      .subscribe();

    const presenceChannel = supabase.channel(`typing-${[user.id, selectedPartner.user_id].sort().join("-")}`, { config: { presence: { key: user.id } } });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const typing = new Set<string>();
        Object.entries(state).forEach(([key, presences]) => {
          if (key !== user.id && (presences as any)[0]?.typing) typing.add(key);
        });
        setTypingUsers(typing);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [user, selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTyping = () => {
    if (!user || !selectedPartner) return;
    const channelName = `typing-${[user.id, selectedPartner.user_id].sort().join("-")}`;
    const channel = supabase.channel(channelName);
    channel.track({ typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ typing: false });
    }, 2000);
  };

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner || !user) return;
    const text = newMessage.trim();
    setNewMessage("");

    // Optimistic insert
    const optimisticMsg: MessageRow = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedPartner.user_id,
      text,
      image_url: null,
      voice_note_url: null,
      read: false,
      status: "sent",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    inputRef.current?.focus();

    const channelName = `typing-${[user.id, selectedPartner.user_id].sort().join("-")}`;
    supabase.channel(channelName).track({ typing: false });

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedPartner.user_id,
      text,
      status: "sent",
    } as any);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !selectedPartner) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-media").upload(path, file);
    if (error) { toast.error("Failed to upload."); return; }
    const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);

    const optimisticMsg: MessageRow = {
      id: crypto.randomUUID(),
      sender_id: user.id,
      receiver_id: selectedPartner.user_id,
      text: "",
      image_url: publicUrl,
      voice_note_url: null,
      read: false,
      status: "sent",
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedPartner.user_id,
      text: "",
      image_url: publicUrl,
      status: "sent",
    } as any);
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      setRecordingDuration(0);

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size === 0) return;

        if (!user || !selectedPartner) return;
        const path = `${user.id}/${Date.now()}.webm`;
        const { error } = await supabase.storage.from("chat-media").upload(path, blob);
        if (error) { toast.error("Failed to upload voice note."); return; }
        const { data: { publicUrl } } = supabase.storage.from("chat-media").getPublicUrl(path);

        const optimisticMsg: MessageRow = {
          id: crypto.randomUUID(),
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          text: "",
          image_url: null,
          voice_note_url: publicUrl,
          read: false,
          status: "sent",
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, optimisticMsg]);

        await supabase.from("messages").insert({
          sender_id: user.id,
          receiver_id: selectedPartner.user_id,
          text: "",
          voice_note_url: publicUrl,
          status: "sent",
        } as any);
      };

      mediaRecorder.start();
      setIsRecording(true);
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration((d) => d + 1);
      }, 1000);
    } catch {
      toast.error("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setRecordingDuration(0);
    if (recordingIntervalRef.current) clearInterval(recordingIntervalRef.current);
  };

  const getStatusIcon = (msg: MessageRow) => {
    if (msg.sender_id !== user?.id) return null;
    const status = (msg as any).status || "sent";
    if (status === "seen") return <Eye size={12} className="text-primary" />;
    if (status === "delivered") return <CheckCheck size={12} className="text-muted-foreground" />;
    return <Check size={12} className="text-muted-foreground" />;
  };

  const formatDuration = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  if (!selectedPartner) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-display font-bold text-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {partners.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground font-body text-sm">No messages yet. Connect with students and start chatting!</p>
            </div>
          )}
          {partners.map((partner) => (
            <button key={partner.id} onClick={() => setSelectedPartner(partner)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border">
              <div className="relative">
                {partner.avatar_url ? (
                  <img src={partner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-semibold text-secondary-foreground">{partner.name.charAt(0)}</div>
                )}
                {partner.online && <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background" />}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-display font-medium text-foreground">{partner.name}</p>
                <p className="text-xs text-muted-foreground font-body truncate">{partner.lastMessage}</p>
              </div>
              {partner.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold flex items-center justify-center">{partner.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => { setSelectedPartner(null); onBack?.(); }} className="text-muted-foreground hover:text-foreground transition-colors"><ArrowLeft size={20} /></button>
        {selectedPartner.avatar_url ? (
          <img src={selectedPartner.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">{selectedPartner.name.charAt(0)}</div>
        )}
        <div>
          <p className="text-sm font-display font-medium text-foreground">{selectedPartner.name}</p>
          <p className="text-xs text-muted-foreground font-display">
            {typingUsers.has(selectedPartner.user_id) ? (
              <span className="text-primary">typing...</span>
            ) : selectedPartner.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] ${isMe ? "text-right" : "text-left"}`}>
                {msg.image_url && (
                  <img src={msg.image_url} alt="" className="max-w-full rounded-lg mb-1 max-h-48 object-cover" />
                )}
                {msg.voice_note_url && (
                  <VoiceNotePlayer url={msg.voice_note_url} isMe={isMe} />
                )}
                {msg.text && (
                  <div className={`inline-block px-3 py-2 rounded-lg text-sm font-body ${isMe ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                    {msg.text}
                  </div>
                )}
                <div className={`flex items-center gap-1 mt-0.5 ${isMe ? "justify-end" : "justify-start"}`}>
                  <span className="text-[10px] text-muted-foreground font-display">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {getStatusIcon(msg)}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        {isRecording ? (
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              <span className="text-sm font-display text-destructive font-medium">Recording {formatDuration(recordingDuration)}</span>
            </div>
            <button onClick={stopRecording} className="p-2 bg-destructive text-destructive-foreground rounded-full hover:opacity-90 transition-opacity">
              <MicOff size={18} />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Upload image"><Image size={18} /></button>
            <input ref={fileInputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleImageUpload} />
            <button onClick={startRecording} className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Voice note"><Mic size={18} /></button>
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 px-3 py-2 bg-accent border-none rounded-md text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <button onClick={handleSend} disabled={!newMessage.trim()} className="p-2 text-primary hover:opacity-80 disabled:opacity-30 transition-opacity"><Send size={18} /></button>
          </div>
        )}
      </div>
    </div>
  );
};

// Voice note playback component
const VoiceNotePlayer = ({ url, isMe }: { url: string; isMe: boolean }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentTime(audio.currentTime);
    const onMeta = () => setDuration(audio.duration);
    const onEnd = () => setPlaying(false);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("loadedmetadata", onMeta);
    audio.addEventListener("ended", onEnd);
    return () => {
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("loadedmetadata", onMeta);
      audio.removeEventListener("ended", onEnd);
    };
  }, []);

  const toggle = () => {
    if (!audioRef.current) return;
    if (playing) { audioRef.current.pause(); setPlaying(false); }
    else { audioRef.current.play(); setPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg mb-1 ${isMe ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
      <audio ref={audioRef} src={url} preload="metadata" />
      <button onClick={toggle} className="flex-shrink-0">
        {playing ? <Pause size={16} /> : <Play size={16} />}
      </button>
      <div className="flex-1 min-w-[80px]">
        <div className="h-1 bg-current/20 rounded-full overflow-hidden">
          <div className="h-full bg-current rounded-full transition-all" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }} />
        </div>
      </div>
      <span className="text-[10px] font-display tabular-nums">{fmt(playing ? currentTime : duration || 0)}</span>
    </div>
  );
};

export default MessagingView;
