// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const navigate = useNavigate();

  /* -------------------- SIGN UP -------------------- */
  const signupNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("Signup error:", error);
      return { success: false, error: error.message };
    }
    return { success: true, data };
  };

  /* -------------------- SIGN IN -------------------- */
  const signinUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Signin error:", error);
        return { success: false, error: error.message };
      }

      if (data?.session?.user?.id) {
        await fetchUserProfile(data.session.user.id);
      }

      return { success: true, data };
    } catch (err) {
      console.error("Signin unexpected error:", err);
      return { success: false, error: err.message };
    }
  };

  /* -------------------- FORGOT PASSWORD -------------------- */
  const forgotPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) {
        console.error("Forgot password error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("Forgot password unexpected error:", err);
      return { success: false, error: err.message };
    }
  };

  /* -------------------- UPDATE PASSWORD -------------------- */
  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        console.error("Update password error:", error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error("Update password unexpected error:", err);
      return { success: false, error: err.message };
    }
  };

  /* -------------------- FETCH PROFILE -------------------- */
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Fetch profile error:", error);
        return null;
      }

      setUserProfile(data);
      return data;
    } catch (err) {
      console.error("fetchUserProfile failed:", err);
      return null;
    }
  };

  /* -------------------- SESSION HANDLING -------------------- */
  useEffect(() => {
    let mounted = true;

    async function loadSession() {
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
    }

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
        console.error("Signout error:", error);
        return { ok: false, error: error.message };
      }

      setUserProfile(null);
      setSession(null);
      return { ok: true };
    } catch (err) {
      console.error("Signout unexpected error:", err);
      return { ok: false, error: err.message };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loadingAuth,
        userProfile,
        signupNewUser,
        signinUser,
        forgotPassword,
        updatePassword,
        signoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
