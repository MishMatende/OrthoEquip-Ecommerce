import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabaseClient";
import { UserAuth } from "../../context/AuthContext";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import toast from "react-hot-toast";

export default function Profile() {
  const { userProfile } = UserAuth();

  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [saving, setSaving] = useState(false);
  const [shake, setShake] = useState(false);

  /* ---------------- PREFILL FROM PROFILE ---------------- */
  useEffect(() => {
    if (!userProfile) return;

    if (userProfile.phone) {
      setPhone(userProfile.phone);
    }

    if (userProfile.username) {
      const parts = userProfile.username.split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
    }
  }, [userProfile]);

  /* ---------------- VALIDATION ---------------- */
  const isValidPhone = (value) => /^2547\d{8}$/.test(value);
  const isValidName = (value) =>
    value.trim().length >= 2 && /^[a-zA-Z\s'-]+$/.test(value);

  const firstNameError =
    firstName && !isValidName(firstName)
      ? "Enter a valid first name (min 2 letters)"
      : "";

  const lastNameError =
    lastName && !isValidName(lastName)
      ? "Enter a valid last name (min 2 letters)"
      : "";

  const phoneError =
    phone && !isValidPhone(phone)
      ? "Phone must be in the format 2547XXXXXXXX"
      : "";

  const isFormValid = useMemo(
    () =>
      isValidName(firstName) && isValidName(lastName) && isValidPhone(phone),
    [firstName, lastName, phone],
  );

  /* ---------------- SAVE PROFILE ---------------- */
  async function saveProfile() {
    if (!isFormValid) {
      setShake(true);
      setTimeout(() => setShake(false), 400);
      return;
    }

    const username = `${firstName.trim()} ${lastName.trim()}`;

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        phone,
        username,
      })
      .eq("id", userProfile.id);

    if (error) {
      console.error(error);
      toast.error("Failed to save profile");
    } else {
      toast.success("Profile updated successfully");
    }

    setSaving(false);
  }

  /* ---------------- UI ---------------- */
  return (
    <>
      {/* Shake animation keyframes */}
      <style>
        {`
          @keyframes shake {
            0% { transform: translateX(0); }
            25% { transform: translateX(-5px); }
            50% { transform: translateX(5px); }
            75% { transform: translateX(-5px); }
            100% { transform: translateX(0); }
          }
        `}
      </style>

      <div
        className={`max-w-md mx-auto space-y-6 ${
          shake ? "animate-[shake_0.4s_ease-in-out]" : ""
        }`}
      >
        <h1 className="text-xl font-bold">My Profile</h1>

        {/* First Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <label className="text-sm font-medium text-muted-foreground md:pt-2">
            First Name
          </label>
          <div className="md:col-span-2 space-y-1">
            <Input
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
            {firstNameError && (
              <p className="text-xs text-red-500">{firstNameError}</p>
            )}
          </div>
        </div>

        {/* Last Name */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <label className="text-sm font-medium text-muted-foreground md:pt-2">
            Last Name
          </label>
          <div className="md:col-span-2 space-y-1">
            <Input
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
            {lastNameError && (
              <p className="text-xs text-red-500">{lastNameError}</p>
            )}
          </div>
        </div>

        {/* Phone */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
          <label className="text-sm font-medium text-muted-foreground md:pt-2">
            Phone
          </label>
          <div className="md:col-span-2 space-y-1">
            <Input
              placeholder="2547XXXXXXXX"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
          </div>
        </div>

        <div className="pt-4">
          <Button
            variant="solid"
            onClick={saveProfile}
            disabled={saving}
            className="w-full"
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </>
  );
}
