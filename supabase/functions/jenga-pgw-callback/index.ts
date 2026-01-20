// supabase/functions/jenga-pgw-callback/index.ts
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

serve(async (req: Request) => {
  // Handle preflight (optional for PGW but useful)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();

    // Support nested structure or flat structure
    const payload = body.transaction ? body.transaction : body;

    const status = payload.status;
    const reference = payload.reference;
    const transactionId = payload.transactionId;
    const paymentMethod = payload.paymentMethod;

    // Validate required fields
    if (!reference) {
      console.error("Missing reference in PGW callback:", body);
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (status === "SUCCESS") {
      await supabase.from("orders")
        .update({
          payment_status: "paid",
          jenga_transaction_id: transactionId || null,
          jenga_payment_method: paymentMethod || null
        })
        .eq("payment_reference", reference);
    } else {
      // Payment failed or canceled
      await supabase.from("orders")
        .update({
          payment_status: "failed"
        })
        .eq("payment_reference", reference);
    }

    return new Response("ok", { status: 200, headers: corsHeaders });

  } catch (err) {
    console.error("PGW CALLBACK ERROR:", err);

    // **Still return 200** so PGW won't retry aggressively
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});
