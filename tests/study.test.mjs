import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';
import { isGenericExplanation } from '../lib/explanation-policy.mjs';

const require=createRequire(import.meta.url);
function load(path,dependencies={}) {
  const code=ts.transpile(readFileSync(path,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true});
  const loaded={exports:{}};
  new Function('require','module','exports',code)(name=>dependencies[name]??require(name),loaded,loaded.exports);
  return loaded.exports;
}
const model=load('lib/study-model.ts');
const exam=load('lib/exam-plan.ts',{'./study-model':model});
const sema=load('lib/sema-plan.ts');
const clock=load('lib/active-study-clock.ts');
const catalog=JSON.parse(readFileSync('data/study-catalog.json','utf8'));
const at=Date.UTC(2026,8,5,12),day=86400000;
const migrationFiles=()=>readdirSync('drizzle').filter(file=>/^\d+.*\.sql$/.test(file)).sort().map(file=>`drizzle/${file}`);

test('SEMA planner reserves missing subjects, respects availability and ends at exam date',()=>{
  const qs=catalog.filter(q=>q.notebook==='/sema-mt-ti');
  assert.equal(qs.filter(q=>sema.semaTopic(q)).length,800);
  assert.equal(sema.semaTopic({notebook:'/biblioteca',subject:'other'}),null);
  const now=Date.parse('2026-09-16T12:00:00-04:00');
  const week=sema.semaWeek(qs,{},[],sema.defaultSemaSettings,now);
  assert.equal(week.length,7);
  assert.equal(week.filter(d=>!d.rest).length,6);
  for(const d of week.filter(d=>!d.rest))assert.equal(d.blocks.reduce((s,b)=>s+b.minutes,0),30);
  const topics=new Set(week.flatMap(d=>d.blocks.map(b=>b.topic)));
  for(const topic of sema.semaTopics)assert.ok(topics.has(topic.id),topic.id);
  assert.ok(week.flatMap(d=>d.blocks).filter(b=>['portuguese','mt','ethics'].includes(b.topic)).every(b=>b.count===0));
  assert.ok(sema.semaWeek(qs,{},[],sema.defaultSemaSettings,Date.parse('2026-12-13T12:00:00-04:00')).every(d=>d.rest));
  assert.equal(sema.semaDay(Date.parse('2026-09-17T02:00:00Z')),'2026-09-16');
  assert.equal(sema.validSemaSettings({minutes:30,days:[]}),false);
  assert.equal(sema.validSemaSettings({minutes:30,days:[1,1]}),false);
  assert.equal(sema.validSemaSettings({minutes:30,days:[0,6]}),true);
});

test('SEMA adapts workload to time without equating speed with mastery',()=>{
 const qs=catalog.filter(q=>q.notebook==='/sema-mt-ti'),q=qs.find(q=>sema.semaTopic(q)==='fundamentals');
 const now=Date.now(),p=model.recordAttempt(q.id,undefined,false,'sure',now);
 const progress={[q.id]:p};
 const timing=[{questionId:q.id,attempts:1,timedAttempts:1,responseMs:60000,studyMs:900000,lastResponseMs:60000,lastAt:now}];
 const slow=sema.semaAnalysis(qs,progress,timing,now).find(t=>t.id==='fundamentals');
 const baseline=sema.semaAnalysis(qs,progress,[],now).find(t=>t.id==='fundamentals');
 assert.equal(slow.priority,baseline.priority);assert.ok(slow.avgMs>baseline.avgMs);
 const study=sema.semaSession(qs,progress,'fundamentals',3,now);
 assert.equal(study[0].id,q.id);assert.equal(study.length,3);
 const strong=model.recordAttempt(q.id,undefined,true,'sure',now);
 assert.ok(!sema.semaSession([q],{[q.id]:strong},'fundamentals',3,now).length);
});

test('active study clock excludes hidden, paused and idle time',()=>{
 assert.equal(clock.activeStudyDelta(1000,2000,1000,true,false),1000);
 assert.equal(clock.activeStudyDelta(1000,2000,1000,false,false),0);
 assert.equal(clock.activeStudyDelta(1000,2000,1000,true,true),0);
 assert.equal(clock.activeStudyDelta(89000,95000,0,true,false),1000);
 assert.equal(clock.activeStudyDelta(95000,99000,0,true,false),0);
});

