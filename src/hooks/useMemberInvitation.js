import { useState } from 'react';
import { createMemberInvitation, getInvitationByToken as fetchInvitationByToken, acceptMemberInvitation } from '../services/invitationsService';
import { formatError } from '../lib/errorFormatter';

export function useMemberInvitation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createInvitation = async (payload) => {
    try {
      setLoading(true);
      setError(null);

      const result = await createMemberInvitation(payload);
      if (result.error) {
        throw result.error;
      }

      return result;
    } catch (err) {
      const formatted = formatError(err);
      setError(formatted.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getInvitationByToken = async (token) => {
    try {
      const result = await fetchInvitationByToken(token);
      if (result.error) {
        setError(result.error.message);
        return null;
      }
      return result.data;
    } catch (err) {
      const formatted = formatError(err);
      setError(formatted.message);
      return null;
    }
  };

  const acceptInvitation = async (token, userId, invitationData = null) => {
    try {
      setLoading(true);
      setError(null);

      const result = await acceptMemberInvitation(token, userId, invitationData);
      if (result.error) {
        throw result.error;
      }

      return result;
    } catch (err) {
      const formatted = formatError(err);
      setError(formatted.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createInvitation, getInvitationByToken, acceptInvitation, loading, error };
}
