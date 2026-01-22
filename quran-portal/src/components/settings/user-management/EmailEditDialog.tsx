
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";

interface EmailEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
  onChange: (email: string) => void;
  isUpdating: boolean;
  onSave: () => void;
}

export const EmailEditDialog = ({
  isOpen,
  onClose,
  email,
  onChange,
  isUpdating,
  onSave
}: EmailEditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Email Address</DialogTitle>
          <DialogDescription>
            Update the user's email address. This will be used for authentication and notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium leading-none">
              Email Address
            </label>
            <Input 
              id="email" 
              type="email" 
              value={email} 
              onChange={(e) => onChange(e.target.value)} 
              placeholder="Enter new email address" 
              disabled={isUpdating} 
            />
          </div>
          <p className="text-xs text-gray-500">
            Please ensure the email address is valid and accessible.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isUpdating}
          >
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isUpdating}>
            {isUpdating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
