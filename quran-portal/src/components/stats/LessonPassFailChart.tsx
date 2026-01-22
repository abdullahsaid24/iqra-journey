import { Card } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
interface LessonPassFailChartProps {
  passCount: number;
  failCount: number;
}
export const LessonPassFailChart = ({
  passCount,
  failCount
}: LessonPassFailChartProps) => {
  const data = [{
    name: 'Pass',
    value: passCount
  }, {
    name: 'Fail',
    value: failCount
  }];
  return <Card className="p-6 bg-slate-50">
      <h3 className="text-lg font-semibold mb-4 text-black">Current Lesson </h3>
      <div className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke="#000000" />
            <YAxis stroke="#000000" />
            <Tooltip />
            <Bar dataKey="value" fill="#22c55e" name="Lessons" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>;
};