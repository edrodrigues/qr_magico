import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import { renderMediaOnLambda } from "npm:@remotion/lambda@4.0.481/client";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  const { data: { user }, error: userErr } = await supabase.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Invalid token" }), {
      status: 401,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  let presenteId: string | undefined;

  try {
    const body = await req.json();
    presenteId = body.presente_id;
    if (!presenteId) {
      return new Response(JSON.stringify({ error: "Missing presente_id" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: presente, error: presenteErr } = await supabase
      .from("presentes")
      .select("*")
      .eq("id", presenteId)
      .single();

    if (presenteErr || !presente) {
      return new Response(JSON.stringify({ error: "Presente not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    if (presente.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const { data: fotos } = await supabase
      .from("fotos")
      .select("url, ordem")
      .eq("presente_id", presenteId)
      .order("ordem", { ascending: true });

    const { data: musica } = await supabase
      .from("musicas")
      .select("url_audio")
      .eq("presente_id", presenteId)
      .maybeSingle();

    const awsRegion = Deno.env.get("AWS_REGION") || "us-east-1";
    const functionName = Deno.env.get("REMOTION_FUNCTION_NAME") || "";
    const serveUrl = Deno.env.get("REMOTION_SERVE_URL") || "";

    if (!functionName || !serveUrl) {
      return new Response(JSON.stringify({ error: "Remotion Lambda not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const inputProps = {
      nome_homenageado: presente.nome_homenageado,
      nome_remetente: presente.nome_remetente,
      ocasiao: presente.ocasiao,
      data_inicio: presente.data_inicio,
      descricao_relacao: presente.descricao_relacao,
      estilo_musical: presente.estilo_musical,
      fotos: (fotos || []).map((f: { url: string }) => f.url),
      thumbnail_url: presente.thumbnail_url || "",
      musicaUrl: musica?.url_audio || "",
    };

    const { renderId, bucketName } = await renderMediaOnLambda({
      region: awsRegion,
      functionName,
      serveUrl,
      composition: "Retrospectiva",
      inputProps,
      framesPerLambda: 30,
      logLevel: "warn",
    });

    console.log(`render-video started: ${presenteId}, renderId=${renderId}`);

    await supabase
      .from("presentes")
      .update({
        video_url: `s3://${bucketName}/renders/${renderId}/out.mp4`,
        updated_at: new Date().toISOString(),
      })
      .eq("id", presenteId);

    return new Response(JSON.stringify({ success: true, renderId }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    console.error(`render-video error ${presenteId}:`, err);

    await supabase
      .from("presentes")
      .update({ status: "failed", updated_at: new Date().toISOString() })
      .eq("id", presenteId);

    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
});