test('official FSRS ratings update memory state and distinguish recall quality',()=>{
  const first=model.recordAttempt('q',undefined,false,'sure',at);
  const immediate=model.recordAttempt('q',first,true,'sure',at+1000);
  assert.equal(immediate.firstCorrect,false);
  assert.ok(immediate.intervalDays>=first.intervalDays);
  assert.equal(immediate.delayedAttempts,0);
  const later=model.recordAttempt('q',immediate,true,'sure',at+day+2000);
  assert.equal(later.delayedCorrect,1);
  assert.ok(later.stability>immediate.stability);
  const forgotten=model.recordAttempt('q',later,false,'sure',at+8*day);
  assert.equal(forgotten.intervalDays,1);
  assert.ok(model.recordAttempt('q',undefined,true,'guess',at).intervalDays<model.recordAttempt('q',undefined,true,'unsure',at).intervalDays);
  assert.ok(model.recordAttempt('q',undefined,true,'unsure',at).intervalDays<model.recordAttempt('q',undefined,true,'sure',at).intervalDays);
  assert.equal(model.memoryGrade(false,'sure'),1);
  assert.equal(model.memoryGrade(true,'guess'),2);
  assert.equal(model.memoryGrade(true,'unsure'),3);
  assert.equal(model.memoryGrade(true,'sure'),4);
  assert.ok(forgotten.stability<later.stability);
  assert.equal(forgotten.lapses,1);
  assert.equal(model.FSRS_VERSION,'ts-fsrs@5.4.2/fsrs6');
});

test('review selection respects due dates, weak items, scope and priority while interleaving',()=>{
  const questions=['a','b','c','d','e'].map((id,i)=>({id,subject:i===2?'other':'same'}));
  const progress={a:{lastCorrect:false,dueAt:at-1,confidence:'sure'},b:{lastCorrect:true,dueAt:at-1,confidence:'sure'},c:{lastCorrect:true,dueAt:at-1,confidence:'guess'},d:{lastCorrect:true,dueAt:at+day,confidence:'sure'}};
  assert.deepEqual(model.selectSession(questions,progress,'recommended',10,at,true).map(q=>q.id),['a','c','b','e']);
  assert.deepEqual(model.selectSession(questions,progress,'new',10,at,true).map(q=>q.id),['e']);
  assert.deepEqual(model.selectSession(questions,progress,'errors',10,at,true).map(q=>q.id),['a','c']);
  assert.equal(model.selectSession(questions,progress,'due',2,at,true).length,2);
  const newQuestions=['A','A','B','B','C','C'].map((subject,i)=>({id:String(i),subject}));
  assert.deepEqual(model.selectSession(newQuestions,{},'new',6,at,true).map(q=>q.subject),['A','B','C','A','B','C']);
});

