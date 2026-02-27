import { useState, useEffect } from "react";
import { FileText, Loader2, ImageOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MediaRendererProps {
  msg: {
    hasMedia?: boolean;
    rawKey?: any;
    rawMessage?: any;
    mediaUrl?: string;
    messageType?: string;
    mimetype?: string;
    fileName?: string;
  };
  instanceId: string;
}

const mediaCache = new Map<string, string>();

async function fetchMediaBase64(instanceId: string, key: any, message: any, mimetype?: string, convertToMp4 = false): Promise<{ base64: string; mimetype: string } | null> {
  const cacheKey = `${instanceId}-${key?.id}`;
  const cached = mediaCache.get(cacheKey);
  if (cached) return { base64: cached, mimetype: mimetype || "image/jpeg" };

  try {
    const { data, error } = await supabase.functions.invoke("whatsapp-orchestrator", {
      body: { action: "get-media-base64", instanceId, key, message, mimetype, convertToMp4 },
    });
    if (error) throw error;
    if (data?.data?.base64) {
      const dataUri = `data:${data.data.mimetype};base64,${data.data.base64}`;
      mediaCache.set(cacheKey, dataUri);
      return { base64: dataUri, mimetype: data.data.mimetype };
    }
    return null;
  } catch (e) {
    console.error("[MediaRenderer] Failed to fetch media:", e);
    return null;
  }
}

export default function MediaRenderer({ msg, instanceId }: MediaRendererProps) {
  const [src, setSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const hasMedia = msg.hasMedia && msg.rawKey && msg.rawMessage;
  const type = msg.messageType;

  useEffect(() => {
    if (!hasMedia) return;
    const cacheKey = `${instanceId}-${msg.rawKey?.id}`;
    const cached = mediaCache.get(cacheKey);
    if (cached) {
      setSrc(cached);
      return;
    }

    setLoading(true);
    setError(false);
    fetchMediaBase64(instanceId, msg.rawKey, msg.rawMessage, msg.mimetype, type === "video")
      .then((res) => {
        if (res) setSrc(res.base64);
        else setError(true);
      })
      .finally(() => setLoading(false));
  }, [hasMedia, instanceId, msg.rawKey?.id]);

  if (!hasMedia) return null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4 gap-2 text-xs opacity-60">
        <Loader2 className="w-4 h-4 animate-spin" /> Carregando mídia...
      </div>
    );
  }

  if (error || !src) {
    return (
      <div className="flex items-center gap-2 py-2 text-xs opacity-50">
        <ImageOff className="w-4 h-4" /> Mídia indisponível
      </div>
    );
  }

  switch (type) {
    case "image":
    case "sticker":
      return <img src={src} alt="media" className="max-w-full rounded mt-1 max-h-60 object-contain" />;
    case "video":
      return <video src={src} controls className="max-w-full rounded mt-1 max-h-60" />;
    case "audio":
      return <audio src={src} controls className="mt-1 w-full" />;
    case "document":
      return (
        <a href={src} download={msg.fileName || "document"} className="flex items-center gap-2 mt-1 text-xs underline">
          <FileText className="w-4 h-4" /> {msg.fileName || "Documento"}
        </a>
      );
    default:
      return null;
  }
}
