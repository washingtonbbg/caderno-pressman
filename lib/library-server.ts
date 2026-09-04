import { env } from "cloudflare:workers";

export type LibraryActor = { id: string; email: string; name: string };

export function actorFromRequest(request: Request): LibraryActor | null {
  const email = request.headers.get("oai-authenticated-user-email")?.trim().toLowerCase();
  const id = request.headers.get("oai-authenticated-user-id")?.trim();
  if (!email || !id) return null;
  return {
    id,
    email,
    name: request.headers.get("oai-authenticated-user-full-name")?.trim() || email,
  };
}

export function requireLibraryAdmin(request: Request): LibraryActor {
  const actor = actorFromRequest(request);
  if (!actor) throw new Response(JSON.stringify({ error: "Autenticação ChatGPT necessária." }), { status: 401, headers: { "content-type": "application/json" } });
  const configured = String((env as Record<string, unknown>).LIBRARY_ADMIN_EMAILS ?? "")
    .split(",").map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!configured.includes(actor.email)) {
    throw new Response(JSON.stringify({ error: "Acesso restrito ao administrador da biblioteca." }), { status: 403, headers: { "content-type": "application/json" } });
  }
  return actor;
}

export function jsonError(error: unknown) {
  if (error instanceof Response) return error;
  const message = error instanceof Error ? error.message : "Erro inesperado.";
  return Response.json({ error: message }, { status: 500 });
}

export function now() { return new Date().toISOString(); }

export function safeFileName(value: string) {
  return value.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 140) || "arquivo";
}

export async function sha256(bytes: ArrayBuffer) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, "0")).join("");
}
