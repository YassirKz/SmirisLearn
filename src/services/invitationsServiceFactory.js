export function createInvitationsService({
  supabase,
  executeSupabase,
  generateInvitationToken,
  getExpirationDate,
  checkRateLimit,
  untrusted,
  validateEmail,
  sendInvitationEmail,
  logger,
}) {
  async function createMemberInvitation({ email, role, organization_id, invited_by }) {
    const validatedEmail = validateEmail(untrusted(email.trim().toLowerCase()));

    if (!checkRateLimit('member-invitation', validatedEmail, 5, 60000)) {
      return { error: new Error('Trop de tentatives. Reessayez dans quelques minutes.') };
    }

    const [orgResult, inviterResult] = await Promise.all([
      executeSupabase(
        supabase.from('organizations').select('name').eq('id', organization_id).single(),
        'invitationsService.fetchOrganization',
      ),
      executeSupabase(
        supabase.from('profiles').select('full_name').eq('id', invited_by).single(),
        'invitationsService.fetchInviter',
      ),
    ]);

    if (orgResult.error) return { error: orgResult.error };
    if (inviterResult.error) return { error: inviterResult.error };

    const organizationName = orgResult.data?.name;
    const inviterName = inviterResult.data?.full_name || 'Un administrateur';

    const profileResult = await executeSupabase(
      supabase.from('profiles').select('id, organization_id').eq('email', validatedEmail).maybeSingle(),
      'invitationsService.checkExistingProfile',
    );

    if (profileResult.error) return { error: profileResult.error };

    const existingUser = profileResult.data;
    if (existingUser?.organization_id) {
      return { error: new Error('Cet email est deja rattache a une organisation.') };
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
      'invitationsService.insertInvitation',
    );

    if (insertResult.error) return { error: insertResult.error };

    const emailResult = await sendInvitationEmail({
      to: validatedEmail,
      type: 'member',
      organizationName,
      invitedByName: inviterName,
      token,
    });

    if (!emailResult.success) {
      logger.warn("Invitation creee, mais l'email n'a pas pu etre envoye.", {
        email: validatedEmail,
        invitationId: insertResult.data?.id,
      });
    }

    return { invitation: insertResult.data, alreadyExisted: !!existingUser };
  }

  async function getInvitationByToken(token) {
    const { data, error } = await supabase.rpc('get_member_invitation_by_token', {
      p_token: token,
    });
    if (error) return { error };
    const invitation = Array.isArray(data) ? data[0] || null : data;
    return { data: invitation };
  }

  async function acceptMemberInvitation(token, userId, fullName = null) {
    const { error } = await supabase.rpc('accept_member_invitation', {
      p_token: token,
      p_user_id: userId,
      p_full_name: fullName ? fullName.trim() : null,
    });

    if (error) return { error };
    return { success: true };
  }

  return {
    acceptMemberInvitation,
    createMemberInvitation,
    getInvitationByToken,
  };
}
