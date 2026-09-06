import { env } from "cloudflare:workers";
import { checkWriteOrigin, field, normalizeDraft, HttpError } from "@/lib/library-model";
import { jsonError, now, requireLibraryAdmin } from "@/lib/library-server";

type Row = Record<string, unknown>;

function answerIndex(answerId: unknown) {
  const match = String(answerId ?? "").match(/-option-([0-4])$/);
  return match ? Number(match[1]) : -1;
}

async function hydrateQuestion(row: Row) {
  const id = String(row.id ?? "");
  const optionsResult = await env.DB.prepare("SELECT id,position,content,analysis FROM bank_options WHERE question_id=? ORDER BY position").bind(id).all();
  const citationResult = await env.DB.prepare(`SELECT c.id,c.role,c.locator,c.note,c.verified,v.label AS version_label,s.title,s.kind,s.official_url
    FROM bank_citations c JOIN library_versions v ON v.id=c.version_id JOIN library_sources s ON s.id=v.source_id
    WHERE c.question_id=? ORDER BY c.locator,c.id`).bind(id).all();
  const optionRows = (optionsResult.results ?? []) as Row[];
  return {
    ...row,
    number: row.legacy_number ?? null,
    tecId: row.tec_id ?? null,
    sourceUrl: row.source_url ?? "",
    referenceText: row.reference_text ?? "",
    bankAnalysis: row.bank_analysis ?? "",
    reviewStatus: row.review_status ?? "needs_review",
    suggestedAnswer: row.suggested_answer ?? null,
    answer: answerIndex(row.answer_id),
    options: optionRows.map(option => String(option.content ?? "")),
    optionAnalysis: optionRows.map(option => String(option.analysis ?? "")),
    citations: ((citationResult.results ?? []) as Row[]).map(citation => ({
      id: String(citation.id ?? ""), title: String(citation.title ?? ""), kind: String(citation.kind ?? ""),
      label: String(citation.version_label ?? ""), locator: String(citation.locator ?? ""), role: String(citation.role ?? ""),
      verified: Number(citation.verified ?? 0), official_url: String(citation.official_url ?? ""), note: String(citation.note ?? ""),
    })),
  };
}

export async function GET() {
  try {
    const result = await env.DB.prepare("SELECT q.* FROM bank_questions q ORDER BY COALESCE(q.legacy_number,999999999),q.created_at,q.id").all();
    const questions = await Promise.all(((result.results ?? []) as Row[]).map(hydrateQuestion));
    return Response.json({ questions }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return jsonError(error); }
}

export async function POST(request: Request) {
  try {
    const actor = requireLibraryAdmin(request);
    checkWriteOrigin(request);
    const body = await request.json() as Record<string, unknown>;
    const draft = normalizeDraft(body);
    const idInput = typeof body.id === "string" && body.id.trim() ? field(body.id, "ID", 160) : "";
    const tecId = typeof body.tecId === "string" && body.tecId.trim() ? field(body.tecId, "ID Tec", 160) : null;
    const legacyNumber = body.number === undefined || body.number === null || body.number === "" ? null : Number(body.number);
    if (legacyNumber !== null && (!Number.isInteger(legacyNumber) || legacyNumber < 1)) throw new HttpError(400, "Número da questão inválido.");
    let questionId = idInput || `bank-${crypto.randomUUID()}`;
    if (!idInput && tecId) {
      const existing = await env.DB.prepare("SELECT id FROM bank_questions WHERE tec_id=?").bind(tecId).first<{ id: string }>();
      if (existing?.id) questionId = existing.id;
    }
    const sourceKey = draft.sourceUrl.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 90) || "fonte";
    const sourceId = `source-${sourceKey}`;
    const versionId = `${sourceId}-declared`;
    const stamp = now();
    await env.DB.prepare(`INSERT INTO library_sources (id,kind,title,authors,publisher,identifier,official_url,topics,created_at)
      VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,official_url=excluded.official_url`).bind(sourceId, "question-bank", draft.source, "", "", sourceId, draft.sourceUrl, draft.subject, stamp).run();
    await env.DB.prepare(`INSERT OR IGNORE INTO library_versions (id,source_id,label,captured_at,status,created_by) VALUES(?,?,?,?,?,?)`)
      .bind(versionId, sourceId, "Fonte declarada no cadastro", stamp, "declared", actor.email).run();
    await env.DB.prepare(`INSERT INTO bank_questions (id,legacy_number,tec_id,source,subject,prompt,answer_id,status,origin,explanation,review_note,source_url,reference_text,bank_analysis,review_status,suggested_answer,created_at,updated_at)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET legacy_number=excluded.legacy_number,tec_id=excluded.tec_id,source=excluded.source,subject=excluded.subject,prompt=excluded.prompt,answer_id=excluded.answer_id,status=excluded.status,explanation=excluded.explanation,review_note=excluded.review_note,source_url=excluded.source_url,reference_text=excluded.reference_text,bank_analysis=excluded.bank_analysis,review_status=excluded.review_status,suggested_answer=excluded.suggested_answer,updated_at=excluded.updated_at`)
      .bind(questionId, legacyNumber, tecId, draft.source, draft.subject, draft.prompt, `${questionId}-option-${draft.answer}`, draft.reviewStatus, "user-library", draft.explanation, draft.reviewNote, draft.sourceUrl, draft.referenceText, draft.bankAnalysis, draft.reviewStatus, draft.suggestedAnswer ?? null, stamp, stamp).run();
    await env.DB.batch(draft.options.map((content, position) => env.DB.prepare(`INSERT INTO bank_options (id,question_id,position,content,analysis) VALUES(?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET content=excluded.content,analysis=excluded.analysis`).bind(`${questionId}-option-${position}`, questionId, position, content, draft.optionAnalysis[position])));
    const citationId = `citation-${questionId}-${sourceId}`.slice(0, 180);
    await env.DB.prepare(`INSERT INTO bank_citations (id,question_id,version_id,role,locator,note,verified) VALUES(?,?,?,?,?,?,?)
      ON CONFLICT(id) DO UPDATE SET version_id=excluded.version_id,locator=excluded.locator,note=excluded.note`).bind(citationId, questionId, versionId, "origin", field(body.locator, "Localizador", 300), "Fonte HTTPS obrigatória no cadastro; conferir a página original antes de publicar como material revisado.", 0).run();
    await env.DB.prepare("INSERT INTO library_audit (id,actor,action,target,created_at) VALUES(?,?,?,?,?)")
      .bind(`audit-${crypto.randomUUID()}`, actor.email, "question.upsert", questionId, stamp).run();
    const saved = await env.DB.prepare("SELECT * FROM bank_questions WHERE id=?").bind(questionId).first<Row>();
    return Response.json({ question: saved ? await hydrateQuestion(saved) : null }, { status: 201, headers: { "cache-control": "no-store" } });
  } catch (error) { return jsonError(error); }
}
