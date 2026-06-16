import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { useToast } from './ToastContext';
import logger from '../lib/logger';
import { formatError } from '../lib/errorFormatter';

const ErrorContext = createContext(null);

export const ErrorProvider = ({ children }) => {
  const [error, setError] = useState(null);
  const toast = useToast();

  const reportError = useCallback((err, options = {}) => {
    const formatted = formatError(err);
    logger.error('[ErrorContext]', formatted);
    setError(formatted);

    if (options.toast !== false) {
      toast.error(options.message || formatted.message, options.toastOptions);
    }

    return formatted;
  }, [toast]);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(() => ({ error, reportError, clearError }), [error, reportError, clearError]);

  return <ErrorContext.Provider value={value}>{children}</ErrorContext.Provider>;
};

export const useError = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useError must be used within an ErrorProvider');
  }
  return context;
};
