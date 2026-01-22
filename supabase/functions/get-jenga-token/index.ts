// Deno-based Supabase Edge Function

import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

serve(async (req) => {
  try {
    const API_KEY = Deno.env.get("JENGA_API_KEY")!;
    const MERCHANT_CODE = Deno.env.get("JENGA_MERCHANT_CODE")!;
    const CONSUMER_SECRET = Deno.env.get("JENGA_CONSUMER_SECRET")!;

    const res = await fetch(
      "https://uat.finserve.africa/authentication/api/v3/authenticate/merchant",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Api-Key": API_KEY
        },
        body: JSON.stringify({
          merchantCode: MERCHANT_CODE,
          consumerSecret: CONSUMER_SECRET
        })
      }
    );

    const data = await res.json();

    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
