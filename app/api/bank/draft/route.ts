import { draftFromPassage } from "@/lib/library-model";
import { jsonError, requireLibraryAdmin } from "@/lib/library-server";

export async function POST(request: Request) {
  try {
    requireLibraryAdmin(request);
    const body = await request.json() as { text?: string; term?: string; source?: string; page?: string };
    const draft = draftFromPassage(String(body.text ?? ""), String(body.term ?? ""));
    return Response.json({ draft: { ...draft, source: body.source ?? "Fonte não informada", page: body.page ?? "" }, reviewRequired: true });
  } catch (error) { return jsonError(error); }
}