test('catalog retains all notebooks, answer bounds, code, references and required figures',()=>{
  assert.equal(new Set(catalog.map(q=>q.notebook)).size,26);
  assert.equal(new Set(catalog.map(q=>q.id)).size,catalog.length);
  for(const q of catalog) {
    assert.ok(q.options[q.answer],q.id);
    if(q.image)assert.ok(existsSync(`public${q.image}`),q.image);
    if(q.graph)for(const edge of q.graph.edges)assert.ok(edge.every(n=>'ABCDE'.includes(n)));
  }
  assert.ok(catalog.some(q=>q.code.includes('struct Node')));
  assert.ok(catalog.some(q=>q.graph?.arrows));
  assert.ok(catalog.find(q=>q.prompt.includes('Qual taxa recebe idade 25')).code.includes('calcular_taxa'));
  assert.ok(catalog.find(q=>q.prompt.includes('calc(0)')).code.includes('def calc'));
  const supplemental=catalog.filter(q=>q.notebook==='/ifmt-banco-complementar');
  assert.equal(supplemental.length,570);
  assert.equal(supplemental.filter(q=>q.examBlock==='portuguese').length,225);
  assert.equal(supplemental.filter(q=>q.referenceText).length,160);
  const sema=catalog.filter(q=>q.notebook==='/sema-mt-ti');
  assert.equal(sema.length,800);
  assert.ok(sema.every(q=>q.sourceUrl.startsWith('https://')));
  assert.ok(supplemental.filter(q=>q.referenceText).every(q=>q.referenceText.length>=40));
  assert.ok(supplemental.filter(q=>q.requiresSource).every(q=>q.sourceUrl.startsWith('https://')));
  assert.equal(supplemental.filter(q=>q.explanationMethod).length,4);
  assert.equal(supplemental.filter(q=>q.reviewStatus==='needs_review').length,567);
  assert.equal(supplemental.filter(q=>!q.explanation).length,566);
  assert.ok(supplemental.every(q=>['reviewed','needs_review'].includes(q.reviewStatus)));
  assert.ok(supplemental.filter(q=>q.explanationMethod).every(q=>q.explanation.length>=120&&Array.isArray(q.optionAnalysis)&&q.optionAnalysis.length===5&&q.optionAnalysis.every(item=>item.length>=40)&&q.bankAnalysis.length>=120));
  assert.ok(supplemental.filter(q=>!q.explanationMethod).every(q=>!q.optionAnalysis.length&&!q.bankAnalysis&&!/O gabarito do caderno indica|distrator por troca de núcleo|Padrão identificado pela revisão:/i.test(q.reviewNote)));
  const disputed=supplemental.find(q=>q.sourceUrl.endsWith('/3798900'));
  assert.equal(disputed.sourceHighlight,'revolução');
  assert.equal(disputed.scoring,'discussion');
  assert.match(disputed.reviewNote,/sem pontuação/);
  assert.ok(disputed.citations.some(c=>c.role==='answer-key'&&c.verified===1));
  assert.ok(supplemental.every(q=>Array.isArray(q.citations)&&q.citations.length&&q.citations[0].official_url.startsWith('https://')));
});

test('future question registration requires a source and explanatory evidence',()=>{
  const helpers=load('lib/library-model.ts',{'./explanation-policy.mjs':{isGenericExplanation}});
  const base={prompt:'Enunciado de teste',subject:'Assunto',source:'Caderno de teste',options:['A','B','C','D','E'],answer:0,explanation:'Justificativa conceitual suficiente para a revisão.',optionAnalysis:['Análise A','Análise B','Análise C','Análise D','Análise E'],bankAnalysis:'O item usa comando direto e alternativas paralelas.',reviewStatus:'needs_review'};
  assert.throws(()=>helpers.normalizeDraft(base),/HTTPS/);
  const normalized=helpers.normalizeDraft({...base,sourceUrl:'https://example.org/fonte'});
  assert.equal(normalized.options.length,5);
  assert.equal(normalized.sourceUrl,'https://example.org/fonte');
  assert.equal(normalized.optionAnalysis.length,5);
  assert.throws(()=>helpers.normalizeDraft({...base,sourceUrl:'https://example.org/fonte',reviewStatus:'reviewed'}),/referência conceitual/);
  const reviewed=helpers.normalizeDraft({...base,sourceUrl:'https://example.org/fonte',reviewStatus:'reviewed',conceptSource:'Manual de referência',conceptSourceUrl:'https://example.org/conceito',conceptLocator:'seção 2',explanationMethod:'conceito → aplicação → contraste',reviewedAt:'2026-09-05',reviewedBy:'equipe'});
  assert.equal(reviewed.conceptSourceUrl,'https://example.org/conceito');
  assert.equal(reviewed.reviewedBy,'equipe');
});

test('exam focus excludes unrelated content and mock sessions preserve 20/10/10/10 without duplicate items',()=>{
  assert.ok(catalog.filter(q=>q.notebook==='/pressman').every(q=>exam.examBlock(q)===null));
  assert.equal(exam.examBlock(catalog.find(q=>q.notebook==='/administracao-banco-completo'&&q.number===80)),null);
  const scoped=catalog.filter(q=>exam.examBlock(q));
  const selected=exam.examSession(scoped,{},'new',50,at,true);
  assert.equal(selected.length,50);
  assert.equal(new Set(selected.map(q=>q.id)).size,50);
  for(const block of exam.examBlocks)assert.equal(selected.filter(q=>exam.examBlock(q)===block.id).length,block.count);
  const predicted=exam.predictedExamSession(scoped);
  assert.equal(predicted.length,20);
  assert.equal(new Set(predicted.map(q=>q.id)).size,20);
  assert.deepEqual(exam.examBlocks.map(block=>predicted.filter(q=>exam.examBlock(q)===block.id).length),[8,4,4,4]);
  const record=model.recordAttempt('q',undefined,true,'sure',exam.FINAL_REVIEW_AT-day);
  assert.equal(exam.capExamReview(record,exam.FINAL_REVIEW_AT-day).dueAt,exam.FINAL_REVIEW_AT);
  assert.equal(exam.capExamReview(record,exam.EXAM_AT).dueAt,record.dueAt);
});

