// supabase/functions/jenga-pgw-callback/index.ts
// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";


serve(async (req: Request) => {
  try {
    const { status, reference, transactionId, paymentMethod } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (status === "SUCCESS") {
      await supabase.from("orders")
        .update({
          payment_status: "paid",
          jenga_transaction_id: transactionId,
          jenga_payment_method: paymentMethod
        })
        .eq("payment_reference", reference);
    }

    return new Response("ok", { status: 200 });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
