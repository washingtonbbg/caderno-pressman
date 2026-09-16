import {studyDb,studyUser,studyJson,studyError} from '@/lib/study-server';
import {HttpError} from '@/lib/library-model';
import {defaultSemaSettings,validSemaSettings} from '@/lib/sema-plan';

export async function GET(request:Request) {
 try {
  const user=studyUser(request);
  const [settings,timing,daily]=await Promise.all([
   studyDb().prepare("SELECT minutes,days FROM study_plans WHERE user_id=? AND program='sema-ti-2026'").bind(user).first<{minutes:number;days:string}>(),
   studyDb().prepare(`SELECT question_id AS questionId,COUNT(*) AS attempts,SUM(response_ms) AS responseMs,SUM(study_ms) AS studyMs,
    SUM(CASE WHEN study_ms>0 THEN 1 ELSE 0 END) AS timedAttempts,MAX(created_at) AS lastAt,
    (SELECT response_ms FROM study_attempts last WHERE last.user_id=a.user_id AND last.question_id=a.question_id ORDER BY ordinal DESC LIMIT 1) AS lastResponseMs
    FROM study_attempts a WHERE user_id=? GROUP BY question_id`).bind(user).all(),
   studyDb().prepare("SELECT strftime('%Y-%m-%d',created_at/1000,'unixepoch','-4 hours') AS day,SUM(study_ms) AS studyMs FROM study_attempts WHERE user_id=? AND question_id LIKE 'sema-mt-ti:%' GROUP BY day ORDER BY day DESC LIMIT 90").bind(user).all(),
  ]);
  return studyJson({settings:settings?{minutes:settings.minutes,days:JSON.parse(settings.days)}:defaultSemaSettings,timing:timing.results,daily:daily.results});
 } catch(error){return studyError(error);}
}
export async function PUT(request:Request) {
 try {
  const user=studyUser(request,true),body=await request.json();
  if(!validSemaSettings(body))throw new HttpError(400,'Escolha de 15 a 180 minutos e pelo menos um dia por semana.');
  await studyDb().prepare("INSERT INTO study_plans(user_id,program,minutes,days,updated_at) VALUES(?,'sema-ti-2026',?,?,?) ON CONFLICT(user_id,program) DO UPDATE SET minutes=excluded.minutes,days=excluded.days,updated_at=excluded.updated_at").bind(user,body.minutes,JSON.stringify(body.days),Date.now()).run();
  return studyJson({saved:true});
 }catch(error){return studyError(error);}
}
export async function PATCH(request:Request) {
 try {
  const user=studyUser(request,true),body=await request.json();
  if(typeof body.attemptId!=='string'||!/^[0-9a-f-]{36}$/i.test(body.attemptId)||!Number.isInteger(body.studyMs)||body.studyMs<0||body.studyMs>86400000)throw new HttpError(400,'Registro de tempo inválido.');
  const result=await studyDb().prepare('UPDATE study_attempts SET study_ms=MAX(study_ms,?) WHERE id=? AND user_id=?').bind(body.studyMs,`${user}:${body.attemptId}`,user).run();
  if(!result.meta.changes)throw new HttpError(404,'Salve a resposta antes de registrar o tempo.');
  return studyJson({saved:true});
 }catch(error){return studyError(error);}
}
