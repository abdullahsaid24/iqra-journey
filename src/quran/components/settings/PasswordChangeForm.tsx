import { useState } from "react";
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Label } from "@/quran/components/ui/label";
import { Card } from "@/quran/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/quran/lib/supabase";

export const PasswordChangeForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Change Password</h2>
          <p className="text-sm text-slate-500">Update your account password.</p>
        </div>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-slate-700">Current Password</Label>
            <Input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-white border-slate-200 focus:ring-quran-primary input-placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-slate-700">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-white border-slate-200 focus:ring-quran-primary input-placeholder:text-slate-400"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-slate-700">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-white border-slate-200 focus:ring-quran-primary input-placeholder:text-slate-400"
            />
          </div>
          <div className="pt-2">
            <Button onClick={handlePasswordChange} className="bg-quran-primary hover:bg-quran-primary/90 text-white">
              Update Password
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
};
