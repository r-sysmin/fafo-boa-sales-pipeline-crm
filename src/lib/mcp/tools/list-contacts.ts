import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

const one = <T,>(value: T | T[] | null | undefined): T | null =>
  Array.isArray(value) ? (value[0] ?? null) : (value ?? null);

export default defineTool({
  name: "list_contacts",
  title: "List contacts",
  description: "List or search the caller's contacts by name or email.",
  inputSchema: {
    search: z.string().trim().min(1).max(100).optional().describe("Match against first name, last name, or email."),
    limit: z.number().int().min(1).max(200).default(50).describe("Maximum contacts to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ search, limit }, ctx) => {
    const supabase = supabaseForUser(ctx);
    let query = supabase
      .from("contacts")
      .select("id, first_name, last_name, email, phone, position, company_id, companies(name)")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (search) {
      const term = search.replace(/[%,]/g, "");
      query = query.or(
        `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`,
      );
    }

    const { data, error } = await query;
    if (error) throw new ToolError(error.message);

    const contacts = (data ?? []).map((c) => ({
      id: c.id,
      first_name: c.first_name,
      last_name: c.last_name,
      email: c.email,
      phone: c.phone,
      position: c.position,
      company_id: c.company_id,
      company: one(c.companies)?.name ?? null,
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(contacts) }],
      structuredContent: { contacts },
    };
  },
});
