import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Provider Interface ──────────────────────────────────────────────
interface ProviderConfig {
  base_url: string;
  api_key: string;
}

interface WhatsAppProvider {
  createInstance(instanceName: string, config: ProviderConfig): Promise<any>;
  deleteInstance(instanceName: string, config: ProviderConfig): Promise<any>;
  connect(instanceName: string, config: ProviderConfig): Promise<{ qrCode?: string; status: string }>;
  disconnect(instanceName: string, config: ProviderConfig): Promise<{ success: boolean }>;
  sendMessage(instanceName: string, config: ProviderConfig, payload: any): Promise<{ messageId?: string; status: string }>;
  sendMedia(instanceName: string, config: ProviderConfig, payload: any): Promise<{ messageId?: string; status: string }>;
  getGroups(instanceName: string, config: ProviderConfig): Promise<{ groups: any[] }>;
  healthCheck(config: ProviderConfig): Promise<{ healthy: boolean; latency: number }>;
}

// ── Evolution Provider ──────────────────────────────────────────────
// ── Safe JSON parser ────────────────────────────────────────────────
async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`API returned non-JSON (status ${res.status}): ${text.slice(0, 200)}`);
  }
}

const evolutionProvider: WhatsAppProvider = {
  async createInstance(instanceName, config) {
    const res = await fetch(`${config.base_url}/instance/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.api_key },
      body: JSON.stringify({ instanceName, integration: "WHATSAPP-BAILEYS", qrcode: true }),
    });
    return safeJson(res);
  },

  async deleteInstance(instanceName, config) {
    const res = await fetch(`${config.base_url}/instance/delete/${instanceName}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", apikey: config.api_key },
    });
    return safeJson(res);
  },

  async connect(instanceName, config) {
    const res = await fetch(`${config.base_url}/instance/connect/${instanceName}`, {
      method: "GET",
      headers: { apikey: config.api_key },
    });
    const data = await safeJson(res);
    return { qrCode: data?.base64 || data?.qrcode?.base64, status: "connecting" };
  },

  async disconnect(instanceName, config) {
    const res = await fetch(`${config.base_url}/instance/logout/${instanceName}`, {
      method: "DELETE",
      headers: { apikey: config.api_key },
    });
    await safeJson(res);
    return { success: true };
  },

  async sendMessage(instanceName, config, payload) {
    const res = await fetch(`${config.base_url}/message/sendText/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.api_key },
      body: JSON.stringify({ number: payload.to, text: payload.text }),
    });
    const data = await safeJson(res);
    return { messageId: data?.key?.id, status: "sent" };
  },

  async sendMedia(instanceName, config, payload) {
    const res = await fetch(`${config.base_url}/message/sendMedia/${instanceName}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: config.api_key },
      body: JSON.stringify({
        number: payload.to,
        mediatype: payload.mediaType || "image",
        media: payload.mediaUrl,
        caption: payload.caption || "",
      }),
    });
    const data = await safeJson(res);
    return { messageId: data?.key?.id, status: "sent" };
  },

  async getGroups(instanceName, config) {
    const res = await fetch(`${config.base_url}/group/fetchAllGroups/${instanceName}?getParticipants=false`, {
      method: "GET",
      headers: { apikey: config.api_key },
    });
    const data = await safeJson(res);
    return { groups: Array.isArray(data) ? data : [] };
  },

  async healthCheck(config) {
    const start = Date.now();
    try {
      const res = await fetch(`${config.base_url}/instance/fetchInstances`, {
        method: "GET",
        headers: { apikey: config.api_key },
      });
      await safeJson(res);
      return { healthy: res.ok, latency: Date.now() - start };
    } catch {
      return { healthy: false, latency: Date.now() - start };
    }
  },
};

// ── Provider Registry ───────────────────────────────────────────────
const providers: Record<string, WhatsAppProvider> = {
  evolution: evolutionProvider,
};

// ── Retry Helper ────────────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 3): Promise<T> {
  let lastError: any;
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (i < maxRetries - 1) await new Promise((r) => setTimeout(r, Math.pow(2, i) * 500));
    }
  }
  throw lastError;
}

