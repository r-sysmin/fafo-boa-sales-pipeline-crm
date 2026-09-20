import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_deal",
  title: "Create deal",
  description: "Create a new deal in one of the caller's pipeline stages.",
  inputSchema: {
    title: z.string().trim().min(1).max(200).describe("Deal title."),
    pipeline_id: z.string().uuid().describe("Pipeline the deal belongs to."),
    stage_id: z.string().uuid().describe("Stage within that pipeline."),
    value: z.number().nonnegative().optional().describe("Deal value in the account currency."),
    probability: z.number().int().min(0).max(100).optional().describe("Win probability percentage."),
    close_date: z.string().date().optional().describe("Expected close date (YYYY-MM-DD)."),
    company_id: z.string().uuid().optional().describe("Related company."),
    contact_id: z.string().uuid().optional().describe("Primary contact."),
    notes: z.string().max(2000).optional().describe("Free-form notes."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (args, ctx) => {
    const userId = requireUser(ctx);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("deals")
      .insert({ ...args, owner_id: userId, created_by: userId })
      .select("id, title, value, stage_id, pipeline_id")
      .single();
    if (error) throw new ToolError(error.message);

    const deal = {
      id: data.id,
      title: data.title,
      value: data.value,
      stage_id: data.stage_id,
      pipeline_id: data.pipeline_id,
    };
    return {
      content: [{ type: "text", text: `Created deal "${deal.title}".` }],
      structuredContent: { deal },
    };
  },
});
