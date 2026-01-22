
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-quran-bg to-quran-light">
      <div className="text-center bg-white/10 backdrop-blur-sm p-8 rounded-xl border border-white/20 shadow-xl">
        <h1 className="text-4xl font-bold mb-4 text-white">404</h1>
        <p className="text-xl text-white/90 mb-6">Oops! Page not found</p>
        <Link to="/" className="inline-block bg-white px-4 py-2 rounded text-quran-primary hover:bg-white/90 transition-colors">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
