import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { useNavigate } from "react-router-dom";

// ✅ Move this OUTSIDE the component — global scope
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

      // Fetch user profile after sign-in
      await fetchUserProfile(data.session?.user?.id);

      return { success: true, data };
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  // Fetch user profile
  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, is_admin")
      .eq("id", userId)
      .single();

    if (error) console.error("Error fetching profile:", error);
    else setUserProfile(data);
  };

  // Listen for session changes
  // inside AuthContextProvider (replace the existing listener code + signoutUser)

  useEffect(() => {
    async function loadSession() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setSession(session);

      if (session?.user) await fetchUserProfile(session.user.id);

      setLoadingAuth(false);
    }

    loadSession();

    // updated listener shape (works with supabase-js v2)
    const { data } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);

        if (session?.user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("id, email, is_admin")
            .eq("id", session.user.id)
            .single();

          setUserProfile(profile);

          if (_event === "SIGNED_IN") {
            if (profile?.is_admin) navigate("/admin");
            else navigate("/");
          }
        } else {
          setUserProfile(null);
        }

        setLoadingAuth(false);
      }
    );

    // unsubscribe safely
    return () => {
      try {
        if (data?.subscription?.unsubscribe) data.subscription.unsubscribe();
        else if (data?.unsubscribe) data.unsubscribe();
      } catch (e) {
        // ignore
      }
    };
  }, [navigate]);

  // sign out — DO NOT navigate here; let callers decide
  const signoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("There was an error signing out:", error);
      throw error;
    }
    setUserProfile(null);
    setSession(null);
    // do NOT call navigate here — caller should redirect after successful sign out
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

// ✅ Export the hook AFTER the context is defined
export const UserAuth = () => useContext(AuthContext);
