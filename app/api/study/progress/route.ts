import catalog from '@/data/study-catalog.json';
import { HttpError, choice, field } from '@/lib/library-model';
import { FSRS_VERSION, memoryGrade, recordAttempt, type Confidence, type MemoryGrade } from '@/lib/study-model';
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
    let question = catalog.find(q=>q.id===questionId);
    if(!question){
      const row=await studyDb().prepare('SELECT id,subject,prompt,answer_id,source FROM bank_questions WHERE id=?').bind(questionId).first<{id:string;subject:string;prompt:string;answer_id:string;source:string}>();
      if(row){const opts=await studyDb().prepare('SELECT content FROM bank_options WHERE question_id=? ORDER BY position').bind(questionId).all<{content:string}>();const answer=Number(row.answer_id.match(/-option-([0-4])$/)?.[1]??-1);if(answer>=0&&answer<opts.results.length)question={...catalog[0],...row,notebook:'/biblioteca',notebookTitle:'Questões cadastradas',options:opts.results.map(o=>o.content),answer,scoring:'',explanation:'',citations:[]};}
    }
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
    const correct=selected===question.answer;
    const rating=body.memoryRating===undefined?memoryGrade(correct,confidence):body.memoryRating;
    if(!Number.isInteger(rating)||rating<1||rating>4)throw new HttpError(400,'Avaliação da memória inválida.');
    const ratingSource=body.ratingSource===undefined?'inferred':choice(body.ratingSource,['declared','inferred'],'Origem da avaliação');
    const responseMs=body.responseMs??0;
    if(!Number.isInteger(responseMs)||responseMs<0||responseMs>86_400_000)throw new HttpError(400,'Tempo de resposta inválido.');
    const elapsedDays=previous?Math.max(0,Math.round((at-previous.lastAt)/86_400_000)):0;
    let next = recordAttempt(questionId,previous,correct,confidence,at,rating as MemoryGrade);
    if(body.examId) {
      if(body.examId!==EXAM_ID||!examBlock(question))throw new HttpError(400,'Questão fora do recorte do edital.');
      next=capExamReview(next,at);
    }
    try {
      await studyDb().batch([
        studyDb().prepare('INSERT INTO study_attempts (id,user_id,question_id,ordinal,selected,confidence,correct,created_at,memory_rating,rating_source,response_ms,scheduled_days,elapsed_days,scheduler_version) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)')
          .bind(id,user,questionId,next.attempts,selected,confidence,Number(next.lastCorrect),next.lastAt,rating,ratingSource,responseMs,next.intervalDays,elapsedDays,FSRS_VERSION),
        studyDb().prepare(`INSERT INTO study_progress (id,user_id,question_id,attempts,correct,last_correct,confidence,interval_days,due_at,last_at,first_correct,delayed_attempts,delayed_correct,note,error_kind,stability,difficulty,lapses,fsrs_state,fsrs_reps,learning_steps)
          VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(user_id,question_id) DO UPDATE SET
          attempts=excluded.attempts,correct=excluded.correct,last_correct=excluded.last_correct,confidence=excluded.confidence,
          interval_days=excluded.interval_days,due_at=excluded.due_at,last_at=excluded.last_at,
          delayed_attempts=excluded.delayed_attempts,delayed_correct=excluded.delayed_correct,
          stability=excluded.stability,difficulty=excluded.difficulty,lapses=excluded.lapses,
          fsrs_state=excluded.fsrs_state,fsrs_reps=excluded.fsrs_reps,learning_steps=excluded.learning_steps`)
          .bind(`${user}:${questionId}`,user,questionId,next.attempts,next.correct,Number(next.lastCorrect),confidence,next.intervalDays,next.dueAt,next.lastAt,Number(next.firstCorrect),next.delayedAttempts,next.delayedCorrect,next.note,next.errorKind,next.stability,next.difficulty,next.lapses,next.fsrsState,next.fsrsReps,next.learningSteps),
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
