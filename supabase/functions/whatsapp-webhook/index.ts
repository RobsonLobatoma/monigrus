import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const eventType = body.event || body.action || "unknown";

    // Evolution API v2 sends instance as a direct string
    const instanceName =
      typeof body.instance === "string"
        ? body.instance
        : body.instance?.instanceName || body.instanceName || null;

    // Find instance by name
    let instanceId: string | null = null;
    if (instanceName) {
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("instance_name", instanceName)
        .maybeSingle();
      instanceId = inst?.id || null;
    }

    console.log(`[webhook] event=${eventType}, instance=${instanceName}, instanceId=${instanceId}`);

    // Log webhook event
    await supabase.from("whatsapp_webhooks_log").insert({
      instance_id: instanceId,
      event_type: eventType,
      payload: body,
      processed: false,
    });

    // Update instance status based on event
    if (instanceId) {
      const statusMap: Record<string, string> = {
        "connection.update": body.data?.state === "open" ? "connected" : body.data?.state === "close" ? "disconnected" : "connecting",
        "CONNECTION_UPDATE": body.data?.state === "open" ? "connected" : body.data?.state === "close" ? "disconnected" : "connecting",
        "qrcode.updated": "connecting",
        "QRCODE_UPDATED": "connecting",
        "status.instance": body.data?.status || "disconnected",
      };

      const newStatus = statusMap[eventType];
      if (newStatus) {
        const updateData: any = { status: newStatus };
        if ((eventType === "qrcode.updated" || eventType === "QRCODE_UPDATED") && body.data?.qrcode?.base64) {
          updateData.qr_code = body.data.qrcode.base64;
        }
        if (newStatus === "connected") {
          updateData.qr_code = null;
          updateData.last_health_check = new Date().toISOString();
        }
        await supabase.from("whatsapp_instances").update(updateData).eq("id", instanceId);
      }

      // Process inbound messages
      if (
        (eventType === "messages.upsert" || eventType === "MESSAGES_UPSERT") &&
        body.data
      ) {
        // Evolution API v2 sends data as single object, but handle array too
        const messages = Array.isArray(body.data) ? body.data : [body.data];

        for (const msg of messages) {
          if (!msg.key) continue;
          const remoteJid = msg.key?.remoteJid || "";
          const isGroup = remoteJid.endsWith("@g.us");
          const isFromMe = msg.key.fromMe || false;
          const senderName = isFromMe ? "Você" : (msg.pushName || msg.key?.participant || "Desconhecido");
          const messageText =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            msg.message?.imageMessage?.caption ||
            msg.message?.videoMessage?.caption ||
            msg.message?.documentMessage?.caption ||
            `[${msg.messageType || "mídia"}]`;
          const messageType = msg.messageType || "text";

          // Use messageTimestamp from Evolution API v2
          const receivedAt = msg.messageTimestamp
            ? new Date(
                (typeof msg.messageTimestamp === "number"
                  ? msg.messageTimestamp
                  : parseInt(msg.messageTimestamp)) * 1000
              ).toISOString()
            : new Date().toISOString();

          // Log to whatsapp_message_log (only inbound)
          if (!isFromMe) {
            await supabase.from("whatsapp_message_log").insert({
              instance_id: instanceId,
              direction: "inbound",
              message_type: messageType,
              payload: msg,
              status: "delivered",
            });
          }

          if (isGroup) {
            // Insert into grupo_messages (both inbound and outbound)
            await supabase.from("grupo_messages").insert({
              instance_id: instanceId,
              whatsapp_group_id: remoteJid,
              sender_name: senderName,
              message_text: messageText,
              message_type: messageType,
              received_at: receivedAt,
            });

            // Update grupos table if mapped
            const { data: grupo } = await supabase
              .from("grupos")
              .select("id, mensagens")
              .eq("whatsapp_group_id", remoteJid)
              .maybeSingle();

            if (grupo) {
              // Update grupo_messages with grupo_id
              await supabase
                .from("grupo_messages")
                .update({ grupo_id: grupo.id })
                .eq("whatsapp_group_id", remoteJid)
                .is("grupo_id", null);

              // Update last_message and increment message count
              await supabase
                .from("grupos")
                .update({
                  last_message: `${senderName}: ${messageText}`.substring(0, 500),
                  last_message_at: receivedAt,
                  ultima_atividade: receivedAt,
                  mensagens: (grupo.mensagens || 0) + 1,
                })
                .eq("id", grupo.id);
            }
          }
        }
      }
    }

    // Mark as processed
    if (instanceId) {
      await supabase
        .from("whatsapp_webhooks_log")
        .update({ processed: true })
        .eq("instance_id", instanceId)
        .eq("event_type", eventType)
        .eq("processed", false)
        .order("created_at", { ascending: false })
        .limit(1);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
