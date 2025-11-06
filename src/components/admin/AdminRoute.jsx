import { Navigate } from "react-router-dom";
import { UserAuth } from "../../context/AuthContext";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }) {
  const { session, userProfile, loadingAuth } = UserAuth();

  if (loadingAuth || !userProfile) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Loading...
      </div>
    );
  }

  if (!session || !userProfile?.is_admin) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}
