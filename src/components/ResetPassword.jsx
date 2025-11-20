// src/pages/ResetPassword.jsx
import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "../components/ui/button";
import BalmOrthoLogo from "../assets/BalmOrthoLogo.png";
import { Loader2, Mail } from "lucide-react";
import { supabase } from "../supabaseClient";
import { toast } from "sonner";

/**
 * Local uploaded image (toolchain will convert this local path to a served URL).
 * Use exactly as provided so your pipeline can transform it.
 */
const UPLOADED_LOGO_PATH = "/mnt/data/5866b44d-457c-490d-a53a-b998b17e8aed.png";

/* Helper that logs full errors for devs but returns a safe user message */
function translateErrorToUserMessage(err) {
  console.error("Full error (dev):", err);
  const raw = (err?.message || "").toString().toLowerCase();
  if (
    raw.includes("invalid") ||
    raw.includes("expired") ||
    raw.includes("token") ||
    raw.includes("session")
  ) {
    return "Your reset link is invalid or expired. Request a new password reset email.";
  }
  if (raw.includes("password")) {
    return "We couldn't update the password. Ensure it meets the requirements.";
  }
  if (raw.includes("unauthorized")) {
    return "Unauthorized. The reset link may be invalid. Request a new reset email.";
  }
  return "An unexpected error occurred. Please try again or request a new reset email.";
}

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const [initialized, setInitialized] = useState(false);
  const [noSessionDetected, setNoSessionDetected] = useState(false);
  const [initErrorDetails, setInitErrorDetails] = useState(null);

  // Modal for requesting new reset email
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestEmail, setRequestEmail] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const policiesUrl = encodeURI(
    "/mnt/data/BALM ORTHO MEDICAL SUPPLIES - POLICIES.docx"
  );

  useEffect(() => {
    let mounted = true;
    async function initFromUrl() {
      try {
        console.debug(
          "ResetPassword init - search:",
          location.search,
          "hash:",
          location.hash
        );

        if (
          supabase.auth &&
          typeof supabase.auth.getSessionFromUrl === "function"
        ) {
          const result = await supabase.auth.getSessionFromUrl({
            storeSession: true,
          });
          console.debug("getSessionFromUrl result:", result);

          if (result?.error) {
            console.error("getSessionFromUrl returned error:", result.error);
            if (mounted) {
              setNoSessionDetected(true);
              setInitErrorDetails(result.error);
            }
          } else {
            if (mounted) setNoSessionDetected(false);
          }
        } else {
          const raw = (location.search || "") + (location.hash || "");
          console.debug("Fallback URL check:", raw);
          if (
            raw &&
            (raw.includes("access_token") ||
              raw.includes("type=recovery") ||
              raw.includes("recovery"))
          ) {
            if (mounted) setNoSessionDetected(false);
          } else {
            if (mounted) {
              setNoSessionDetected(true);
              setInitErrorDetails({
                message: "No recovery token found in URL.",
              });
            }
          }
        }
      } catch (err) {
        console.error("initFromUrl caught error:", err);
        if (mounted) {
          setNoSessionDetected(true);
          setInitErrorDetails(err);
        }
      } finally {
        if (mounted) setInitialized(true);
      }
    }

    initFromUrl();
    return () => (mounted = false);
  }, [location]);

  const showExpiredView = initialized && noSessionDetected;

  // Normal flow: set password
  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      toast.error("Password must be at least 6 characters.", {
        position: "top-right",
      });
      return;
    }
    if (password !== confirm) {
      toast.error("Passwords do not match.", { position: "top-right" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({ password });
      console.debug("supabase.auth.updateUser:", { data, error });
      if (error) {
        toast.error(translateErrorToUserMessage(error), {
          position: "top-right",
        });
        return;
      }
      toast.success("Password updated. You can now sign in.", {
        position: "top-right",
      });
      navigate("/signin", { replace: true });
    } catch (err) {
      toast.error(translateErrorToUserMessage(err), { position: "top-right" });
    } finally {
      setLoading(false);
    }
  };

  // Send reset email (modal)
  const sendResetEmail = async (e) => {
    e?.preventDefault?.();
    if (!requestEmail || !requestEmail.includes("@")) {
      toast.error("Please enter a valid email address.", {
        position: "top-right",
      });
      return;
    }

    setRequestLoading(true);
    try {
      let res;
      if (
        supabase.auth &&
        typeof supabase.auth.resetPasswordForEmail === "function"
      ) {
        res = await supabase.auth.resetPasswordForEmail(requestEmail, {
          redirectTo: window.location.href.split("#")[0],
        });
      } else if (
        supabase.auth &&
        supabase.auth.api &&
        typeof supabase.auth.api.resetPasswordForEmail === "function"
      ) {
        res = await supabase.auth.api.resetPasswordForEmail(requestEmail);
      } else {
        throw new Error("reset_password_method_unavailable");
      }

      console.debug("resetPasswordForEmail result:", res);
      const error = res?.error || (res?.data && res?.data.error) || null;
      if (error) {
        console.error("reset email error:", error);
        toast.error(translateErrorToUserMessage(error), {
          position: "top-right",
        });
        return;
      }

      // success
      toast.success("Password reset email sent. Check your inbox.", {
        position: "top-right",
      });

      // optional: close modal state
      setShowRequestModal(false);
      setRequestEmail("");

      // go to check-email page
      navigate("/auth/check-email", { replace: true });
    } catch (err) {
      console.error("Unhandled error sending reset email:", err);
      toast.error(translateErrorToUserMessage(err), { position: "top-right" });
    } finally {
      setRequestLoading(false);
    }
  };

  // While initializing
  if (!initialized) {
    return (
      <div className="w-full flex justify-center px-4 py-8">
        <div className="w-full max-w-[320px] px-6 py-8 rounded-2xl backdrop-blur-lg bg-white/80 border border-white/30 shadow-lg text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600">Checking reset link…</p>
        </div>
      </div>
    );
  }

  // Expired/invalid link UI (no form)
  if (showExpiredView) {
    return (
      <>
        <div className="w-full flex justify-center px-4 py-8">
          <div className="w-full max-w-[360px] px-6 py-8 rounded-2xl bg-white/95 border border-gray-100 shadow-lg text-center">
            <img
              src={BalmOrthoLogo || UPLOADED_LOGO_PATH}
              alt="Balm Ortho Logo"
              className="h-[64px] mb-4 mx-auto"
              onError={(e) => {
                if (e?.currentTarget?.src !== UPLOADED_LOGO_PATH)
                  e.currentTarget.src = UPLOADED_LOGO_PATH;
              }}
            />

            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              Reset link expired or invalid
            </h2>

            <div className="p-3 text-sm bg-yellow-50 border border-yellow-100 text-yellow-800 rounded mb-4">
              The password reset link appears to be expired or invalid. For
              security reasons you cannot set a new password from this link.
            </div>

            <p className="text-sm text-gray-600 mb-4">
              Request a new password reset email below.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-1.5 text-sm bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-medium rounded-md transition-all"
              >
                Request new reset email
              </Button>

              <a
                href="/signin"
                className="text-sm text-gray-600 hover:underline"
              >
                Back to sign in
              </a>
            </div>
          </div>
        </div>

        {showRequestModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm bg-white rounded-lg shadow-lg p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold">
                  Request password reset
                </h3>
                <button
                  aria-label="Close"
                  onClick={() => setShowRequestModal(false)}
                  className="text-gray-500 hover:text-gray-700 rounded-full p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={sendResetEmail} className="space-y-3">
                <label className="block text-xs text-gray-600 mb-1">
                  Email
                </label>

                <div className="relative">
                  <input
                    type="email"
                    value={requestEmail}
                    onChange={(e) => setRequestEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    autoComplete="email"
                    className="w-full pr-10 p-2.5 text-sm rounded-md border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none"
                  />

                  <div className="absolute right-2 top-1/2 -translate-y-1/2 bg-white rounded-md p-2 border border-gray-200">
                    <Mail className="w-4 h-4 text-gray-500" />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    type="submit"
                    disabled={requestLoading}
                    className="flex-1 py-1.5 text-sm bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-medium rounded-md transition-all"
                  >
                    {requestLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
                    ) : (
                      "Send reset"
                    )}
                  </Button>

                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="flex-1 py-1.5 text-sm border border-gray-200 text-gray-700 rounded-md cursor-pointer hover:border-black transition duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  }

  // Normal form (valid reset session detected)
  return (
    <div className="w-full flex justify-center px-4 py-8">
      <form
        onSubmit={handleSetPassword}
        className="w-full max-w-[320px] px-5 py-6 rounded-2xl backdrop-blur-lg bg-white/70 border border-white/30 shadow-lg sm:px-6 sm:py-8"
      >
        <div className="flex flex-col items-center">
          <img
            src={BalmOrthoLogo || UPLOADED_LOGO_PATH}
            alt="Balm Ortho logo"
            className="h-[64px] mb-3"
            onError={(e) => {
              if (e?.currentTarget?.src !== UPLOADED_LOGO_PATH)
                e.currentTarget.src = UPLOADED_LOGO_PATH;
            }}
          />
          <h2 className="font-bold text-xl text-gray-800 mb-3">
            Set a new password
          </h2>
        </div>

        <div className="flex flex-col space-y-3">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm"
            placeholder="New password (min 6 chars)"
            type="password"
            required
            minLength={6}
            name="new-password"
            autoComplete="new-password"
          />

          <input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="p-2.5 rounded-md border border-gray-300 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none bg-white/80 placeholder-gray-500 text-gray-800 text-sm"
            placeholder="Confirm new password"
            type="password"
            required
            minLength={6}
            name="new-password-confirm"
            autoComplete="new-password"
          />

          <Button
            type="submit"
            disabled={loading}
            className="mt-1 w-full py-1.5 text-sm bg-[#4eb0e3] hover:bg-[#3ca0d4] text-white font-medium rounded-md transition-all"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2 inline-block" />
            ) : (
              "Set new password"
            )}
          </Button>

          <p className="text-xs text-gray-500 text-center">
            After resetting you will be redirected to sign in.
          </p>

          <div className="flex items-center justify-center gap-3 mt-2">
            <a href="/signin" className="text-xs text-gray-500 hover:underline">
              Back to sign in
            </a>
          </div>
        </div>
      </form>
    </div>
  );
}
