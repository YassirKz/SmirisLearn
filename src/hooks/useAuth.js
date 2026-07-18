import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

console.log('🔐 [useAuth] Hook appelé');

/**
 * Hook personnalisé pour l'authentification
 * @throws {Error} Si utilisé hors d'un AuthProvider
 * @returns {Object} Méthodes et état d'authentification
 */
export function useAuth() {
    const context = useContext(AuthContext);
    console.log('🔐 [useAuth] Contexte récupéré:', context ? '✅' : '❌');
    
    if (!context) {
        throw new Error('useAuth doit être utilisé dans un AuthProvider');
    }
    
    return context;
}