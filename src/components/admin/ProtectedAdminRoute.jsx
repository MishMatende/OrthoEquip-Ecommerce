import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { UserAuth } from "../../context/AuthContext";

export default function ProtectedAdminRoute({ children }) {
  const { session, loadingAuth, userProfile, loadingProfile } = UserAuth();

  if (loadingAuth || loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#4eb0e3]" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/signin" replace />;
  }

  if (!userProfile?.is_admin) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
