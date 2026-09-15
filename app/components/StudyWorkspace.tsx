"use client";

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { memoryGrade, recordAttempt, retrievability, selectSession, type Confidence, type MemoryGrade, type StudyMode, type StudyProgress, type StudyQuestion } from '@/lib/study-model';
import { EXAM_ID, capExamReview, examBlock, examBlocks, examSession, predictedExamSession, type ExamBlock } from '@/lib/exam-plan';
import QuestionExplanation from './QuestionExplanation';
import FeedbackEvidence from './FeedbackEvidence';
import MemoryPalace from './MemoryPalace';
import type { MemoryLocus } from '@/lib/memory-palace';
import {useBankCatalog} from '@/lib/use-bank-catalog';

const confidenceLabels: Record<Confidence,string> = {guess:'Chute',unsure:'Em dúvida',sure:'Consigo justificar'};
const ratingLabels:Record<MemoryGrade,{label:string;description:string}>={1:{label:'Esqueci',description:'Não consegui recuperar a resposta.'},2:{label:'Difícil',description:'Lembrei com muito esforço ou após pistas.'},3:{label:'Bom',description:'Lembrei corretamente com algum esforço.'},4:{label:'Fácil',description:'Lembrei imediatamente e consigo justificar.'}};
const modeLabels: Record<StudyMode,string> = {recommended:'Revisões + novas',due:'Revisões pendentes',errors:'Erros e dúvidas',new:'Questões novas'};
const date = (at: number) => new Date(at).toLocaleDateString('pt-BR',{day:'2-digit',month:'short'});
const percent = (hits:number,total:number) => total ? `${Math.round(hits/total*100)}%` : '—';
const memoryStrength = (progress:StudyProgress,at:number) => `${Math.round(retrievability(progress,at)*100)}%`;
type Attempt = {attemptId:string;questionId:string;selected:number;confidence:Confidence;memoryRating:MemoryGrade;ratingSource:'declared'|'inferred';responseMs:number;examId?:string};

function QuestionGraph({graph}:{graph:NonNullable<StudyQuestion['graph']>}) {
  const pos:Record<string,number[]> = {A:[35,85],B:[135,30],C:[135,140],D:[245,85],E:[245,140]};
  return <svg className="learnGraph" viewBox="0 0 280 175" role="img" aria-label={`Grafo ${graph.arrows?'dirigido':'não dirigido'}; arestas ${graph.edges.map(e=>e.join(graph.arrows?' para ':' e ')).join(', ')}`}>
    <defs><marker id="learn-arrow" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="currentColor"/></marker></defs>
    {graph.edges.map(([u,v])=>{const dx=pos[v][0]-pos[u][0],dy=pos[v][1]-pos[u][1],len=Math.hypot(dx,dy);return <line key={u+v} x1={pos[u][0]} y1={pos[u][1]} x2={pos[v][0]-(graph.arrows?dx/len*22:0)} y2={pos[v][1]-(graph.arrows?dy/len*22:0)} stroke="currentColor" strokeWidth="2" markerEnd={graph.arrows?'url(#learn-arrow)':undefined}/>;})}
    {[...new Set(graph.edges.flat())].map(v=><g key={v}><circle cx={pos[v][0]} cy={pos[v][1]} r="20" fill="#fff" stroke="currentColor" strokeWidth="2"/><text x={pos[v][0]} y={pos[v][1]+6} textAnchor="middle" fill="currentColor">{v}</text></g>)}
  </svg>;
}

