import { env } from "cloudflare:workers";
import { jsonError, now, requireLibraryAdmin } from "@/lib/library-server";

export async function GET() {
  try {
    const result = await env.DB.prepare(`SELECT s.*, COUNT(v.id) AS version_count
      FROM library_sources s LEFT JOIN library_versions v ON v.source_id=s.id
      GROUP BY s.id ORDER BY s.kind, s.title`).all();
    return Response.json({ sources: result.results });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = requireLibraryAdmin(request);
    const body = await request.json() as Record<string, unknown>;
    const title = String(body.title ?? "").trim();
    if (!title) return Response.json({ error: "Informe o título da fonte." }, { status: 400 });
    const id = String(body.id ?? crypto.randomUUID()).trim();
    await env.DB.prepare(`INSERT INTO library_sources
      (id,kind,title,authors,publisher,identifier,official_url,topics,created_at)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET
      kind=excluded.kind,title=excluded.title,authors=excluded.authors,publisher=excluded.publisher,
      identifier=excluded.identifier,official_url=excluded.official_url,topics=excluded.topics`)
      .bind(id, String(body.kind ?? "book"), title, String(body.authors ?? ""), String(body.publisher ?? ""),
        String(body.identifier ?? ""), String(body.officialUrl ?? ""), String(body.topics ?? ""), now()).run();
    await env.DB.prepare(`INSERT INTO library_audit (id,actor,action,target,created_at) VALUES(?,?,?,?,?)`)
      .bind(crypto.randomUUID(), actor.email, "source.upsert", id, now()).run();
    return Response.json({ id }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
