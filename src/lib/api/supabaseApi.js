import { supabase } from '../supabase';
import logger from '../logger';
import { formatError } from '../errorFormatter';
import { createSupabaseExecutor } from './supabaseExecutor';

export const executeSupabase = createSupabaseExecutor({ logger, formatError });

export { supabase };
