import { env } from "cloudflare:workers";
import { searchExpression } from "@/lib/library-model";
import { jsonError, requireLibraryAdmin } from "@/lib/library-server";

export async function GET(request: Request) {
  try {
    requireLibraryAdmin(request);
    const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
    if (q.length < 2) return Response.json({ results: [] });
    const expression = searchExpression(q);
    if (!expression) return Response.json({ results: [] });
    const result = await env.DB.prepare(`SELECT p.id,p.version_id,p.page,p.printed_page,p.locator,p.content,p.method,
      v.label,v.filename,s.id AS source_id,s.title AS source_title
      FROM library_passages_fts f JOIN library_passages p ON p.id=f.id
      JOIN library_versions v ON v.id=p.version_id JOIN library_sources s ON s.id=v.source_id
      WHERE library_passages_fts MATCH ? ORDER BY p.page LIMIT 50`).bind(expression).all();
    return Response.json({ results: result.results });
  } catch (error) { return jsonError(error); }
}
