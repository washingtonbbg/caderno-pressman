import catalog from '@/data/study-catalog.json';
import { HttpError, choice, field } from '@/lib/library-model';
import { recordAttempt, type Confidence } from '@/lib/study-model';
import { EXAM_ID, capExamReview, examBlock } from '@/lib/exam-plan';
import { readProgress, readQuestionProgress, studyDb, studyError, studyJson, studyUser } from '@/lib/study-server';

export async function GET(request: Request) {
  try { return studyJson({progress:await readProgress(studyUser(request))}); }
  catch(error) { return studyError(error); }
}

export async function POST(request: Request) {
  try {
    const user = studyUser(request,true);
    const body = await request.json();
    const questionId = field(body.questionId,'Questão',200,true);
    const question = catalog.find(q=>q.id===questionId);
    if (!question) throw new HttpError(404,'Questão não encontrada.');
    if (question.scoring === 'discussion') throw new HttpError(409,'Esta questão está disponível para discussão conceitual, sem pontuação enquanto a classificação permanece em dúvida.');
    const confidence = choice(body.confidence,['guess','unsure','sure'],'Confiança') as Confidence;
    const selected = body.selected;
    if (!Number.isInteger(selected) || selected < -1 || selected >= question.options.length) throw new HttpError(400,'Resposta inválida.');
    const attemptId = field(body.attemptId,'Tentativa',36,true);
    if (!/^[0-9a-f-]{36}$/i.test(attemptId)) throw new HttpError(400,'Tentativa inválida.');
    const id = `${user}:${attemptId}`;
    const duplicate = await studyDb().prepare('SELECT question_id FROM study_attempts WHERE id=? AND user_id=?').bind(id,user).first<{question_id:string}>();
    if (duplicate) {
      if (duplicate.question_id !== questionId) throw new HttpError(409,'Esta tentativa já pertence a outra questão.');
      return studyJson({progress:await readQuestionProgress(user,questionId)});
    }
    const previous = await readQuestionProgress(user,questionId);
    const at=Date.now();
    let next = recordAttempt(questionId,previous,selected === question.answer,confidence,at);
    if(body.examId) {
      if(body.examId!==EXAM_ID||!examBlock(question))throw new HttpError(400,'Questão fora do recorte do edital.');
      next=capExamReview(next,at);
    }
    try {
      await studyDb().batch([
        studyDb().prepare('INSERT INTO study_attempts (id,user_id,question_id,ordinal,selected,confidence,correct,created_at) VALUES(?,?,?,?,?,?,?,?)')
          .bind(id,user,questionId,next.attempts,selected,confidence,Number(next.lastCorrect),next.lastAt),
        studyDb().prepare(`INSERT INTO study_progress (id,user_id,question_id,attempts,correct,last_correct,confidence,interval_days,due_at,last_at,first_correct,delayed_attempts,delayed_correct,note,error_kind)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,question_id) DO UPDATE SET
          attempts=excluded.attempts,correct=excluded.correct,last_correct=excluded.last_correct,confidence=excluded.confidence,
          interval_days=excluded.interval_days,due_at=excluded.due_at,last_at=excluded.last_at,
          delayed_attempts=excluded.delayed_attempts,delayed_correct=excluded.delayed_correct`)
          .bind(`${user}:${questionId}`,user,questionId,next.attempts,next.correct,Number(next.lastCorrect),confidence,next.intervalDays,next.dueAt,next.lastAt,Number(next.firstCorrect),next.delayedAttempts,next.delayedCorrect,next.note,next.errorKind),
      ]);
    } catch (error) {
      // The unique ordinal makes concurrent updates atomic; a repeated request is safe to retry.
      const saved = await studyDb().prepare('SELECT id FROM study_attempts WHERE id=? AND user_id=?').bind(id,user).first();
      if (saved) return studyJson({progress:await readQuestionProgress(user,questionId)});
      if (String(error).includes('UNIQUE constraint')) throw new HttpError(409,'O histórico mudou em outra aba. Tente salvar novamente.');
      throw error;
    }
    return studyJson({progress:await readQuestionProgress(user,questionId)});
  } catch(error) { return studyError(error); }
}

export async function PATCH(request: Request) {
  try {
    const user = studyUser(request,true);
    const body = await request.json();
    const questionId = field(body.questionId,'Questão',200,true);
    const note = field(body.note,'Anotação',3000);
    const errorKind = choice(body.errorKind,['','concept','attention','application','guess'],'Motivo');
    if(!Number.isInteger(body.noteRevision)||body.noteRevision<0) throw new HttpError(400,'Versão da anotação inválida.');
    const result = await studyDb().prepare('UPDATE study_progress SET note=?,error_kind=?,note_revision=note_revision+1 WHERE user_id=? AND question_id=? AND note_revision=?').bind(note,errorKind,user,questionId,body.noteRevision).run();
    if (!result.meta.changes) {
      const latest=await readQuestionProgress(user,questionId);
      if(!latest) throw new HttpError(404,'Registre uma tentativa antes de anotar.');
      return studyJson({error:'A anotação mudou em outra aba. Compare os textos antes de salvar.',latest},409);
    }
    return studyJson({saved:true,noteRevision:body.noteRevision+1});
  } catch(error) { return studyError(error); }
}