export default function StudyWorkspace({questions:initial}:{questions:StudyQuestion[]}) {
  const questions=useBankCatalog(initial);
  const [progress,setProgress] = useState<Record<string,StudyProgress>>({});
  const [connection,setConnection] = useState<'loading'|'saved'|'guest'|'error'>('loading');
  const [notebook,setNotebook] = useState('all');
  const [examFocus,setExamFocus] = useState(true);
  const [block,setBlock] = useState<ExamBlock|'all'>('all');
  const [mockExam,setMockExam] = useState(false);
  const [predictedExam,setPredictedExam] = useState(false);
  const [responseLog,setResponseLog] = useState<{question:StudyQuestion;selected:number}[]>([]);
  const [elapsed,setElapsed] = useState(0);
  const startedAt = useRef(0);
  const questionStartedAt = useRef(0);
  const [mode,setMode] = useState<StudyMode>('recommended');
  const [mixed,setMixed] = useState(true);
  const [limit,setLimit] = useState(10);
  const [session,setSession] = useState<StudyQuestion[]>([]);
  const [active,setActive] = useState(0);
  const [finished,setFinished] = useState(false);
  const [answers,setAnswers] = useState<boolean[]>([]);
  const [optionsOpen,setOptionsOpen] = useState(false);
  const [selected,setSelected] = useState<number|null>(null);
  const [confidence,setConfidence] = useState<Confidence|null>(null);
  const [recall,setRecall] = useState('');
  const [answered,setAnswered] = useState(false);
  const [memoryRating,setMemoryRating] = useState<MemoryGrade|null>(null);
  const [responseMs,setResponseMs] = useState(0);
  const [busy,setBusy] = useState(false);
  const [pending,setPending] = useState<Attempt|null>(null);
  const [message,setMessage] = useState('');
  const [note,setNote] = useState('');
  const [errorKind,setErrorKind] = useState('');
  const [noteDirty,setNoteDirty] = useState(false);
  const [noteConflict,setNoteConflict] = useState<StudyProgress|null>(null);
  const [now,setNow] = useState(0);
  const [journalOpen,setJournalOpen] = useState(false);
  const [memories,setMemories] = useState<MemoryLocus[]>([]);
  const [memoryBusy,setMemoryBusy] = useState(false);
  const [memoryError,setMemoryError] = useState('');
  const [memoryImageBusy,setMemoryImageBusy] = useState(false);
  const [memoryImageError,setMemoryImageError] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const inSession = useRef(false);
  const q = session[active];
  const relevant = useMemo(()=>questions.filter(q=>!examFocus||examBlock(q)),[questions,examFocus]);
  const notebooks = useMemo(()=>Array.from(new Map(relevant.map(q=>[q.notebook,q.notebookTitle]))),[relevant]);
  const scope = useMemo(()=>relevant.filter(q=>(notebook==='all'||q.notebook===notebook)&&(!examFocus||block==='all'||examBlock(q)===block)),[relevant,notebook,examFocus,block]);
  const canMix=new Set(scope.map(q=>q.subject)).size>1;
  const records = scope.flatMap(q=>progress[q.id]?[progress[q.id]]:[]);
  const due = records.filter(p=>p.dueAt<=now).length;
  const available = predictedExam?predictedExamSession(relevant):mockExam?examSession(relevant,{},'new',50,now,true):examFocus&&block==='all'&&notebook==='all'?examSession(scope,progress,mode,limit,now,mixed):selectSession(scope,progress,mode,limit,now,mixed);

  useEffect(()=>{
    let live=true;
    const params=new URLSearchParams(window.location.search);
    const chosen = params.get('caderno');
    fetch('/api/study/progress').then(async r=>{
      const data=await r.json();
      if (!live) return;
      if (r.status===401) {setConnection('guest');return;}
      if (!r.ok) throw Error();
      setProgress(data.progress);setConnection('saved');
    }).catch(()=>{if(live)setConnection('error');}).finally(()=>{
      if(!live)return;
      setNow(Date.now());
      if(chosen&&questions.some(q=>q.notebook===chosen))setNotebook(chosen);
      if(chosen&&!params.has('edital'))setExamFocus(false);
      const chosenBlock=params.get('bloco');
      if(examBlocks.some(b=>b.id===chosenBlock))setBlock(chosenBlock as ExamBlock);
      if(params.get('formato')==='simulado')setMockExam(true);
      if(params.get('formato')==='predicao'){setMockExam(true);setPredictedExam(true);}
    });
    return ()=>{live=false;};
  },[questions]);

  useEffect(()=>{
    let live=true;
    const refresh=()=>{
      if(document.hidden||inSession.current)return;
      setNow(Date.now());
      if(connection!=='saved')return;
      fetch('/api/study/progress').then(async r=>{
        if(!r.ok)return;
        const data=await r.json();
        if(live&&!inSession.current)setProgress(data.progress);
      }).catch(()=>{});
    };
    window.addEventListener('focus',refresh);
    document.addEventListener('visibilitychange',refresh);
    const timer=window.setInterval(refresh,60000);
    return ()=>{live=false;window.clearInterval(timer);window.removeEventListener('focus',refresh);document.removeEventListener('visibilitychange',refresh);};
  },[connection]);

  useEffect(()=>{
    if(!session.length||!mockExam)return;
    const timer=window.setInterval(()=>setElapsed(Math.floor((Date.now()-startedAt.current)/1000)),1000);
    return ()=>window.clearInterval(timer);
  },[session.length,mockExam]);

  function resetQuestion() {
    setOptionsOpen(mockExam);setSelected(null);setConfidence(null);setRecall('');setAnswered(false);
    setMemoryRating(null);setResponseMs(0);questionStartedAt.current=Date.now();
    setPending(null);setMessage('');setNote('');setErrorKind('');setNoteDirty(false);setNoteConflict(null);
    setMemoryError('');setMemoryBusy(false);
    setMemoryImageBusy(false);setMemoryImageError('');
  }
  function start() {
    let chosen:StudyQuestion[];
    if(predictedExam)chosen=predictedExamSession(relevant);
    else if(mockExam) {
      const shuffled=[...relevant];
      for(let i=shuffled.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[shuffled[i],shuffled[j]]=[shuffled[j],shuffled[i]];}
      chosen=examSession(shuffled,{},'new',50,Date.now(),true);
    } else chosen=examFocus&&block==='all'&&notebook==='all'?examSession(scope,progress,mode,limit,Date.now(),mixed):selectSession(scope,progress,mode,limit,Date.now(),mixed);
    inSession.current=chosen.length>0;
    startedAt.current=Date.now();setElapsed(0);setResponseLog([]);
    setNow(Date.now());setSession(chosen);setActive(0);setAnswers([]);setMemories([]);setFinished(false);resetQuestion();
    requestAnimationFrame(()=>heading.current?.focus());
  }
  async function persist(attempt:Attempt) {
    setBusy(true);setMessage('');
    try {
      const response=await fetch('/api/study/progress',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(attempt)});
      const data=await response.json();
      if(!response.ok) throw Error(data.error || 'Não foi possível salvar a tentativa.');
      setProgress(p=>({...p,[attempt.questionId]:data.progress}));setPending(null);
      setNote(data.progress.note);setErrorKind(data.progress.errorKind);
      setMessage('Tentativa salva.');
    } catch(error) { setMessage(`${error instanceof Error?error.message:'Falha de conexão.'} Use “Tentar salvar novamente”.`); }
    finally {setBusy(false);}
  }
  async function generateMemory() {
    if(!q||memoryBusy)return;
    setMemoryBusy(true);setMemoryError('');
    try {
      const response=await fetch('/api/study/memory-palace',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({
        questionId:q.id,position:active,prompt:q.prompt,correctAnswer:`${String.fromCharCode(65+q.answer)} — ${q.options[q.answer]}`,explanation:q.explanation,previous:memories,
      })});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'Não foi possível gerar a cena agora.');
      setMemories(current=>[...current.filter(item=>item.questionId!==q.id),data]);
    } catch(error) {setMemoryError(error instanceof Error?error.message:'Não foi possível gerar a cena agora.');}
    finally {setMemoryBusy(false);}
  }
  async function generateMemoryImage() {
    const current=memories.find(item=>item.questionId===q?.id);
    if(!current||memoryImageBusy||current.imageUrl)return;
    setMemoryImageBusy(true);setMemoryImageError('');
    try {
      const response=await fetch('/api/study/memory-palace/image',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({locus:current.locus,scene:current.scene})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'Não foi possível gerar a imagem agora.');
      setMemories(items=>items.map(item=>item.questionId===current.questionId?{...item,imageUrl:data.imageUrl}:item));
    } catch(error) {setMemoryImageError(error instanceof Error?error.message:'Não foi possível gerar a imagem agora.');}
    finally {setMemoryImageBusy(false);}
  }
  async function answer(value:number,certainty:Confidence) {
    if(answered || busy) return;
    setSelected(value);setConfidence(certainty);setAnswered(true);setOptionsOpen(true);
    const measuredResponse=Math.max(0,Date.now()-questionStartedAt.current);setResponseMs(measuredResponse);
    const correct=value===q.answer;
    setAnswers(a=>[...a,correct]);
    setResponseLog(log=>[...log,{question:q,selected:value}]);
    if(!mockExam){void generateMemory();return;}
    const inferred=memoryGrade(correct,certainty);setMemoryRating(inferred);
    if(connection!=='saved') {
      const record=recordAttempt(q.id,progress[q.id],correct,certainty,Date.now(),inferred);
      const result=examFocus?capExamReview(record,Date.now()):record;
      setProgress(p=>({...p,[q.id]:result}));setNote(result.note);setErrorKind(result.errorKind);
      setMessage('Tentativa temporária: será perdida ao sair desta página.');return;
    }
    const attempt={attemptId:crypto.randomUUID(),questionId:q.id,selected:value,confidence:certainty,memoryRating:inferred,ratingSource:'inferred' as const,responseMs:measuredResponse,...(examFocus?{examId:EXAM_ID}:{})};
    setPending(attempt);await persist(attempt);
  }
  async function rateMemory(rating:MemoryGrade) {
    if(!answered||memoryRating||busy||selected===null||!confidence)return;
    setMemoryRating(rating);
    const correct=selected===q.answer;
    if(connection!=='saved') {
      const record=recordAttempt(q.id,progress[q.id],correct,confidence,Date.now(),rating);
      const result=examFocus?capExamReview(record,Date.now()):record;
      setProgress(p=>({...p,[q.id]:result}));setNote(result.note);setErrorKind(result.errorKind);
      setMessage('Avaliação mantida somente nesta sessão.');return;
    }
    const attempt={attemptId:crypto.randomUUID(),questionId:q.id,selected,confidence,memoryRating:rating,ratingSource:'declared' as const,responseMs,...(examFocus?{examId:EXAM_ID}:{})};
    setPending(attempt);await persist(attempt);
  }
  async function saveNote() {
    setBusy(true);setMessage('');
    try {
      let noteRevision=progress[q.id].noteRevision;
      if(connection==='saved') {
        const r=await fetch('/api/study/progress',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({questionId:q.id,note,errorKind,noteRevision})});
        const data=await r.json();
        if(!r.ok) {if(data.latest)setNoteConflict(data.latest);throw Error(data.error);}
        noteRevision=data.noteRevision;
      }
      setProgress(p=>({...p,[q.id]:{...p[q.id],note,errorKind,noteRevision}}));setNoteDirty(false);setNoteConflict(null);
      setMessage(connection==='saved'?'Anotação salva.':'Anotação mantida somente nesta sessão.');
    } catch(error) {setMessage(error instanceof Error?error.message:'Não foi possível salvar a anotação.');}
    finally {setBusy(false);}
  }
  function next() {
    if(active+1===session.length) {inSession.current=false;setFinished(true);setSession([]);setNow(Date.now());}
    else {setActive(a=>a+1);resetQuestion();requestAnimationFrame(()=>heading.current?.focus());}
  }

  return <main className="learnWorkspace">
    <header className="learnTop"><Link href="/">← Cadernos de Estudo</Link><Link href="/reta-final">Estratégia até 13/09</Link>{questions.some(item=>item.explanationMethod)&&<Link href="/revisao-portugues">Revisão conceitual</Link>}<a href="#metodo">Como estudar</a></header>
    <div className="learnContainer">
      <div className="learnIntro"><div><p className="learnEyebrow">SEU ESTUDO, UMA TENTATIVA POR VEZ</p><h1>Estudar hoje</h1></div><p>Recupere da memória. Confira a explicação.<br/>Volte ao conteúdo depois de um intervalo.</p></div>
      {connection==='loading'&&<p role="status">Carregando seu histórico…</p>}
      {connection==='saved'&&<p className="learnStorage">Histórico e anotações salvos na sua conta.</p>}
      {connection==='guest'&&<div className="learnNotice"><p>Entre para salvar suas revisões e continuar em outro dispositivo. Sem entrar, você pode praticar apenas nesta sessão.</p><a href="/signin-with-chatgpt?return_to=%2Festudar" target="_top">Entrar com ChatGPT →</a></div>}
      {connection==='error'&&<div className="learnNotice" role="alert"><p>Seu histórico não carregou. A prática ficará temporária até a conexão ser restabelecida; não será adicionada ao histórico salvo.</p><button onClick={()=>window.location.reload()}>Recarregar histórico</button></div>}
      {!session.length&&<>
        {examFocus&&<div className="learnNotice"><strong>Recorte IFMT Administrador · prova 13/09</strong><p>20 específicos + 10 Português + 10 Gerais + 10 Tecnologia. O treino misto distribui itens nessa proporção quando há material disponível. O número de itens cadastrados não comprova cobertura integral do edital.</p><Link href="/reta-final">Ver plano diário e lacunas →</Link></div>}
        {finished&&<section className="learnComplete" aria-live="polite"><h2>Sessão concluída</h2><p>{answers.filter(Boolean).length} acertos em {answers.length} tentativas. Confira as revisões pendentes nos próximos dias.</p><p>Conseguir responder agora é um passo. Lembrar novamente depois de um intervalo ajuda a avaliar a retenção.</p></section>}
        {finished&&mockExam&&<section className="learnPlanner"><h2>Correção do {predictedExam?'simulado preditivo':'ensaio'}</h2><p>Tempo decorrido: {Math.floor(elapsed/60)} min {elapsed%60} s. Este treino usa itens do banco e {predictedExam?'uma curadoria heurística por aderência ao edital; não prevê nem garante questões reais.':'não estima nota de corte.'}</p><div className="learnStats">{examBlocks.map(b=>{const items=responseLog.filter(r=>examBlock(r.question)===b.id);return <div key={b.id}><strong>{items.filter(r=>r.selected===r.question.answer).length}/{items.length}</strong><span>{b.title}</span></div>;})}</div><details className="examSimulationReview"><summary>Conferir as {responseLog.length} respostas e explicações</summary>{responseLog.map(({question,selected},i)=><article key={question.id}><h3>{i+1}. {question.prompt}</h3><p>Sua resposta: {selected<0?'Não sei':String.fromCharCode(65+selected)} · Gabarito: {String.fromCharCode(65+question.answer)} — {question.options[question.answer]}</p><p>{question.explanation||'Justificativa ainda não cadastrada; confira a fonte no caderno.'}</p><Link href={question.notebook}>Consultar caderno →</Link></article>)}</details><p>Depois da correção, escolha “Erros e dúvidas” para praticar novamente com explicação e anotações.</p></section>}
        <section className="learnStats" aria-label="Seu progresso no recorte selecionado">
          <div><strong>{due}</strong><span>revisões pendentes</span></div>
          <div><strong>{records.length}<small> / {scope.length}</small></strong><span>questões tentadas</span></div>
          <div><strong>{percent(records.filter(p=>p.firstCorrect).length,records.length)}</strong><span>acerto na primeira tentativa</span></div>
          <div><strong>{percent(records.reduce((s,p)=>s+p.delayedCorrect,0),records.reduce((s,p)=>s+p.delayedAttempts,0))}</strong><span>acerto após 24h ou mais</span></div>
        </section>
        <section className="learnPlanner" aria-labelledby="session-title"><div><h2 id="session-title">Sua próxima sessão</h2><p>Revisões vencidas entram antes de questões novas. Se precisar aprender a base, abra o caderno e estude um exemplo resolvido.</p></div>
          <div className="learnFilters"><label>Programa<select value={examFocus?'exam':'library'} onChange={e=>{setExamFocus(e.target.value==='exam');setNotebook('all');setBlock('all');setMockExam(false);setPredictedExam(false);setFinished(false);}}><option value="exam">IFMT Administrador · 13/09/2026</option><option value="library">Biblioteca inteira</option></select></label>{examFocus&&<><label>Bloco do edital<select value={block} disabled={mockExam} onChange={e=>{setBlock(e.target.value as ExamBlock|'all');setNotebook('all');}}><option value="all">Os quatro blocos</option>{examBlocks.map(b=><option value={b.id} key={b.id}>{b.title}</option>)}</select></label><label>Formato<select value={predictedExam?'prediction':mockExam?'mock':'practice'} onChange={e=>{setPredictedExam(e.target.value==='prediction');setMockExam(e.target.value!=='practice');setFinished(false);}}><option value="practice">Prática com correção a cada questão</option><option value="prediction">Predição de hoje · 20 questões</option><option value="mock">Ensaio de 50 · correção somente no fim</option></select></label></>}</div>
          {mockExam&&<p>{predictedExam?'O simulado preditivo seleciona 8 questões específicas e 4 de cada bloco básico, priorizando núcleos centrais do edital e variedade de assuntos. É uma heurística de treino, não uma previsão garantida da prova.':'O ensaio usa todos os blocos, sem os filtros abaixo, e pode repetir itens já vistos.'} O cronômetro mede seu tempo; confirme a duração oficial no edital. {available.length<(predictedExam?20:50)&&'O banco deste recorte não contém itens suficientes; o ensaio será parcial.'}</p>}
          <div className="learnFilters"><label>Caderno<select value={notebook} disabled={mockExam} onChange={e=>setNotebook(e.target.value)}><option value="all">Todos os cadernos do recorte</option>{notebooks.map(([href,title])=><option key={href} value={href}>{title}</option>)}</select></label>
            <label>Objetivo<select value={mode} onChange={e=>setMode(e.target.value as StudyMode)}>{Object.entries(modeLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
            <label>Questões por sessão<select value={limit} onChange={e=>setLimit(Number(e.target.value))}>{[5,10,20].map(n=><option key={n} value={n}>{n} questões</option>)}</select></label>
          </div>
          <label className="learnToggle"><input type="checkbox" checked={mixed&&canMix} disabled={!canMix} onChange={e=>setMixed(e.target.checked)}/>{canMix?'Alternar os assuntos disponíveis dentro da fila.':'Este recorte tem um único assunto catalogado; a sessão permanece focada nele.'}</label>
          <div className="learnStart"><button className="learnPrimary" disabled={!available.length||connection==='loading'} onClick={start}>Começar {available.length} questões →</button><span>{scope.length-records.length} novas · {records.filter(p=>!p.lastCorrect||p.confidence!=='sure').length} com erro ou dúvida</span></div>
          {!available.length&&connection!=='loading'&&<p role="status">Nenhuma questão neste recorte agora. Escolha outro objetivo ou volte na próxima revisão{records.length?` (${date(Math.min(...records.map(p=>p.dueAt)))})`:''}.</p>}
        </section>
        <section className="learnJournal"><div className="learnSectionLine"><h2>Caderno de erros e dúvidas</h2><button onClick={()=>setJournalOpen(v=>!v)} aria-expanded={journalOpen}>{journalOpen?'Recolher':'Ver histórico'}</button></div><p>{records.filter(p=>!p.lastCorrect&&p.confidence==='sure').length} erros com confiança · {records.filter(p=>p.lastCorrect&&p.confidence!=='sure').length} acertos com dúvida ou chute</p>
          {journalOpen&&<div className="learnJournalList">{scope.filter(q=>progress[q.id]&&(!progress[q.id].lastCorrect||progress[q.id].confidence!=='sure'||progress[q.id].note)).map(item=>{const p=progress[item.id];return <article key={item.id}><small>{item.notebookTitle} · revisão {date(p.dueAt)}</small><h3>{item.prompt}</h3><p>{p.lastCorrect?'Acerto com necessidade de revisão':'Última tentativa incorreta'} · {confidenceLabels[p.confidence]} · força estimada {memoryStrength(p,now)}</p>{p.lapses>0&&<p>{p.lapses} esquecimento(s) registrado(s); a fila reduziu o intervalo automaticamente.</p>}{p.note&&<blockquote>{p.note}</blockquote>}<Link href={item.notebook}>Abrir caderno →</Link></article>;})}{!records.length&&<p>As tentativas feitas aqui formarão seu histórico. Anote a regra que decidiu cada questão.</p>}</div>}
        </section>
      </>}
      {!!session.length&&q&&<section className="learnSession">
        <div className="learnSessionBar"><span>Questão {active+1} de {session.length} · {answers.length} respondidas{mockExam?` · ${Math.floor(elapsed/60)} min ${elapsed%60} s`:''}</span><progress value={answers.length} max={session.length} aria-label="Tentativas nesta sessão"/></div>
        <article className="learnQuestion"><div className="learnQuestionMeta"><span>{q.notebookTitle}</span>{!mockExam&&<Link href={q.notebook} target="_blank">Consultar caderno ↗</Link>}</div><p className="learnSource">{q.label} · {q.source}</p>
          {q.referenceText&&<div className="learnReferenceText"><strong>Texto de referência</strong><p>{q.referenceText}</p></div>}
          <h2 ref={heading} tabIndex={-1}>{q.prompt}</h2>
          {q.requiresSource&&q.sourceUrl&&<p className="learnSourceRequired" role="note"><strong>Esta questão usa imagem, tirinha, tabela ou diagrama da fonte.</strong> <a href={q.sourceUrl} target="_blank" rel="noreferrer">Abrir a questão original antes de responder ↗</a></p>}
          {q.code&&<pre className="learnCode"><code>{q.code}</code></pre>}{q.image&&<figure><img src={q.image} alt={q.imageAlt}/></figure>}{q.graph&&<QuestionGraph graph={q.graph}/>}
          {!optionsOpen&&<div className="learnRecall"><label htmlFor="recall">Antes das alternativas: qual regra ou conceito resolve a questão?</label><textarea id="recall" rows={3} value={recall} onChange={e=>setRecall(e.target.value)} placeholder="Explique em uma frase, sem consultar. Escrever é opcional."/><button className="learnPrimary" onClick={()=>setOptionsOpen(true)}>Ver alternativas →</button><button onClick={()=>answer(-1,'guess')}>Não sei ainda · ver explicação</button></div>}
          {optionsOpen&&<><div className="learnOptions" role="group" aria-label="Alternativas">{q.options.map((option,i)=><button key={i} disabled={answered} aria-pressed={selected===i} onClick={()=>setSelected(i)} className={`${selected===i?'chosen':''} ${answered&&!mockExam&&i===q.answer?'hit':''} ${answered&&!mockExam&&selected===i&&i!==q.answer?'miss':''}`}><b>{String.fromCharCode(65+i)}</b><span>{option}</span>{answered&&!mockExam&&i===q.answer&&<em>Gabarito</em>}{answered&&!mockExam&&selected===i&&i!==q.answer&&<em>Sua resposta</em>}</button>)}</div>
            {!answered&&<><fieldset className="learnConfidence"><legend>Antes de corrigir, quanta confiança você tem?</legend>{Object.entries(confidenceLabels).map(([value,label])=><label key={value}><input type="radio" name="confidence" value={value} checked={confidence===value} onChange={()=>setConfidence(value as Confidence)}/>{label}</label>)}</fieldset><div className="learnActions"><button className="learnPrimary" disabled={selected===null||!confidence} onClick={()=>selected!==null&&confidence&&answer(selected,confidence)}>Confirmar e conferir</button><button onClick={()=>answer(-1,'guess')}>Não sei ainda</button></div></>}
          </>}
          {answered&&mockExam&&<div className="learnFeedback"><p>Resposta registrada. A correção será exibida ao concluir o ensaio.</p><p role="status">{busy?'Salvando…':message}</p>{pending&&!busy&&<button onClick={()=>persist(pending)}>Tentar salvar novamente</button>}<button className="learnPrimary" disabled={busy||!!pending} onClick={next}>{active+1===session.length?'Concluir e corrigir ensaio':'Próxima questão →'}</button></div>}
          {answered&&!mockExam&&<div className="learnFeedback"><p className="learnVerdict">{selected===q.answer?'Você acertou.':selected===-1?'Vamos construir essa resposta.':'A resposta precisa de revisão.'} Gabarito: {String.fromCharCode(65+q.answer)}.</p>
            {selected===q.answer&&confidence!=='sure'&&<p>Acertar com dúvida ou por chute pede nova tentativa; isso não é tratado como lembrança segura.</p>}
            {selected!==q.answer&&confidence==='sure'&&<p>Este erro com confiança merece atenção: identifique qual regra parecia correta e compare com a referência.</p>}
            <QuestionExplanation question={q}/>
            <fieldset className="learnMemoryRating"><legend>Depois de conferir: como foi recuperar esta resposta?</legend><p>Considere sua lembrança real, não apenas o acerto. Essa avaliação define o próximo intervalo.</p><div>{(Object.entries(ratingLabels) as [string,{label:string;description:string}][]).map(([value,item])=>{const rating=Number(value) as MemoryGrade;return <button type="button" key={value} disabled={!!memoryRating||busy} aria-pressed={memoryRating===rating} onClick={()=>rateMemory(rating)}><strong>{item.label}</strong><span>{item.description}</span></button>;})}</div></fieldset>
            <MemoryPalace memory={memories.find(item=>item.questionId===q.id)} loading={memoryBusy} error={memoryError} onRetry={generateMemory} onGenerateImage={generateMemoryImage} imageBusy={memoryImageBusy} imageError={memoryImageError}/>
            {q.languageNote&&<details><summary>Pistas e distinções do caderno</summary><p>{q.languageNote}</p><p>Uma pista linguística ajuda a conferir a proposição; não substitui o conceito ou a fonte.</p></details>}
            {recall&&<details><summary>O que você lembrou antes de responder</summary><p>{recall}</p></details>}
            {memoryRating&&!pending&&progress[q.id]&&<p>Próxima revisão: <strong>{date(progress[q.id].dueAt)}</strong> · intervalo FSRS de {progress[q.id].intervalDays} dia(s) · força estimada {memoryStrength(progress[q.id],now)}{connection!=='saved'?' nesta sessão temporária':''}.</p>}
            <div className="learnAnnotation"><label htmlFor="study-note">Com suas palavras: qual regra decide esta questão? O que muda na alternativa errada?</label><textarea id="study-note" rows={3} value={note} maxLength={3000} disabled={!memoryRating||!!pending||busy} onChange={e=>{setNote(e.target.value);setNoteDirty(true);}} placeholder={memoryRating?'Uma ou duas frases para sua próxima revisão (opcional).':'Avalie primeiro como foi recuperar a resposta.'}/><label>O que dificultou a resposta?<select value={errorKind} disabled={!memoryRating||!!pending||busy} onChange={e=>{setErrorKind(e.target.value);setNoteDirty(true);}}><option value="">Não registrar motivo</option><option value="concept">Ainda não conhecia o conceito</option><option value="attention">Leitura do comando ou atenção</option><option value="application">Dificuldade de aplicar o conceito</option><option value="guess">Chute ou dúvida entre alternativas</option></select></label>{noteDirty&&<button disabled={busy||!!pending||!!noteConflict} onClick={saveNote}>Salvar anotação</button>}</div>
            {noteConflict&&<div className="learnNotice" role="alert"><p>A versão salva em outra aba:</p><blockquote>{noteConflict.note||'(sem texto)'}</blockquote><p>Seu rascunho continua no campo acima.</p><button onClick={()=>{setProgress(p=>({...p,[q.id]:noteConflict}));setNote(n=>[noteConflict.note,n].filter(Boolean).join('\n\n'));setNoteConflict(null);setNoteDirty(true);}}>Reunir os textos para revisar</button><button onClick={()=>{setProgress(p=>({...p,[q.id]:noteConflict}));setNote(noteConflict.note);setErrorKind(noteConflict.errorKind);setNoteConflict(null);setNoteDirty(false);}}>Usar a versão salva</button></div>}
            <p role="status" aria-live="polite">{busy?'Salvando…':message}</p>{pending&&!busy&&<button onClick={()=>persist(pending)}>Tentar salvar novamente</button>}
            <button className="learnPrimary" disabled={busy||!!pending||noteDirty||memoryBusy||!memoryRating} onClick={next}>{active+1===session.length?'Concluir sessão':'Próxima questão →'}</button>{!memoryRating&&<p>Avalie a recuperação para calcular a próxima revisão.</p>}{noteDirty&&<p>Salve sua anotação para continuar.</p>}
          </div>}
        </article>
      </section>}
      <details className="learnMethods" id="metodo"><summary>Como este estudo funciona — e em que evidências se apoia</summary><div>
        <p><strong>Sinalização após a resposta:</strong> explicações usam cores com rótulos para organizar a leitura, com opção de desligar. Nenhuma pista de correção é acrescentada durante a tentativa. É uma aplicação do princípio de sinalização, não uma paleta cientificamente ótima nem substituto de recuperação ativa. <Link href="/referencias">Referências consolidadas, aplicações e limites →</Link></p>
        <h3>Estratégia da sessão</h3>
        <p><strong>1. Recuperar antes de reconhecer:</strong> formule a regra ou o conceito antes de abrir as alternativas. Essa tentativa reduz a dependência de pistas visuais e torna a correção mais informativa.</p>
        <p><strong>2. Responder e declarar confiança:</strong> a confiança é registrada antes da correção. Uma resposta errada volta como “reaprender”; um acerto por chute é tratado como difícil; um acerto com dúvida, como recordação parcial; e um acerto justificável, como recordação forte. Confiança não comprova domínio sozinha.</p>
        <p><strong>3. Corrigir com contraste:</strong> confira o gabarito, explique a regra decisiva e identifique por que a alternativa escolhida falhou. Quando necessário, registre se a dificuldade veio de conceito, atenção, aplicação ou chute.</p>
        <p><strong>4. Revisar no momento adaptativo:</strong> o agendador oficial FSRS para TypeScript estima dificuldade, estabilidade e probabilidade de recuperação para cada questão, com retenção-alvo de 90%. Depois da correção, “Esqueci”, “Difícil”, “Bom” e “Fácil” atualizam o estado e calculam o próximo intervalo. A configuração privilegia revisões diárias e não cria etapas obrigatórias de poucos minutos.</p>
        <p><strong>5. Intercalar com prioridade:</strong> revisões vencidas e memórias mais frágeis entram antes das questões novas. Dentro da mesma prioridade, assuntos diferentes são alternados para exercitar discriminação entre conceitos. Conteúdo ainda novo deve primeiro ser estudado com exemplos.</p>
        <p><strong>6. Criar uma pista memorável:</strong> o Palácio da Memória transforma a regra decisiva em uma cena concreta e exagerada dentro de um percurso familiar. A cena serve como pista de recuperação; não substitui compreensão, fonte ou prática.</p>
        <h3>O que fica registrado para análise futura</h3>
        <p>Por questão, o histórico conserva número de tentativas e acertos, primeira resposta, último resultado, confiança prévia, avaliação posterior, origem declarada ou inferida da avaliação, tempo de resposta, intervalo efetivo e programado, versão do agendador, próxima revisão, dificuldade, estabilidade, estado FSRS, lapsos, motivo do erro e anotações. Esses dados permitem acompanhar evolução sem guardar o texto digitado antes de abrir as alternativas.</p>
        <p>Em melhorias futuras será possível avaliar calibração da confiança, retenção depois de 24 horas ou mais, frequência de lapsos, assuntos mais frágeis e diferença entre recuperação estimada e desempenho observado. Ajustes do algoritmo deverão usar dados agregados suficientes e preservar a separação entre desempenho no treino e aprendizagem transferível.</p>
        <h3>Limites da interpretação</h3>
        <p>A “força estimada” é uma previsão operacional para ordenar revisões, não uma medição direta do cérebro nem um diagnóstico individual. O indicador “após 24h” usa novas tentativas das mesmas questões e não substitui testes com itens inéditos. Resultados podem variar conforme familiaridade, qualidade das questões, sono, atenção e contexto.</p>
        <p>No recorte histórico IFMT Administrador, revisões que ultrapassariam a revisão final de 12/09/2026 foram antecipadas para aquele marco. Fora desse período, prevalece o calendário adaptativo normal.</p>
        <ul><li><a href="https://psychclassics.yorku.ca/Ebbinghaus/" target="_blank" rel="noreferrer">Ebbinghaus (1885/1913): Memory — fundamento histórico e método experimental</a></li><li><a href="https://github.com/open-spaced-repetition/ts-fsrs" target="_blank" rel="noreferrer">Open Spaced Repetition: implementação ts-fsrs utilizada pelo aplicativo</a></li><li><a href="https://doi.org/10.1038/s44159-022-00089-1" target="_blank" rel="noreferrer">Carpenter, Pan e Butler (2022): espaçamento e recuperação</a></li><li><a href="https://doi.org/10.1002/rev3.3266" target="_blank" rel="noreferrer">Firth, Rivers e Boyle (2021): intercalação e limites da evidência</a></li><li><a href="https://doi.org/10.1007/s10648-018-9434-x" target="_blank" rel="noreferrer">Bisra et al. (2018): meta-análise de autoexplicação</a></li><li><a href="https://doi.org/10.1007/s10648-025-10035-1" target="_blank" rel="noreferrer">Murray, Horner e Göbel (2025): espaçamento e recuperação em matemática</a></li></ul>
        <FeedbackEvidence />
      </div></details>
    </div>
  </main>;
}
