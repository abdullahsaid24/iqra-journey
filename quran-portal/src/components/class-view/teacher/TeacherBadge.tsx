import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface TeacherBadgeProps {
  email: string;
  onRemove: () => void;
}

export const TeacherBadge = ({ email, onRemove }: TeacherBadgeProps) => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Badge variant="secondary" className="flex items-center gap-1 cursor-pointer">
          {email}
          <X className="h-3 w-3" />
        </Badge>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Teacher</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove {email} from this class?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onRemove}>Remove</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};