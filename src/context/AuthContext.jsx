// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
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
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      if (
        err instanceof TypeError ||
        err?.message?.toLowerCase().includes("network")
      ) {
        return { success: false, error: "NETWORK_ERROR" };
      }

      return { success: false, error: "Unexpected error occurred" };
    }
  };

  /* -------------------- FETCH PROFILE -------------------- */
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;

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
      throw err;
    }
  };

  /* -------------------- SESSION HANDLING -------------------- */
  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        setSession(initialSession);

        if (initialSession?.user) {
          await fetchUserProfile(initialSession.user.id);
        }
      } catch (err) {
        console.error("Get session error:", err);
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    };

    loadSession();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
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
        }

        setLoadingAuth(false);
      }
    );

    return () => {
      mounted = false;
      try {
        if (data?.subscription?.unsubscribe) data.subscription.unsubscribe();
        else if (typeof data?.unsubscribe === "function") data.unsubscribe();
      } catch {}
    };
  }, [navigate]);

  /* -------------------- SIGN OUT -------------------- */
  const signoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        return { ok: false, error: error.message };
      }

      setUserProfile(null);
      setSession(null);
      setShowPhoneModal(false);
      sessionStorage.removeItem("profileModalShown");

      return { ok: true };
    } catch {
      return { ok: false, error: "NETWORK_ERROR" };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loadingAuth,
        userProfile,
        showPhoneModal,
        setShowPhoneModal,
        signupNewUser,
        signinUser,
        signoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
