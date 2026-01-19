
import { Button } from "@/quran/components/ui/button";
import { Card } from "@/quran/components/ui/card";
import { useNavigate } from "react-router-dom";
import { handleSignOut } from "@/quran/lib/authUtils";

export const AccountSettings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await handleSignOut(navigate);
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/quran/login");
    }
  };

  return (
    <Card className="p-6 bg-white border-slate-200 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Account</h2>
          <p className="text-sm text-slate-500">Manage your account settings and preferences.</p>
        </div>

        <div className="pt-4 border-t border-slate-100">
          <Button
            variant="destructive"
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </Card>
  );
};
