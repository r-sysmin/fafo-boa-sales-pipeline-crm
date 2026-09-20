import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { usePipelines, usePipelineStages } from "@/hooks/usePipelineStages";
import { clearDemoWorkspace, hasDemoData, seedDemoWorkspace } from "@/lib/demoData";
import { Loader2, Sparkles, Trash2 } from "lucide-react";

export function DemoDataSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [working, setWorking] = useState(false);

  const { data: pipelines } = usePipelines();
  const pipeline = pipelines?.[0];
  const { data: stages } = usePipelineStages(pipeline?.id);

  const { data: demoLoaded, isLoading } = useQuery({
    queryKey: ["demo-data-present", user?.id],
    queryFn: hasDemoData,
    enabled: !!user,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries();
  };

  const handleLoad = async () => {
    if (!user || !pipeline || !stages?.length) {
      toast({ title: "No pipeline yet", description: "Create a pipeline first, then load the demo workspace.", variant: "destructive" });
      return;
    }
    setWorking(true);
    try {
      const result = await seedDemoWorkspace(user.id, pipeline.id, stages);
      toast({
        title: "Demo workspace loaded",
        description: `${result.companies} companies, ${result.contacts} contacts and ${result.deals} deals added.`,
      });
      refreshAll();
    } catch (err: any) {
      toast({ title: "Couldn't load demo data", description: err.message, variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  const handleClear = async () => {
    setWorking(true);
    try {
      await clearDemoWorkspace();
      toast({ title: "Demo data removed", description: "Only your own records remain." });
      refreshAll();
    } catch (err: any) {
      toast({ title: "Couldn't remove demo data", description: err.message, variant: "destructive" });
    } finally {
      setWorking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="flex items-center gap-2">
              Demo workspace
              {demoLoaded && <Badge variant="secondary">Loaded</Badge>}
            </CardTitle>
            <CardDescription>
              Explore the CRM with realistic sample companies, contacts, deals, activities and tasks. Remove it any time
              without touching your own records.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-3">
        <Button onClick={handleLoad} disabled={working || isLoading || !!demoLoaded}>
          {working ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
          {demoLoaded ? "Demo data already loaded" : "Load demo workspace"}
        </Button>
        <Button variant="outline" onClick={handleClear} disabled={working || isLoading || !demoLoaded}>
          <Trash2 className="mr-2 h-4 w-4" />
          Remove demo data
        </Button>
      </CardContent>
    </Card>
  );
}
