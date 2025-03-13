
import { Routes, Route } from "react-router-dom";
import "./App.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

// Import your pages
import Index from "@/pages/Index";
import About from "@/pages/About";
import Classes from "@/pages/Classes";
import NotFound from "@/pages/NotFound";
import Signup from "@/pages/Signup";
import Success from "@/pages/Success";
import Admin from "@/pages/Admin";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<NotFound />} />
      </Routes>

      <Toaster />
      <Sonner />
    </>
  );
}

export default App;
