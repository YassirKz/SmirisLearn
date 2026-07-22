import { supabase } from '../lib/supabase';
import { executeSupabase } from '../lib/api/supabaseApi';
import { generateInvitationToken, getExpirationDate } from '../utils/tokenGenerator';
import { checkRateLimit } from '../utils/rateLimit';
import { untrusted, validateEmail } from '../utils/security';
import { sendInvitationEmail } from '../lib/email';
import logger from '../lib/logger';
import { createInvitationsService } from './invitationsServiceFactory';

const invitationsService = createInvitationsService({
  supabase,
  executeSupabase,
  generateInvitationToken,
  getExpirationDate,
  checkRateLimit,
  untrusted,
  validateEmail,
  sendInvitationEmail,
  logger,
});

export const {
  acceptMemberInvitation,
  createMemberInvitation,
  getInvitationByToken,
} = invitationsService;
