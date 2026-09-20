import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_task",
  title: "Create task",
  description: "Create a follow-up task for the caller, optionally linked to a deal or contact.",
  inputSchema: {
    title: z.string().trim().min(1).max(200),
    description: z.string().max(2000).optional(),
    due_date: z.string().date().optional().describe("Due date (YYYY-MM-DD)."),
    priority: z.enum(["low", "medium", "high"]).default("medium"),
    deal_id: z.string().uuid().optional(),
    contact_id: z.string().uuid().optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (args, ctx) => {
    const userId = requireUser(ctx);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("tasks")
      .insert({ ...args, user_id: userId })
      .select("id, title, due_date, priority, completed")
      .single();
    if (error) throw new ToolError(error.message);

    const task = {
      id: data.id,
      title: data.title,
      due_date: data.due_date,
      priority: data.priority,
      completed: data.completed,
    };
    return {
      content: [{ type: "text", text: `Created task "${task.title}".` }],
      structuredContent: { task },
    };
  },
});
