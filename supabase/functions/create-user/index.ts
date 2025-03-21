// Setup type definitions for built-in Supabase Runtime APIs
// Bu kod satırı hesap oluşturduktan sonra hemen gerçekleşecek eventleri hazırlıyor!!!!


import { serve } from "https://deno.land/std@0.224.0/http/server.ts"
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@1.30.0';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    // Get required data from the request body
    const { id, email_addresses, first_name, last_name, username, image_url } = (await req.json()).data; // clerk ten veri alınan yer
    const email = email_addresses[0].email_address;

    // Insert into Supabase users table with all fields
    const { data, error } = await supabase
      .from('users')
      .insert({ id, email, avatar_url: image_url, first_name, last_name, username });

    // Error handling
    if (error) {
      return new Response(JSON.stringify(error), { status: 400 });
    }

    // Return successful response
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' },
      status: 201,
    });
  } catch (err) {
    console.log(err);

    return new Response(JSON.stringify({ error: err.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
