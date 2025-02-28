
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import Index from "@/pages/Index";
import About from "@/pages/About";
import Classes from "@/pages/Classes";
import Signup from "@/pages/Signup";
import Success from "@/pages/Success";
import NotFound from "@/pages/NotFound";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/about" element={<About />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/signup" element={<Signup />} />
        
        {/* Handle all success routes including typo */}
        <Route path="/success" element={<Success />} />
        <Route path="/success/*" element={<Success />} />
        <Route path="/succes" element={<Success />} />
        <Route path="/succes/*" element={<Success />} />
        
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster position="top-center" />
    </Router>
  );
};

export default App;
