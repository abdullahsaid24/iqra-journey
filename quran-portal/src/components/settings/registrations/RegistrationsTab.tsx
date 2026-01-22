
import { Card } from "@/components/ui/card";
import { RegistrationsTable } from "./RegistrationsTable";
import { useRegistrations } from "./hooks/useRegistrations";
import { LoadingState } from "../user-management/LoadingState";
import { ErrorState } from "../user-management/ErrorState";

export const RegistrationsTab = () => {
  const { data: registrations, isLoading, error, refetch } = useRegistrations();

  if (isLoading) {
    return <LoadingState />;
  }

  if (error) {
    return <ErrorState error={error} onRetry={refetch} />;
  }

  const pendingCount = (registrations || []).filter(r => r.status === 'pending').length;
  const completedCount = (registrations || []).filter(r => r.status === 'completed').length;

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 animate-fade-in">
      <Card className="border bg-card shadow-lg">
        <div className="p-4 md:p-6">
          <div className="text-center mb-6 md:mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Registrations</h2>
            <div className="w-32 h-1 bg-primary mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Pending</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{pendingCount}</p>
            </div>
            <div className="p-4 bg-muted border border-border rounded-lg">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-xl md:text-2xl font-bold text-foreground">{completedCount}</p>
            </div>
          </div>
          
          <RegistrationsTable 
            registrations={registrations || []} 
            onRegistrationProcessed={refetch}
          />
        </div>
      </Card>
    </div>
  );
};