test('D1 API isolates users, preserves notes, rejects invalid writes and deduplicates retries',async t=>{
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-08-20',d1Databases:['DB']}));
  t.after(()=>mf.dispose());
  const DB=await mf.getD1Database('DB');
  const schema=migrationFiles().flatMap(file=>readFileSync(file,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean));
  await DB.batch(schema.map(sql=>DB.prepare(sql)));
  const helpers=load('lib/library-model.ts',{'./explanation-policy.mjs':{isGenericExplanation}});
  const server=load('lib/study-server.ts',{'cloudflare:workers':{env:{DB}},'./library-model':helpers});
  const route=load('app/api/study/progress/route.ts',{'@/data/study-catalog.json':catalog,'@/lib/library-model':helpers,'@/lib/study-model':model,'@/lib/study-server':server,'@/lib/exam-plan':exam});
  const req=(method,user,body,origin='https://study.example')=>new Request('https://study.example/api/study/progress',{method,headers:{...(user?{'oai-authenticated-user-id':user,'oai-authenticated-user-email':`${user}@example.org`}:{}),origin,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
  assert.equal((await route.GET(req('GET',null))).status,401);
  const q=catalog[0];
  const attempt={questionId:q.id,attemptId:crypto.randomUUID(),selected:q.answer,confidence:'guess'};
  assert.equal((await route.POST(req('POST','alice',attempt,'https://evil.example'))).status,403);
  assert.equal((await route.POST(req('POST','alice',{...attempt,selected:999}))).status,400);
  const result=await route.POST(req('POST','alice',attempt));
  assert.equal(result.status,200);
  assert.match(result.headers.get('cache-control'),/no-store/);
  assert.equal((await result.json()).progress.attempts,1);
  const retry=await route.POST(req('POST','alice',attempt));
  assert.equal((await retry.json()).progress.attempts,1);
  const bob=await route.GET(req('GET','bob'));
  assert.deepEqual((await bob.json()).progress,{});
  assert.equal((await route.PATCH(req('PATCH','bob',{questionId:q.id,note:'wrong owner',errorKind:'',noteRevision:0}))).status,404);
  assert.equal((await route.PATCH(req('PATCH','alice',{questionId:q.id,note:'Minha regra',errorKind:'concept',noteRevision:0}))).status,200);
  const conflict=await route.PATCH(req('PATCH','alice',{questionId:q.id,note:'Texto antigo',errorKind:'',noteRevision:0}));
  assert.equal(conflict.status,409);
  assert.equal((await conflict.json()).latest.note,'Minha regra');
  const concurrent=await Promise.all([1,2].map(()=>route.POST(req('POST','alice',{...attempt,attemptId:crypto.randomUUID()}))));
  assert.ok(concurrent.every(r=>r.status===200||r.status===409));
  const final=(await (await route.GET(req('GET','alice'))).json()).progress[q.id];
  const count=await DB.prepare('SELECT COUNT(*) AS n FROM study_attempts WHERE user_id=? AND question_id=?').bind('alice',q.id).first();
  assert.equal(final.attempts,count.n);
  assert.equal(final.note,'Minha regra');
  assert.equal(final.firstCorrect,true);
  assert.equal(final.delayedAttempts,0);
  assert.ok(final.stability>=.2);
  assert.ok(final.difficulty>=1&&final.difficulty<=10);
  const logged=await DB.prepare('SELECT memory_rating,rating_source,response_ms,scheduler_version FROM study_attempts WHERE user_id=? LIMIT 1').bind('alice').first();
  assert.equal(logged.memory_rating,2);
  assert.equal(logged.rating_source,'inferred');
  assert.equal(logged.response_ms,0);
  assert.equal(logged.scheduler_version,model.FSRS_VERSION);
  const semaRoute=load('app/api/study/sema/route.ts',{'@/lib/study-server':server,'@/lib/library-model':helpers,'@/lib/sema-plan':sema});
  assert.equal((await semaRoute.GET(req('GET',null))).status,401);
  assert.equal((await semaRoute.PUT(req('PUT','alice',{minutes:30,days:[1]},'https://evil.example'))).status,403);
  assert.equal((await semaRoute.PUT(req('PUT','alice',{minutes:30,days:[]}))).status,400);
  assert.equal((await semaRoute.PUT(req('PUT','alice',{minutes:45,days:[1,3,5]}))).status,200);
  assert.deepEqual((await (await semaRoute.GET(req('GET','alice'))).json()).settings,{minutes:45,days:[1,3,5]});
  assert.deepEqual((await (await semaRoute.GET(req('GET','bob'))).json()).settings,sema.defaultSemaSettings);
  assert.equal((await semaRoute.PATCH(req('PATCH','bob',{attemptId:attempt.attemptId,studyMs:4000}))).status,404);
  assert.equal((await semaRoute.PATCH(req('PATCH','alice',{attemptId:attempt.attemptId,studyMs:-1}))).status,400);
  for(const studyMs of [60000,60000,40000])assert.equal((await semaRoute.PATCH(req('PATCH','alice',{attemptId:attempt.attemptId,studyMs}))).status,200);
  const stats=(await (await semaRoute.GET(req('GET','alice'))).json()).timing.find(t=>t.questionId===q.id);
  assert.equal(stats.studyMs,60000);assert.equal(stats.timedAttempts,1);
  assert.deepEqual((await (await semaRoute.GET(req('GET','bob'))).json()).timing,[]);
});

test('question bank registration persists conceptual evidence and its source',async t=>{
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-08-20',d1Databases:['DB']}));
  t.after(()=>mf.dispose());
  const DB=await mf.getD1Database('DB');
  const schema=migrationFiles().flatMap(file=>readFileSync(file,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean));
  await DB.batch(schema.map(sql=>DB.prepare(sql)));
  const helpers=load('lib/library-model.ts',{'./explanation-policy.mjs':{isGenericExplanation}});
  const server=load('lib/library-server.ts',{'cloudflare:workers':{env:{DB,LIBRARY_ADMIN_EMAILS:'alice@example.org'}}});
  const route=load('app/api/bank/questions/route.ts',{'cloudflare:workers':{env:{DB,LIBRARY_ADMIN_EMAILS:'alice@example.org'}},'@/lib/library-model':helpers,'@/lib/library-server':server});
  const body={source:'Caderno de teste',sourceUrl:'https://example.org/caderno',locator:'p. 4 · questão 1',subject:'Administração',prompt:'Qual conceito se aplica?',options:['A correta','B distrator','C distrator','D distrator','E distrator'],answer:0,explanation:'A alternativa A preserva a definição apresentada e a finalidade do conceito.',optionAnalysis:['A coincide com a definição.','B troca o critério.','C mistura categorias.','D inverte a relação.','E amplia sem fundamento.'],bankAnalysis:'Comando direto e alternativas paralelas com troca de núcleo.',reviewStatus:'needs_review'};
  const request=(payload)=>new Request('https://study.example/api/bank/questions',{method:'POST',headers:{'origin':'https://study.example','content-type':'application/json','oai-authenticated-user-id':'alice','oai-authenticated-user-email':'alice@example.org'},body:JSON.stringify(payload)});
  assert.equal((await route.POST(request({...body,sourceUrl:''}))).status,400);
  assert.equal((await route.POST(request({...body,reviewStatus:'reviewed'}))).status,400);
  const created=await route.POST(request(body));
  assert.equal(created.status,201);
  const saved=(await created.json()).question;
  assert.equal(saved.options.length,5);
  assert.equal(saved.optionAnalysis[0],'A coincide com a definição.');
  assert.equal(saved.citations.length,1);
  assert.equal(saved.citations[0].official_url,'https://example.org/caderno');
  const listed=await route.GET();
  assert.equal((await listed.json()).questions.length,1);
});
