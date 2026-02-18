import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { UserAuth } from "../../context/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { session, loadingAuth, userProfile, loadingProfile } = UserAuth();

  // 1. Still checking auth session (safe to show loader)
  if (loadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4eb0e3]" />
      </div>
    );
  }

  // 2. Auth finished, but no session => redirect immediately
  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  // 3. We have a session, but profile is still loading
  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4eb0e3]" />
      </div>
    );
  }

  // 4. Session exists, but profile is missing or not admin
  if (!userProfile || userProfile.is_admin !== true) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
