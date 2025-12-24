import { UserAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";

export default function PhoneRequiredModal() {
  const { showPhoneModal, setShowPhoneModal } = UserAuth();
  const navigate = useNavigate();

  if (!showPhoneModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md space-y-4">
        <h2 className="text-xl font-bold">Phone number required</h2>

        <p className="text-sm text-gray-600">
          Please add your phone number and/or username to your profile so we can
          contact you about orders and quotations.
        </p>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowPhoneModal(false)}>
            Later
          </Button>

          <Button
            onClick={() => {
              setShowPhoneModal(false);
              navigate("/profile");
            }}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
