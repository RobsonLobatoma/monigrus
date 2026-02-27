import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChats, useChatMessages, useSendMessage, useSendMedia, useDeleteMessage, useEditMessage } from "@/hooks/useWhatsAppMessages";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Search, Loader2, Users, Paperclip, MoreVertical, Pencil, Trash2, Image, Video, FileText, Music } from "lucide-react";

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

function MediaRenderer({ msg }: { msg: any }) {
  if (!msg.mediaUrl) return null;
  switch (msg.messageType) {
    case "image":
    case "sticker":
      return <img src={msg.mediaUrl} alt="media" className="max-w-full rounded mt-1 max-h-60 object-contain" />;
    case "video":
      return <video src={msg.mediaUrl} controls className="max-w-full rounded mt-1 max-h-60" />;
    case "audio":
      return <audio src={msg.mediaUrl} controls className="mt-1 w-full" />;
    case "document":
      return (
        <a href={msg.mediaUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-1 text-xs underline">
          <FileText className="w-4 h-4" /> {msg.fileName || "Documento"}
        </a>
      );
    default:
      return null;
  }
}

export default function ChatTab() {
  const { toast } = useToast();
  const [selectedInstanceId, setSelectedInstanceId] = useState<string>("");
  const [selectedChat, setSelectedChat] = useState<string>("");
  const [selectedChatName, setSelectedChatName] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [messageText, setMessageText] = useState("");
  const [editingMsg, setEditingMsg] = useState<any>(null);
  const [editText, setEditText] = useState("");
  const [mediaDialog, setMediaDialog] = useState(false);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");
  const [mediaCaption, setMediaCaption] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: instances } = useWhatsAppInstances();
  const connectedInstances = (instances || []).filter((i: any) => i.status === "connected");

  const { data: chats, isLoading: loadingChats } = useChats(selectedInstanceId);
  const { data: messages, isLoading: loadingMessages } = useChatMessages(selectedInstanceId, selectedChat);
  const sendMessage = useSendMessage();
  const sendMedia = useSendMedia();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();

  useEffect(() => {
    if (!selectedInstanceId && connectedInstances.length > 0) {
      setSelectedInstanceId(connectedInstances[0].id);
    }
  }, [connectedInstances, selectedInstanceId]);

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
    setMessageText("");
  };

  const handleSendMedia = () => {
    if (!mediaUrl.trim() || !selectedInstanceId || !selectedChat) return;
    sendMedia.mutate(
      { instanceId: selectedInstanceId, to: selectedChat, mediaUrl: mediaUrl.trim(), mediaType, caption: mediaCaption },
      {
        onError: (e: any) => toast({ title: "Erro ao enviar mídia", description: e.message, variant: "destructive" }),
      }
    );
    setMediaDialog(false);
    setMediaUrl("");
    setMediaCaption("");
  };

  const handleDelete = (msg: any) => {
    deleteMessage.mutate(
      { instanceId: selectedInstanceId, messageId: msg.id, remoteJid: selectedChat, fromMe: msg.fromMe },
      { onError: (e: any) => toast({ title: "Erro ao apagar", description: e.message, variant: "destructive" }) }
    );
  };

  const handleEdit = () => {
    if (!editingMsg || !editText.trim()) return;
    editMessage.mutate(
      { instanceId: selectedInstanceId, messageId: editingMsg.id, remoteJid: selectedChat, text: editText.trim(), fromMe: editingMsg.fromMe },
      {
        onSuccess: () => { setEditingMsg(null); setEditText(""); },
        onError: (e: any) => toast({ title: "Erro ao editar", description: e.message, variant: "destructive" }),
      }
    );
  };

  return (
    <div className="space-y-4">
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
          {/* Chat list */}
          <Card className="flex flex-col overflow-hidden">
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Buscar conversa..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9" />
              </div>
            </div>
            <ScrollArea className="flex-1">
              {loadingChats ? (
                <div className="space-y-3 p-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1 space-y-1.5"><Skeleton className="h-4 w-32" /><Skeleton className="h-3 w-48" /></div>
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
                      className={`w-full text-left px-3 py-2.5 flex items-center gap-3 hover:bg-accent/50 transition-colors ${selectedChat === chat.remoteJid ? "bg-accent" : ""}`}
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

          {/* Messages */}
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
                        <div key={msg.id || i} className={`flex ${msg.fromMe ? "justify-end" : "justify-start"} group`}>
                          <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm relative ${msg.fromMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                            {msg.fromMe && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <button className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/10">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="min-w-[120px]">
                                  <DropdownMenuItem onClick={() => { setEditingMsg(msg); setEditText(msg.text); }}>
                                    <Pencil className="w-3.5 h-3.5 mr-2" /> Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(msg)}>
                                    <Trash2 className="w-3.5 h-3.5 mr-2" /> Apagar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )}
                            {!msg.fromMe && msg.pushName && (
                              <p className="text-xs font-semibold mb-0.5 opacity-80">{msg.pushName}</p>
                            )}
                            <MediaRenderer msg={msg} />
                            {msg.text && <p className="whitespace-pre-wrap break-words">{msg.text}</p>}
                            {!msg.text && !msg.mediaUrl && <p className="whitespace-pre-wrap break-words">[{msg.messageType}]</p>}
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

                <div className="p-3 border-t flex gap-2">
                  <Button variant="ghost" size="icon" className="shrink-0" onClick={() => setMediaDialog(true)}>
                    <Paperclip className="w-4 h-4" />
                  </Button>
                  <Input
                    placeholder="Digite sua mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                    disabled={sendMessage.isPending}
                  />
                  <Button size="icon" onClick={handleSend} disabled={sendMessage.isPending || !messageText.trim()}>
                    {sendMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </>
            )}
          </Card>
        </div>
      )}

      {/* Media Dialog */}
      <Dialog open={mediaDialog} onOpenChange={setMediaDialog}>
        <DialogContent>
          <DialogHeader><DialogTitle>Enviar mídia</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Tipo</label>
              <div className="flex gap-2 mt-1">
                {[{ v: "image", icon: Image, label: "Imagem" }, { v: "video", icon: Video, label: "Vídeo" }, { v: "document", icon: FileText, label: "Doc" }, { v: "audio", icon: Music, label: "Áudio" }].map(t => (
                  <Button key={t.v} variant={mediaType === t.v ? "default" : "outline"} size="sm" onClick={() => setMediaType(t.v)}>
                    <t.icon className="w-3.5 h-3.5 mr-1" /> {t.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">URL da mídia</label>
              <Input placeholder="https://..." value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">Legenda (opcional)</label>
              <Input placeholder="Legenda..." value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} className="mt-1" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMediaDialog(false)}>Cancelar</Button>
            <Button onClick={handleSendMedia} disabled={!mediaUrl.trim() || sendMedia.isPending}>
              {sendMedia.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingMsg} onOpenChange={(o) => { if (!o) setEditingMsg(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar mensagem</DialogTitle></DialogHeader>
          <Input value={editText} onChange={e => setEditText(e.target.value)} onKeyDown={e => e.key === "Enter" && handleEdit()} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingMsg(null)}>Cancelar</Button>
            <Button onClick={handleEdit} disabled={!editText.trim() || editMessage.isPending}>
              {editMessage.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
