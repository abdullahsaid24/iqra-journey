import { Plus, Minus } from "lucide-react";

interface MistakeCounterProps {
  mistakes: number;
  onIncrement: () => void;
  onDecrement: () => void;
}

export const MistakeCounter = ({
  mistakes,
  onIncrement,
  onDecrement,
}: MistakeCounterProps) => {
  const getMistakeTextColor = (mistakes: number) => {
    if (mistakes === 0) return "text-quran-success";
    if (mistakes <= 2) return "text-quran-warning";
    return "text-quran-error";
  };

  return (
    <div className="mistake-counter mb-4">
      <button
        onClick={onDecrement}
        className="counter-button"
        aria-label="Decrease mistakes"
      >
        <Minus className="h-5 w-5" />
      </button>
      <span className={getMistakeTextColor(mistakes)}>{mistakes} mistakes</span>
      <button
        onClick={onIncrement}
        className="counter-button"
        aria-label="Increase mistakes"
      >
        <Plus className="h-5 w-5" />
      </button>
    </div>
  );
};
