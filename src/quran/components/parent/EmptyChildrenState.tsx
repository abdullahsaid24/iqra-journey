
import { Card, CardContent } from "@/quran/components/ui/card";
import { User } from "lucide-react";

export const EmptyChildrenState = () => {
  return (
    <div className="container mx-auto p-8 bg-gradient-to-br from-slate-50 to-slate-100/50 min-h-screen">
      <Card className="bg-white/90 backdrop-blur shadow-md">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <User className="mb-4 h-12 w-12 text-quran-primary" />
          <h2 className="mb-2 text-xl font-semibold text-quran-primary">No Children Found</h2>
          <p className="text-center text-quran-neutral">
            No children are currently linked to your account. Please contact your administrator.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
