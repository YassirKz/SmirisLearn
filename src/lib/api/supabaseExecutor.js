export function createSupabaseExecutor({ logger, formatError, now = performance.now.bind(performance) }) {
  return async function executeSupabase(statement, label = 'supabase') {
    logger.debug('[supabaseApi] appel', label, { timestamp: new Date().toISOString() });
    const start = now();

    try {
      const result = await statement;
      const duration = Math.round(now() - start);

      if (result?.error) {
        const error = formatError(result.error);
        logger.error('[supabaseApi]', label, error, { duration });
        return { data: null, error, duration };
      }

      logger.debug('[supabaseApi]', label, { duration, count: result.count ?? undefined });
      return { ...result, duration };
    } catch (rawError) {
      const duration = Math.round(now() - start);
      const error = formatError(rawError);
      logger.error('[supabaseApi]', label, error, { duration });
      return { data: null, error, duration };
    }
  };
}
