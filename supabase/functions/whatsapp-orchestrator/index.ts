import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProviderConfig { base_url: string; api_key: string; }

const FETCH_TIMEOUT = 25000;

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try { return JSON.parse(text); } catch { throw new Error(`Non-JSON (${res.status}): ${text.slice(0, 200)}`); }
}

const headers = (c: ProviderConfig) => ({ "Content-Type": "application/json", apikey: c.api_key });
const authOnly = (c: ProviderConfig) => ({ apikey: c.api_key });
const sig = () => AbortSignal.timeout(FETCH_TIMEOUT);

const evo = {
  createInstance: async (n: string, c: ProviderConfig) =>
    safeJson(await fetch(`${c.base_url}/instance/create`, { method: "POST", headers: headers(c), body: JSON.stringify({ instanceName: n, integration: "WHATSAPP-BAILEYS", qrcode: true }), signal: sig() })),
  deleteInstance: async (n: string, c: ProviderConfig) =>
    safeJson(await fetch(`${c.base_url}/instance/delete/${n}`, { method: "DELETE", headers: headers(c), signal: sig() })),
  connect: async (n: string, c: ProviderConfig) => {
    const d = await safeJson(await fetch(`${c.base_url}/instance/connect/${n}`, { headers: authOnly(c), signal: sig() }));
    return { qrCode: d?.base64 || d?.qrcode?.base64, status: "connecting" };
  },
  disconnect: async (n: string, c: ProviderConfig) => {
    await safeJson(await fetch(`${c.base_url}/instance/logout/${n}`, { method: "DELETE", headers: authOnly(c), signal: sig() }));
    return { success: true };
  },
  sendMessage: async (n: string, c: ProviderConfig, p: any) => {
    const d = await safeJson(await fetch(`${c.base_url}/message/sendText/${n}`, { method: "POST", headers: headers(c), body: JSON.stringify({ number: p.to, text: p.text }), signal: sig() }));
    return { messageId: d?.key?.id, status: "sent" };
  },
  sendMedia: async (n: string, c: ProviderConfig, p: any) => {
    const d = await safeJson(await fetch(`${c.base_url}/message/sendMedia/${n}`, { method: "POST", headers: headers(c), body: JSON.stringify({ number: p.to, mediatype: p.mediaType || "image", media: p.mediaUrl, caption: p.caption || "" }), signal: sig() }));
    return { messageId: d?.key?.id, status: "sent" };
  },
  getGroups: async (n: string, c: ProviderConfig) => {
    console.log(`[evo.getGroups] Fetching groups for instance: ${n}, url: ${c.base_url}/group/fetchAllGroups/${n}`);
    const d = await safeJson(await fetch(`${c.base_url}/group/fetchAllGroups/${n}?getParticipants=false`, { headers: authOnly(c), signal: sig() }));
    console.log(`[evo.getGroups] Got response, isArray: ${Array.isArray(d)}, length: ${Array.isArray(d) ? d.length : 'N/A'}`);
    return { groups: Array.isArray(d) ? d : [] };
  },
  healthCheck: async (c: ProviderConfig) => {
    const s = Date.now();
    try { const r = await fetch(`${c.base_url}/instance/fetchInstances`, { headers: authOnly(c), signal: sig() }); await safeJson(r); return { healthy: r.ok, latency: Date.now() - s }; }
    catch { return { healthy: false, latency: Date.now() - s }; }
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
      const baseUrl = (row.config as any)?.base_url?.replace(/\/+$/, "");
      if (!baseUrl) throw new Error("Provider base_url not configured");
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
        const apiRes = await evo.createInstance(instanceName, config);
        const msg = apiRes?.message;
        const inUse = Array.isArray(msg) ? msg.some((m: string) => typeof m === "string" && m.includes("already in use")) : typeof msg === "string" && msg.includes("already in use");
        if (!inUse && (apiRes?.status === 404 || apiRes?.status === 403 || apiRes?.error || apiRes?.message)) {
          const isErr = apiRes?.error || (typeof msg === "string" && !msg.includes("already in use"));
          if (isErr) throw new Error(`API error: ${JSON.stringify(apiRes)}`);
        }
        const { data } = await svc.from("whatsapp_instances").insert({ instance_name: instanceName, provider_id: row.id, status: "disconnected" }).select().single();
        result = { instance: data, apiResult: apiRes };
        break;
      }
      case "delete-instance": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
        try { await evo.deleteInstance(inst.instance_name, config); } catch {}
        await svc.from("whatsapp_instances").delete().eq("id", params.instanceId);
        result = { success: true };
        break;
      }
      case "connect-instance": {
        const inst = await getInst(params.instanceId);
        const { config } = await resolveProvider(inst.provider_id);
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
        for (const wg of waGroups) {
          const jid = wg.id || wg.jid;
          const name = wg.subject || wg.name || jid;
          if (!jid) continue;
          const { data: existing } = await svc.from("grupos").select("id, gestor").eq("whatsapp_group_id", jid).maybeSingle();
          if (existing) {
            const upd: any = { nome: name, ultima_atividade: new Date().toISOString() };
            // Enrich existing groups that have no gestor
            if (!existing.gestor && gestorName) {
              upd.gestor = gestorName;
              upd.gestor_id = user.id;
            }
            if (gestorTeamId) upd.team_id = gestorTeamId;
            await svc.from("grupos").update(upd).eq("id", existing.id);
          } else {
            const { data: byName } = await svc.from("grupos").select("id").eq("nome", name).is("whatsapp_group_id", null).maybeSingle();
            if (byName) {
              await svc.from("grupos").update({ whatsapp_group_id: jid, ultima_atividade: new Date().toISOString(), gestor: gestorName, gestor_id: user.id, team_id: gestorTeamId }).eq("id", byName.id);
            } else {
              await svc.from("grupos").insert({ nome: name, whatsapp_group_id: jid, gestor: gestorName, gestor_id: user.id, team_id: gestorTeamId, status: "PENDENTE", sla: "DENTRO DO SLA", ultima_atividade: new Date().toISOString() });
            }
          }
          synced++;
        }
        console.log(`[sync-groups] Done. Synced: ${synced}/${waGroups.length}`);
        result = { synced, total: waGroups.length };
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
      ? "A Evolution API não respondeu dentro de 25 segundos. Verifique se o servidor está acessível e se o URL/IP é público."
      : (err.message || "Internal error");
    console.error("Orchestrator error:", msg, err.name);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
