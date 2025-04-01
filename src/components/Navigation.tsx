
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isScrolled ? "bg-background/80 backdrop-blur-lg shadow-sm" : ""
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-xl font-outfit font-medium">
            Iqra Dugsi
          </Link>
          
          <div className="hidden md:flex space-x-8">
            {[
              ["Home", "/"],
              ["About", "/about"],
              ["Classes", "/classes"],
              ["Sign Up", "/signup"],
              ["Quran Portal", "https://quranprogress.ca/"],
            ].map(([title, url]) => (
              url.startsWith('http') ? (
                <a
                  key={title}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="nav-link"
                >
                  {title}
                </a>
              ) : (
                <Link
                  key={title}
                  to={url}
                  className={`nav-link ${
                    location.pathname === url ? "text-primary font-medium" : ""
                  }`}
                >
                  {title}
                </Link>
              )
            ))}
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-background/95 backdrop-blur-lg border-t">
          <div className="container mx-auto px-4 py-4 space-y-4">
            {[
              ["Home", "/"],
              ["About", "/about"],
              ["Classes", "/classes"],
              ["Sign Up", "/signup"],
              ["Quran Portal", "https://quranprogress.ca/"],
            ].map(([title, url]) => (
              url.startsWith('http') ? (
                <a
                  key={title}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2"
                >
                  {title}
                </a>
              ) : (
                <Link
                  key={title}
                  to={url}
                  className={`block py-2 ${
                    location.pathname === url ? "text-primary font-medium" : ""
                  }`}
                >
                  {title}
                </Link>
              )
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
