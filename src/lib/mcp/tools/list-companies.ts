import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_companies",
  title: "List companies",
  description: "List or search the caller's companies by name.",
  inputSchema: {
    search: z.string().trim().min(1).max(100).optional().describe("Match against the company name."),
    limit: z.number().int().min(1).max(200).default(50),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("companies")
      .select("id, name, industry, website")
      .order("name", { ascending: true })
      .limit(limit);
    if (search) query = query.ilike("name", `%${search.replace(/[%,]/g, "")}%`);

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);

    const companies = (data ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      industry: c.industry,
      website: c.website,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(companies) }],
      structuredContent: { companies },
    };
  },
});
