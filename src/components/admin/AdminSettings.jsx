// src/pages/AdminSettings.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2 } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import toast from "react-hot-toast";

export default function AdminSettings() {
  // profile
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  // about content
  const [about, setAbout] = useState({
    overview: "",
    vision: "",
    mission: "",
    coreValues: "",
  });
  const [loadingAbout, setLoadingAbout] = useState(true);
  const [savingAbout, setSavingAbout] = useState(false);

  // add admin form
  const [adminForm, setAdminForm] = useState({
    name: "",
    phoneNumber: "",
    emailAddress: "",
    role: "admin",
  });
  const [savingNewAdmin, setSavingNewAdmin] = useState(false);

  // local policies path from uploaded file (encoded)
  const policiesUrl = encodeURI(
    "/mnt/data/BALM ORTHO MEDICAL SUPPLIES - POLICIES.docx",
  );

  // ---------- Fetch profile ----------
  const fetchProfile = async () => {
    setLoadingProfile(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData?.user?.id;
      if (!userId) {
        setProfile(null);
        setLoadingProfile(false);
        return;
      }

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("fetchProfile error:", error);
        toast.error("Failed to load profile");
      } else {
        setProfile(data);
      }
    } catch (err) {
      console.error("fetchProfile exception:", err);
      toast.error("Failed to load profile");
    } finally {
      setLoadingProfile(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchAbout();
  }, []);

  // ---------- About: fetch & save ----------
  const fetchAbout = async () => {
    setLoadingAbout(true);
    try {
      // Attempt to get the about JSON from site_settings table (key = 'about')
      const { data, error } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "about")
        .single();

      if (error) {
        // If not found, initialize using defaults (don't fail loudly)
        console.warn("No about content found or fetch error:", error);
        // Keep defaults (empty) - admin can populate and save.
      } else if (data?.value) {
        const value = data.value;
        setAbout({
          overview: value.overview || "",
          vision: value.vision || "",
          mission: value.mission || "",
          coreValues: Array.isArray(value.coreValues)
            ? value.coreValues.join("\n")
            : value.coreValues || "",
        });
      }
    } catch (err) {
      console.error("fetchAbout exception:", err);
      toast.error("Failed to load About content");
    } finally {
      setLoadingAbout(false);
    }
  };

  const handleSaveAbout = async (e) => {
    e?.preventDefault();
    setSavingAbout(true);
    try {
      // prepare JSON value
      const value = {
        overview: about.overview,
        vision: about.vision,
        mission: about.mission,
        coreValues: about.coreValues
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
      };

      // Upsert into site_settings table
      const { error } = await supabase.from("site_settings").upsert({
        key: "about",
        value,
        updated_at: new Date().toISOString(),
      });

      if (error) throw error;

      toast.success("About updated", { position: "top-right" });
    } catch (err) {
      console.error("handleSaveAbout error:", err);
      toast.error("Failed to save About", { position: "top-right" });
    } finally {
      setSavingAbout(false);
    }
  };

  // ---------- Profile save ----------
  const handleSaveProfile = async (e) => {
    e?.preventDefault();
    setSavingProfile(true);
    try {
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData?.user?.id;
      if (!userId) throw new Error("No user session found");

      const updates = {
        id: userId,
        full_name: profile?.full_name || "",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;

      toast.success("Profile saved", { position: "top-right" });
      await fetchProfile();
    } catch (err) {
      console.error("handleSaveProfile error:", err);
      toast.error("Failed to save profile", { position: "top-right" });
    } finally {
      setSavingProfile(false);
    }
  };

  // ---------- Admin creation ----------
  const handleAddAdmin = async (e) => {
    e?.preventDefault();

    // basic validation
    if (!adminForm.name.trim() || !adminForm.emailAddress.trim()) {
      toast.error("Please provide name and email for the new admin");
      return;
    }

    setSavingNewAdmin(true);

    try {
      // Insert into an "admins" table as a record to later invite / create auth user server-side
      // Table suggestion: admins(name, phone, email, role, invited_by, created_at)
      const { data, error } = await supabase.from("admins").insert([
        {
          name: adminForm.name.trim(),
          phone: adminForm.phoneNumber.trim(),
          email: adminForm.emailAddress.trim(),
          role: adminForm.role,
          invited_by: profile?.id || null,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast.success(
        "Admin record created. Send invite to the email to create an account.",
        {
          position: "top-right",
        },
      );

      // reset form
      setAdminForm({
        name: "",
        phoneNumber: "",
        emailAddress: "",
        role: "admin",
      });
    } catch (err) {
      console.error("handleAddAdmin error:", err);
      toast.error("Failed to add admin", { position: "top-right" });
    } finally {
      setSavingNewAdmin(false);
    }
  };

  // ---------- UI ----------
  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {/* PROFILE */}
      <section>
        <Card className="max-w-xl">
          <CardContent>
            {loadingProfile ? (
              <div className="flex items-center justify-center h-28 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading profile...
              </div>
            ) : (
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div>
                  <Label>Full name</Label>
                  <Input
                    value={profile?.full_name || ""}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    placeholder="Your full name"
                    required
                  />
                </div>

                {/* removed avatar upload as requested */}

                <div className="flex justify-end pt-2">
                  <Button
                    type="submit"
                    className="bg-[#4eb0e3] hover:bg-[#056fb1]"
                    disabled={savingProfile}
                  >
                    {savingProfile ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
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
      </section>

      {/* ABOUT EDITOR */}
      <section>
        <h2 className="text-lg font-medium mb-3">About (site content)</h2>
        <Card className="max-w-3xl">
          <CardContent>
            {loadingAbout ? (
              <div className="flex items-center justify-center h-28 text-gray-500">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                Loading About...
              </div>
            ) : (
              <form onSubmit={handleSaveAbout} className="space-y-4">
                <div>
                  <Label>Overview</Label>
                  <textarea
                    value={about.overview}
                    onChange={(e) =>
                      setAbout({ ...about, overview: e.target.value })
                    }
                    rows={4}
                    className="w-full p-3 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none"
                    placeholder="Short company overview shown on About page / Hero"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Vision</Label>
                    <input
                      value={about.vision}
                      onChange={(e) =>
                        setAbout({ ...about, vision: e.target.value })
                      }
                      className="w-full p-2.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none"
                      placeholder="Our Vision"
                    />
                  </div>

                  <div>
                    <Label>Mission</Label>
                    <input
                      value={about.mission}
                      onChange={(e) =>
                        setAbout({ ...about, mission: e.target.value })
                      }
                      className="w-full p-2.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none"
                      placeholder="Our Mission"
                    />
                  </div>
                </div>

                <div>
                  <Label>Core values (one per line)</Label>
                  <textarea
                    value={about.coreValues}
                    onChange={(e) =>
                      setAbout({ ...about, coreValues: e.target.value })
                    }
                    rows={4}
                    className="w-full p-3 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#4eb0e3] focus:outline-none"
                    placeholder="Quality Assurance&#10;Reliability&#10;Integrity"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <a
                      href={policiesUrl}
                      download
                      className="inline-flex items-center px-4 py-2 rounded-md border border-gray-200 text-sm hover:shadow"
                    >
                      Download policies (DOCX)
                    </a>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      onClick={() => {
                        // reset to last saved values
                        fetchAbout();
                        toast("Reverted", { position: "top-right" });
                      }}
                      variant="outline"
                    >
                      Revert
                    </Button>

                    <Button
                      onClick={handleSaveAbout}
                      className="bg-[#4eb0e3] hover:bg-[#056fb1]"
                      disabled={savingAbout}
                    >
                      {savingAbout ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                          Saving...
                        </>
                      ) : (
                        "Save About"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ADD ADMIN */}
      <section>
        <h2 className="text-lg font-medium mb-3">Add a new admin</h2>

        <Card className="max-w-2xl">
          <CardContent>
            <form onSubmit={handleAddAdmin} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <Label>Phone number</Label>
                  <Input
                    value={adminForm.phoneNumber}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        phoneNumber: e.target.value,
                      })
                    }
                    placeholder="+2547XXXXXXXX"
                  />
                </div>

                <div>
                  <Label>Email address</Label>
                  <Input
                    type="email"
                    value={adminForm.emailAddress}
                    onChange={(e) =>
                      setAdminForm({
                        ...adminForm,
                        emailAddress: e.target.value,
                      })
                    }
                    placeholder="admin@example.com"
                    required
                  />
                </div>

                <div>
                  <Label>Role</Label>
                  <select
                    value={adminForm.role}
                    onChange={(e) =>
                      setAdminForm({ ...adminForm, role: e.target.value })
                    }
                    className="w-full p-2.5 rounded-md border border-gray-200 focus:ring-2 focus:ring-[#4eb0e3]"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                    <option value="support">Support</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    setAdminForm({
                      name: "",
                      phoneNumber: "",
                      emailAddress: "",
                      role: "admin",
                    })
                  }
                >
                  Reset
                </Button>

                <Button
                  type="submit"
                  className="bg-[#4eb0e3] hover:bg-[#056fb1]"
                  disabled={savingNewAdmin}
                >
                  {savingNewAdmin ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                      Adding...
                    </>
                  ) : (
                    "Add admin"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
