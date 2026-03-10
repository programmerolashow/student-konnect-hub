import { useState, useRef } from "react";
import { chats, currentUser, users, Chat, Message } from "@/lib/mock-data";
import { Send, Mic, Image, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface MessagingViewProps {
  activeChatUserId?: string;
  onBack?: () => void;
}

const MessagingView = ({ activeChatUserId, onBack }: MessagingViewProps) => {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(
    activeChatUserId ? chats.find((c) => c.participant.id === activeChatUserId) || null : null
  );
  const [newMessage, setNewMessage] = useState("");
  const [chatMessages, setChatMessages] = useState<Record<string, Message[]>>(
    Object.fromEntries(chats.map((c) => [c.id, c.messages]))
  );
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSend = () => {
    if (!newMessage.trim() || !selectedChat) return;
    const msg: Message = {
      id: `m-${Date.now()}`,
      senderId: currentUser.id,
      text: newMessage.trim(),
      timestamp: new Date().toISOString(),
    };
    setChatMessages((prev) => ({
      ...prev,
      [selectedChat.id]: [...(prev[selectedChat.id] || []), msg],
    }));
    setNewMessage("");
    inputRef.current?.focus();
  };

  if (!selectedChat) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-xl font-display font-bold text-foreground">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setSelectedChat(chat)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent transition-colors border-b border-border"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-display font-semibold text-secondary-foreground">
                {chat.participant.name.charAt(0)}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-display font-medium text-foreground">{chat.participant.name}</p>
                <p className="text-xs text-muted-foreground font-body truncate">{chat.lastMessage}</p>
              </div>
              {chat.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs font-display font-bold flex items-center justify-center">
                  {chat.unread}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const messages = chatMessages[selectedChat.id] || [];

  return (
    <div className="h-full flex flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-3 p-4 border-b border-border">
        <button onClick={() => { setSelectedChat(null); onBack?.(); }} className="text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-display font-semibold text-secondary-foreground">
          {selectedChat.participant.name.charAt(0)}
        </div>
        <div>
          <p className="text-sm font-display font-medium text-foreground">{selectedChat.participant.name}</p>
          <p className="text-xs text-muted-foreground font-display">
            {selectedChat.participant.online ? "Online" : "Offline"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${isMe ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] px-3 py-2 rounded-lg text-sm font-body ${
                  isMe
                    ? "bg-primary text-primary-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2">
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Upload image">
            <Image size={18} />
          </button>
          <button className="p-2 text-muted-foreground hover:text-foreground transition-colors" title="Voice note">
            <Mic size={18} />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 bg-accent border-none rounded-md text-sm font-display text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className="p-2 text-primary hover:opacity-80 disabled:opacity-30 transition-opacity"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MessagingView;
