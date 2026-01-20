// deno-lint-ignore-file
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req: Request) => {
  try {
    const body = await req.json();
    console.log("CALLBACK:", body);

    const { status, transactionId, ref } = body;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (status === "SUCCESS") {
      await supabase.from("orders")
        .update({
          jenga_status: "paid",
          jenga_transaction_id: transactionId,
          payment_status: "paid"
        })
        .eq("payment_reference", ref);
    }

    return new Response("ok", { status: 200 });

  } catch (err) {
    console.error("CALLBACK ERROR:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
