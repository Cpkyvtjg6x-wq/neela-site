import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Client Supabase côté SERVEUR uniquement (clé service_role).
// Ne jamais importer ce fichier dans un composant client.
let client: SupabaseClient | null = null;

export function getDb(): SupabaseClient {
  if (!client) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "Variables Supabase manquantes (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)."
      );
    }
    client = createClient(url, key, { auth: { persistSession: false } });
  }
  return client;
}
