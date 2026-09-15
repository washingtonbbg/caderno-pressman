import catalog from '@/data/study-catalog.json';
import {field,HttpError} from '@/lib/library-model';
import {readProgress,studyDb,studyError,studyJson,studyUser} from '@/lib/study-server';
export async function GET(request:Request){try{
 const user=studyUser(request);const rows=await studyDb().prepare('SELECT question_id,content,revision FROM research_notes WHERE user_id=?').bind(user).all<{question_id:string;content:string;revision:number}>();
 return studyJson({notes:Object.fromEntries(rows.results.map(r=>[r.question_id,JSON.parse(r.content)])),revisions:Object.fromEntries(rows.results.map(r=>[r.question_id,r.revision])),progress:await readProgress(user)});
}catch(e){return studyError(e);}}
export async function PUT(request:Request){try{
 const user=studyUser(request,true);const body=await request.json();const id=field(body.questionId,'Questão',200,true);
 if(!catalog.some(q=>q.id===id)&&!await studyDb().prepare('SELECT id FROM bank_questions WHERE id=?').bind(id).first())throw new HttpError(404,'Questão não encontrada.');
 if(!Number.isInteger(body.revision)||body.revision<0)throw new HttpError(400,'Versão inválida.');
 const content:Record<string,string>={};for(const key of ['concept','definition','confusion','task','hypothesis','authorship','author','model','evidence','references'])content[key]=field(body.annotation?.[key],key,20000);
 if(!['unknown','human','ai','hybrid'].includes(content.authorship))throw new HttpError(400,'Autoria inválida.');
 const result=body.revision===0?await studyDb().prepare('INSERT OR IGNORE INTO research_notes(user_id,question_id,content,revision,updated_at) VALUES(?,?,?,1,?)').bind(user,id,JSON.stringify(content),Date.now()).run():await studyDb().prepare('UPDATE research_notes SET content=?,revision=revision+1,updated_at=? WHERE user_id=? AND question_id=? AND revision=?').bind(JSON.stringify(content),Date.now(),user,id,body.revision).run();
 if(!result.meta.changes)throw new HttpError(409,'A ficha mudou em outra aba. Exporte seu texto e recarregue antes de salvar.');
 return studyJson({revision:body.revision+1});
}catch(e){return studyError(e);}}
