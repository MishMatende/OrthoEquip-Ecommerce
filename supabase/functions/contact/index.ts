import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "npm:resend";

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body = await req.json();
    const { name, email, service, phone, message } = body;

    if (!name || !email || !service || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

    // 🚫 Rate limit: 3 messages per 10 minutes per IP
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

    const { count } = await supabase
      .from("contact_messages")
      .select("*", { count: "exact", head: true })
      .eq("ip_address", ip)
      .gte("created_at", tenMinutesAgo);

    if ((count ?? 0) >= 3) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait." }),
        { status: 429 }
      );
    }

    // 💾 Save message
    await supabase.from("contact_messages").insert({
      name,
      email,
      service,
      phone,
      message,
      ip_address: ip,
    });

    // 📧 Send admin email
    const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

    await resend.emails.send({
      from: "Balm Ortho Medical Supplies <no-reply@balmorthomedical.com>",
      to: ["balmortho93@gmail.com"],
      reply_to: `${name} <${email}>`,
      subject: `New Contact Request — ${service}`,
      html: `
        <h2>New Contact Request</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "N/A"}</p>
        <p><strong>Service:</strong> ${service}</p>
        <hr />
        <p>${message.replace(/\n/g, "<br />")}</p>
      `,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("Contact function error:", err);
    return new Response(
      JSON.stringify({ error: "Server error" }),
      { status: 500 }
    );
  }
});
