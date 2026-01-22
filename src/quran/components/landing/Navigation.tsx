
import { Button } from "@/quran/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { handleSignOut } from "@/quran/lib/authUtils";

interface NavigationProps {
  isAuthenticated: boolean;
  onSignOut: () => Promise<void>;
}

export const Navigation = ({ isAuthenticated, onSignOut }: NavigationProps) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      // Call the parent onSignOut for any component-specific cleanup
      await onSignOut();

      // Then use the centralized logout handler
      await handleSignOut(navigate);
    } catch (error) {
      console.error("Logout failed:", error);
      // Fallback: force navigate to login
      navigate("/quran/login");
    }
  };

  return (
    <nav className="absolute top-0 left-0 right-0 p-4 md:p-6">
      <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <Link to="/quran" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2">
            <div className="flex items-center justify-center w-8 h-8 md:w-10 md:h-10 bg-gradient-to-br from-quran-primary to-quran-secondary rounded-lg">
              <span className="text-lg md:text-xl font-bold text-white font-arabic">اقرأ</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-xl md:text-2xl font-bold text-white font-outfit">
              Iqra Dugsi
            </span>
            <span className="text-xs md:text-sm text-white/80 font-outfit uppercase tracking-widest">
              Quran Tracking
            </span>
          </div>
        </Link>
        {isAuthenticated ? (
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/quran/dashboard">
              <Button variant="outline" className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-quran-bg">
                Dashboard
              </Button>
            </Link>
            <Button
              variant="outline"
              className="w-full sm:w-auto text-white border-white hover:bg-white hover:text-quran-bg"
              onClick={handleLogout}
            >
              Sign Out
            </Button>
          </div>
        ) : null}
      </div>
    </nav>
  );
};
