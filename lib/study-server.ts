import { env } from 'cloudflare:workers';
import { HttpError, checkWriteOrigin } from './library-model';
import type { StudyProgress } from './study-model';

export function studyDb() { return env.DB; }
export function studyUser(request: Request, write = false) {
  const id = request.headers.get('oai-authenticated-user-id')?.trim();
  if (!id || !request.headers.get('oai-authenticated-user-email')) throw new HttpError(401, 'Entre com sua conta para salvar revisões e anotações.');
  if (write) checkWriteOrigin(request);
  return id;
}
const columns = `question_id AS questionId, attempts, correct, last_correct AS lastCorrect, confidence,
 interval_days AS intervalDays, due_at AS dueAt, last_at AS lastAt, first_correct AS firstCorrect,
 delayed_attempts AS delayedAttempts, delayed_correct AS delayedCorrect, note, error_kind AS errorKind, note_revision AS noteRevision`;
function normalize(row: StudyProgress) { return {...row, lastCorrect: !!row.lastCorrect, firstCorrect: !!row.firstCorrect}; }
export async function readProgress(user: string) {
  const rows = await studyDb().prepare(`SELECT ${columns} FROM study_progress WHERE user_id=?`).bind(user).all<StudyProgress>();
  return Object.fromEntries(rows.results.map(row => [row.questionId, normalize(row)]));
}
export async function readQuestionProgress(user: string, question: string) {
  const row = await studyDb().prepare(`SELECT ${columns} FROM study_progress WHERE user_id=? AND question_id=?`).bind(user,question).first<StudyProgress>();
  return row ? normalize(row) : undefined;
}
export function studyJson(body: unknown, status = 200) { return Response.json(body, {status,headers:{'cache-control':'private, no-store'}}); }
export function studyError(error: unknown) {
  if (error instanceof HttpError) return studyJson({error:error.message},error.status);
  console.error('Study request failed', error);
  return studyJson({error:'Não foi possível salvar ou carregar o estudo. Tente novamente.'},503);
}
