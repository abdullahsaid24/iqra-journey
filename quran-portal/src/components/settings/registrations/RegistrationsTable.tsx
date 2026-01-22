import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, X, FileText } from "lucide-react";
import { ProcessRegistrationDialog } from "./ProcessRegistrationDialog";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Student {
  id: string;
  name: string;
  age: number;
}

interface ParentLink {
  parent_user_id: string;
  phone_number: string | null;
  secondary_phone_number: string | null;
  students: Array<{
    id: string;
    name: string;
    email: string | null;
  }>;
}

interface Registration {
  id: string;
  parent_name: string | null;
  email: string;
  phone: string;
  status: string;
  payment_status: string;
  registration_type: 'parent' | 'adult';
  created_at: string;
  students: Student[];
  parentLinks: ParentLink[];
  accountExists?: boolean;
}

interface RegistrationsTableProps {
  registrations: Registration[];
  onRegistrationProcessed: () => void;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'completed':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'rejected':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

const getPaymentStatusColor = (status: string) => {
  switch (status) {
    case 'paid':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'failed':
      return 'bg-red-100 text-red-800 border-red-300';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300';
  }
};

export const RegistrationsTable = ({ registrations, onRegistrationProcessed }: RegistrationsTableProps) => {
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [isProcessDialogOpen, setIsProcessDialogOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);

  const handleUpdateStatus = async (registrationId: string, newStatus: string) => {
    setUpdatingStatus(registrationId);
    try {
      const { error } = await supabase
        .from('registrations')
        .update({ status: newStatus })
        .eq('id', registrationId);

      if (error) throw error;

      toast.success(`Registration ${newStatus === 'rejected' ? 'rejected' : 'completed'} successfully`);
      onRegistrationProcessed();
    } catch (error: any) {
      console.error('Error updating registration status:', error);
      toast.error("Failed to update registration status");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleProcessClick = (registration: Registration) => {
    setSelectedRegistration(registration);
    setIsProcessDialogOpen(true);
  };

  if (registrations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">No registrations found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {registrations.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">No registrations found</p>
      ) : (
        registrations.map((registration) => (
          <Card key={registration.id} className="p-4 md:p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-3">
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <h3 className="font-semibold text-base md:text-lg">
                      {registration.parent_name || 'N/A'}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      <Badge className={getStatusColor(registration.status)}>
                        {registration.status}
                      </Badge>
                      <Badge className={getPaymentStatusColor(registration.payment_status)}>
                        {registration.payment_status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {registration.registration_type}
                      </Badge>
                      {registration.accountExists && (
                        <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">
                          ✓ Account Exists
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 text-sm">
                    <p className="text-muted-foreground">
                      <span className="font-medium">Email:</span> {registration.email}
                    </p>
                    {registration.phone && (
                      <p className="text-muted-foreground">
                        <span className="font-medium">Phone:</span> {registration.phone}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      Registered: {new Date(registration.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {registration.students && registration.students.length > 0 && (
                  <div className="pt-2 border-t">
                    <p className="font-medium text-sm mb-2">Students ({registration.students.length}):</p>
                    <div className="space-y-1">
                      {registration.students.map((student) => (
                        <div key={student.id} className="text-sm text-muted-foreground pl-3 border-l-2 border-primary/30">
                          <p className="font-medium">{student.name} (Age: {student.age})</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {registration.parentLinks && registration.parentLinks.length > 0 && (
                  <div className="pt-2">
                    <Badge variant="secondary" className="text-xs">
                      {registration.parentLinks.reduce((acc, link) => acc + link.students.length, 0)} existing link(s)
                    </Badge>
                  </div>
                )}
              </div>

              {registration.status === 'pending' && (
                <div className="w-full md:w-auto flex flex-col gap-2 md:min-w-[200px]">
                  {!registration.accountExists && (
                    <Button
                      className="w-full"
                      onClick={() => handleProcessClick(registration)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Create Accounts
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="w-full border-2"
                    onClick={() => handleUpdateStatus(registration.id, 'completed')}
                    disabled={updatingStatus === registration.id}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Mark Complete
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleUpdateStatus(registration.id, 'rejected')}
                    disabled={updatingStatus === registration.id}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
              {registration.status === 'completed' && (
                <div className="w-full md:w-auto">
                  <Badge variant="outline" className="text-green-600">
                    ✓ Processed
                  </Badge>
                </div>
              )}
              {registration.status === 'rejected' && (
                <div className="w-full md:w-auto">
                  <Badge variant="outline" className="text-red-600">
                    ✗ Rejected
                  </Badge>
                </div>
              )}
            </div>
          </Card>
        ))
      )}
      
      {selectedRegistration && (
        <ProcessRegistrationDialog
          open={isProcessDialogOpen}
          onOpenChange={setIsProcessDialogOpen}
          registration={selectedRegistration}
          onSuccess={onRegistrationProcessed}
        />
      )}
    </div>
  );
};
