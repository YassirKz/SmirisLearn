// supabase/functions/send-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/**
 * Génère le HTML pour l'email d'invitation entreprise
 */
function buildCompanyEmailHtml({
  organizationName,
  adminName,
  inviteLink,
}: {
  organizationName: string;
  adminName: string;
  inviteLink: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Smiris Learn</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Bienvenue sur Smiris Learn !</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">
                Bonjour <strong>${adminName || "Administrateur"}</strong>,
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                Vous êtes invité(e) à rejoindre <strong>${organizationName}</strong> en tant qu'administrateur.
                Cliquez sur le bouton ci-dessous pour créer votre compte et commencer.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;padding:14px 32px;">
                    <a href="${inviteLink}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">
                      Accepter l'invitation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                <a href="${inviteLink}" style="color:#6366f1;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Smiris Learn. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Génère le HTML pour l'email d'invitation membre
 */
function buildMemberEmailHtml({
  organizationName,
  invitedByName,
  inviteLink,
}: {
  organizationName: string;
  invitedByName: string;
  inviteLink: string;
}) {
  return `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background-color:#f4f7fa;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f7fa;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:32px 40px;text-align:center;">
              <h1 style="color:#ffffff;margin:0;font-size:24px;font-weight:700;">🎓 Smiris Learn</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <h2 style="color:#1e293b;margin:0 0 16px;font-size:20px;">Vous êtes invité(e) !</h2>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 12px;">
                Bonjour,
              </p>
              <p style="color:#475569;font-size:15px;line-height:1.6;margin:0 0 24px;">
                <strong>${invitedByName}</strong> vous invite à rejoindre l'organisation
                <strong>${organizationName}</strong> sur Smiris Learn.
                Cliquez sur le bouton ci-dessous pour accepter l'invitation.
              </p>
              <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
                <tr>
                  <td style="background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:8px;padding:14px 32px;">
                    <a href="${inviteLink}" style="color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">
                      Rejoindre l'organisation
                    </a>
                  </td>
                </tr>
              </table>
              <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin:0;">
                Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br/>
                <a href="${inviteLink}" style="color:#6366f1;word-break:break-all;">${inviteLink}</a>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
              <p style="color:#94a3b8;font-size:12px;margin:0;">© ${new Date().getFullYear()} Smiris Learn. Tous droits réservés.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ success: false, error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // 1. Vérifier l'authentification via le JWT Supabase
    const authHeader = req.headers.get("Authorization");
    console.log("🔑 [Auth] Authorization Header:", authHeader ? `${authHeader.substring(0, 20)}...` : "Absente");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new Error("Non authentifié : Header d'autorisation manquant ou mal formé");
    }

    const authToken = authHeader.substring(7); // Supprime "Bearer "
    
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      {
        auth: { persistSession: false },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authToken);

    if (authError || !user) {
      console.error("❌ [Auth] Erreur validation token:", authError);
      throw new Error("Non authentifié : Session utilisateur invalide ou expirée");
    }

    console.log("👤 [Auth] Utilisateur authentifié:", user.email);


    // 2. Récupérer les données de la requête
    const adminSupabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false } },
    );
    const { data: callerProfile, error: callerError } = await adminSupabase
      .from("profiles")
      .select("role, organization_id")
      .eq("id", user.id)
      .single();
    if (callerError || !callerProfile || !["org_admin", "super_admin"].includes(callerProfile.role)) {
      const error = new Error("Forbidden");
      (error as Error & { status?: number }).status = 403;
      throw error;
    }

    let { to, type = "company", organizationName, token, invitedByName, adminName } =
      await req.json();

    if (!to) throw new Error("Le champ 'to' (email destinataire) est requis");
    if (!token) throw new Error("Le champ 'token' est requis");
    if (!["company", "member"].includes(type)) throw new Error("Invalid invitation type");

    if (type === "company" && callerProfile.role !== "super_admin") {
      const error = new Error("Forbidden");
      (error as Error & { status?: number }).status = 403;
      throw error;
    }

    if (type === "member") {
      const { data: invitation, error: invitationError } = await adminSupabase
        .from("member_invitations")
        .select("email, organization_id, organizations(name)")
        .eq("token", token)
        .gte("expires_at", new Date().toISOString())
        .single();
      if (invitationError || !invitation) throw new Error("Invitation invalide ou expiree");
      if (callerProfile.role !== "super_admin" && callerProfile.organization_id !== invitation.organization_id) {
        const error = new Error("Forbidden");
        (error as Error & { status?: number }).status = 403;
        throw error;
      }

      to = invitation.email;
      organizationName = invitation.organizations?.name || organizationName;
    }

    // 3. Construire le lien d'invitation
    // On utilise l'origin envoyé par le frontend ou un fallback
    const origin = Deno.env.get("FRONTEND_URL") || "https://smiris-learn.vercel.app";
    const inviteLink =
      type === "member"
        ? `${origin}/accept-member-invite?token=${token}`
        : `${origin}/accept-invite?token=${token}`;

    // 4. Construire le contenu de l'email
    let subject: string;
    let html: string;

    if (type === "member") {
      subject = `Invitation à rejoindre ${organizationName || "une organisation"} sur Smiris Learn`;
      html = buildMemberEmailHtml({
        organizationName: organizationName || "une organisation",
        invitedByName: invitedByName || "Un administrateur",
        inviteLink,
      });
    } else {
      subject = `Bienvenue sur Smiris Learn — ${organizationName || "Votre organisation"}`;
      html = buildCompanyEmailHtml({
        organizationName: organizationName || "Votre organisation",
        adminName: adminName || "",
        inviteLink,
      });
    }

    // 5. Envoyer via Resend
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY non configurée dans les secrets");
    }

    const fromAddress = Deno.env.get("RESEND_FROM_EMAIL") || "Smiris Learn <onboarding@resend.dev>";

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendResponse.json();

    if (!resendResponse.ok) {
      console.error("Resend error:", resendData);
      throw new Error(resendData?.message || "Erreur lors de l'envoi de l'email via Resend");
    }

    console.log(`✅ Email envoyé à ${to} (type: ${type}, id: ${resendData.id})`);

    return new Response(
      JSON.stringify({ success: true, id: resendData.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erreur send-email:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: (error as Error & { status?: number }).status || 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
