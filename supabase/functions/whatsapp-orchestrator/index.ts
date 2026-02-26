import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig { base_url: string; api_key: string; }

const FETCH_TIMEOUT = 45000;
const LONG_FETCH_TIMEOUT = 120000; // 2min for heavy endpoints like fetchAllGroups/findChats

async function safeFetch(url: string | URL | Request, init?: RequestInit): Promise<Response> {
  const urlStr = String(url);
  const timeout = init?.signal ? undefined : AbortSignal.timeout(FETCH_TIMEOUT);
  const baseInit: RequestInit = { ...init, signal: init?.signal || timeout, redirect: "follow" };

  try {
    return await fetch(urlStr, baseInit);
  } catch (err: any) {
    const msg = err?.message || "";
    if (!(msg.includes("certificate") || msg.includes("UnknownIssuer") || msg.includes("tls") || msg.includes("SSL"))) {
      throw err;
    }
    // TLS failed → try HTTP with redirect: manual to avoid being redirected back to broken HTTPS
    const httpUrl = urlStr.replace("https://", "http://");
    console.log(`[safeFetch] TLS error, fallback HTTP (manual redirect): ${httpUrl}`);
    const httpRes = await fetch(httpUrl, { ...baseInit, redirect: "manual" });

    // If HTTP works (2xx/4xx/5xx), return it
    if (httpRes.status < 300 || httpRes.status >= 400) return httpRes;

    // Server redirects HTTP→HTTPS but cert is invalid → clear error
    const location = httpRes.headers.get("location") || "";
    if (location.startsWith("https://")) {
      throw new Error(
        "A Evolution API redireciona HTTP para HTTPS mas o certificado SSL é inválido (UnknownIssuer). " +
        "Corrija o certificado SSL (ex: Let's Encrypt) ou desabilite o redirecionamento forçado HTTPS no seu servidor/proxy (Nginx/Coolify/Traefik)."
      );
    }
    // Non-HTTPS redirect — follow it
    return await fetch(location, baseInit);
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
    const d = await safeJson(await safeFetch(groupUrl, { headers: authOnly(c), signal: AbortSignal.timeout(LONG_FETCH_TIMEOUT) }));
    console.log(`[evo.getGroups] Got response, isArray: ${Array.isArray(d)}, length: ${Array.isArray(d) ? d.length : 'N/A'}`);
    return { groups: Array.isArray(d) ? d : [] };
  },
  setWebhook: async (n: string, c: ProviderConfig, webhookUrl: string) => {
    console.log(`[evo.setWebhook] Setting webhook for ${n} → ${webhookUrl}`);
    try {
      const res = await safeJson(await safeFetch(`${c.base_url}/webhook/set/${n}`, {
        method: "POST",
        headers: headers(c),
        body: JSON.stringify({
          webhook: {
            enabled: true,
            url: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events: [
              "MESSAGES_UPSERT",
              "MESSAGES_UPDATE",
              "CONNECTION_UPDATE",
              "QRCODE_UPDATED"
            ]
          }
        }),
        signal: sig()
      }));
      console.log(`[evo.setWebhook] Webhook set successfully for ${n}:`, JSON.stringify(res));
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
  findChats: async (n: string, c: ProviderConfig) => {
    try {
      const d = await safeJson(await safeFetch(`${c.base_url}/chat/findChats/${n}`, {
        method: "POST",
        headers: headers(c),
        body: JSON.stringify({}),
        signal: AbortSignal.timeout(LONG_FETCH_TIMEOUT)
      }));
      return Array.isArray(d) ? d : [];
    } catch (e) {
      console.error(`[evo.findChats] Error:`, e);
      return [];
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
        const syncStart = Date.now();
        const MAX_EXEC_MS = 140000; // 140s safety margin (function limit is 150s)

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

        // 1. Fetch all groups from Evolution API (single call)
        console.log(`[sync-groups] Fetching groups from Evolution API...`);
        const { groups: waGroups } = await evo.getGroups(inst.instance_name, config);
        console.log(`[sync-groups] Got ${waGroups.length} groups from API`);

        // 2. Pre-load ALL existing groups for this instance in 1 query
        const { data: allExisting } = await svc.from("grupos")
          .select("id, gestor, whatsapp_group_id, nome")
          .eq("instance_id", inst.id);
        const existingMap = new Map((allExisting || []).map(g => [g.whatsapp_group_id, g]));
        console.log(`[sync-groups] Pre-loaded ${existingMap.size} existing groups from DB`);

        // Also pre-load groups without whatsapp_group_id for name-matching
        const { data: unmatchedGroups } = await svc.from("grupos")
          .select("id, nome")
          .is("whatsapp_group_id", null);
        const nameMap = new Map((unmatchedGroups || []).map(g => [g.nome, g.id]));

        // 3. Process in batches of 50
        const BATCH_SIZE = 50;
        let synced = 0;
        const jidToGroupId: Record<string, string> = {};
        let timedOut = false;

        for (let i = 0; i < waGroups.length; i += BATCH_SIZE) {
          // Timeout protection
          if (Date.now() - syncStart > MAX_EXEC_MS) {
            console.log(`[sync-groups] Time limit reached at batch ${Math.floor(i / BATCH_SIZE)}, processed ${synced}/${waGroups.length}`);
            timedOut = true;
            break;
          }

          const batch = waGroups.slice(i, i + BATCH_SIZE);
          const toInsert: any[] = [];
          const toUpdate: { id: string; data: any }[] = [];

          for (const wg of batch) {
            const jid = wg.id || wg.jid;
            const name = wg.subject || wg.name || jid;
            if (!jid) continue;

            const existing = existingMap.get(jid);
            if (existing) {
              const upd: any = { nome: name, ultima_atividade: new Date().toISOString(), instance_id: inst.id, ativo: true };
              if (!existing.gestor && gestorName) {
                upd.gestor = gestorName;
                upd.gestor_id = user.id;
              }
              if (gestorTeamId) upd.team_id = gestorTeamId;
              if (params.tagId) upd.tag_id = params.tagId;
              toUpdate.push({ id: existing.id, data: upd });
              jidToGroupId[jid] = existing.id;
            } else {
              // Check name-match for groups without whatsapp_group_id
              const matchedId = nameMap.get(name);
              if (matchedId) {
                const upd: any = { whatsapp_group_id: jid, instance_id: inst.id, gestor: gestorName, gestor_id: user.id, team_id: gestorTeamId, ultima_atividade: new Date().toISOString(), ativo: true };
                toUpdate.push({ id: matchedId, data: upd });
                jidToGroupId[jid] = matchedId;
                nameMap.delete(name); // consumed
              } else {
                toInsert.push({ nome: name, whatsapp_group_id: jid, instance_id: inst.id, gestor: gestorName, gestor_id: user.id, team_id: gestorTeamId, ultima_atividade: new Date().toISOString(), ativo: true, status: "PENDENTE", sla: "DENTRO DO SLA", ...(params.tagId ? { tag_id: params.tagId } : {}) });
              }
            }
            synced++;
          }

          // Batch updates: use Promise.all with individual updates (Supabase doesn't support multi-row update with different values)
          // But we batch them in parallel within the batch, not sequentially
          if (toUpdate.length > 0) {
            await Promise.all(toUpdate.map(u => svc.from("grupos").update(u.data).eq("id", u.id)));
          }

          // Batch insert
          if (toInsert.length > 0) {
            const { data: inserted } = await svc.from("grupos").insert(toInsert).select("id, whatsapp_group_id");
            if (inserted) {
              for (const row of inserted) {
                if (row.whatsapp_group_id) jidToGroupId[row.whatsapp_group_id] = row.id;
              }
            }
          }
        }

        console.log(`[sync-groups] Upsert done: ${synced}/${waGroups.length} groups processed`);

        // 4. Fetch last messages using findChats (single API call)
        const jids = Object.keys(jidToGroupId);
        let messagesFound = 0;

        if (!timedOut && Date.now() - syncStart < MAX_EXEC_MS) {
          console.log(`[sync-groups] Fetching chats from Evolution API...`);
          const chats = await evo.findChats(inst.instance_name, config);
          console.log(`[sync-groups] Got ${chats.length} chats, mapping to groups...`);

          // Build map: remoteJid → lastMessage data
          const chatMap = new Map<string, any>();
          for (const chat of chats) {
            const jid = chat.remoteJid || chat.id;
            if (jid && chat.lastMessage) chatMap.set(jid, chat);
          }

          // Batch message updates
          const msgUpdates: { id: string; last_message: string; last_message_at: string }[] = [];
          for (const jid of jids) {
            const chat = chatMap.get(jid);
            if (!chat?.lastMessage) continue;
            const msg = chat.lastMessage;
            const text = msg?.message?.conversation
              || msg?.message?.extendedTextMessage?.text
              || msg?.message?.imageMessage?.caption
              || msg?.message?.videoMessage?.caption
              || msg?.message?.documentMessage?.caption
              || msg?.body
              || null;
            if (!text) continue;
            const ts = msg?.messageTimestamp
              ? new Date((typeof msg.messageTimestamp === "number" ? msg.messageTimestamp : parseInt(msg.messageTimestamp)) * 1000).toISOString()
              : new Date().toISOString();
            const senderName = msg?.pushName || "";
            const lastMsg = senderName ? `${senderName}: ${text}`.substring(0, 500) : text.substring(0, 500);
            msgUpdates.push({ id: jidToGroupId[jid], last_message: lastMsg, last_message_at: ts });
          }

          // Process message updates in batches of 50 (parallel within batch)
          for (let i = 0; i < msgUpdates.length; i += BATCH_SIZE) {
            if (Date.now() - syncStart > MAX_EXEC_MS) {
              console.log(`[sync-groups] Time limit on message updates at ${messagesFound}`);
              break;
            }
            const msgBatch = msgUpdates.slice(i, i + BATCH_SIZE);
            await Promise.all(msgBatch.map(u => svc.from("grupos").update({ last_message: u.last_message, last_message_at: u.last_message_at }).eq("id", u.id)));
            messagesFound += msgBatch.length;
          }
          console.log(`[sync-groups] Messages updated: ${messagesFound}/${jids.length}`);
        }

        // 5. Auto-register webhook if not configured
        if (Date.now() - syncStart < MAX_EXEC_MS) {
          const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;
          try {
            const webhookInfo = await evo.findWebhook(inst.instance_name, config);
            const isEnabled = webhookInfo?.enabled === true || webhookInfo?.webhook?.enabled === true;
            if (!isEnabled) {
              console.log(`[sync-groups] Webhook not enabled, registering...`);
              await evo.setWebhook(inst.instance_name, config, webhookUrl);
            }
          } catch (e) {
            console.log(`[sync-groups] Could not check webhook, registering anyway...`);
            await evo.setWebhook(inst.instance_name, config, webhookUrl);
          }
        }

        const elapsed = ((Date.now() - syncStart) / 1000).toFixed(1);
        console.log(`[sync-groups] Done in ${elapsed}s. Synced: ${synced}/${waGroups.length}${timedOut ? " (partial - timed out)" : ""}`);
        result = { synced, total: waGroups.length, messagesFound, timedOut, elapsed: `${elapsed}s` };
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
      ? "A Evolution API não respondeu a tempo. Verifique se o servidor está acessível e tente novamente."
      : (err.message || "Internal error");
    console.error("Orchestrator error:", msg, err.name);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
