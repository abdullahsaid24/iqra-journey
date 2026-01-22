import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GlobalRecipientsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipients: string[];
  isLoading: boolean;
  onFetch: () => void;
}

export const GlobalRecipientsModal = ({
  open,
  onOpenChange,
  recipients,
  isLoading,
  onFetch
}: GlobalRecipientsModalProps) => {
  // Fetch numbers when the modal is opened
  React.useEffect(() => {
    if (open) {
      onFetch();
    }
  }, [open, onFetch]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>All Recipients</DialogTitle>
          <DialogDescription>
            These are all the unique phone numbers your global message will be sent to.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[300px] overflow-y-auto my-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="animate-spin w-6 h-6 text-quran-primary" />
            </div>
          ) : recipients.length > 0 ? (
            <ul className="text-sm space-y-1">
              {recipients.map((num, i) => (
                <li key={i} className="break-all">{num}</li>
              ))}
            </ul>
          ) : (
            <div className="text-gray-500 text-sm italic">No phone numbers found.</div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
