// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loadingAuth, setLoadingAuth] = useState(true);

  const [userProfile, setUserProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [showPhoneModal, setShowPhoneModal] = useState(false);

  const navigate = useNavigate();

  // prevents double profile fetch race conditions
  const profileFetchLock = useRef(false);

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

    // prevents multiple fetch calls stacking
    if (profileFetchLock.current) return userProfile;

    profileFetchLock.current = true;
    setLoadingProfile(true);

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin, phone, username")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("[fetchUserProfile] error:", error);
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
      console.error("[fetchUserProfile] crash:", err);
      setUserProfile(null);
      return null;
    } finally {
      profileFetchLock.current = false;
      setLoadingProfile(false);
    }
  };

  /* -------------------- SESSION HANDLING -------------------- */
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      setLoadingAuth(true);

      try {
        const { data, error } = await supabase.auth.getSession();

        if (!mounted) return;

        if (error) {
          console.error("[AuthContext] getSession error:", error);
        }

        const initialSession = data?.session || null;
        setSession(initialSession);

        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        } else {
          setUserProfile(null);
          setLoadingProfile(false);
        }
      } catch (err) {
        console.error("[AuthContext] getSession crash:", err);
        setSession(null);
        setUserProfile(null);
        setLoadingProfile(false);
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    }

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        console.log("[AuthContext] Auth event:", event);

        // important: show loading during refresh events
        setSession(newSession);
        setLoadingAuth(false);

        if (newSession?.user) {
          fetchUserProfile(newSession.user.id);
        }
      },
    );

    return () => {
      mounted = false;
      authListener?.subscription?.unsubscribe();
    };
  }, [navigate]);

  /* -------------------- SIGN OUT -------------------- */
  const signoutUser = async () => {
    try {
      setLoadingAuth(true);

      // instant UI feedback
      setSession(null);
      setUserProfile(null);
      setShowPhoneModal(false);
      setLoadingProfile(false);
      sessionStorage.removeItem("profileModalShown");

      await supabase.auth.signOut();

      setLoadingAuth(false);
      return { ok: true };
    } catch (err) {
      console.error("Sign out failed:", err);
      setLoadingAuth(false);
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
