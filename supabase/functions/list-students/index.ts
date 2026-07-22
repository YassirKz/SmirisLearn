// supabase/functions/list-students/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { verifyApiKey, corsHeaders, checkOrgAccess, getPathParameter } from "../_shared/verify-api-key.ts";

serve(async (req) => {
  const startTime = performance.now();
  let statusCode = 200;
  let responseBody: any = {};

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log('📡 [API] list-students - Début');
  try {
    const { keyData, supabase } = await verifyApiKey(req);

    const url = new URL(req.url);
    const orgId = getPathParameter(req, "list-students", "organization ID");
    console.log('📡 [API] list-students - orgId:', orgId);

    if (!orgId) {
      throw new Error("Missing organization ID in path");
    }

    // VÉRIFICATION DE SÉCURITÉ (IDOR)
    checkOrgAccess(keyData, orgId);

    const page = Number(url.searchParams.get("page") || "1");
    const limit = Number(url.searchParams.get("limit") || "20");
    const search = url.searchParams.get("search") || "";

    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new Error("page must be >= 1 and limit must be between 1 and 100");
    }

    let query = supabase
      .from("profiles")
      .select("id, full_name, email, role, suspended, created_at", { count: "exact" })
      .eq("organization_id", orgId)
      .eq("role", "student")
      .order("created_at", { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (search) {
      const sanitized = search.replace(/[%_\\]/g, '\\$&');
      query = query.or(`full_name.ilike.%${sanitized}%,email.ilike.%${sanitized}%`);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    console.log('📡 [API] list-students - Succès');

    responseBody = {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil((count || 0) / limit),
      },
    };

  } catch (error) {
    statusCode = (error as any).status || 400;
    responseBody = { success: false, error: error.message };
  } finally {
    const responseTimeMs = Math.round(performance.now() - startTime);
    return new Response(JSON.stringify(responseBody), {
      status: statusCode,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
