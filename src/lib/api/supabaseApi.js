import { supabase } from '../supabase';
import logger from '../logger';
import { formatError } from '../errorFormatter';

export async function executeSupabase(statement, label = 'supabase') {
  const start = performance.now();
  try {
    const result = await statement;
    const duration = Math.round(performance.now() - start);

    if (result?.error) {
      const error = formatError(result.error);
      logger.error('[supabaseApi]', label, error, { duration });
      return { data: null, error, duration };
    }

    logger.debug('[supabaseApi]', label, { duration, count: result.count ?? undefined });
    return { ...result, duration };
  } catch (rawError) {
    const duration = Math.round(performance.now() - start);
    const error = formatError(rawError);
    logger.error('[supabaseApi]', label, error, { duration });
    return { data: null, error, duration };
  }
}

export { supabase };
