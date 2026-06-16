export function formatError(error) {
  if (!error) {
    return { message: 'Erreur inconnue', code: 'UNKNOWN', details: null, original: null };
  }

  const message = error?.message || String(error) || 'Erreur inconnue';
  const code = error?.code || error?.status || error?.statusCode || 'UNKNOWN';
  const details = error?.details || error?.hint || null;

  return {
    message,
    code,
    details,
    original: error,
  };
}
