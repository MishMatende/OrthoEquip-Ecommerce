import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);
  const [loadingAuth, setLoadingAuth] = useState(true);

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
      return { success: true, data };
    } catch (error) {
      console.error("An unexpected error occurred:", error);
    }
  };

  // Load session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoadingAuth(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setLoadingAuth(false);
      }
    );

    return () => listener.subscription.unsubscribe();
  }, []);

  // Sign out
  const signoutUser = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error("There was an error signing out:", error);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        loadingAuth,
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
