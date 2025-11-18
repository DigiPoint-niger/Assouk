"use client";
import { createClient } from "@supabase/supabase-js";

// Read environment variables (Next.js will load from process.env)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabase;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase URL or ANON KEY is not set. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your environment."
  );

  // Provide a safe mock object to avoid runtime errors during prerender/build.
  const noop = async () => ({ data: null, error: null });
  const mock = {
    auth: {
      signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
      signUp: async () => ({ error: new Error('Supabase not configured') }),
      signOut: async () => ({}),
      getSession: async () => ({ data: { session: null } }),
      onAuthStateChange: () => ({ subscription: { unsubscribe: () => {} } }),
    },
    from: () => ({ select: noop, insert: noop, update: noop, upsert: noop }),
    channel: () => ({ on: () => ({ subscribe: () => {} }) }),
  };

  supabase = mock;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
    },
  });
}

export { supabase };
export default supabase;
