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

    // Try to find instance by instance name from payload
    let instanceId: string | null = null;
    const instanceName = body.instance?.instanceName || body.instance || body.instanceName;
    if (instanceName && typeof instanceName === "string") {
      const { data: inst } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("instance_name", instanceName)
        .maybeSingle();
      instanceId = inst?.id || null;
    }

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
        "qrcode.updated": "connecting",
        "status.instance": body.data?.status || "disconnected",
      };

      const newStatus = statusMap[eventType];
      if (newStatus) {
        const updateData: any = { status: newStatus };
        if (eventType === "qrcode.updated" && body.data?.qrcode?.base64) {
          updateData.qr_code = body.data.qrcode.base64;
        }
        if (newStatus === "connected") {
          updateData.qr_code = null;
          updateData.last_health_check = new Date().toISOString();
        }
        await supabase.from("whatsapp_instances").update(updateData).eq("id", instanceId);
      }

      // Log inbound messages
      if (eventType === "messages.upsert" && body.data) {
        const messages = Array.isArray(body.data) ? body.data : [body.data];
        for (const msg of messages) {
          if (msg.key && !msg.key.fromMe) {
            await supabase.from("whatsapp_message_log").insert({
              instance_id: instanceId,
              direction: "inbound",
              message_type: msg.messageType || "text",
              payload: msg,
              status: "delivered",
            });
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
