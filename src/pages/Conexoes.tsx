import { useState, useEffect, useRef, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { useWhatsAppProviders, useActivateProvider, useUpdateProviderConfig, useHealthCheck } from "@/hooks/useWhatsAppProviders";
import { useWhatsAppInstances, useCreateInstance, useDeleteInstance, useConnectInstance, useDisconnectInstance, useGetQrCode, useSyncGroups, useCheckStatus } from "@/hooks/useWhatsAppInstances";
import { useMessageLog, useWebhooksLog } from "@/hooks/useWhatsAppMessages";

import ChatTab from "@/components/ChatTab";
import { Plus, Trash2, Plug, Unplug, QrCode, Heart, RefreshCw, Wifi, WifiOff, AlertCircle, Loader2, Search, MessageSquare } from "lucide-react";

const statusColors: Record<string, string> = {
  connected: "bg-green-500/20 text-green-400 border-green-500/30",
  connecting: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  disconnected: "bg-muted text-muted-foreground",
  error: "bg-destructive/20 text-destructive border-destructive/30",
};


export default function Conexoes() {
  const { toast } = useToast();
  const [newInstanceName, setNewInstanceName] = useState("");
  const [qrModal, setQrModal] = useState<{ open: boolean; qrCode?: string; instanceName?: string; instanceId?: string }>({ open: false });
  
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollingCountRef = useRef(0);


  const { data: providers, isLoading: loadingProviders } = useWhatsAppProviders();
  const { data: instances, isLoading: loadingInstances } = useWhatsAppInstances();
  const { data: messageLogs, isLoading: loadingLogs } = useMessageLog();
  const { data: webhookLogs, isLoading: loadingWebhooks } = useWebhooksLog();
  

  const activateProvider = useActivateProvider();
  const updateConfig = useUpdateProviderConfig();
  const healthCheck = useHealthCheck();
  const createInstance = useCreateInstance();
  const deleteInstance = useDeleteInstance();
  const connectInstance = useConnectInstance();
  const disconnectInstance = useDisconnectInstance();
  const getQrCode = useGetQrCode();
  const syncGroups = useSyncGroups();
  const checkStatus = useCheckStatus();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    pollingCountRef.current = 0;
  }, []);

  const startPolling = useCallback((instanceId: string) => {
    stopPolling();
    pollingCountRef.current = 0;
    pollingRef.current = setInterval(() => {
      pollingCountRef.current++;
      if (pollingCountRef.current > 12) {
        stopPolling();
        return;
      }
      checkStatus.mutate(instanceId, {
        onSuccess: (data: any) => {
          if (data?.status === "connected") {
            stopPolling();
            setQrModal(s => ({ ...s, open: false }));
            toast({ title: "Conectado!", description: "Instância conectada com sucesso. Sincronizando grupos..." });
            syncGroups.mutate({ instanceId }, {
              onSuccess: (syncData: any) => {
                toast({ title: "Grupos sincronizados", description: `${syncData?.synced || 0} grupos mapeados.` });
              },
              onError: (err: any) => {
                toast({ title: "Erro ao sincronizar grupos", description: err.message, variant: "destructive" });
              },
            });
          }
        },
      });
    }, 5000);
  }, [stopPolling, checkStatus, syncGroups, toast]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  const autoCheckedIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    if (!instances?.length) return;
    const connectingInstances = instances.filter((i: any) => i.status === "connecting");
    connectingInstances.forEach((inst: any) => {
      if (autoCheckedIdsRef.current.has(inst.id)) return;
      autoCheckedIdsRef.current.add(inst.id);
      checkStatus.mutate(inst.id, {
        onSuccess: (data: any) => {
          if (data?.justConnected || data?.status === "connected") {
            toast({ title: `${inst.instance_name} conectada!`, description: "Sincronizando grupos automaticamente..." });
            syncGroups.mutate({ instanceId: inst.id }, {
              onSuccess: (syncData: any) => {
                toast({ title: "Grupos sincronizados", description: `${syncData?.synced || 0} grupos mapeados.` });
              },
              onError: (err: any) => {
                console.error("Auto-sync failed:", err.message);
              },
            });
          }
        },
        onError: (err: any) => {
          console.error("Auto-check status failed:", err.message);
        },
      });
    });
  }, [instances]);


  const handleCreateInstance = () => {
    if (!newInstanceName.trim()) return;
    createInstance.mutate(
      { instanceName: newInstanceName.trim() },
      {
        onSuccess: () => {
          toast({ title: "Instância criada com sucesso" });
          setNewInstanceName("");
        },
        onError: (e: any) => toast({ title: "Erro ao criar instância", description: e.message, variant: "destructive" }),
      }
    );
  };

  const handleConnect = (instanceId: string, instanceName: string) => {
    connectInstance.mutate(instanceId, {
      onSuccess: (data: any) => {
        if (data?.alreadyConnected) {
          toast({ title: "Já conectado!", description: `${instanceName} já está conectada. Sincronizando grupos...` });
          syncGroups.mutate({ instanceId }, {
            onSuccess: (syncData: any) => {
              toast({ title: "Grupos sincronizados", description: `${syncData?.synced || 0} grupos mapeados.` });
            },
            onError: (err: any) => {
              toast({ title: "Erro ao sincronizar grupos", description: err.message, variant: "destructive" });
            },
          });
          return;
        }
        if (data?.qrCode) {
          setQrModal({ open: true, qrCode: data.qrCode, instanceName, instanceId });
          startPolling(instanceId);
        } else {
          toast({ title: "Conexão iniciada", description: "Aguardando QR Code..." });
          startPolling(instanceId);
        }
      },
      onError: (e: any) => toast({ title: "Erro ao conectar", description: e.message, variant: "destructive" }),
    });
  };

  const handleGetQr = (instanceId: string, instanceName: string) => {
    getQrCode.mutate(instanceId, {
      onSuccess: (data: any) => {
        if (data?.qrCode) {
          setQrModal({ open: true, qrCode: data.qrCode, instanceName });
        } else {
          toast({ title: "QR Code não disponível", variant: "destructive" });
        }
      },
      onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
    });
  };


  const handleCreateTag = () => {
    if (!newTagName.trim()) return;
    createTag.mutate({ nome: newTagName.trim(), cor: newTagColor }, {
      onSuccess: () => {
        toast({ title: "Tag criada" });
        setNewTagName("");
        setNewTagColor(TAG_COLORS[0]);
      },
      onError: (e: any) => toast({ title: "Erro ao criar tag", description: e.message, variant: "destructive" }),
    });
  };

  const handleUpdateTag = (id: string) => {
    updateTag.mutate({ id, nome: editTagName, cor: editTagColor }, {
      onSuccess: () => {
        toast({ title: "Tag atualizada" });
        setEditingTagId(null);
      },
      onError: (e: any) => toast({ title: "Erro ao atualizar", description: e.message, variant: "destructive" }),
    });
  };

  const handleDeleteTag = (id: string) => {
    deleteTag.mutate(id, {
      onSuccess: () => toast({ title: "Tag excluída" }),
      onError: (e: any) => toast({ title: "Erro ao excluir", description: e.message, variant: "destructive" }),
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Conexões WhatsApp</h1>
        <p className="text-muted-foreground">Gerencie instâncias, providers e monitore mensagens</p>
      </div>

      <Tabs defaultValue="instances" className="space-y-4">
        <TabsList>
          <TabsTrigger value="instances">Instâncias</TabsTrigger>
          <TabsTrigger value="chat"><MessageSquare className="w-4 h-4 mr-1" />Chat</TabsTrigger>
          <TabsTrigger value="providers">Providers</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        {/* ── Chat Tab ── */}
        <TabsContent value="chat">
          <ChatTab />
        </TabsContent>

        {/* ── Instances Tab ── */}
        <TabsContent value="instances" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Instância</CardTitle>
              <CardDescription>Crie uma nova instância WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Nome da instância"
                  value={newInstanceName}
                  onChange={(e) => setNewInstanceName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateInstance()}
                />
                <Button onClick={handleCreateInstance} disabled={createInstance.isPending}>
                  {createInstance.isPending ? <Loader2 className="animate-spin" /> : <Plus />}
                  Criar
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Instâncias Ativas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingInstances ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : !instances?.length ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma instância encontrada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Telefone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {instances.map((inst: any) => (
                      <TableRow key={inst.id}>
                        <TableCell className="font-medium">{inst.instance_name}</TableCell>
                        <TableCell>{inst.phone_number || "—"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={statusColors[inst.status] || ""}>
                            {inst.status === "connected" && <Wifi className="w-3 h-3 mr-1" />}
                            {inst.status === "disconnected" && <WifiOff className="w-3 h-3 mr-1" />}
                            {inst.status === "error" && <AlertCircle className="w-3 h-3 mr-1" />}
                            {inst.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{inst.whatsapp_providers?.display_name || "—"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-1">
                            {inst.status !== "connected" && (
                              <Button size="icon" variant="ghost" title="Conectar" onClick={() => handleConnect(inst.id, inst.instance_name)} disabled={connectInstance.isPending}>
                                <Plug className="w-4 h-4" />
                              </Button>
                            )}
                            {inst.status === "connected" && (
                              <Button size="icon" variant="ghost" title="Desconectar" onClick={() => disconnectInstance.mutate(inst.id, { onSuccess: () => toast({ title: "Desconectado" }) })} disabled={disconnectInstance.isPending}>
                                <Unplug className="w-4 h-4" />
                              </Button>
                            )}
                            <Button size="icon" variant="ghost" title="QR Code" onClick={() => handleGetQr(inst.id, inst.instance_name)} disabled={getQrCode.isPending}>
                              <QrCode className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Verificar Status" onClick={() => checkStatus.mutate(inst.id, {
                              onSuccess: (data: any) => toast({ title: `Status: ${data?.status}`, description: `Estado na API: ${data?.state}` }),
                              onError: (e: any) => toast({ title: "Erro ao verificar", description: e.message, variant: "destructive" }),
                            })} disabled={checkStatus.isPending}>
                              <Search className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" title="Remover" onClick={() => {
                              stopPolling();
                              autoCheckedIdsRef.current.clear();
                              deleteInstance.mutate(inst.id, {
                                onSuccess: () => toast({ title: "Instância removida" }),
                                onError: (e: any) => toast({ title: "Erro ao remover", description: e.message, variant: "destructive" }),
                              });
                            }} disabled={deleteInstance.isPending}>
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Providers Tab ── */}
        <TabsContent value="providers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Providers Disponíveis</CardTitle>
              <CardDescription>Ative, desative ou configure providers de WhatsApp</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingProviders ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Provider</TableHead>
                      <TableHead>Base URL</TableHead>
                      <TableHead>Padrão</TableHead>
                      <TableHead>Ativo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(providers || []).map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.display_name}</TableCell>
                        <TableCell>
                          <Input
                            className="max-w-xs"
                            defaultValue={p.config?.base_url || ""}
                            placeholder="https://..."
                            onBlur={(e) => {
                              const newUrl = e.target.value;
                              if (newUrl !== (p.config?.base_url || "")) {
                                updateConfig.mutate(
                                  { providerId: p.id, config: { ...p.config, base_url: newUrl } },
                                  { onSuccess: () => toast({ title: "URL atualizada" }) }
                                );
                              }
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={p.is_default ? "default" : "outline"}>{p.is_default ? "Sim" : "Não"}</Badge>
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={p.is_active}
                            onCheckedChange={(checked) =>
                              activateProvider.mutate(
                                { providerId: p.id, isActive: checked },
                                { onSuccess: () => toast({ title: checked ? "Provider ativado" : "Provider desativado" }) }
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              healthCheck.mutate(p.id, {
                                onSuccess: (data: any) =>
                                  toast({
                                    title: data?.healthy ? "Provider saudável" : "Provider com problemas",
                                    description: `Latência: ${data?.latency}ms`,
                                  }),
                                onError: (e: any) => toast({ title: "Erro no health check", description: e.message, variant: "destructive" }),
                              })
                            }
                            disabled={healthCheck.isPending}
                          >
                            <Heart className="w-4 h-4 mr-1" />
                            Testar
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tags Tab ── */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Tag className="w-5 h-5" /> Gerenciar Tags</CardTitle>
              <CardDescription>Crie tags para organizar seus grupos por categorias</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Create tag form */}
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Nome da tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreateTag()}
                  className="max-w-xs"
                />
                <div className="flex gap-1">
                  {TAG_COLORS.map(c => (
                    <button
                      key={c}
                      className={`w-6 h-6 rounded-full border-2 transition-transform ${newTagColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setNewTagColor(c)}
                    />
                  ))}
                </div>
                <Button onClick={handleCreateTag} disabled={createTag.isPending || !newTagName.trim()}>
                  {createTag.isPending ? <Loader2 className="animate-spin w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  Criar
                </Button>
              </div>

              {/* Tags list */}
              {loadingTags ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : !tags?.length ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma tag criada</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Cor</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tags.map(tag => (
                      <TableRow key={tag.id}>
                        <TableCell>
                          {editingTagId === tag.id ? (
                            <div className="flex gap-1">
                              {TAG_COLORS.map(c => (
                                <button
                                  key={c}
                                  className={`w-5 h-5 rounded-full border-2 transition-transform ${editTagColor === c ? "border-foreground scale-110" : "border-transparent"}`}
                                  style={{ backgroundColor: c }}
                                  onClick={() => setEditTagColor(c)}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="w-5 h-5 rounded-full inline-block" style={{ backgroundColor: tag.cor }} />
                          )}
                        </TableCell>
                        <TableCell>
                          {editingTagId === tag.id ? (
                            <Input
                              value={editTagName}
                              onChange={(e) => setEditTagName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && handleUpdateTag(tag.id)}
                              className="max-w-xs h-8"
                            />
                          ) : (
                            <span className="font-medium">{tag.nome}</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {editingTagId === tag.id ? (
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => handleUpdateTag(tag.id)} disabled={updateTag.isPending}>
                                <Check className="w-4 h-4 text-green-500" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => setEditingTagId(null)}>
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-1">
                              <Button size="icon" variant="ghost" onClick={() => {
                                setEditingTagId(tag.id);
                                setEditTagName(tag.nome);
                                setEditTagColor(tag.cor);
                              }}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <Button size="icon" variant="ghost" onClick={() => handleDeleteTag(tag.id)} disabled={deleteTag.isPending}>
                                <Trash2 className="w-4 h-4 text-destructive" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Logs Tab ── */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Log de Mensagens</CardTitle>
              <CardDescription>Últimas mensagens enviadas e recebidas</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingLogs ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : !messageLogs?.length ? (
                <p className="text-muted-foreground text-center py-8">Nenhum log encontrado</p>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Direção</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Latência</TableHead>
                        <TableHead>Erro</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {messageLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell>
                            <Badge variant={log.direction === "inbound" ? "secondary" : "outline"}>
                              {log.direction === "inbound" ? "⬇ Entrada" : "⬆ Saída"}
                            </Badge>
                          </TableCell>
                          <TableCell>{log.message_type}</TableCell>
                          <TableCell>
                            <Badge variant={log.status === "failed" ? "destructive" : "outline"}>{log.status}</Badge>
                          </TableCell>
                          <TableCell>{log.latency_ms ? `${log.latency_ms}ms` : "—"}</TableCell>
                          <TableCell className="text-xs text-destructive">{log.error_message || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Webhooks Tab ── */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks Recebidos</CardTitle>
              <CardDescription>Eventos recebidos dos providers</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingWebhooks ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
              ) : !webhookLogs?.length ? (
                <p className="text-muted-foreground text-center py-8">Nenhum webhook encontrado</p>
              ) : (
                <div className="max-h-[500px] overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Evento</TableHead>
                        <TableHead>Processado</TableHead>
                        <TableHead>Instância</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {webhookLogs.map((log: any) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">{new Date(log.created_at).toLocaleString("pt-BR")}</TableCell>
                          <TableCell><Badge variant="outline">{log.event_type}</Badge></TableCell>
                          <TableCell>
                            <Badge variant={log.processed ? "default" : "secondary"}>{log.processed ? "Sim" : "Não"}</Badge>
                          </TableCell>
                          <TableCell className="text-xs">{log.instance_id || "—"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── QR Code Modal ── */}
      <Dialog open={qrModal.open} onOpenChange={(o) => { if (!o) stopPolling(); setQrModal((s) => ({ ...s, open: o })); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>QR Code — {qrModal.instanceName}</DialogTitle>
          </DialogHeader>
          <div className="flex items-center justify-center p-4">
            {qrModal.qrCode ? (
              <img src={qrModal.qrCode.startsWith("data:") ? qrModal.qrCode : `data:image/png;base64,${qrModal.qrCode}`} alt="QR Code" className="w-64 h-64" />
            ) : (
              <p className="text-muted-foreground">QR Code não disponível</p>
            )}
          </div>
          <Button variant="outline" onClick={() => qrModal.instanceName && handleGetQr(instances?.find((i: any) => i.instance_name === qrModal.instanceName)?.id, qrModal.instanceName!)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar QR Code
          </Button>
        </DialogContent>
      </Dialog>

    </div>
  );
}
