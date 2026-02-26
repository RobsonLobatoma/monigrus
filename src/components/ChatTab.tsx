import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useChats, useChatMessages, useSendMessage } from "@/hooks/useWhatsAppMessages";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Search, Loader2, User, Users } from "lucide-react";

function formatTime(ts: number) {
  if (!ts) return "";
  const d = new Date(ts * 1000);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() || "?";
}

function isGroup(jid: string) {
  return jid.includes("@g.us");
}

export default function ChatTab() {
  const { toast } = useToast();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [selectedChatName, setSelectedChatName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: instances } = useWhatsAppInstances();
  const connectedInstances = (instances || []).filter((i: any) => i.status === "connected");

  const { data: chats, isLoading: loadingChats } = useChats(selectedInstanceId);
  const { data: messages, isLoading: loadingMessages } = useChatMessages(selectedInstanceId, selectedChat);
  const sendMessage = useSendMessage();

  // Auto-select first connected instance
  useEffect(() => {
    if (!selectedInstanceId && connectedInstances.length > 0) {
      setSelectedInstanceId(connectedInstances[0].id);
    }
  }, [connectedInstances, selectedInstanceId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const filteredChats = (chats || []).filter((c: any) =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.remoteJid?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSend = () => {
    if (!messageText.trim() || !selectedInstanceId || !selectedChat) return;
    sendMessage.mutate(
      { instanceId: selectedInstanceId, to: selectedChat, text: messageText.trim() },
      {
        onSuccess: () => setMessageText(""),
        onError: (e: any) => toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4">
      {/* Instance selector */}
      <Select value={selectedInstanceId} onValueChange={(v) => { setSelectedInstanceId(v); setSelectedChat(""); setSelectedChatName(""); }}>
        <SelectTrigger className="w-full max-w-xs">
          <SelectValue placeholder="Selecione uma instância conectada" />
        </SelectTrigger>
        <SelectContent>
          {connectedInstances.map((inst: any) => (
            <SelectItem key={inst.id} value={inst.id}>
              {inst.instance_name} {inst.phone_number ? `(${inst.phone_number})` : ""}
            </SelectItem>
          ))}
          {connectedInstances.length === 0 && (
            <div className="px-2 py-3 text-sm text-muted-foreground text-center">Nenhuma instância conectada</div>
          )}
        </SelectContent>
      </Select>

      {!selectedInstanceId ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mb-3 opacity-40" />
            <p>Selecione uma instância conectada para ver as conversas</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 h-[calc(100vh-280px)] min-h-[500px]">
          {/* Left: Chat list */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar conversa..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-9"
                />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingChats ? (
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
                    <button
                      key={chat.remoteJid}
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-accent/50 transition-colors ${
                        selectedChat === chat.remoteJid ? "bg-accent" : ""
                      }`}
                      onClick={() => { setSelectedChat(chat.remoteJid); setSelectedChatName(chat.name); }}
                    >
                      <Avatar className="w-10 h-10 shrink-0">
                        <AvatarFallback className="text-xs">
                          {isGroup(chat.remoteJid) ? <Users className="w-4 h-4" /> : getInitials(chat.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm truncate">{chat.name}</span>
                          <span className="text-xs text-muted-foreground shrink-0 ml-2">{formatTime(chat.timestamp)}</span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{chat.lastMessage || "..."}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </Card>

          {/* Right: Messages */}
          <Card className="flex flex-col overflow-hidden">
            {!selectedChat ? (
              <CardContent className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">Selecione uma conversa</p>
                </div>
              </CardContent>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-xs">
                      {isGroup(selectedChat) ? <Users className="w-4 h-4" /> : getInitials(selectedChatName)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-sm">{selectedChatName}</p>
                    <p className="text-xs text-muted-foreground">{selectedChat}</p>
                  </div>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                  {loadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : !messages?.length ? (
                    <p className="text-muted-foreground text-center text-sm py-8">Nenhuma mensagem encontrada</p>
                  ) : (
                    <div className="space-y-2">
                      {messages.map((msg: any, i: number) => (
                        <div key={msg.id || i} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                            msg.fromMe
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}>
                            {!msg.fromMe && msg.pushName && (
                              <p className="text-xs font-semibold mb-0.5 opacity-80">{msg.pushName}</p>
                            )}
                            <p className="whitespace-pre-wrap break-words">{msg.text || `[${msg.messageType}]`}</p>
                            <p className={`text-[10px] mt-1 ${msg.fromMe ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                              {formatTime(msg.timestamp)}
                            </p>
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                {/* Input */}
                <div className="p-3 border-t flex gap-2">
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sendMessage.isPending}
                  />
                  <Button
                    size="icon"
                    onClick={handleSend}
                    disabled={sendMessage.isPending || !messageText.trim()}
                  >
                    {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
