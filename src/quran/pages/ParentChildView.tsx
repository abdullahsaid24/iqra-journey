
import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

const ParentChildView = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  
  // Redirect directly to the student stats page with the parent flag
  useEffect(() => {
    if (childId) {
      navigate(`/quran/student/${childId}/stats`, { 
        state: { 
          from: "/quran/parent-dashboard", 
          isParentView: true 
        } 
      });
    }
  }, [childId, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-quran-primary" />
    </div>
  );
};

export default ParentChildView;
