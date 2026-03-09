import React, { memo, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreVertical, Pencil, Trash2, Loader2 } from "lucide-react";
import ContactAvatar from "@/components/chat/ContactAvatar";
import MediaRenderer from "@/components/chat/MediaRenderer";

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

interface ChatMessagesProps {
  instanceId: string;
  selectedChat: string;
  selectedChatName: string;
  messages: any[];
  isLoading: boolean;
  onEdit: (msg: any) => void;
  onDelete: (msg: any) => void;
}

const MessageItem = memo(({ msg, instanceId, onEdit, onDelete, index }: {
  msg: any;
  instanceId: string;
  onEdit: (msg: any) => void;
  onDelete: (msg: any) => void;
  index: number;
}) => (
  <div className={`flex ${msg.fromMe ? "justify-end" : "justify-start"} group`}>
    <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm relative ${msg.fromMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
      {msg.fromMe && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10">
              <MoreVertical className="w-3.5 h-3.5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={() => onEdit(msg)}>
              <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
            </DropdownMenuItem>
            <DropdownMenuItem className="text-destructive" onClick={() => onDelete(msg)}>
              <Trash2 className="w-3.5 h-3.5 mr-2" /> Apagar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {!msg.fromMe && msg.pushName && (
        <p className="text-xs font-semibold mb-0.5 opacity-80">{msg.pushName}</p>
      )}
      <MediaRenderer msg={msg} instanceId={instanceId} />
      {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
      {!msg.text && !msg.mediaUrl && <p className="whitespace-pre-wrap break-words">[{msg.messageType}]</p>}
      <p className={`text-[10px] mt-1 ${msg.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
        {formatTime(msg.timestamp)}
      </p>
    </div>
  </div>
));

const ChatMessages = memo(({ instanceId, selectedChat, selectedChatName, messages, isLoading, onEdit, onDelete }: ChatMessagesProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!selectedChat) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <div className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p className="text-sm">Selecione uma conversa</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="px-4 py-3 border-b flex items-center gap-3">
        <ContactAvatar
          instanceId={instanceId}
          remoteJid={selectedChat}
          name={selectedChatName}
          isGroup={isGroup(selectedChat)}
          className="w-8 h-8"
        />
        <div>
          <p className="font-medium text-sm">{selectedChatName}</p>
          <p className="text-xs text-muted-foreground">{selectedChat}</p>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : !messages?.length ? (
          <p className="text-muted-foreground text-center text-sm py-8">Nenhuma mensagem encontrada</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, i) => (
              <MessageItem
                key={msg.id || i}
                msg={msg}
                instanceId={instanceId}
                onEdit={onEdit}
                onDelete={onDelete}
                index={i}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </ScrollArea>
    </>
  );
});

export default ChatMessages;