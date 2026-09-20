import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_deal",
  title: "Update deal",
  description: "Update a deal's stage, value, probability, close date, or notes.",
  inputSchema: {
    deal_id: z.string().uuid().describe("Deal to update."),
    stage_id: z.string().uuid().optional().describe("Move the deal to this stage."),
    title: z.string().trim().min(1).max(200).optional(),
    value: z.number().nonnegative().optional(),
    probability: z.number().int().min(0).max(100).optional(),
    close_date: z.string().date().optional(),
    notes: z.string().max(2000).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ deal_id, ...patch }, ctx) => {
    const updates = Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined));
    if (Object.keys(updates).length === 0) throw new ToolError("Provide at least one field to update.");

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deals")
      .update(updates)
      .eq("id", deal_id)
      .select("id, title, value, probability, close_date, stage_id")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError("Deal not found.");

    const deal = {
      id: data.id,
      title: data.title,
      value: data.value,
      probability: data.probability,
      close_date: data.close_date,
      stage_id: data.stage_id,
    };
    return {
      content: [{ type: "text", text: `Updated deal "${deal.title}".` }],
      structuredContent: { deal },
    };
  },
});
