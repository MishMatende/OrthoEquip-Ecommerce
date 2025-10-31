import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [session, setSession] = useState(undefined);

  // Sign up
  const signupNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({
      email: email,
      password: password,
    });

    if (error) {
      console.error("there was a problem signing up: ", error);
      return { success: false, error };
    }
    return { success: true, data };
  };

  //Sign in
  const signinUser = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });
      if (error) {
        console.error("sign-in error occured: ", error);
        return { success: false, error: error.mesage };
      }
      return { success: true, data };
    } catch (error) {
      console.error("an error occured: ", error);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
  }, []);

  //Sign out
  const signoutUser = () => {
    const { error } = supabase.auth.signOut();
    if (error) {
      console.error("there was an error: ", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{ session, signupNewUser, signinUser, signoutUser }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => {
  {
    return useContext(AuthContext);
  }
};
