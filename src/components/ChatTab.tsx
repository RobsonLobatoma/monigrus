import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useChats, useChatMessages, useSendMessage, useSendMedia, useDeleteMessage, useEditMessage } from "@/hooks/useWhatsAppMessages";
import { useWhatsAppInstances } from "@/hooks/useWhatsAppInstances";
import { useToast } from "@/hooks/use-toast";
import { Send, MessageSquare, Loader2, Paperclip, Image, Video, FileText, Music } from "lucide-react";
import ChatList from "@/components/chat/ChatList";
import ChatMessages from "@/components/chat/ChatMessages";

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

  const { data: instances } = useWhatsAppInstances();
  const connectedInstances = (instances || []).filter((i: any) => i.status === "connected");

  const { data: chats, isLoading: loadingChats } = useChats(selectedInstanceId);
  const { data: messages, isLoading: loadingMessages } = useChatMessages(selectedInstanceId, selectedChat);
  const sendMessage = useSendMessage();
  const sendMedia = useSendMedia();
  const deleteMessage = useDeleteMessage();
  const editMessage = useEditMessage();

  const handleInstanceChange = useCallback((instanceId: string) => {
    setSelectedInstanceId(instanceId);
    setSelectedChat("");
    setSelectedChatName("");
  }, []);

  const handleChatSelect = useCallback((remoteJid: string, name: string) => {
    setSelectedChat(remoteJid);
    setSelectedChatName(name);
  }, []);

  const handleSend = useCallback(() => {
    if (!messageText.trim() || !selectedInstanceId || !selectedChat) return;
    sendMessage.mutate(
      { instanceId: selectedInstanceId, to: selectedChat, text: messageText.trim() },
      {
        onSuccess: () => setMessageText(""),
        onError: (e: any) => toast({ title: "Erro ao enviar", description: e.message, variant: "destructive" }),
      }
    );
    setMessageText("");
  }, [messageText, selectedInstanceId, selectedChat, sendMessage, toast]);

  const handleSendMedia = useCallback(() => {
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
  }, [mediaUrl, selectedInstanceId, selectedChat, mediaType, mediaCaption, sendMedia, toast]);

  const handleDelete = useCallback((msg: any) => {
    deleteMessage.mutate(
      { instanceId: selectedInstanceId, messageId: msg.id, remoteJid: selectedChat, fromMe: msg.fromMe },
      { onError: (e: any) => toast({ title: "Erro ao apagar", description: e.message, variant: "destructive" }) }
    );
  }, [selectedInstanceId, selectedChat, deleteMessage, toast]);

  const handleEdit = useCallback(() => {
    if (!editingMsg || !editText.trim()) return;
    editMessage.mutate(
      { instanceId: selectedInstanceId, messageId: editingMsg.id, remoteJid: selectedChat, text: editText.trim(), fromMe: editingMsg.fromMe },
      {
        onSuccess: () => { setEditingMsg(null); setEditText(""); },
        onError: (e: any) => toast({ title: "Erro ao editar", description: e.message, variant: "destructive" }),
      }
    );
  }, [editingMsg, editText, selectedInstanceId, selectedChat, editMessage, toast]);

  const handleEditStart = useCallback((msg: any) => {
    setEditingMsg(msg);
    setEditText(msg.text);
  }, []);

  return (
    <div className="space-y-4">
      <Select value={selectedInstanceId} onValueChange={handleInstanceChange}>
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
          <ChatList
            instanceId={selectedInstanceId}
            chats={chats || []}
            isLoading={loadingChats}
            selectedChat={selectedChat}
            searchTerm={searchTerm}
            onChatSelect={handleChatSelect}
            onSearchChange={setSearchTerm}
          />

          <Card className="flex flex-col overflow-hidden">
            <ChatMessages
              instanceId={selectedInstanceId}
              selectedChat={selectedChat}
              selectedChatName={selectedChatName}
              messages={messages || []}
              isLoading={loadingMessages}
              onEdit={handleEditStart}
              onDelete={handleDelete}
            />

            {selectedChat && (
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
