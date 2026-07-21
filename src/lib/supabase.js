import { createClient } from '@supabase/supabase-js'
import logger from './logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export function createSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey)
}

export const supabase = createSupabaseClient()

logger.info('[Supabase] Client initialisé');
