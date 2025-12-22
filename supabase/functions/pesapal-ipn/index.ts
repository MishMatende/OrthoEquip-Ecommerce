// import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
// import { createClient } from "@supabase/supabase-js";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
// };

// serve(async (req) => {
//   try {
//     // Pesapal sends IPN as GET with query params
//     const url = new URL(req.url);

//     const orderTrackingId = url.searchParams.get("OrderTrackingId");
//     const merchantReference = url.searchParams.get("OrderMerchantReference");

//     if (!orderTrackingId || !merchantReference) {
//       return new Response("Missing parameters", { status: 400 });
//     }

//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL")!,
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
//     );

//     // 1️⃣ Authenticate with Pesapal
//     const authRes = await fetch(
//       "https://cybqa.pesapal.com/pesapalv3/api/Auth/RequestToken",
//       {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           consumer_key: Deno.env.get("PESAPAL_CONSUMER_KEY"),
//           consumer_secret: Deno.env.get("PESAPAL_CONSUMER_SECRET"),
//         }),
//       }
//     );

//     const authData = await authRes.json();

//     if (!authData.token) {
//       throw new Error("Pesapal auth failed");
//     }

//     // 2️⃣ Query Pesapal for transaction status
//     const statusRes = await fetch(
//       `https://cybqa.pesapal.com/pesapalv3/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${authData.token}`,
//         },
//       }
//     );

//     const statusData = await statusRes.json();

//     /*
//       Possible payment_status values:
//       - COMPLETED
//       - FAILED
//       - INVALID
//       - REVERSED
//     */

//     const paymentStatus = statusData.payment_status;

//     // 3️⃣ Update order safely (idempotent)
//     if (paymentStatus === "COMPLETED") {
//       await supabase
//         .from("orders")
//         .update({
//           status: "paid",
//           payment_status: "paid",
//         })
//         .eq("pesapal_tracking_id", orderTrackingId);
//     }

//     if (paymentStatus === "FAILED") {
//       await supabase
//         .from("orders")
//         .update({
//           status: "payment_failed",
//           payment_status: "failed",
//         })
//         .eq("pesapal_tracking_id", orderTrackingId);
//     }

//     // 4️⃣ Respond OK to Pesapal
//     return new Response("OK", {
//       status: 200,
//       headers: corsHeaders,
//     });
//   } catch (err) {
//     console.error("Pesapal IPN error:", err);

//     return new Response("IPN error", { status: 500 });
//   }
// });


// supabase/functions/pesapal-ipn/index.ts
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

serve(async (req) => {
  try {
    const body = await req.text();
    console.log("🔔 Pesapal IPN HIT:", body);

    // DO NOTHING ELSE FOR NOW
    return new Response("OK", { status: 200 });
  } catch (err) {
    console.error("❌ IPN error:", err);
    return new Response("OK", { status: 200 });
  }
});
