
import { Button } from "@/quran/components/ui/button";
import { Input } from "@/quran/components/ui/input";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/quran/components/ui/dialog";

interface PhoneEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  phoneNumber: string;
  secondaryPhoneNumber?: string;
  onChange: (phoneNumber: string, type: 'primary' | 'secondary') => void;
  isUpdating: boolean;
  onSave: () => void;
}

export const PhoneEditDialog = ({
  isOpen,
  onClose,
  phoneNumber,
  secondaryPhoneNumber = '',
  onChange,
  isUpdating,
  onSave
}: PhoneEditDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Phone Numbers</DialogTitle>
          <DialogDescription>
            These phone numbers will be used for SMS notifications.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label htmlFor="primary-phone" className="text-sm font-medium leading-none">
              Primary Phone Number
            </label>
            <Input 
              id="primary-phone" 
              type="tel" 
              value={phoneNumber} 
              onChange={(e) => onChange(e.target.value, 'primary')} 
              placeholder="Enter primary phone number with country code" 
              disabled={isUpdating} 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="secondary-phone" className="text-sm font-medium leading-none">
              Secondary Phone Number (Optional)
            </label>
            <Input 
              id="secondary-phone" 
              type="tel" 
              value={secondaryPhoneNumber} 
              onChange={(e) => onChange(e.target.value, 'secondary')} 
              placeholder="Enter secondary phone number with country code" 
              disabled={isUpdating} 
            />
          </div>
          <p className="text-xs text-gray-500">
            Format: +1XXXXXXXXXX (include country code)
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
