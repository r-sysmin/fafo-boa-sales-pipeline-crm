import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_pipelines",
  title: "List pipelines",
  description: "List the caller's sales pipelines with their stages in order.",
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("pipelines")
      .select("id, name, pipeline_stages(id, name, position)")
      .order("created_at", { ascending: true });
    if (error) throw new ToolError(error.message);

    const pipelines = (data ?? []).map((p) => ({
      id: p.id,
      name: p.name,
      stages: [...(p.pipeline_stages ?? [])]
        .sort((a, b) => a.position - b.position)
        .map((s) => ({ id: s.id, name: s.name, position: s.position })),
    }));

    return {
      content: [{ type: "text", text: JSON.stringify(pipelines) }],
      structuredContent: { pipelines },
    };
  },
});
