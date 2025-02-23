
import { Link } from "react-router-dom";
import { Phone, Mail, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-muted mt-20">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="font-outfit text-lg font-medium">Iqra Dugsi</h3>
            <p className="text-sm text-muted-foreground">
              Dedicated to teaching students of all ages the Quran, Islamic studies, and Arabic reading skills.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-outfit text-sm font-medium">Quick Links</h4>
            <div className="space-y-2">
              {[
                ["Home", "/"],
                ["About Us", "/about"],
                ["Classes", "/classes"],
                ["Contact", "/contact"],
              ].map(([title, url]) => (
                <Link
                  key={title}
                  to={url}
                  className="block text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  {title}
                </Link>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-outfit text-sm font-medium">Contact Info</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                (555) 123-4567
              </p>
              <p className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                info@iqradugsi.com
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                123 Islamic Center St
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-outfit text-sm font-medium">Office Hours</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Monday - Thursday: 9 AM - 9 PM</p>
              <p>Friday: 3 PM - 9 PM</p>
              <p>Saturday - Sunday: 1 PM - 5 PM</p>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Iqra Dugsi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
