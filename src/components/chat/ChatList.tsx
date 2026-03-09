import React, { memo } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";
import ContactAvatar from "@/components/chat/ContactAvatar";

function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function isGroup(jid: string) {
  return jid.includes("@g.us");
}

interface ChatListProps {
  instanceId: string;
  chats: any[];
  isLoading: boolean;
  selectedChat: string;
  searchTerm: string;
  onChatSelect: (remoteJid: string, name: string) => void;
  onSearchChange: (term: string) => void;
}

const ChatItem = memo(({ chat, instanceId, isSelected, onClick }: {
  chat: any;
  instanceId: string;
  isSelected: boolean;
  onClick: () => void;
}) => (
  <button
    className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-accent/50 transition-colors ${isSelected ? "bg-accent" : ""}`}
    onClick={onClick}
  >
    <ContactAvatar
      instanceId={instanceId}
      remoteJid={chat.remoteJid}
      name={chat.name}
      isGroup={isGroup(chat.remoteJid)}
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate">{chat.name}</span>
        <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTime(chat.timestamp)}</span>
      </div>
      <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || "..."}</p>
    </div>
  </button>
));

const ChatList = memo(({ instanceId, chats, isLoading, selectedChat, searchTerm, onChatSelect, onSearchChange }: ChatListProps) => {
  const filteredChats = chats.filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.remoteJid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="flex flex-col overflow-hidden">
      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar conversa..." 
            value={searchTerm} 
            onChange={(e) => onSearchChange(e.target.value)} 
            className="pl-9 h-9" 
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="space-y-3 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredChats.length === 0 ? (
          <p className="text-muted-foreground text-center text-sm py-8">Nenhuma conversa encontrada</p>
        ) : (
          <div className="divide-y">
            {filteredChats.map((chat: any) => (
              <ChatItem
                key={chat.remoteJid}
                chat={chat}
                instanceId={instanceId}
                isSelected={selectedChat === chat.remoteJid}
                onClick={() => onChatSelect(chat.remoteJid, chat.name)}
              />
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );
});

export default ChatList;