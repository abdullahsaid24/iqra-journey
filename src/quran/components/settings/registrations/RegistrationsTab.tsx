
import { Card } from "@/quran/components/ui/card";
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
    <div className="animate-fade-in">
      <Card className="bg-white border-slate-200 shadow-sm">
        <div className="p-6">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Registrations</h2>
            <p className="text-slate-500">Manage and process new student registrations.</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-500 mb-1">Pending</p>
              <p className="text-2xl font-bold text-slate-900">{pendingCount}</p>
            </div>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
              <p className="text-sm font-medium text-slate-500 mb-1">Completed</p>
              <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
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
