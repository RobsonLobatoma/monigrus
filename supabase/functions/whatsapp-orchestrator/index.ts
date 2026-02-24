import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig { base_url: string; api_key: string; }

const FETCH_TIMEOUT = 45000;

async function safeFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const urlStr = String(url);
  try {
    // Use redirect: "manual" to prevent Deno from auto-following HTTPS redirects
    const res = await fetch(url, { ...init, redirect: "manual" });

    // Intercept redirects that go back to HTTPS (e.g. Coolify/Nginx HTTP→HTTPS redirect)
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      if (location) {
        console.log(`[safeFetch] Redirect ${res.status} detected: ${urlStr} → ${location}`);
        if (location.startsWith("https://") && urlStr.startsWith("http://")) {
          const httpLocation = location.replace("https://", "http://");
          console.log(`[safeFetch] Intercepted HTTPS redirect, forcing HTTP: ${httpLocation}`);
          const retryInit = init ? { ...init, redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT) } : { redirect: "manual" as const };
          return await fetch(httpLocation, retryInit);
        }
        // For non-HTTPS redirects, follow normally
        const retryInit = init ? { ...init, redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT) } : { redirect: "manual" as const };
        return await fetch(location, retryInit);
      }
    }

    return res;
  } catch (err: any) {
    const msg = err?.message || "";
    if (msg.includes("certificate") || msg.includes("UnknownIssuer")) {
      const httpUrl = urlStr.replace("https://", "http://");
      console.log(`[safeFetch] TLS error, falling back to HTTP: ${httpUrl}`);
      const retryInit = init ? { ...init, redirect: "manual", signal: AbortSignal.timeout(FETCH_TIMEOUT) } : { redirect: "manual" as const };
      return await fetch(httpUrl, retryInit);
    }
    throw err;
  }
}

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 200)}`); }
}

const headers = (c: ProviderConfig) => ({ "Content-Type": "application/json", apikey: c.api_key });
const authOnly = (c: ProviderConfig) => ({ apikey: c.api_key });
const sig = () => AbortSignal.timeout(FETCH_TIMEOUT);

const evo = {
  createInstance: async (n: string, c: ProviderConfig) =>
    safeJson(await safeFetch(`${c.base_url}/instance/create`, { method: "POST", headers: headers(c), body: JSON.stringify({ instanceName: n, integration: "WHATSAPP-BAILEYS", qrcode: true }), signal: sig() })),
  deleteInstance: async (n: string, c: ProviderConfig) =>
    safeJson(await safeFetch(`${c.base_url}/instance/delete/${n}`, { method: "DELETE", headers: headers(c), signal: sig() })),
  connect: async (n: string, c: ProviderConfig) => {
    const d = await safeJson(await safeFetch(`${c.base_url}/instance/connect/${n}`, { headers: authOnly(c), signal: sig() }));
    return { qrCode: d?.base64 || d?.qrcode?.base64, status: "connecting" };
  },
  disconnect: async (n: string, c: ProviderConfig) => {
    await safeJson(await safeFetch(`${c.base_url}/instance/logout/${n}`, { method: "DELETE", headers: authOnly(c), signal: sig() }));
    return { success: true };
  },
  sendMessage: async (n: string, c: ProviderConfig, p: any) => {
    const d = await safeJson(await safeFetch(`${c.base_url}/message/sendText/${n}`, { method: "POST", headers: headers(c), body: JSON.stringify({ number: p.to, text: p.text }), signal: sig() }));
    return { messageId: d?.key?.id, status: "sent" };
  },
  sendMedia: async (n: string, c: ProviderConfig, p: any) => {
    const d = await safeJson(await safeFetch(`${c.base_url}/message/sendMedia/${n}`, { method: "POST", headers: headers(c), body: JSON.stringify({ number: p.to, mediatype: p.mediaType || "image", media: p.mediaUrl, caption: p.caption || "" }), signal: sig() }));
    return { messageId: d?.key?.id, status: "sent" };
  },
  getGroups: async (n: string, c: ProviderConfig) => {
    const groupUrl = `${c.base_url}/group/fetchAllGroups/${n}?getParticipants=false`;
    console.log(`[evo.getGroups] URL: ${groupUrl}, protocol: ${new URL(groupUrl).protocol}`);
    const d = await safeJson(await safeFetch(groupUrl, { headers: authOnly(c), signal: sig() }));
    console.log(`[evo.getGroups] Got response, isArray: ${Array.isArray(d)}, length: ${Array.isArray(d) ? d.length : 'N/A'}`);
    return { groups: Array.isArray(d) ? d : [] };
  },
  setWebhook: async (n: string, c: ProviderConfig, webhookUrl: string) => {
    console.log(`[evo.setWebhook] Setting webhook for ${n} → ${webhookUrl}`);
    try {
      await safeJson(await safeFetch(`${c.base_url}/webhook/set/${n}`, {
        method: "POST",
        headers: headers(c),
        body: JSON.stringify({
          url: webhookUrl,
          webhook_by_events: false,
          webhook_base64: false,
          events: ["connection.update", "qrcode.updated", "messages.upsert", "messages.update", "status.instance"]
        }),
        signal: sig()
      }));
      console.log(`[evo.setWebhook] Webhook set successfully for ${n}`);
    } catch (e) {
      console.error(`[evo.setWebhook] Failed to set webhook for ${n}:`, e);
    }
  },
  connectionState: async (n: string, c: ProviderConfig) => {
    const d = await safeJson(await safeFetch(`${c.base_url}/instance/connectionState/${n}`, { headers: authOnly(c), signal: sig() }));
    return d?.instance?.state || d?.state || "unknown";
  },
  healthCheck: async (c: ProviderConfig) => {
    const s = Date.now();
    try { const r = await safeFetch(`${c.base_url}/instance/fetchInstances`, { headers: authOnly(c), signal: sig() }); await safeJson(r); return { healthy: r.ok, latency: Date.now() - s }; }
    catch { return { healthy: false, latency: Date.now() - s }; }
  },
  findLastMessage: async (n: string, c: ProviderConfig, remoteJid: string) => {
    try {
      const d = await safeJson(await safeFetch(`${c.base_url}/chat/findMessages/${n}`, {
        method: "POST",
        headers: headers(c),
        body: JSON.stringify({ where: { key: { remoteJid } }, limit: 1 }),
        signal: sig()
      }));
      const msgs = Array.isArray(d) ? d : d?.messages || d?.data || [];
      if (msgs.length === 0) return null;
      const msg = msgs[0];
      const text = msg?.message?.conversation || msg?.message?.extendedTextMessage?.text || msg?.body || null;
      const ts = msg?.messageTimestamp
        ? new Date((typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : parseInt(msg.messageTimestamp)) * 1000).toISOString()
        : null;
      return { text, timestamp: ts };
    } catch (e) {
      console.error(`[evo.findLastMessage] Error for ${remoteJid}:`, e);
      return null;
    }
  },
  findWebhook: async (n: string, c: ProviderConfig) => {
    try {
      return await safeJson(await safeFetch(`${c.base_url}/webhook/find/${n}`, { headers: authOnly(c), signal: sig() }));
    } catch (e) {
      console.error(`[evo.findWebhook] Error:`, e);
      return null;
    }
  },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const body = await req.json();
    const { action, ...params } = body;

    const resolveProvider = async (providerId?: string) => {
      const { data: row } = providerId
        ? await supabase.from("whatsapp_providers").select("*").eq("id", providerId).single()
        : await supabase.from("whatsapp_providers").select("*").eq("is_default", true).eq("is_active", true).single();
      if (!row) throw new Error("No active provider");
      let baseUrl = (row.config as any)?.base_url?.replace(/\/+$/, "");
      if (!baseUrl) throw new Error("Provider base_url not configured");
      // Proactively convert HTTPS → HTTP for domains with self-signed certificates
      if (baseUrl.startsWith("https://")) {
        try {
          const hostname = new URL(baseUrl).hostname;
          if (hostname.includes("sslip.io") || hostname.includes("nip.io") || /\d+\.\d+\.\d+\.\d+/.test(hostname)) {
            baseUrl = baseUrl.replace("https://", "http://");
            console.log("[resolveProvider] Auto-converted to HTTP:", baseUrl);
          }
        } catch {}
      }
      const apiKey = Deno.env.get((row.config as any)?.api_key_secret_name || "EVOLUTION_API_KEY") || "";
      return { config: { base_url: baseUrl, api_key: apiKey } as ProviderConfig, row };
    };

    const svc = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const getInst = async (id: string) => {
      const { data } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(*)").eq("id", id).single();
      if (!data) throw new Error("Instance not found");
      return data;
    };

    let result: any;

    switch (action) {
      case "list-providers": { const { data } = await supabase.from("whatsapp_providers").select("*").order("created_at"); result = data; break; }
      case "set-active-provider": { const { data } = await svc.from("whatsapp_providers").update({ is_active: params.isActive }).eq("id", params.providerId).select().single(); result = data; break; }
      case "update-provider-config": { const { data } = await svc.from("whatsapp_providers").update({ config: params.config }).eq("id", params.providerId).select().single(); result = data; break; }
      case "get-instances": { const { data } = await supabase.from("whatsapp_instances").select("*, whatsapp_providers(name, display_name)").order("created_at"); result = data; break; }
      case "create-instance": {
        const { instanceName, providerId } = params;
        const { config, row } = await resolveProvider(providerId);
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;
        const apiRes = await evo.createInstance(instanceName, config);
        const msg = apiRes?.message;
        const inUse = Array.isArray(msg) ? msg.some((m: string) => typeof m === "string" && m.includes("already in use")) : typeof msg === "string" && msg.includes("already in use");
        if (!inUse && (apiRes?.status === 404 || apiRes?.status === 403 || apiRes?.error || apiRes?.message)) {
          const isErr = apiRes?.error || (typeof msg === "string" && !msg.includes("already in use"));
          if (isErr) throw new Error(`API error: ${JSON.stringify(apiRes)}`);
        }
        await evo.setWebhook(instanceName, config, webhookUrl);
        const { data } = await svc.from("whatsapp_instances").insert({ instance_name: instanceName, provider_id: row.id, status: "disconnected" }).select().single();
        result = { instance: data, apiResult: apiRes };
        break;
      }
      case "delete-instance": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        try { await evo.deleteInstance(inst.instance_name, config); } catch {}
        // Deactivate all groups linked to this instance before deleting
        await svc.from("grupos").update({ ativo: false }).eq("instance_id", params.instanceId);
        await svc.from("whatsapp_instances").delete().eq("id", params.instanceId);
        result = { success: true };
        break;
      }
      case "connect-instance": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        // Check real status first - if already connected, skip QR flow
        try {
          const realState = await evo.connectionState(inst.instance_name, config);
          console.log(`[connect-instance] Real state for ${inst.instance_name}: ${realState}`);
          if (realState === "open") {
            await svc.from("whatsapp_instances").update({ status: "connected", qr_code: null }).eq("id", params.instanceId);
            result = { alreadyConnected: true, status: "connected" };
            break;
          }
        } catch (e) {
          console.log(`[connect-instance] Could not check real state, proceeding with QR flow:`, e);
        }
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;
        await evo.setWebhook(inst.instance_name, config, webhookUrl);
        const r = await evo.connect(inst.instance_name, config);
        await svc.from("whatsapp_instances").update({ status: "connecting", qr_code: r.qrCode || null }).eq("id", params.instanceId);
        result = r;
        break;
      }
      case "disconnect-instance": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        await evo.disconnect(inst.instance_name, config);
        await svc.from("whatsapp_instances").update({ status: "disconnected", qr_code: null }).eq("id", params.instanceId);
        result = { success: true };
        break;
      }
      case "get-qr-code": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        const r = await evo.connect(inst.instance_name, config);
        if (r.qrCode) await svc.from("whatsapp_instances").update({ qr_code: r.qrCode }).eq("id", params.instanceId);
        result = r;
        break;
      }
      case "send-message": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        const s = Date.now();
        const r = await evo.sendMessage(inst.instance_name, config, { to: params.to, text: params.text });
        await svc.from("whatsapp_message_log").insert({ instance_id: params.instanceId, direction: "outbound", message_type: "text", payload: { to: params.to, text: params.text }, status: r.status, latency_ms: Date.now() - s });
        result = r;
        break;
      }
      case "send-media": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        const s = Date.now();
        const r = await evo.sendMedia(inst.instance_name, config, params);
        await svc.from("whatsapp_message_log").insert({ instance_id: params.instanceId, direction: "outbound", message_type: "media", payload: params, status: r.status, latency_ms: Date.now() - s });
        result = r;
        break;
      }
      case "get-groups": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        result = await evo.getGroups(inst.instance_name, config);
        break;
      }
      case "sync-groups": {
        const inst = await getInst(params.instanceId);
        console.log(`[sync-groups] Instance ${inst.instance_name}, status: ${inst.status}`);
        if (inst.status !== "connected") {
          throw new Error(`A instância "${inst.instance_name}" não está conectada (status: ${inst.status}). Conecte a instância antes de sincronizar grupos.`);
        }
        const { config } = await resolveProvider(inst.provider_id);

        // Fetch authenticated user's profile for gestor enrichment
        const { data: profile } = await svc.from("user_profiles")
          .select("full_name, team_id")
          .eq("user_id", user.id)
          .maybeSingle();
        const gestorName = profile?.full_name ?? null;
        const gestorTeamId = profile?.team_id ?? null;
        console.log(`[sync-groups] Gestor: ${gestorName}, team_id: ${gestorTeamId}`);

        console.log(`[sync-groups] Fetching groups from Evolution API...`);
        const { groups: waGroups } = await evo.getGroups(inst.instance_name, config);
        console.log(`[sync-groups] Got ${waGroups.length} groups, starting upsert...`);
        let synced = 0;
        const jidToGroupId: Record<string, string> = {};
        for (const wg of waGroups) {
          const jid = wg.id || wg.jid;
          const name = wg.subject || wg.name || jid;
          if (!jid) continue;

          const { data: existing } = await svc.from("grupos").select("id, gestor").eq("whatsapp_group_id", jid).maybeSingle();
          if (existing) {
            const upd: any = { nome: name, ultima_atividade: new Date().toISOString(), instance_id: inst.id, ativo: true };
            if (!existing.gestor && gestorName) {
              upd.gestor = gestorName;
              upd.gestor_id = user.id;
            }
            if (gestorTeamId) upd.team_id = gestorTeamId;
            await svc.from("grupos").update(upd).eq("id", existing.id);
            jidToGroupId[jid] = existing.id;
          } else {
            const { data: byName } = await svc.from("grupos").select("id").eq("nome", name).is("whatsapp_group_id", null).maybeSingle();
            const insertData: any = { whatsapp_group_id: jid, instance_id: inst.id, gestor: gestorName, gestor_id: user.id, team_id: gestorTeamId, ultima_atividade: new Date().toISOString(), ativo: true };
            if (byName) {
              await svc.from("grupos").update(insertData).eq("id", byName.id);
              jidToGroupId[jid] = byName.id;
            } else {
              const { data: inserted } = await svc.from("grupos").insert({ nome: name, ...insertData, status: "PENDENTE", sla: "DENTRO DO SLA" }).select("id").single();
              if (inserted) jidToGroupId[jid] = inserted.id;
            }
          }
          synced++;
        }

        // Fetch last message for each group in batches of 5
        const jids = Object.keys(jidToGroupId);
        const BATCH_SIZE = 5;
        let messagesFound = 0;
        console.log(`[sync-groups] Fetching last messages for ${jids.length} groups in batches of ${BATCH_SIZE}...`);
        for (let i = 0; i < jids.length; i += BATCH_SIZE) {
          const batch = jids.slice(i, i + BATCH_SIZE);
          const results = await Promise.allSettled(
            batch.map(jid => evo.findLastMessage(inst.instance_name, config, jid))
          );
          for (let j = 0; j < batch.length; j++) {
            const r = results[j];
            if (r.status === "fulfilled" && r.value?.text) {
              const groupId = jidToGroupId[batch[j]];
              const upd: any = { last_message: r.value.text };
              if (r.value.timestamp) upd.last_message_at = r.value.timestamp;
              await svc.from("grupos").update(upd).eq("id", groupId);
              messagesFound++;
            }
          }
        }
        console.log(`[sync-groups] Messages found: ${messagesFound}/${jids.length}`);

        // Webhook diagnostic
        try {
          const webhookInfo = await evo.findWebhook(inst.instance_name, config);
          console.log(`[sync-groups] Webhook config for ${inst.instance_name}:`, JSON.stringify(webhookInfo));
        } catch (e) {
          console.log(`[sync-groups] Could not check webhook config:`, e);
        }

        console.log(`[sync-groups] Done. Synced: ${synced}/${waGroups.length}`);
        result = { synced, total: waGroups.length, messagesFound };
        break;
      }
      case "check-status": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        const prevStatus = inst.status;
        const state = await evo.connectionState(inst.instance_name, config);
        console.log(`[check-status] Instance ${inst.instance_name}: state=${state}, prevStatus=${prevStatus}`);
        const statusMap: Record<string, string> = { open: "connected", close: "disconnected", connecting: "connecting" };
        const newStatus = statusMap[state] || "disconnected";
        const upd: any = { status: newStatus };
        if (newStatus === "connected") upd.qr_code = null;
        await svc.from("whatsapp_instances").update(upd).eq("id", params.instanceId);
        const justConnected = prevStatus !== "connected" && newStatus === "connected";
        result = { state, status: newStatus, justConnected };
        break;
      }
      case "health-check": {
        const { config } = await resolveProvider(params.providerId);
        result = await evo.healthCheck(config);
        if (params.providerId) await svc.from("whatsapp_providers").update({ updated_at: new Date().toISOString() }).eq("id", params.providerId);
        break;
      }
      case "get-message-log": {
        let q = supabase.from("whatsapp_message_log").select("*").order("created_at", { ascending: false }).limit(params.limit || 100);
        if (params.instanceId) q = q.eq("instance_id", params.instanceId);
        const { data } = await q; result = data; break;
      }
      case "get-webhooks-log": {
        let q = supabase.from("whatsapp_webhooks_log").select("*").order("created_at", { ascending: false }).limit(params.limit || 100);
        if (params.instanceId) q = q.eq("instance_id", params.instanceId);
        const { data } = await q; result = data; break;
      }
      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ data: result }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    const isTimeout = err.name === "TimeoutError" || err.name === "AbortError";
    const msg = isTimeout
      ? "A Evolution API não respondeu dentro de 45 segundos. Verifique se o servidor está acessível e se o URL/IP é público."
      : (err.message || "Internal error");
    console.error("Orchestrator error:", msg, err.name);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
