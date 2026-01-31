// src/utils/supabase.ts
import type { SupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@supabase/supabase-js';

// ENV aus Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Debug-Logging während der Entwicklung
if (import.meta.env.DEV) {
  console.log('🔧 Supabase URL:', supabaseUrl);
  console.log('🔧 Supabase Key:', `${supabaseAnonKey?.slice(0, 8)}...`);
}

// Validierung
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    '[supabase.ts] ❌ ENV-Variablen fehlen. Bitte .env prüfen und Vite korrekt starten.'
  );
}

// Supabase-Client erstellen
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey);
