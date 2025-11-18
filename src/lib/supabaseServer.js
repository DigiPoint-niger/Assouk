// Fichier : /lib/supabaseServer.js

// N'a PAS besoin de "use client"
import { createClient } from "@supabase/supabase-js";

/**
 * Crée une instance Supabase optimisée pour les Server Components et Route Handlers.
 * Utilise la SERVICE_ROLE_KEY si disponible pour des accès sécurisés,
 * ou la ANON_KEY pour des accès en lecture seule non authentifiés.
 */
export function createServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Utilisez la clé la plus puissante si disponible pour les opérations backend.
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase environment variables for server client.");
  }

  // Crée le client (pas besoin de la session)
  return createClient(supabaseUrl, supabaseKey);
}