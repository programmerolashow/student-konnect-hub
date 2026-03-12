import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tables } from "@/integrations/supabase/types";
import { Send, Mic, Image, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

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
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch chat partners (anyone you've exchanged messages with)
  useEffect(() => {
    if (!user) return;
    const fetchPartners = async () => {
      // Get distinct users from messages
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

      // If activeChatUserId, select that partner
      if (activeChatUserId) {
        const { data: profile } = await supabase.from("profiles").select("*").eq("user_id", activeChatUserId).single();
        if (profile) setSelectedPartner(profile);
      }
    };
    fetchPartners();
  }, [user, activeChatUserId]);

  // Fetch messages for selected partner
  useEffect(() => {
    if (!user || !selectedPartner) return;
    const fetchMessages = async () => {
      const { data } = await supabase
        .from("messages")
        .select("*")
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${selectedPartner.user_id}),and(sender_id.eq.${selectedPartner.user_id},receiver_id.eq.${user.id})`)
        .order("created_at", { ascending: true });
      setMessages(data || []);
      // Mark as read
      await supabase.from("messages").update({ read: true }).eq("sender_id", selectedPartner.user_id).eq("receiver_id", user.id).eq("read", false);
    };
    fetchMessages();

    // Realtime subscription
    const channel = supabase
      .channel(`messages-${selectedPartner.user_id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const msg = payload.new as MessageRow;
        if ((msg.sender_id === user.id && msg.receiver_id === selectedPartner.user_id) || (msg.sender_id === selectedPartner.user_id && msg.receiver_id === user.id)) {
          setMessages((prev) => [...prev, msg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, selectedPartner]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedPartner || !user) return;
    await supabase.from("messages").insert({ sender_id: user.id, receiver_id: selectedPartner.user_id, text: newMessage.trim() });
    setNewMessage("");
    inputRef.current?.focus();
  };

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
              {partner.avatar_url ? (
                <img src={partner.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-semibold text-secondary-foreground">{partner.name.charAt(0)}</div>
              )}
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
          <p className="text-xs text-muted-foreground font-display">{selectedPartner.online ? "Online" : "Offline"}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.sender_id === user?.id;
          return (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[75%] px-3 py-2 rounded-lg text-sm font-body ${isMe ? "bg-primary text-primary-foreground" : "bg-accent text-accent-foreground"}`}>
                {msg.text}
              </div>
            </motion.div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Upload image"><Image size={18} /></button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Voice note"><Mic size={18} /></button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-accent border-none rounded-md text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button onClick={handleSend} disabled={!newMessage.trim()} className="p-2 text-primary hover:opacity-80 disabled:opacity-30 transition-opacity"><Send size={18} /></button>
        </div>
      </div>
    </div>
  );
};

export default MessagingView;
