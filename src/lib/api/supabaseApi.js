import { supabase } from '../supabase';
import logger from '../logger';
import { formatError } from '../errorFormatter';

export async function executeSupabase(statement, label = 'supabase') {
  console.log(`📡 [Supabase] Appel: ${label}`, { timestamp: new Date().toISOString() });
  const start = performance.now();
  try {
    const result = await statement;
    const duration = Math.round(performance.now() - start);

    if (result?.error) {
      const error = formatError(result.error);
      logger.error('[supabaseApi]', label, error, { duration });
      console.error(`❌ [Supabase] Erreur: ${label}`, error);
      return { data: null, error, duration };
    }

    logger.debug('[supabaseApi]', label, { duration, count: result.count ?? undefined });
    console.log(`✅ [Supabase] Réussi: ${label} (${duration}ms)`, result);
    return { ...result, duration };
  } catch (rawError) {
    const duration = Math.round(performance.now() - start);
    const error = formatError(rawError);
    logger.error('[supabaseApi]', label, error, { duration });
    console.error(`❌ [Supabase] Erreur: ${label}`, error);
    return { data: null, error, duration };
  }
}

export { supabase };
