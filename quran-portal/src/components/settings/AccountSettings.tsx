
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { handleSignOut } from "@/lib/authUtils";

export const AccountSettings = () => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await handleSignOut(navigate);
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: force navigate to login
      navigate("/login");
    }
  };

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-xl font-semibold">Account</h2>
      <Button 
        variant="destructive" 
        onClick={handleLogout}
      >
        Sign Out
      </Button>
    </Card>
  );
};
