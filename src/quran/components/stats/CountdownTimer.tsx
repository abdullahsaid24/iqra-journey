import { useEffect, useState } from "react";
const CountdownTimer = () => {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calculateTimeLeft = () => {
      // Get current date and end of month
      const now = new Date();
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const difference = endOfMonth.getTime() - now.getTime();

      // Calculate days, hours, and minutes
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor(difference % (1000 * 60 * 60 * 24) / (1000 * 60 * 60));
      const minutes = Math.floor(difference % (1000 * 60 * 60) / (1000 * 60));
      return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every minute
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 60000); // Update every minute instead of every second

    return () => clearInterval(timer);
  }, []);
  return <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-sm font-medium text-gray-500 mb-1">Monthly Countdown</h3>
      <p className="text-2xl font-mono font-bold text-gray-900">{timeLeft}</p>
    </div>;
};
export default CountdownTimer;
