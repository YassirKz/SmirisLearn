import { supabase } from '../lib/supabase';
import { executeSupabase } from '../lib/api/supabaseApi';
import { generateInvitationToken, getExpirationDate } from '../utils/tokenGenerator';
import { checkRateLimit } from '../utils/rateLimit';
import { untrusted, validateEmail } from '../utils/security';
import { sendInvitationEmail } from '../lib/email';
import { sendNotification } from '../utils/notifications';
import logger from '../lib/logger';

export async function createMemberInvitation({ email, role, organization_id, invited_by }) {
  const validatedEmail = validateEmail(untrusted(email.trim().toLowerCase()));

  if (!checkRateLimit('member-invitation', validatedEmail, 5, 60000)) {
    return { error: new Error('Trop de tentatives. Réessayez dans quelques minutes.') };
  }

  const [orgResult, inviterResult] = await Promise.all([
    executeSupabase(
      supabase.from('organizations').select('name').eq('id', organization_id).single(),
      'invitationsService.fetchOrganization'
    ),
    executeSupabase(
      supabase.from('profiles').select('full_name').eq('id', invited_by).single(),
      'invitationsService.fetchInviter'
    ),
  ]);

  if (orgResult.error) return { error: orgResult.error };
  if (inviterResult.error) return { error: inviterResult.error };

  const organizationName = orgResult.data?.name;
  const inviterName = inviterResult.data?.full_name || 'Un administrateur';

  const profileResult = await executeSupabase(
    supabase.from('profiles').select('id, organization_id').eq('email', validatedEmail).maybeSingle(),
    'invitationsService.checkExistingProfile'
  );

  if (profileResult.error) return { error: profileResult.error };

  const existingUser = profileResult.data;
  if (existingUser?.organization_id) {
    return { error: new Error('Cet email est déjà rattaché à une organisation.') };
  }

  if (existingUser) {
    const updateResult = await executeSupabase(
      supabase.from('profiles').update({ organization_id, role }).eq('id', existingUser.id),
      'invitationsService.updateExistingProfile'
    );

    if (updateResult.error) return { error: updateResult.error };

    return { user: existingUser, alreadyExisted: true };
  }

  const token = generateInvitationToken();
  const expiresAt = getExpirationDate();

  const insertResult = await executeSupabase(
    supabase
      .from('member_invitations')
      .insert({
        organization_id,
        email: validatedEmail,
        role,
        token,
        expires_at: expiresAt,
        invited_by,
      })
      .select()
      .single(),
    'invitationsService.insertInvitation'
  );

  if (insertResult.error) return { error: insertResult.error };

  const emailResult = await sendInvitationEmail({
    to: validatedEmail,
    type: 'member',
    organizationName,
    invitedBy: inviterName,
    token,
  });

  if (!emailResult.success) {
    logger.warn('Invitation créée, mais l’email n’a pas pu être envoyé.', {
      email: validatedEmail,
      invitationId: insertResult.data?.id,
    });
  }

  return { invitation: insertResult.data };
}

export async function getInvitationByToken(token) {
  const result = await executeSupabase(
    supabase.from('member_invitations').select('*, organizations(name)').eq('token', token).maybeSingle(),
    'invitationsService.getInvitationByToken'
  );

  return result;
}

export async function acceptMemberInvitation(token, userId) {
  const invitationResult = await getInvitationByToken(token);
  if (invitationResult.error) return { error: invitationResult.error };
  const invitation = invitationResult.data;
  if (!invitation) return { error: new Error('Invitation invalide') };
  if (new Date(invitation.expires_at) < new Date()) return { error: new Error('Invitation expirée') };

  const updateResult = await executeSupabase(
    supabase
      .from('profiles')
      .update({ organization_id: invitation.organization_id, role: invitation.role })
      .eq('id', userId),
    'invitationsService.acceptInvitation'
  );

  if (updateResult.error) return { error: updateResult.error };

  const deleteResult = await executeSupabase(
    supabase.from('member_invitations').delete().eq('token', token),
    'invitationsService.deleteInvitation'
  );

  if (deleteResult.error) return { error: deleteResult.error };

  if (invitation.invited_by) {
    await sendNotification(
      invitation.invited_by,
      'Invitation acceptée ! 🤝',
      `${invitation.email} a rejoint votre organisation.`,
      'success',
      '/admin/members'
    );
  }

  return { invitation };
}
