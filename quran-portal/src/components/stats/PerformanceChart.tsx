import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from "@/components/ui/card";

interface ChartData {
  name: string;
  value: number;
}

interface PerformanceChartProps {
  data: ChartData[];
}

export const PerformanceChart = ({ data }: PerformanceChartProps) => {
  return (
    <Card className="bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-semibold text-gray-900">Performance Metrics</h2>
      <div className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="name" stroke="#4B5563" />
            <YAxis stroke="#4B5563" />
            <Tooltip />
            <Bar dataKey="value" fill="#0C8A7D" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
};