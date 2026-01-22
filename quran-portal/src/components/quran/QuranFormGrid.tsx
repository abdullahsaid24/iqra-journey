import { QuranPageSelect } from "./QuranPageSelect";

interface QuranFormGridProps {
  startPage: string;
  endPage: string;
  onStartPageChange: (value: string) => void;
  onEndPageChange: (value: string) => void;
}

export const QuranFormGrid = ({
  startPage,
  endPage,
  onStartPageChange,
  onEndPageChange,
}: QuranFormGridProps) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h3 className="mb-2 font-semibold text-gray-700">Start</h3>
        <div className="space-y-2">
          <QuranPageSelect
            selectedPage={startPage}
            onPageChange={onStartPageChange}
            label="Page #"
          />
        </div>
      </div>
      <div>
        <h3 className="mb-2 font-semibold text-gray-700">End</h3>
        <div className="space-y-2">
          <QuranPageSelect
            selectedPage={endPage}
            onPageChange={onEndPageChange}
            startFromPage={startPage}
            label="Page #"
          />
        </div>
      </div>
    </div>
  );
};