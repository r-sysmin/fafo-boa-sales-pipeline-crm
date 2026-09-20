import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "pipeline_summary",
  title: "Pipeline summary",
  description: "Summarize deal count and total value per stage for a pipeline.",
  inputSchema: {
    pipeline_id: z.string().uuid().optional().describe("Pipeline to summarize; defaults to the first pipeline."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ pipeline_id }, ctx) => {
    const supabase = supabaseForUser(ctx);

    let targetPipelineId = pipeline_id;
    if (!targetPipelineId) {
      const { data, error } = await supabase
        .from("pipelines")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw new ToolError(error.message);
      if (!data) throw new ToolError("No pipeline found for this account.");
      targetPipelineId = data.id;
    }

    const [stagesResult, dealsResult] = await Promise.all([
      supabase
        .from("pipeline_stages")
        .select("id, name, position")
        .eq("pipeline_id", targetPipelineId)
        .order("position", { ascending: true }),
      supabase.from("deals").select("stage_id, value").eq("pipeline_id", targetPipelineId),
    ]);
    if (stagesResult.error) throw new ToolError(stagesResult.error.message);
    if (dealsResult.error) throw new ToolError(dealsResult.error.message);

    const deals = dealsResult.data ?? [];
    const stages = (stagesResult.data ?? []).map((stage) => {
      const stageDeals = deals.filter((d) => d.stage_id === stage.id);
      return {
        id: stage.id,
        name: stage.name,
        position: stage.position,
        deal_count: stageDeals.length,
        total_value: stageDeals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      };
    });

    const summary = {
      pipeline_id: targetPipelineId,
      total_deals: deals.length,
      total_value: deals.reduce((sum, d) => sum + (d.value ?? 0), 0),
      stages,
    };

    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: { summary },
    };
  },
});
