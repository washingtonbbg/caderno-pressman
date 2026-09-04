import { env } from "cloudflare:workers";
import { jsonError, now, requireLibraryAdmin, safeFileName, sha256 } from "@/lib/library-server";

export async function POST(request: Request) {
  try {
    const actor = requireLibraryAdmin(request);
    const form = await request.formData();
    const file = form.get("file");
    const sourceId = String(form.get("sourceId") ?? "").trim();
    if (!(file instanceof File) || !sourceId) return Response.json({ error: "Arquivo e fonte são obrigatórios." }, { status: 400 });
    const source = await env.DB.prepare("SELECT id FROM library_sources WHERE id=?").bind(sourceId).first();
    if (!source) return Response.json({ error: "Fonte não encontrada." }, { status: 404 });
    const versionId = crypto.randomUUID();
    const bytes = await file.arrayBuffer();
    const filename = safeFileName(file.name);
    const objectKey = `sources/${sourceId}/${versionId}/${filename}`;
    await env.LIBRARY.put(objectKey, bytes, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    try {
      await env.DB.prepare(`INSERT INTO library_versions
        (id,source_id,label,published_on,valid_from,valid_until,captured_at,object_key,filename,mime,size,sha256,status,created_by)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(versionId, sourceId, String(form.get("label") ?? file.name),
        String(form.get("publishedOn") ?? ""), String(form.get("validFrom") ?? ""), String(form.get("validUntil") ?? ""),
        now(), objectKey, filename, file.type || "application/octet-stream", bytes.byteLength, await sha256(bytes), "uploaded", actor.email).run();
    } catch (error) {
      await env.LIBRARY.delete(objectKey);
      throw error;
    }
    return Response.json({ versionId, filename, size: bytes.byteLength }, { status: 201 });
  } catch (error) { return jsonError(error); }
}
