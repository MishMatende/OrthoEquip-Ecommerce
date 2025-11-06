import { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { Loader2, Upload } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Card, CardContent } from "../../components/ui/card";
import { toast } from "sonner";

export default function AdminSettings() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);

  const user = supabase.auth.getUser();

  // Fetch current profile
  const fetchProfile = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getUser();
    const userId = sessionData?.user?.id;
    if (!userId) return;

    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) console.error(error);
    else setProfile(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const uploadAvatar = async () => {
    if (!avatarFile) return profile.avatar_url;
    const fileExt = avatarFile.name.split(".").pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;
    const { error } = await supabase.storage
      .from("avatars")
      .upload(filePath, avatarFile);

    if (error) throw error;

    const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const avatar_url = await uploadAvatar();
      const { data: sessionData } = await supabase.auth.getUser();
      const userId = sessionData?.user?.id;
      const updates = {
        id: userId,
        full_name: profile.full_name,
        avatar_url,
        updated_at: new Date(),
      };
      const { error } = await supabase.from("profiles").upsert(updates);
      if (error) throw error;
      toast.success("Profile updated!");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {loading ? (
        <div className="flex justify-center items-center h-32 text-gray-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          Loading profile...
        </div>
      ) : (
        <Card className="max-w-xl">
          <CardContent>
            <form onSubmit={handleSave} className="space-y-4 mt-4">
              <div>
                <Label>Full Name</Label>
                <Input
                  value={profile?.full_name || ""}
                  onChange={(e) =>
                    setProfile({ ...profile, full_name: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label>Avatar</Label>
                <div className="flex items-center gap-3 mt-1">
                  <label className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200">
                    <Upload size={16} />
                    <span>Select Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setAvatarFile(e.target.files[0])}
                      className="hidden"
                    />
                  </label>
                  {avatarFile ? (
                    <span className="text-sm text-gray-600">
                      {avatarFile.name}
                    </span>
                  ) : (
                    profile?.avatar_url && (
                      <img
                        src={profile.avatar_url}
                        alt="avatar"
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    )
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <Button
                  type="submit"
                  className="bg-[#0680cd] hover:bg-[#056fb1]"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
