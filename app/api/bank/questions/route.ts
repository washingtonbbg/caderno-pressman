import { env } from "cloudflare:workers";
import { jsonError } from "@/lib/library-server";

export async function GET() {
  try {
    const result = await env.DB.prepare(`SELECT q.*, GROUP_CONCAT(o.position || '::' || o.content, '||') AS options
      FROM bank_questions q LEFT JOIN bank_options o ON o.question_id=q.id GROUP BY q.id ORDER BY q.legacy_number`).all();
    return Response.json({ questions: result.results });
  } catch (error) { return jsonError(error); }
}
