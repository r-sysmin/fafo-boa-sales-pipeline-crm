import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_deals",
  title: "List deals",
  description: "List the caller's deals, optionally filtered by pipeline or stage.",
  inputSchema: {
    pipeline_id: z.string().uuid().optional().describe("Only deals in this pipeline."),
    stage_id: z.string().uuid().optional().describe("Only deals in this stage."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum deals to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ pipeline_id, stage_id, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("deals")
      .select(
        "id, title, value, probability, close_date, notes, pipeline_id, stage_id, pipeline_stages(name), companies(name), contacts(first_name, last_name)",
      )
      .order("updated_at", { ascending: false })
      .limit(limit);
    if (pipeline_id) query = query.eq("pipeline_id", pipeline_id);
    if (stage_id) query = query.eq("stage_id", stage_id);

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);

    const deals = (data ?? []).map((d) => ({
      id: d.id,
      title: d.title,
      value: d.value,
      probability: d.probability,
      close_date: d.close_date,
      notes: d.notes,
      pipeline_id: d.pipeline_id,
      stage_id: d.stage_id,
      stage: d.pipeline_stages?.name ?? null,
      company: d.companies?.name ?? null,
      contact: d.contacts ? `${d.contacts.first_name} ${d.contacts.last_name}` : null,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(deals) }],
      structuredContent: { deals },
    };
  },
});
