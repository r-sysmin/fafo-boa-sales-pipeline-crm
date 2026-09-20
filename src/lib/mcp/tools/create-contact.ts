import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { requireUser, supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_contact",
  title: "Create contact",
  description: "Add a new contact to the caller's CRM.",
  inputSchema: {
    first_name: z.string().trim().min(1).max(100),
    last_name: z.string().trim().min(1).max(100),
    email: z.string().trim().email().max(255).optional(),
    phone: z.string().trim().max(50).optional(),
    position: z.string().trim().max(120).optional(),
    company_id: z.string().uuid().optional().describe("Company this contact works for."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (args, ctx) => {
    const userId = requireUser(ctx);
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("contacts")
      .insert({ ...args, created_by: userId })
      .select("id, first_name, last_name, email")
      .single();
    if (error) throw new ToolError(error.message);

    const contact = {
      id: data.id,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
    };
    return {
      content: [{ type: "text", text: `Created contact ${contact.first_name} ${contact.last_name}.` }],
      structuredContent: { contact },
    };
  },
});
