import { useState, useEffect, useCallback } from "react";
import { DashboardNavbar } from "@/components/layout/DashboardNavbar";
import { DashboardNav } from "@/components/layout/DashboardNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, CheckCircle2, AlertTriangle, UserCog, Loader2 } from "lucide-react";

interface SeedStatusData {
  ok: boolean;
  user_id: string;
  email: string;
  created: boolean;
}

const SeedStatus = () => {
  const { toast } = useToast();
  const [data, setData] = useState<SeedStatusData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: respData, error: respError } = await supabase.functions.invoke<SeedStatusData>("seed-owner", {
        body: {},
      });

      if (respError) {
        try {
          const errJson = JSON.parse(respError.message) as { error: string };
          setError(errJson.error || respError.message);
        } catch {
          setError(respError.message || "Unknown error");
        }
        setData(null);
      } else if (respData && respData.ok) {
        setData(respData);
        setError(null);
      } else {
        setError("Unexpected response from seed function");
        setData(null);
      }
    } catch (e) {
      setError((e as Error).message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const runSeed = async () => {
    setRunning(true);
    setError(null);
    try {
      const { data: respData, error: respError } = await supabase.functions.invoke<SeedStatusData>("seed-owner", {
        body: {},
      });

      if (respError) {
        try {
          const errJson = JSON.parse(respError.message) as { error: string };
          const msg = errJson.error || respError.message;
          setError(msg);
          setData(null);
          toast({ title: "Seed failed", description: msg, variant: "destructive" });
        } catch {
          setError(respError.message);
          setData(null);
          toast({ title: "Seed failed", description: respError.message, variant: "destructive" });
        }
      } else if (respData && respData.ok) {
        setData(respData);
        setError(null);
        toast({
          title: "Seed successful",
          description: `Owner account ${respData.created ? "created" : "re-synced"} for ${respData.email}`,
        });
      } else {
        const msg = "Unexpected response from seed function";
        setError(msg);
        setData(null);
        toast({ title: "Seed failed", description: msg, variant: "destructive" });
      }
    } catch (e) {
      const msg = (e as Error).message;
      setError(msg);
      setData(null);
      toast({ title: "Seed failed", description: msg, variant: "destructive" });
    } finally {
      setRunning(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const isProvisioned = !!data;

  return (
    <div className="min-h-screen bg-background">
      <DashboardNavbar />
      <DashboardNav />
      <main className="ml-64 pt-20 px-4 pb-4 md:px-8 md:pb-8">
        <div className="max-w-3xl">
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Owner Account Status</h1>
            <p className="text-muted-foreground">
              Check and manage the super admin (Owner) account provisioning
            </p>
          </div>

          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-72" />
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-10 w-32" />
              </CardContent>
            </Card>
          ) : (
            <>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <UserCog className="h-5 w-5 text-primary" />
                        Provisioning Status
                      </CardTitle>
                      <CardDescription>
                        Current state of the Owner account
                      </CardDescription>
                    </div>
                    <Badge variant={isProvisioned ? "default" : "destructive"}>
                      {isProvisioned ? "Provisioned" : "Not Provisioned"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {isProvisioned && (
                    <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
                      <div className="flex items-center gap-2 text-primary">
                        <CheckCircle2 className="h-5 w-5" />
                        <span className="font-medium">Owner account is active</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{data.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">User ID</p>
                          <p className="font-medium font-mono text-xs break-all">
                            {data.user_id}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Created on first run</p>
                          <p className="font-medium">
                            {data.created ? "Yes" : "No (existed before)"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {!isProvisioned && !error && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>No Owner account found</AlertTitle>
                      <AlertDescription>
                        The seed function did not return a provisioned owner. This may mean
                        the super admin secrets are not configured or the account needs to be
                        bootstrapped.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex items-center gap-3">
                    <Button
                      onClick={runSeed}
                      disabled={running}
                      variant={isProvisioned ? "outline" : "default"}
                    >
                      {running ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="mr-2 h-4 w-4" />
                      )}
                      {running
                        ? "Running..."
                        : isProvisioned
                        ? "Re-sync Owner"
                        : "Run Seed"}
                    </Button>
                    <Button variant="ghost" onClick={checkStatus} disabled={loading}>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Status
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isProvisioned && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Re-syncing updates the owner password to match the current{" "}
                  <code className="bg-muted px-1 py-0.5 rounded text-xs">SUPER_ADMIN_PASSWORD</code>{" "}
                  secret and ensures the profile and role are correct.
                </p>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SeedStatus;
