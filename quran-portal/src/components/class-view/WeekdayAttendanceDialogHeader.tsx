
import { DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface Props {
  title: string;
}

export function WeekdayAttendanceDialogHeader({
  title
}: Props) {
  return (
    <DialogHeader>
      <DialogTitle className="text-center text-lg font-semibold text-neutral-950">
        {title}
      </DialogTitle>
      <DialogDescription className="text-center text-neutral-600">
        Mark students as present or absent. The absence level is shown next to the "Absent" button.
      </DialogDescription>
    </DialogHeader>
  );
}