// ── Main Handler ────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", "")
    );
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, ...params } = body;

    // ── Resolve provider config ──
    const resolveProviderConfig = async (providerId?: string) => {
      let providerRow: any;
      if (providerId) {
        const { data } = await supabase.from("whatsapp_providers").select("*").eq("id", providerId).single();
        providerRow = data;
      } else {
        const { data } = await supabase.from("whatsapp_providers").select("*").eq("is_default", true).eq("is_active", true).single();
        providerRow = data;
      }
      if (!providerRow) throw new Error("No active provider found");

      const rawBaseUrl = providerRow.config?.base_url;
      if (!rawBaseUrl) throw new Error("Provider base_url is not configured. Please set it in Conexões > Providers.");
      const baseUrl = rawBaseUrl.replace(/\/+$/, ""); // strip trailing slashes

      const secretName = providerRow.config?.api_key_secret_name || "EVOLUTION_API_KEY";
      const apiKey = Deno.env.get(secretName) || "";
      const adapter = providers[providerRow.name];
      if (!adapter) throw new Error(`Provider adapter '${providerRow.name}' not found`);

      return {
        adapter,
        config: { base_url: baseUrl, api_key: apiKey } as ProviderConfig,
        providerRow,
      };
    };

    // ── Service client for writes ──
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let result: any;

    switch (action) {
      // ── Provider actions ──
      case "list-providers": {
        const { data } = await supabase.from("whatsapp_providers").select("*").order("created_at");
        result = data;
        break;
      }
      case "set-active-provider": {
        const { providerId, isActive } = params;
        const { data } = await serviceClient
          .from("whatsapp_providers")
          .update({ is_active: isActive })
          .eq("id", providerId)
          .select()
          .single();
        result = data;
        break;
      }
      case "update-provider-config": {
        const { providerId, config: newConfig } = params;
        const { data } = await serviceClient
          .from("whatsapp_providers")
          .update({ config: newConfig })
          .eq("id", providerId)
          .select()
          .single();
        result = data;
        break;
      }

      // ── Instance actions ──
      case "get-instances": {
        const { data } = await supabase
          .from("whatsapp_instances")
          .select("*, whatsapp_providers(name, display_name)")
          .order("created_at");
        result = data;
        break;
      }
      case "create-instance": {
        const { instanceName, providerId } = params;
        const { adapter, config, providerRow } = await resolveProviderConfig(providerId);
        const apiResult = await withRetry(() => adapter.createInstance(instanceName, config));

        // Validate API response before saving to DB
        const errMsg = apiResult?.error || apiResult?.message;
        const msgArr = apiResult?.message;
        const isAlreadyInUse = Array.isArray(msgArr)
          ? msgArr.some((m: string) => typeof m === "string" && m.includes("already in use"))
          : typeof msgArr === "string" && msgArr.includes("already in use");

        if (!isAlreadyInUse && (apiResult?.status === 404 || apiResult?.status === 403 || errMsg)) {
          throw new Error(`Evolution API error: ${errMsg || "Unknown"} - ${JSON.stringify(apiResult?.response || apiResult?.message || {})}`);
        }

        const { data } = await serviceClient
          .from("whatsapp_instances")
          .insert({ instance_name: instanceName, provider_id: providerRow.id, status: "disconnected" })
          .select()
          .single();
        result = { instance: data, apiResult };
        break;
      }
      case "delete-instance": {
        const { instanceId } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (inst) {
          const { adapter, config } = await resolveProviderConfig(inst.provider_id);
          try { await adapter.deleteInstance(inst.instance_name, config); } catch {}
          await serviceClient.from("whatsapp_instances").delete().eq("id", instanceId);
        }
        result = { success: true };
        break;
      }
      case "connect-instance": {
        const { instanceId } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);
        const connectResult = await withRetry(() => adapter.connect(inst.instance_name, config));

        await serviceClient
          .from("whatsapp_instances")
          .update({ status: "connecting", qr_code: connectResult.qrCode || null })
          .eq("id", instanceId);
        result = connectResult;
        break;
      }
      case "disconnect-instance": {
        const { instanceId } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);
        await adapter.disconnect(inst.instance_name, config);

        await serviceClient
          .from("whatsapp_instances")
          .update({ status: "disconnected", qr_code: null })
          .eq("id", instanceId);
        result = { success: true };
        break;
      }
      case "get-qr-code": {
        const { instanceId } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);
        const connectResult = await adapter.connect(inst.instance_name, config);

        if (connectResult.qrCode) {
          await serviceClient.from("whatsapp_instances").update({ qr_code: connectResult.qrCode }).eq("id", instanceId);
        }
        result = connectResult;
        break;
      }

      // ── Message actions ──
      case "send-message": {
        const { instanceId, to, text } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);

        const start = Date.now();
        const msgResult = await withRetry(() => adapter.sendMessage(inst.instance_name, config, { to, text }));
        const latency = Date.now() - start;

        await serviceClient.from("whatsapp_message_log").insert({
          instance_id: instanceId,
          direction: "outbound",
          message_type: "text",
          payload: { to, text },
          status: msgResult.status,
          latency_ms: latency,
        });
        result = msgResult;
        break;
      }
      case "send-media": {
        const { instanceId, to, mediaUrl, mediaType, caption } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);

        const start = Date.now();
        const msgResult = await withRetry(() => adapter.sendMedia(inst.instance_name, config, { to, mediaUrl, mediaType, caption }));
        const latency = Date.now() - start;

        await serviceClient.from("whatsapp_message_log").insert({
          instance_id: instanceId,
          direction: "outbound",
          message_type: "media",
          payload: { to, mediaUrl, mediaType, caption },
          status: msgResult.status,
          latency_ms: latency,
        });
        result = msgResult;
        break;
      }

      // ── Group actions ──
      case "get-groups": {
        const { instanceId } = params;
        const { data: inst } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", instanceId).single();
        if (!inst) throw new Error("Instance not found");
        const { adapter, config } = await resolveProviderConfig(inst.provider_id);
        result = await adapter.getGroups(inst.instance_name, config);
        break;
      }

      // ── Health check ──
      case "health-check": {
        const { providerId } = params;
        const { adapter, config } = await resolveProviderConfig(providerId);
        const hc = await adapter.healthCheck(config);

        if (providerId) {
          await serviceClient.from("whatsapp_providers").update({ updated_at: new Date().toISOString() }).eq("id", providerId);
        }
        result = hc;
        break;
      }

      // ── Logs ──
      case "get-message-log": {
        const { instanceId, limit: lim } = params;
        let query = supabase.from("whatsapp_message_log").select("*").order("created_at", { ascending: false }).limit(lim || 100);
        if (instanceId) query = query.eq("instance_id", instanceId);
        const { data } = await query;
        result = data;
        break;
      }
      case "get-webhooks-log": {
        const { instanceId, limit: lim } = params;
        let query = supabase.from("whatsapp_webhooks_log").select("*").order("created_at", { ascending: false }).limit(lim || 100);
        if (instanceId) query = query.eq("instance_id", instanceId);
        const { data } = await query;
        result = data;
        break;
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Orchestrator error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
