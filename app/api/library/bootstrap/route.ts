import { env } from "cloudflare:workers";
import { bankSeed, sourceSeed } from "@/lib/library-seed";
import { jsonError, now, requireLibraryAdmin } from "@/lib/library-server";

export async function POST(request: Request) {
  try {
    const actor = requireLibraryAdmin(request);
    const sourceVersions = new Map<string, string>();
    for (const source of sourceSeed) {
      await env.DB.prepare(`INSERT INTO library_sources (id,kind,title,authors,publisher,identifier,official_url,topics,created_at)
        VALUES(?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET title=excluded.title,authors=excluded.authors,official_url=excluded.official_url`)
        .bind(source.id, source.kind, source.title, source.authors, source.label, source.id, source.url ?? "", "administração", now()).run();
      const versionId = `declared-${source.id}`;
      sourceVersions.set(source.id, versionId);
      await env.DB.prepare(`INSERT OR IGNORE INTO library_versions (id,source_id,label,captured_at,status,created_by) VALUES(?,?,?,?,?,?)`)
        .bind(versionId, source.id, source.label, now(), "declared", actor.email).run();
    }
    for (const question of bankSeed.questions) {
      const questionId = String(question.id);
      const stamp = now();
      await env.DB.prepare(`INSERT INTO bank_questions (id,legacy_number,tec_id,source,subject,prompt,answer_id,status,origin,explanation,review_note,source_url,reference_text,bank_analysis,review_status,suggested_answer,created_at,updated_at)
        VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(id) DO UPDATE SET prompt=excluded.prompt,subject=excluded.subject,answer_id=excluded.answer_id,source_url=excluded.source_url,review_note=excluded.review_note,updated_at=excluded.updated_at`)
        .bind(questionId, question.number, question.tecId, question.source, question.subject, question.prompt, `${questionId}-option-${question.answer}`, "imported", "admin-bank", question.explanation ?? "", question.bibliography ?? "Fonte identificada na transcrição; conferir a edição e a página.", question.sourceUrl ?? "", question.referenceText ?? "", question.bankAnalysis ?? "", question.reviewStatus ?? "needs_review", question.suggestedAnswer ?? null, stamp, stamp).run();
      for (let position = 0; position < question.options.length; position++) {
        await env.DB.prepare(`INSERT INTO bank_options (id,question_id,position,content,analysis) VALUES(?,?,?,?,?)
          ON CONFLICT(id) DO UPDATE SET content=excluded.content,analysis=excluded.analysis`).bind(`${questionId}-option-${position}`, questionId, position, question.options[position], question.optionAnalysis?.[position] ?? "").run();
      }
      for (const source of sourceSeed.filter((entry) => entry.qs.includes(question.number))) {
        const versionId = sourceVersions.get(source.id);
        if (!versionId) continue;
        await env.DB.prepare(`INSERT OR IGNORE INTO bank_citations (id,question_id,version_id,role,locator,note,verified) VALUES(?,?,?,?,?,?,?)`)
          .bind(`citation-${questionId}-${source.id}`, questionId, versionId, "declared", source.locator ?? "", "Fonte identificada na transcrição; conferir a edição e a página.", 0).run();
      }
    }
    await env.DB.prepare(`INSERT INTO library_meta (key,value) VALUES(?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value`).bind("bank.admin-107.revision", "admin-107-v1").run();
    return Response.json({ importedQuestions: bankSeed.questions.length, declaredSources: sourceSeed.length });
  } catch (error) { return jsonError(error); }
}
