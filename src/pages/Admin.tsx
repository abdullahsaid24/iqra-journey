
import { useState } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";
import { 
  syncRegistrationsWithStripe, 
  forceUpdateRegistrationStatus, 
  createUserSubscriptions 
} from "@/integrations/supabase/client";

const Admin = () => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isForcing, setIsForcing] = useState(false);
  const [isCreatingSubscriptions, setIsCreatingSubscriptions] = useState(false);
  const [syncResult, setSyncResult] = useState<any>(null);
  const [forceResult, setForceResult] = useState<any>(null);
  const [subscriptionResult, setSubscriptionResult] = useState<any>(null);

  // List of emails that need to be fixed
  const paidEmails = [
    'sharique.chowdhury@gmail.com',
    'sakeenasamad@hotmail.com', 
    'ali.zeynaly@gmail.com',
    'Sana.Syed0104@gmail.com',
    'salsabeel.mohamed@gmail.com',
    'ghousia_mazhar@hotmail.com',
    'aabbaass@gmail.com',
    'maryemaziz@gmail.com',
    'a.shahzad@gmail.com',
    'sumaiya.tahzib@gmail.com',
    'shamimainab.78@gmail.com',
    'wasimahmad113@gmail.com',
    'sobia.syed@gmail.com',
    'maliasif@gmail.com',
    'fathimabatool@gmail.com',
    'saqibarifi@gmail.com',
    'sakeenasamad@yahoomail.com',
    'syed.k.khan@gmail.com',
    'mnausherwani@gmail.com'
  ];

  const handleSyncWithStripe = async () => {
    setIsSyncing(true);
    setSyncResult(null);
    
    try {
      const result = await syncRegistrationsWithStripe();
      setSyncResult(result);
      
      if (result.success) {
        toast({
          title: "Sync Complete",
          description: `Successfully synchronized ${result.data?.updates?.length || 0} registrations with Stripe.`,
        });
      } else {
        toast({
          title: "Sync Failed",
          description: `Error: ${result.error?.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Sync Failed",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleForceUpdate = async () => {
    setIsForcing(true);
    setForceResult(null);
    
    try {
      const result = await forceUpdateRegistrationStatus(paidEmails);
      setForceResult(result);
      
      if (result.success) {
        toast({
          title: "Force Update Complete",
          description: `Updated: ${result.updated}, Not Found: ${result.notFound}, Errors: ${result.errors}`,
        });
      } else {
        toast({
          title: "Force Update Failed",
          description: `Error: ${result.error?.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Force Update Failed",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsForcing(false);
    }
  };

  const handleCreateSubscriptions = async () => {
    setIsCreatingSubscriptions(true);
    setSubscriptionResult(null);
    
    try {
      const result = await createUserSubscriptions();
      setSubscriptionResult(result);
      
      if (result.success) {
        toast({
          title: "Subscription Creation Complete",
          description: `Created: ${result.created}, Already Existing: ${result.existing}, Errors: ${result.errors}`,
        });
      } else {
        toast({
          title: "Subscription Creation Failed",
          description: `Error: ${result.error?.message || "Unknown error"}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Subscription Creation Failed",
        description: `Error: ${error.message || "Unknown error"}`,
        variant: "destructive",
      });
    } finally {
      setIsCreatingSubscriptions(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-1 container px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-outfit font-medium mb-8">
            Admin Panel
          </h1>

          <div className="grid gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Registration Status Management</CardTitle>
                <CardDescription>
                  Manage the synchronization of registration statuses with Stripe
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center flex-wrap">
                    <Button onClick={handleSyncWithStripe} disabled={isSyncing}>
                      {isSyncing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Syncing...
                        </>
                      ) : (
                        "Sync with Stripe"
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleForceUpdate} 
                      disabled={isForcing} 
                      variant="destructive"
                    >
                      {isForcing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Force Update Paid Registrations"
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleCreateSubscriptions} 
                      disabled={isCreatingSubscriptions}
                      variant="secondary"
                    >
                      {isCreatingSubscriptions ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating Subscriptions...
                        </>
                      ) : (
                        "Create User Subscriptions"
                      )}
                    </Button>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>The force update will set payment_status='paid' and status='active' for registrations with the following emails:</p>
                    <div className="mt-2 p-2 bg-muted rounded-md h-32 overflow-y-auto">
                      <ul className="list-disc pl-5">
                        {paidEmails.map(email => (
                          <li key={email}>{email}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {syncResult && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="font-medium mb-2">Sync Result:</h3>
                        <pre className="p-2 bg-muted rounded-md text-xs overflow-x-auto">
                          {JSON.stringify(syncResult, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}

                  {forceResult && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="font-medium mb-2">Force Update Result:</h3>
                        <pre className="p-2 bg-muted rounded-md text-xs overflow-x-auto">
                          {JSON.stringify(forceResult, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                  
                  {subscriptionResult && (
                    <>
                      <Separator className="my-4" />
                      <div>
                        <h3 className="font-medium mb-2">Subscription Creation Result:</h3>
                        <pre className="p-2 bg-muted rounded-md text-xs overflow-x-auto">
                          {JSON.stringify(subscriptionResult, null, 2)}
                        </pre>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
