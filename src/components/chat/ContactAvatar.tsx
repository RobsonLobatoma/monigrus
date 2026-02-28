import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// In-memory cache with TTL
const pictureCache = new Map<string, { url: string | null; timestamp: number }>();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const pendingRequests = new Map<string, Promise<string | null>>();

async function fetchProfilePicture(instanceId: string, remoteJid: string): Promise<string | null> {
  const cacheKey = `${instanceId}:${remoteJid}`;

  // Check cache
  const cached = pictureCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.url;
  }

  // Deduplicate concurrent requests
  const pending = pendingRequests.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const { data, error } = await supabase.functions.invoke("whatsapp-orchestrator", {
        body: { action: "get-profile-picture", instanceId, remoteJid },
      });
      const url = data?.data?.pictureUrl || null;
      pictureCache.set(cacheKey, { url, timestamp: Date.now() });
      return url;
    } catch {
      pictureCache.set(cacheKey, { url: null, timestamp: Date.now() });
      return null;
    } finally {
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, promise);
  return promise;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";
}

interface ContactAvatarProps {
  instanceId: string;
  remoteJid: string;
  name: string;
  isGroup: boolean;
  className?: string;
}

export default function ContactAvatar({ instanceId, remoteJid, name, isGroup, className = "w-10 h-10" }: ContactAvatarProps) {
  const [pictureUrl, setPictureUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!instanceId || !remoteJid) return;
    let cancelled = false;

    fetchProfilePicture(instanceId, remoteJid).then((url) => {
      if (!cancelled) setPictureUrl(url);
    });

    return () => { cancelled = true; };
  }, [instanceId, remoteJid]);

  return (
    <Avatar className={`${className} shrink-0`}>
      {pictureUrl && <AvatarImage src={pictureUrl} alt={name} />}
      <AvatarFallback className="text-xs">
        {isGroup ? <Users className="w-4 h-4" /> : getInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}
