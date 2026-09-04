import { env } from "cloudflare:workers";
import { jsonError, requireLibraryAdmin } from "@/lib/library-server";

export async function GET(request: Request, context: { params: { versionId: string } }) {
  try {
    requireLibraryAdmin(request);
    const row = await env.DB.prepare("SELECT object_key,filename,mime FROM library_versions WHERE id=?").bind(context.params.versionId).first<{ object_key: string; filename: string; mime: string }>();
    if (!row?.object_key) return Response.json({ error: "Arquivo não encontrado." }, { status: 404 });
    const object = await env.LIBRARY.get(row.object_key);
    if (!object) return Response.json({ error: "Objeto não encontrado." }, { status: 404 });
    return new Response(object.body, { headers: { "content-type": row.mime || "application/octet-stream", "content-disposition": `attachment; filename="${row.filename || "arquivo"}"`, "cache-control": "private, no-store" } });
  } catch (error) { return jsonError(error); }
}
