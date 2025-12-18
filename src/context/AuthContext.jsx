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

  // Sign up
  const signupNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("There was a problem signing up:", error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  // Sign in
  const signinUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        console.error("Sign-in error occurred:", error);
        return { success: false, error: error.message };
      }

      // Attempt to fetch profile after sign in
      if (data?.session?.user?.id) {
        await fetchUserProfile(data.session.user.id);
      }

      return { success: true, data };
    } catch (error) {
      console.error("An unexpected error occurred during signin:", error);
      return { success: false, error };
    }
  };

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    if (!userId) return null;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, email, is_admin")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
        return null;
      } else {
        setUserProfile(data);
        return data;
      }
    } catch (err) {
      console.error("fetchUserProfile failed:", err);
      return null;
    }
  };

  // Load initial session + subscribe to changes
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
      } catch (e) {
        console.error("Error getting session:", e);
      } finally {
        if (mounted) setLoadingAuth(false);
      }
    }

    loadSession();

    // Subscribe to auth changes (works with supabase-js v2 shapes)
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        try {
          setSession(newSession);

          if (newSession?.user) {
            const profile = await fetchUserProfile(newSession.user.id);
            // optional redirect on sign-in if admin
            if (_event === "SIGNED_IN" && profile?.is_admin) {
              navigate("/admin");
            }
          } else {
            // signed out
            setUserProfile(null);
          }
        } catch (err) {
          console.error("onAuthStateChange handler error:", err);
        } finally {
          setLoadingAuth(false);
        }
      }
    );

    return () => {
      mounted = false;
      // unsubscribe guard for both possible shapes
      try {
        if (data?.subscription?.unsubscribe) data.subscription.unsubscribe();
        else if (typeof data?.unsubscribe === "function") data.unsubscribe();
      } catch (err) {
        // swallow unsubscribe errors
      }
    };
  }, [navigate]);

  // sign out — returns { ok: true } or { ok: false, error }
  const signoutUser = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("There was an error signing out:", error);
        return { ok: false, error };
      }
      // local clear
      setUserProfile(null);
      setSession(null);
      return { ok: true };
    } catch (err) {
      console.error("signoutUser unexpected error:", err);
      return { ok: false, error: err };
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
        signoutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
