import { AccessToken } from "npm:livekit-server-sdk@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const roomName = body?.roomName?.trim();
    const participantName = body?.participantName?.trim();
    const participantIdentity = body?.participantIdentity?.trim();
    const isSeated = Boolean(body?.isSeated);

    if (!roomName || !participantName) {
      return new Response(
        JSON.stringify({ error: "roomName and participantName are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("LIVEKIT_API_KEY");
    const apiSecret = Deno.env.get("LIVEKIT_API_SECRET");

    if (!apiKey || !apiSecret) {
      return new Response(
        JSON.stringify({ error: "LIVEKIT_API_KEY and LIVEKIT_API_SECRET must be set" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const identity = participantIdentity || participantName;

    const token = new AccessToken(apiKey, apiSecret, {
      identity,
      name: participantName,
      ttl: "6h",
    });

    token.addGrant({
      roomJoin: true,
      room: roomName,
      // Client mutes mic unless seated; always allow publish so sit→speak works without reconnect.
      canPublish: true,
      canSubscribe: true,
    });

    const jwt = await token.toJwt();

    return new Response(
      JSON.stringify({ token: jwt }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Token generation failed";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
