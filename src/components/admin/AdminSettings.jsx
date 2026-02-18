import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient"; // adjust path if needed
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Card, CardContent } from "../components/ui/card";
import { Loader2, UserPlus, User } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminSettings() {
  /* =========================
     PROFILE STATE
  ========================= */
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    phone: "",
  });

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  /* =========================
     ADD ADMIN STATE
  ========================= */
  const [adminForm, setAdminForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [savingAdmin, setSavingAdmin] = useState(false);

  /* =========================
     FETCH PROFILE
  ========================= */
  async function fetchProfile() {
    setLoadingProfile(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("No session user found");

      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, phone")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;

      const username = data?.username || "";

      const parts = username.trim().split(" ");
      const firstName = parts[0] || "";
      const lastName = parts.slice(1).join(" ") || "";

      setProfile({
        first_name: firstName,
        last_name: lastName,
        phone: data?.phone || "",
      });
    } catch (err) {
      console.error("[fetchProfile] error:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    fetchProfile();
  }, []);

  /* =========================
     SAVE PROFILE
  ========================= */
  async function handleSaveProfile(e) {
    e.preventDefault();
    setSavingProfile(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const userId = authData?.user?.id;
      if (!userId) throw new Error("No session user found");

      const username =
        `${profile.first_name.trim()} ${profile.last_name.trim()}`.trim();

      if (!username) {
        toast.error("Please enter first and last name");
        setSavingProfile(false);
        return;
      }

      const updates = {
        id: userId,
        username,
        phone: profile.phone.trim(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);

      if (error) throw error;

      toast.success("Profile updated successfully");
      fetchProfile();
    } catch (err) {
      console.error("[handleSaveProfile] error:", err);
      toast.error("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  /* =========================
     ADD ADMIN
  ========================= */
  async function handleAddAdmin(e) {
    e.preventDefault();

    if (!adminForm.name.trim() || !adminForm.email.trim()) {
      toast.error("Full name and email are required");
      return;
    }

    setSavingAdmin(true);

    try {
      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      const invitedBy = authData?.user?.id;

      const payload = {
        name: adminForm.name.trim(),
        email: adminForm.email.trim().toLowerCase(),
        phone: adminForm.phone.trim(),
        role: "admin", // behind the scenes
        invited_by: invitedBy,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("admins").insert([payload]);

      if (error) throw error;

      toast.success("New admin added successfully");

      setAdminForm({
        name: "",
        email: "",
        phone: "",
      });
    } catch (err) {
      console.error("[handleAddAdmin] error:", err);
      toast.error("Failed to add admin");
    } finally {
      setSavingAdmin(false);
    }
  }

  /* =========================
     UI
  ========================= */
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
      <div className="flex items-center gap-2">
        <User className="w-6 h-6 text-gray-700" />
        <h1 className="text-2xl font-bold text-gray-900">Admin Settings</h1>
      </div>

      {/* ================= PROFILE CARD ================= */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-900">Your Profile</h2>

          {loadingProfile ? (
            <div className="flex items-center justify-center h-28 text-gray-500">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading profile...
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>First name</Label>
                  <Input
                    value={profile.first_name}
                    onChange={(e) =>
                      setProfile({ ...profile, first_name: e.target.value })
                    }
                    placeholder="John"
                    required
                  />
                </div>

                <div>
                  <Label>Last name</Label>
                  <Input
                    value={profile.last_name}
                    onChange={(e) =>
                      setProfile({ ...profile, last_name: e.target.value })
                    }
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Phone number</Label>
                <Input
                  value={profile.phone}
                  onChange={(e) =>
                    setProfile({ ...profile, phone: e.target.value })
                  }
                  placeholder="+2547XXXXXXXX"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-[#4eb0e3] hover:bg-[#056fb1] rounded-xl"
                  disabled={savingProfile}
                >
                  {savingProfile ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Saving...
                    </>
                  ) : (
                    "Save Profile"
                  )}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* ================= ADD ADMIN CARD ================= */}
      <Card className="rounded-2xl shadow-sm">
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">
              Add New Admin
            </h2>
          </div>

          <p className="text-sm text-gray-500">
            Add a new admin to the system. Role is automatically assigned.
          </p>

          <form onSubmit={handleAddAdmin} className="space-y-5">
            <div>
              <Label>Full name</Label>
              <Input
                value={adminForm.name}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, name: e.target.value })
                }
                placeholder="Jane Doe"
                required
              />
            </div>

            <div>
              <Label>Email address</Label>
              <Input
                type="email"
                value={adminForm.email}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, email: e.target.value })
                }
                placeholder="admin@example.com"
                required
              />
            </div>

            <div>
              <Label>Phone number</Label>
              <Input
                value={adminForm.phone}
                onChange={(e) =>
                  setAdminForm({ ...adminForm, phone: e.target.value })
                }
                placeholder="+2547XXXXXXXX"
              />
            </div>

            <div className="flex justify-end">
              <Button
                type="submit"
                className="bg-[#4eb0e3] hover:bg-[#056fb1] rounded-xl"
                disabled={savingAdmin}
              >
                {savingAdmin ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding...
                  </>
                ) : (
                  "Add Admin"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
