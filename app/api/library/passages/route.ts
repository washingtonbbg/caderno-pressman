import { env } from "cloudflare:workers";
import { jsonError, now, requireLibraryAdmin } from "@/lib/library-server";

export async function POST(request: Request) {
  try {
    const actor = requireLibraryAdmin(request);
    const body = await request.json() as Record<string, unknown>;
    const versionId = String(body.versionId ?? "");
    const content = String(body.content ?? "").trim();
    const page = Number(body.page ?? 0);
    if (!versionId || !content || !Number.isInteger(page) || page < 1) return Response.json({ error: "Trecho, versão e página são obrigatórios." }, { status: 400 });
    const id = crypto.randomUUID();
    await env.DB.prepare(`INSERT INTO library_passages (id,version_id,page,printed_page,locator,content,method,verified) VALUES(?,?,?,?,?,?,?,?)
      ON CONFLICT(version_id,page,locator) DO UPDATE SET content=excluded.content,method=excluded.method`).bind(id, versionId, page,
      String(body.printedPage ?? ""), String(body.locator ?? `p. ${page}`), content, String(body.method ?? "pdf-text"), 0).run();
    await env.DB.prepare(`INSERT INTO library_audit (id,actor,action,target,created_at) VALUES(?,?,?,?,?)`).bind(crypto.randomUUID(), actor.email, "passage.upsert", id, now()).run();
    return Response.json({ id }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
