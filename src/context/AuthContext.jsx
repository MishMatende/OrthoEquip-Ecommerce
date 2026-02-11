// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const navigate = useNavigate();

  /* -------------------- SIGN UP -------------------- */
  const signupNewUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signUp({ email, password });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch {
      return { success: false, error: "NETWORK_ERROR" };
    }
  };

  /* -------------------- SIGN IN -------------------- */
  const signinUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        // Normalize known Supabase error messages
        const message = error.message?.toLowerCase() || "";

        if (message.includes("invalid login credentials")) {
          return { success: false, code: "INVALID_CREDENTIALS" };
        }

        if (message.includes("email not confirmed")) {
          return { success: false, code: "EMAIL_NOT_CONFIRMED" };
        }

        return { success: false, code: "UNKNOWN", raw: error.message };
      }

      return { success: true, data };
    } catch {
      return { success: false, code: "NETWORK_ERROR" };
    }
  };

  /* -------------------- FETCH PROFILE -------------------- */
  const fetchUserProfile = async (userId) => {
    if (!userId) {
      setUserProfile(null);
      setLoadingProfile(false);
      return null;
    }

    setLoadingProfile(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin, phone, username")
        .eq("id", userId)
        .single();

      if (error) {
        if (
          error.message?.toLowerCase().includes("fetch") ||
          error.message?.toLowerCase().includes("network")
        ) {
          throw new TypeError("Network error while fetching profile");
        }

        console.error("Fetch profile error:", error);
        setUserProfile(null);
        return null;
      }

      setUserProfile(data);

      /* 🔔 Require phone AND username (non-admins only) */
      const needsProfileCompletion =
        (!data.phone || !data.username) &&
        !data.is_admin &&
        !sessionStorage.getItem("profileModalShown");

      if (needsProfileCompletion) {
        sessionStorage.setItem("profileModalShown", "true");
        setShowPhoneModal(true);
      }

      return data;
    } catch (err) {
      console.error("fetchUserProfile failed:", err);
      setUserProfile(null);
      return null;
    } finally {
      setLoadingProfile(false);
    }
  };

  /* -------------------- SESSION HANDLING -------------------- */
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session: initialSession },
          error,
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("Get session error:", error);
        }

        setSession(initialSession);

        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        } else {
          setUserProfile(null);
          setLoadingProfile(false);
        }
      } catch (err) {
        console.error("Get session crash:", err);
        setSession(null);
        setUserProfile(null);
        setLoadingProfile(false);
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);

        if (newSession?.user) {
          const profile = await fetchUserProfile(newSession.user.id);

          if (event === "SIGNED_IN" && profile?.is_admin) {
            navigate("/admin");
          }
        } else {
          setUserProfile(null);
          setShowPhoneModal(false);
          sessionStorage.removeItem("profileModalShown");
          setLoadingProfile(false);
        }

        setLoadingAuth(false);
      },
    );

    return () => {
      mounted = false;
      try {
        if (data?.subscription?.unsubscribe) {
          data.subscription.unsubscribe();
        } else if (typeof data?.unsubscribe === "function") {
          data.unsubscribe();
        }
      } catch {}
    };
  }, [navigate]);

  /* -------------------- SIGN OUT -------------------- */
  const signoutUser = async () => {
    try {
      // instant UI feedback
      setSession(null);
      setUserProfile(null);
      setShowPhoneModal(false);
      setLoadingProfile(false);
      sessionStorage.removeItem("profileModalShown");

      await supabase.auth.signOut();
      return { ok: true };
    } catch (err) {
      console.error("Sign out failed:", err);
      return { ok: false, error: err.message };
    }
  };

  /* -------------------- FORGOT PASSWORD -------------------- */
  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("FORGOT PASSWORD CRASH:", err);
      return { success: false, error: "Unexpected error occurred" };
    }
  };

  /* -------------------- UPDATE PASSWORD -------------------- */
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch {
      return { success: false, error: "NETWORK_ERROR" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loadingAuth,
        userProfile,
        loadingProfile,
        showPhoneModal,
        setShowPhoneModal,
        signupNewUser,
        signinUser,
        signoutUser,
        forgotPassword,
        updatePassword,
        fetchUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
