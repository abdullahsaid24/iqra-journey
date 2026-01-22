
import { Card } from "@/components/ui/card";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  bgColor?: string;
  textColor?: string;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  bgColor = "bg-green-50",
  textColor = "text-green-800"
}: StatCardProps) => {
  return (
    <Card className={`${bgColor} border-none shadow-sm`}>
      <div className="p-4 sm:p-6">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <p className={`mt-2 text-2xl sm:text-3xl font-bold ${textColor}`}>{value}</p>
        {subtitle && <p className="mt-1 text-xs sm:text-sm text-gray-500">{subtitle}</p>}
      </div>
    </Card>
  );
};
