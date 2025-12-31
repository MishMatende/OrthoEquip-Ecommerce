import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_INVITE_SECRET = process.env.ADMIN_INVITE_SECRET;
const RESET_REDIRECT_URL =
  process.env.RESET_REDIRECT_URL || process.env.SITE_URL || undefined;

if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars");
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

// util: generate a short temporary password (we won't keep/use it; user will reset)
function makeTempPassword() {
  return "Tmp!" + Math.random().toString(36).slice(2, 10) + "A";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // simple shared-secret protection (additional server-side checks recommended)
  const incomingSecret =
    req.headers["x-admin-invite-secret"] ||
    req.headers["admin-invite-secret"] ||
    req.query?.secret;
  if (!ADMIN_INVITE_SECRET || incomingSecret !== ADMIN_INVITE_SECRET) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { email, name = "", role = "admin", phone = null } = req.body || {};

  if (!email) {
    return res.status(400).json({ error: "Missing email in request body" });
  }

  try {
    // 1) Create the auth user (with a short temporary password)
    const tempPassword = makeTempPassword();
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        user_metadata: { full_name: name, phone },
        // email_confirm: true, // optional – if you set true the user won't need to confirm email
      });

    if (createError) {
      console.error("createUser error:", createError);
      // If user already exists, you may want to handle differently (e.g. continue)
      return res
        .status(500)
        .json({ error: createError.message || createError });
    }

    const createdUser = createData?.user;
    if (!createdUser?.id) {
      return res.status(500).json({ error: "Failed to create user" });
    }

    const userId = createdUser.id;

    // 2) Insert into profiles table with is_admin = true
    // Adjust column names if your profiles table uses different field names
    const profileRow = {
      id: userId,
      full_name: name || null,
      email: email,
      phone: phone,
      is_admin: true,
      updated_at: new Date().toISOString(),
    };

    const { error: profileError } = await supabase
      .from("profiles")
      .upsert(profileRow);
    if (profileError) {
      console.error("profiles upsert error:", profileError);
      // Attempt to rollback the created auth user? (optional)
      return res
        .status(500)
        .json({ error: "Failed to write profile: " + profileError.message });
    }

    // 3) Send password reset email so the user can set their own password.
    // Use the admin API to request a password reset email (redirectTo optional).
    // The API is supabase.auth.api.resetPasswordForEmail(...) for older clients,
    // and supabase.auth.resetPasswordForEmail(...) for newer. Using admin/api namespace is safe with service key.
    let resetResult;
    try {
      resetResult = await supabase.auth.api.resetPasswordForEmail(email, {
        redirectTo: RESET_REDIRECT_URL,
      });
    } catch (err) {
      // Some SDKs may expose errors differently; try fallback to the v2 method
      try {
        resetResult = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: RESET_REDIRECT_URL,
        });
      } catch (err2) {
        console.error("resetPasswordForEmail errors:", err, err2);
        // Not fatal — user can still be emailed manually if needed
        return res.status(500).json({
          warning:
            "User created and profile added, but failed to send password reset email. Check server logs.",
          details: err?.message || err2?.message || err,
        });
      }
    }

    // success
    return res.status(200).json({
      message:
        "User created, profile added, and password reset email sent (or queued).",
      user: { id: userId, email },
      profile: profileRow,
      resetResult: resetResult || null,
    });
  } catch (err) {
    console.error("invite-admin exception:", err);
    return res.status(500).json({ error: err.message || "invite failed" });
  }
}
