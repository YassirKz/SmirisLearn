import emailjs from '@emailjs/browser';

emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

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
    console.log('📧 Envoi email de type', type, 'via EmailJS...', { to, organizationName, adminName });

    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
    if (!serviceId) throw new Error('VITE_EMAILJS_SERVICE_ID manquant');
    if (!publicKey) throw new Error('VITE_EMAILJS_PUBLIC_KEY manquant');

    const inviteLink = type === 'member'
      ? `${window.location.origin}/accept-member-invite?token=${token}`
      : `${window.location.origin}/accept-invite?token=${token}`;

    console.log('🔗 Lien d\'invitation :', inviteLink);

    let templateParams;
    let templateId;

    if (type === 'member') {
      templateId = import.meta.env.VITE_EMAILJS_MEMBER_TEMPLATE_ID;
      templateParams = {
        to_email: to,
        organization_name: organizationName,
        invited_by: invitedByName || 'Un administrateur',
        invite_link: inviteLink,
      };
    } else {
      templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      templateParams = {
        from_name: fromName || 'Smiris Learn',
        from_email: fromEmail,
        reply_to: fromEmail,
        to_email: to,
        adminName: adminName || '',
        companyName: organizationName || '',
        inviteLink: inviteLink,
      };
    }

    if (!templateId) {
      throw new Error(`Template ID manquant pour le type "${type}"`);
    }

    console.log('🔑 Service ID :', serviceId);
    console.log('📋 Template ID :', templateId);
    console.log('📤 Paramètres du template :', templateParams);
    console.log('📧 to_email =', templateParams.to_email);

    const response = await emailjs.send(serviceId, templateId, templateParams);

    console.log('✅ Réponse EmailJS :', response.status, response.text);
    return { success: true, data: response };

  } catch (error) {
    console.error('❌ Erreur EmailJS :', error);
    if (error.text) console.error('Détails :', error.text);
    return { 
      success: false, 
      error: error.text || error.message || 'Erreur inconnue' 
    };
  }
};