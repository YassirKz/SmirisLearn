import emailjs from '@emailjs/browser';

// Initialiser EmailJS (à faire une seule fois)
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

/**
 * Envoie un email d'invitation
 * @param {Object} params
 * @param {string} params.to - Email du destinataire
 * @param {string} params.type - 'company' ou 'member'
 * @param {string} params.organizationName - Nom de l'organisation (pour le membre) ou nom de l'entreprise (pour l'invité entreprise)
 * @param {string} params.token - Token d'invitation
 * @param {string} params.invitedByName - Nom de la personne qui invite (admin)
 * @param {string} params.fromEmail - Email de l'expéditeur (pour le type company)
 * @param {string} params.fromName - Nom de l'expéditeur (pour le type company)
 * @param {string} params.adminName - Nom de l'admin (pour le type company)
 */
export const sendInvitationEmail = async ({ 
  to, 
  type = 'company', 
  organizationName, 
  token, 
  invitedByName,
  fromEmail,
  fromName,
  adminName 
}) => {
  try {
    console.log(`📧 Envoi email de type "${type}" via EmailJS...`);

    // Construire le lien d'invitation en fonction du type
    const inviteLink = type === 'member'
      ? `${window.location.origin}/accept-member-invite?token=${token}`
      : `${window.location.origin}/accept-invite?token=${token}`;

    // Préparer les variables du template selon le type
    let templateParams;

    if (type === 'member') {
      // Template pour invitation membre
      templateParams = {
        to_email: to,
        organization_name: organizationName,
        invited_by: invitedByName,
        invite_link: inviteLink,
        // Ajoutez d'autres variables si votre template en a besoin
      };
    } else {
      // Template pour invitation entreprise (existant)
      templateParams = {
        from_name: fromName || "Smiris Learn",
        from_email: fromEmail,
        reply_to: fromEmail,
        to_email: to,
        adminName: adminName,
        companyName: organizationName,
        inviteLink: inviteLink
      };
    }

    // Choisir le bon template ID selon le type
    const templateId = type === 'member'
      ? import.meta.env.VITE_EMAILJS_MEMBER_TEMPLATE_ID   // À définir dans .env
      : import.meta.env.VITE_EMAILJS_TEMPLATE_ID;        // Template existant

    if (!templateId) {
      throw new Error(`Template ID manquant pour le type ${type}`);
    }

    // Envoyer l'email
    const response = await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      templateId,
      templateParams
    );

    console.log('✅ Email envoyé!', response);
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur EmailJS:', error);
    return { 
      success: false, 
      error: error.text || error.message || 'Erreur inconnue' 
    };
  }
};