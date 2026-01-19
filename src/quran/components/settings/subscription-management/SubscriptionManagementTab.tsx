import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/quran/components/ui/card";
import { Badge } from "@/quran/components/ui/badge";
import { Button } from "@/quran/components/ui/button";
import { RefreshCw, CreditCard, Users, DollarSign, Download, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/quran/components/ui/tabs";

interface ParentSubscription {
  email: string;
  is_subscribed: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string | null;
  updated_at: string | null;
  amount: number | null;
  currency: string | null;
  children: Array<{
    name: string;
    email: string | null;
  }>;
}

// Interface for Stripe customers from the API
interface StripeCustomer {
  stripe_customer_id: string;
  email: string;
  name: string;
  phone: string | null;
  phone_source: string | null;
  subscription_id: string;
  subscription_status: string;
  amount: number | null;
  currency: string;
  created: string | null;
  current_period_end: string | null;
}

export const SubscriptionManagementTab = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch parent subscriptions from database (for "All Parents" section)
  const {
    data: subscriptions,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['parent-subscriptions'],
    queryFn: async () => {
      const {
        data,
        error
      } = await supabase.rpc('get_parent_subscriptions');
      if (error) {
        console.error('Error fetching parent subscriptions:', error);
        throw error;
      }
      return (data || []).map((parent: any) => ({
        email: parent.email,
        is_subscribed: parent.is_subscribed,
        stripe_customer_id: parent.stripe_customer_id,
        stripe_subscription_id: parent.stripe_subscription_id,
        subscription_status: parent.subscription_status,
        updated_at: parent.updated_at,
        amount: parent.amount,
        currency: parent.currency,
        children: parent.children || []
      })) as ParentSubscription[];
    },
    refetchInterval: 30000 // Auto-refresh every 30 seconds
  });

  // Fetch Stripe customers directly from Stripe API
  const {
    data: stripeData,
    isLoading: isLoadingStripe,
    refetch: refetchStripe
  } = useQuery({
    queryKey: ['stripe-customers-direct'],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await supabase.functions.invoke('get-stripe-customers', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        console.error('Error fetching Stripe customers:', response.error);
        throw response.error;
      }

      return response.data as {
        success: boolean;
        total: number;
        customers: StripeCustomer[];
        summary: {
          active: number;
          past_due: number;
          failed: number;
          other: number;
        };
      };
    },
    refetchInterval: 60000 // Refresh every minute
  });

  // Stripe customers from direct API call
  const stripeCustomers = stripeData?.customers || [];
  const activeCustomers = stripeCustomers.filter(c => c.subscription_status === 'active');
  const pastDueCustomers = stripeCustomers.filter(c => c.subscription_status === 'past_due');
  const failedCustomers = stripeCustomers.filter(c =>
    c.subscription_status === 'unpaid' ||
    c.subscription_status === 'canceled'
  );
  const otherCustomers = stripeCustomers.filter(c =>
    c.subscription_status !== 'active' &&
    c.subscription_status !== 'past_due' &&
    c.subscription_status !== 'unpaid' &&
    c.subscription_status !== 'canceled'
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toast.success('Subscription data refreshed');
    } catch (error) {
      toast.error('Failed to refresh subscription data');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-sync on component mount and every 5 minutes
  React.useEffect(() => {
    const performAutoSync = async () => {
      try {
        const {
          data: {
            session
          }
        } = await supabase.auth.getSession();
        if (!session) return;
        await supabase.functions.invoke('sync-stripe-subscriptions', {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });
        await refetch();
      } catch (error) {
        console.error('Auto-sync error:', error);
      }
    };
    performAutoSync(); // Initial sync
    const interval = setInterval(performAutoSync, 5 * 60 * 1000); // Every 5 minutes
    return () => clearInterval(interval);
  }, [refetch]);

  const handleSyncFromStripe = async () => {
    setIsSyncing(true);
    try {
      const {
        data: {
          session
        }
      } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Please sign in to sync subscriptions');
        return;
      }
      toast.info('Starting sync from Stripe... This may take a moment.');
      const response = await supabase.functions.invoke('sync-stripe-subscriptions', {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      if (response.error) {
        console.error('Sync error:', response.error);
        toast.error('Failed to sync from Stripe');
        return;
      }
      const result = response.data;
      if (result.success) {
        toast.success(`Sync completed! Synced: ${result.synced_successfully}, Skipped: ${result.skipped}, Errors: ${result.errors}`);
        // Refresh the data after sync
        await refetch();
      } else {
        toast.error('Sync failed: ' + result.error);
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to sync from Stripe');
    } finally {
      setIsSyncing(false);
    }
  };

  // Calculate stats (all parents)
  const totalParents = subscriptions?.length || 0;
  const paidParents = subscriptions?.filter(sub => sub.is_subscribed).length || 0;
  const unpaidParents = totalParents - paidParents;
  const totalChildren = subscriptions?.reduce((acc, parent) => acc + parent.children.length, 0) || 0;

  // Render a customer card (for database ParentSubscription)
  const renderCustomerCard = (parent: ParentSubscription, index: number) => (
    <div key={index} className="p-3 md:p-4 border rounded-lg space-y-3">
      {/* Parent Info */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm md:text-base truncate">{parent.email}</div>
          {parent.stripe_customer_id && <div className="text-xs text-muted-foreground truncate">
            ID: {parent.stripe_customer_id.slice(0, 20)}...
          </div>}
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {parent.amount && <div className="text-xs md:text-sm font-medium whitespace-nowrap">
            ${(parent.amount / 100).toFixed(2)}/{parent.currency?.toUpperCase() || 'USD'}
          </div>}
          <Badge
            variant={parent.subscription_status === 'active' ? "default" : "secondary"}
            className={`${parent.subscription_status === 'past_due' ? "bg-orange-500 hover:bg-orange-600" :
              parent.subscription_status === 'active' ? "bg-green-500" :
                parent.subscription_status === 'unpaid' || parent.subscription_status === 'canceled' ? "bg-red-500" :
                  "bg-gray-400"
              } text-xs font-bold`}
          >
            {parent.subscription_status?.toUpperCase().replace('_', ' ') || 'UNKNOWN'}
          </Badge>
        </div>
      </div>

      {/* Children List */}
      {parent.children.length > 0 ? <div className="ml-4 pl-4 border-l-2 border-gray-200">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          Children ({parent.children.length}):
        </div>
        <div className="space-y-1">
          {parent.children.map((child, childIndex) => <div key={childIndex} className="text-sm">
            • {child.name}
            {child.email && <span className="text-muted-foreground ml-2">({child.email})</span>}
          </div>)}
        </div>
      </div> : <div className="ml-4 text-sm text-muted-foreground">
        No children linked to this parent
      </div>}

      {parent.updated_at && <div className="text-xs text-muted-foreground">
        Last updated: {new Date(parent.updated_at).toLocaleDateString()}
      </div>}
    </div>
  );

  // Render a Stripe customer card (for direct Stripe API data)
  const renderStripeCustomerCard = (customer: StripeCustomer, index: number) => (
    <div key={index} className="p-3 md:p-4 border rounded-lg space-y-3 bg-card">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm md:text-base truncate text-foreground">{customer.name || customer.email}</div>
          <div className="text-xs text-muted-foreground truncate">{customer.email}</div>
          {customer.phone ? (
            <div className="text-xs text-green-600 font-medium">
              Phone: {customer.phone}
              <span className="text-muted-foreground ml-1">({customer.phone_source || 'stripe'})</span>
            </div>
          ) : (
            <div className="text-xs text-red-500">No phone number</div>
          )}
          <div className="text-xs text-muted-foreground truncate">
            ID: {customer.stripe_customer_id.slice(0, 20)}...
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3 flex-wrap">
          {customer.amount && <div className="text-xs md:text-sm font-medium whitespace-nowrap text-foreground">
            ${(customer.amount / 100).toFixed(2)}/{customer.currency?.toUpperCase() || 'USD'}
          </div>}
          <Badge
            variant={customer.subscription_status === 'active' ? "default" : "secondary"}
            className={`${customer.subscription_status === 'past_due' ? "bg-orange-500 hover:bg-orange-600 text-white" :
              customer.subscription_status === 'active' ? "bg-green-500 hover:bg-green-600 text-white" :
                customer.subscription_status === 'unpaid' || customer.subscription_status === 'canceled' ? "bg-red-500 hover:bg-red-600 text-white" :
                  "bg-gray-400 text-white"
              } text-xs font-bold`}
          >
            {customer.subscription_status?.toUpperCase().replace('_', ' ') || 'UNKNOWN'}
          </Badge>
        </div>
      </div>

      {customer.current_period_end && (
        <div className="text-xs text-muted-foreground">
          Period ends: {new Date(customer.current_period_end).toLocaleDateString()}
        </div>
      )}
    </div>
  );

  if (isLoading) {
    return <div className="flex items-center justify-center p-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>;
  }
  return <div className="space-y-4 md:space-y-6">
    {/* Header */}
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h2 className="text-xl md:text-2xl font-bold">Subscription Management</h2>
      </div>
      <div className="flex gap-2">
        <Button onClick={handleSyncFromStripe} disabled={isSyncing} variant="default" size="sm" className="flex-1 md:flex-initial">
          <Download className={`h-4 w-4 mr-2 ${isSyncing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">{isSyncing ? 'Syncing...' : 'Manual Sync'}</span>
          <span className="xs:hidden">Sync</span>
        </Button>
        <Button onClick={handleRefresh} disabled={isRefreshing} variant="outline" size="sm" className="flex-1 md:flex-initial">
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span className="hidden xs:inline">Refresh</span>
        </Button>
      </div>
    </div>

    {/* Stats Cards */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Parents</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalParents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Paying Parents</CardTitle>
          <CreditCard className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{paidParents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Not Paying</CardTitle>
          <DollarSign className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{unpaidParents}</div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Children</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalChildren}</div>
        </CardContent>
      </Card>
    </div>

    {/* Stripe Customers Section */}
    <Card className="bg-white border-slate-200 shadow-sm mb-6">
      <CardHeader className="bg-slate-50 border-b border-slate-200 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-quran-primary" />
            <CardTitle className="text-lg md:text-xl text-slate-900">Stripe Customers</CardTitle>
            <Badge variant="outline" className="ml-2 bg-slate-100 text-slate-700 border-slate-300">
              {stripeData?.total || 0} Total
            </Badge>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetchStripe()}
            disabled={isLoadingStripe}
            className="bg-white hover:bg-slate-50 text-slate-700 border-slate-200"
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoadingStripe ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
        <p className="text-sm text-slate-500 mt-1">
          Live data directly from Stripe API
        </p>
      </CardHeader>
      <CardContent className="pt-6">
        {isLoadingStripe ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-quran-primary"></div>
            <span className="ml-3 text-slate-500">Loading from Stripe...</span>
          </div>
        ) : stripeData?.success === false ? (
          <div className="text-center py-8 text-red-500">
            Error loading Stripe data. Make sure the function is deployed.
          </div>
        ) : (
          <Tabs defaultValue="active" className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-6 bg-slate-100">
              <TabsTrigger value="active" className="data-[state=active]:bg-white data-[state=active]:text-green-700 data-[state=active]:shadow-sm text-slate-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                Active ({activeCustomers.length})
              </TabsTrigger>
              <TabsTrigger value="past_due" className="data-[state=active]:bg-white data-[state=active]:text-orange-700 data-[state=active]:shadow-sm text-slate-600">
                <AlertTriangle className="h-4 w-4 mr-1" />
                Past Due ({pastDueCustomers.length})
              </TabsTrigger>
              <TabsTrigger value="failed" className="data-[state=active]:bg-white data-[state=active]:text-red-700 data-[state=active]:shadow-sm text-slate-600">
                <XCircle className="h-4 w-4 mr-1" />
                Failed ({failedCustomers.length})
              </TabsTrigger>
              <TabsTrigger value="other" className="data-[state=active]:bg-white data-[state=active]:text-slate-700 data-[state=active]:shadow-sm text-slate-600">
                Other ({otherCustomers.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="active" className="space-y-3">
              {activeCustomers.length > 0 ? (
                activeCustomers.map((customer, index) => renderStripeCustomerCard(customer, index))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  No active Stripe customers
                </div>
              )}
            </TabsContent>

            <TabsContent value="past_due" className="space-y-3">
              {pastDueCustomers.length > 0 ? (
                <>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-orange-700">
                      <AlertTriangle className="h-4 w-4" />
                      <span className="font-medium">These customers have failed payments</span>
                    </div>
                    <p className="text-sm text-orange-600 mt-1">
                      They'll receive SMS notifications if configured
                    </p>
                  </div>
                  {pastDueCustomers.map((customer, index) => renderStripeCustomerCard(customer, index))}
                </>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  No past due customers
                </div>
              )}
            </TabsContent>

            <TabsContent value="failed" className="space-y-3">
              {failedCustomers.length > 0 ? (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-red-700">
                      <XCircle className="h-4 w-4" />
                      <span className="font-medium">These subscriptions are canceled or unpaid</span>
                    </div>
                  </div>
                  {failedCustomers.map((customer, index) => renderStripeCustomerCard(customer, index))}
                </>
              ) : (
                <div className="text-center py-6 text-slate-500">
                  No failed or canceled subscriptions
                </div>
              )}
            </TabsContent>

            <TabsContent value="other" className="space-y-3">
              {otherCustomers.length > 0 ? (
                otherCustomers.map((customer, index) => renderStripeCustomerCard(customer, index))
              ) : (
                <div className="text-center py-6 text-slate-500">
                  No other Stripe customers
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>

    {/* All Parents Table (existing) */}
    <Card>
      <CardHeader>
        <CardTitle className="text-lg md:text-xl">All Parents & Children</CardTitle>
        <p className="text-sm text-muted-foreground">
          Complete list of all parents including those not on Stripe
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 md:space-y-6">
          {subscriptions?.map((parent, index) => <div key={index} className="p-3 md:p-4 border rounded-lg space-y-3">
            {/* Parent Info */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm md:text-base truncate">{parent.email}</div>
                {parent.stripe_customer_id && <div className="text-xs text-muted-foreground truncate">
                  ID: {parent.stripe_customer_id.slice(0, 20)}...
                </div>}
              </div>

              <div className="flex items-center gap-2 md:gap-3 flex-wrap">
                {parent.amount && <div className="text-xs md:text-sm font-medium whitespace-nowrap">
                  ${(parent.amount / 100).toFixed(2)}/{parent.currency?.toUpperCase() || 'USD'}
                </div>}
                <Badge variant={parent.is_subscribed && parent.subscription_status !== 'past_due' ? "default" : "secondary"} className={`${parent.subscription_status === 'past_due' ? "bg-red-500 hover:bg-red-600" : parent.is_subscribed ? "bg-green-500" : "bg-gray-400"} text-xs font-bold`}>
                  {parent.subscription_status === 'past_due' ? "PAST DUE" : parent.is_subscribed ? "PAYING" : "NOT PAYING"}
                </Badge>
              </div>
            </div>

            {/* Children List */}
            {parent.children.length > 0 ? <div className="ml-4 pl-4 border-l-2 border-gray-200">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Children ({parent.children.length}):
              </div>
              <div className="space-y-1">
                {parent.children.map((child, childIndex) => <div key={childIndex} className="text-sm">
                  • {child.name}
                  {child.email && <span className="text-muted-foreground ml-2">({child.email})</span>}
                </div>)}
              </div>
            </div> : <div className="ml-4 text-sm text-muted-foreground">
              No children linked to this parent
            </div>}

            {parent.updated_at && <div className="text-xs text-muted-foreground">
              Last updated: {new Date(parent.updated_at).toLocaleDateString()}
            </div>}
          </div>)}

          {!subscriptions?.length && <div className="text-center py-8 text-muted-foreground">
            No parent subscription data found
          </div>}
        </div>
      </CardContent>
    </Card>
  </div>;
};
