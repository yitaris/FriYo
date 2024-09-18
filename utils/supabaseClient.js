const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
import { createClient } from '@supabase/supabase-js';

function createClerkSupabaseClient() {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const clerkToken = await window.Clerk?.session?.getToken({
          template: 'supabase',
        });

        const headers = new Headers(options?.headers);
        headers.set('Authorization', `Bearer ${clerkToken}`);

        return fetch(url, {
          ...options,
          headers,
        });
      },
    },
  });
}

export const client = createClerkSupabaseClient();
