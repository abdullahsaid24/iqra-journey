import { Card } from "@/components/ui/card";
import { StatCard } from "./StatCard";

interface TeacherFeedbackProps {
  feedback: string;
  passingRate: number;
  lessonsCompleted: number;
  totalMistakes: number;
}

export const TeacherFeedback = ({ 
  feedback, 
  passingRate, 
  lessonsCompleted, 
  totalMistakes 
}: TeacherFeedbackProps) => {
  return (
    <Card className="bg-white p-6 shadow-sm md:col-span-2">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Teacher's Feedback</h2>
      <div className="space-y-4">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-gray-700">{feedback}</p>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <StatCard
            title="Passing Rate"
            value={`${Math.round(passingRate)}%`}
            bgColor="bg-green-50"
            textColor="text-green-800"
          />
          <StatCard
            title="Lessons Completed"
            value={lessonsCompleted}
            bgColor="bg-blue-50"
            textColor="text-blue-800"
          />
          <StatCard
            title="Total Mistakes"
            value={totalMistakes}
            bgColor="bg-amber-50"
            textColor="text-amber-800"
          />
        </div>
      </div>
    </Card>
  );
};