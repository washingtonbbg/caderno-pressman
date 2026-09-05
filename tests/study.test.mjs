import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import ts from 'typescript';
import { Miniflare, convertV4MiniflareOptions } from 'miniflare';

const require=createRequire(import.meta.url);
function load(path,dependencies={}) {
  const code=ts.transpile(readFileSync(path,'utf8'),{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true});
  const loaded={exports:{}};
  new Function('require','module','exports',code)(name=>dependencies[name]??require(name),loaded,loaded.exports);
  return loaded.exports;
}
const model=load('lib/study-model.ts');
const exam=load('lib/exam-plan.ts',{'./study-model':model});
const catalog=JSON.parse(readFileSync('data/study-catalog.json','utf8'));
const at=Date.UTC(2026,8,5,12),day=86400000;

test('same-day retries cannot inflate retention or spacing; uncertain hits return early',()=>{
  const first=model.recordAttempt('q',undefined,false,'sure',at);
  const immediate=model.recordAttempt('q',first,true,'sure',at+1000);
  assert.equal(immediate.firstCorrect,false);
  assert.equal(immediate.intervalDays,1);
  assert.equal(immediate.delayedAttempts,0);
  assert.equal(immediate.dueAt,first.dueAt);
  const later=model.recordAttempt('q',immediate,true,'sure',at+day+2000);
  assert.equal(later.delayedCorrect,1);
  assert.equal(later.intervalDays,3);
  const forgotten=model.recordAttempt('q',later,false,'sure',at+8*day);
  assert.equal(forgotten.intervalDays,1);
  assert.equal(model.recordAttempt('q',undefined,true,'guess',at).intervalDays,1);
  assert.equal(model.recordAttempt('q',undefined,true,'unsure',at).intervalDays,1);
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
  assert.equal(new Set(catalog.map(q=>q.notebook)).size,25);
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
  assert.ok(supplemental.filter(q=>q.referenceText).every(q=>q.referenceText.length>=40));
  assert.ok(supplemental.filter(q=>q.requiresSource).every(q=>q.sourceUrl.startsWith('https://')));
});

test('exam focus excludes unrelated content and mock sessions preserve 20/10/10/10 without duplicate items',()=>{
  assert.ok(catalog.filter(q=>q.notebook==='/pressman').every(q=>exam.examBlock(q)===null));
  assert.equal(exam.examBlock(catalog.find(q=>q.notebook==='/administracao-banco-completo'&&q.number===80)),null);
  const scoped=catalog.filter(q=>exam.examBlock(q));
  const selected=exam.examSession(scoped,{},'new',50,at,true);
  assert.equal(selected.length,50);
  assert.equal(new Set(selected.map(q=>q.id)).size,50);
  for(const block of exam.examBlocks)assert.equal(selected.filter(q=>exam.examBlock(q)===block.id).length,block.count);
  const record=model.recordAttempt('q',undefined,true,'sure',exam.FINAL_REVIEW_AT-day);
  assert.equal(exam.capExamReview(record,exam.FINAL_REVIEW_AT-day).dueAt,exam.FINAL_REVIEW_AT);
  assert.equal(exam.capExamReview(record,exam.EXAM_AT).dueAt,record.dueAt);
});

test('D1 API isolates users, preserves notes, rejects invalid writes and deduplicates retries',async t=>{
  const mf=new Miniflare(convertV4MiniflareOptions({modules:true,script:'export default {fetch(){return new Response("ok")}}',compatibilityDate:'2026-08-20',d1Databases:['DB']}));
  t.after(()=>mf.dispose());
  const DB=await mf.getD1Database('DB');
  const schema=['drizzle/0002_sloppy_expediter.sql','drizzle/0003_fine_ultimates.sql'].flatMap(file=>readFileSync(file,'utf8').split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean));
  await DB.batch(schema.map(sql=>DB.prepare(sql)));
  const helpers=load('lib/library-model.ts');
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
});
