'use client';
import {useEffect,useMemo,useState} from 'react';
import {defaultSemaSettings,SEMA_DATE,semaAnalysis,semaDay,semaTopics,semaWeek,type SemaSettings,type SemaTiming,type SemaTopic} from '@/lib/sema-plan';
import type {StudyQuestion,StudyProgress} from '@/lib/study-model';

const weekdays=['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const minutes=(ms:number)=>`${Math.floor(ms/60000)} min ${Math.floor(ms/1000)%60} s`;
export default function SemaPlanner({questions,progress,connection,now,onStart}:{questions:StudyQuestion[];progress:Record<string,StudyProgress>;connection:string;now:number;onStart:(topic:SemaTopic,count:number)=>void}) {
 const [settings,setSettings]=useState<SemaSettings>(defaultSemaSettings);
 const [timing,setTiming]=useState<SemaTiming[]>([]);
 const [daily,setDaily]=useState<{day:string;studyMs:number}[]>([]);
 const [status,setStatus]=useState('');
 const [loading,setLoading]=useState(true);
 const [failed,setFailed]=useState(false);
 const [saving,setSaving]=useState(false);
 const [lesson,setLesson]=useState<SemaTopic>('fundamentals');
 const [filter,setFilter]=useState('');
 useEffect(()=>{
  let live=true;
  if(connection==='loading')return;
  if(connection!=='saved'){setLoading(false);return;}
  setLoading(true);
  fetch('/api/study/sema').then(async r=>{const data=await r.json();if(!r.ok)throw Error(data.error);if(live){setSettings(data.settings);setTiming(data.timing);setDaily(data.daily);setFailed(false);}}).catch(()=>{if(live){setFailed(true);setStatus('Não foi possível carregar seu cronograma e tempos. Recarregue para tentar novamente.');}}).finally(()=>{if(live)setLoading(false);});
  return ()=>{live=false;};
 },[connection,progress]);
 const stats=useMemo(()=>semaAnalysis(questions,progress,timing,now),[questions,progress,timing,now]);
 const week=useMemo(()=>now?semaWeek(questions,progress,timing,settings,now):[],[questions,progress,timing,settings,now]);
 const day=now?semaDay(now):'';
 const daysLeft=day?Math.max(0,Math.round((Date.parse(SEMA_DATE)-Date.parse(day))/86400000)):0;
 const total=stats.reduce((s,t)=>s+t.studied,0);
 const current=semaTopics.find(t=>t.id===lesson)!;
 const timed=new Map(timing.map(t=>[t.questionId,t]));
 const seen=questions.filter(q=>progress[q.id]&&(!filter||`${q.prompt} ${q.subject}`.toLocaleLowerCase('pt-BR').includes(filter.toLocaleLowerCase('pt-BR'))));
 async function save(){setSaving(true);setStatus('');try{const r=await fetch('/api/study/sema',{method:'PUT',headers:{'content-type':'application/json'},body:JSON.stringify(settings)});const data=await r.json();if(!r.ok)throw Error(data.error);setStatus('Rotina salva. O cronograma será recalculado a partir do seu desempenho.');}catch(e){setStatus(e instanceof Error?e.message:'Falha ao salvar. Sua escolha continua na tela; tente novamente.');}finally{setSaving(false);}}
 return <section className="semaPlan" id="cronograma" aria-label="Cronograma adaptativo SEMA">
  <div className="semaHeading"><div><p className="learnEyebrow">SEMA-MT · DO ZERO À PRÁTICA</p><h2>Seu cronograma de estudo</h2><p>Comece pela base. A cada sessão, seus erros, revisões e tempo por questão ajustam a próxima.</p></div><div className="semaDeadline"><strong>{now?daysLeft:'—'}</strong><span>dias até 13/12/2026</span></div></div>
  <p>Rotina inicial sugerida: 30 minutos, de segunda a sábado. Ajuste ao tempo que você realmente tem. A meta não aumenta automaticamente.</p>
  <div className="semaSettings"><label>Minutos por dia<select value={settings.minutes} disabled={loading||failed||saving} onChange={e=>setSettings(s=>({...s,minutes:Number(e.target.value)}))}>{[15,20,30,45,60,90,120,180].map(n=><option key={n} value={n}>{n} minutos</option>)}</select></label><fieldset><legend>Dias de estudo</legend>{weekdays.map((d,i)=><label key={d}><input type="checkbox" disabled={loading||failed||saving} checked={settings.days.includes(i)} onChange={e=>setSettings(s=>({...s,days:e.target.checked?[...s.days,i]:s.days.filter(x=>x!==i)}))}/>{d}</label>)}</fieldset><button disabled={connection!=='saved'||loading||failed||saving||!settings.days.length} onClick={save}>{saving?'Salvando…':'Salvar minha rotina'}</button></div>
  {connection==='guest'&&<p>Esta é uma prévia. Entre na sua conta para guardar a rotina, os tempos e a evolução.</p>}
  {!!status&&<p role="status">{status}</p>}{failed&&<button onClick={()=>window.location.reload()}>Recarregar dados</button>}
  <div className="semaMeasures"><div><strong>{loading||failed?'—':minutes(total)}</strong><span>tempo ativo registrado em TI</span></div><div><strong>{loading||failed?'—':minutes(daily.find(d=>d.day===day)?.studyMs??0)}</strong><span>registrado hoje · meta {settings.minutes} min</span></div><div><strong>{settings.minutes*settings.days.length} min</strong><span>planejados por semana</span></div></div>
  <p className="semaSmall">Tempo ativo é uma estimativa: pausa ao ocultar a página, perder o foco ou passar 90 segundos sem interação. Tempos antigos não são reconstruídos. O tempo registrado inclui leitura, resposta e correção até você avançar.</p>
  <h3>Próximos sete dias</h3><p>O plano é recalculado após a sessão. Erros e revisões aumentam a prioridade; seu tempo médio ajusta a quantidade de questões, sem tratar rapidez como domínio.</p>
  <div className="semaWeek">{week.map((d,i)=><article key={d.day} className={i===0?'semaToday':''}><h4>{i===0?'Hoje':new Date(`${d.day}T12:00:00-04:00`).toLocaleDateString('pt-BR',{weekday:'short',timeZone:'America/Cuiaba'})} · {d.day.slice(8)}/{d.day.slice(5,7)}</h4>{d.rest?<p>{d.day>=SEMA_DATE?'Prova / período de preparação encerrado':'Descanso'}</p>:d.blocks.map(b=>{const t=stats.find(t=>t.id===b.topic)!;return <div key={b.topic}><strong>{t.title}</strong><p>{b.minutes} min · {b.count?`até ${b.count} questões`:'leitura guiada · aguardando questões'}</p><button disabled={loading||failed||connection==='loading'} onClick={()=>{setLesson(b.topic);if(b.count)onStart(b.topic,b.count);else document.getElementById('sema-base')?.scrollIntoView({behavior:'smooth'});}}>{b.count?'Estudar este bloco':'Ver orientação'}</button></div>;})}</article>)}</div>
  <p>Uma vez por semana, use um bloco de TI para escrever uma resposta técnica curta: apresente o conceito, explique a solução e justifique sua escolha. Esse treino de discursiva é orientado, sem nota ou tempo automático nesta tela.</p>
  <details className="semaBasics" id="sema-base" open><summary>Aprender antes de resolver</summary><label>Escolha a base<select value={lesson} onChange={e=>setLesson(e.target.value as SemaTopic)}>{semaTopics.map(t=><option key={t.id} value={t.id}>{t.title}</option>)}</select></label><h3>{current.title}</h3><p>{current.lesson}</p><blockquote>{current.example}</blockquote><p><strong>Confira se entendeu:</strong> {current.check}</p><p>Introdução ao eixo: não substitui uma aula completa nem a explicação específica de cada questão.</p><button onClick={()=>onStart(lesson,3)} disabled={!stats.find(t=>t.id===lesson)?.items||loading||failed}>Praticar até 3 questões deste eixo</button></details>
  <details><summary>Conteúdo do edital e lacunas do banco</summary><p>Base: edital nº 1, de 01/09/2026, páginas 15, 28 e 64. A distribuição de estudo é uma proposta adaptativa, não um peso oficial por eixo. Português e conhecimentos gerais aguardam suas questões.</p>{stats.map(t=><article key={t.id}><h3>{t.title} · {t.items} questões disponíveis</h3><p>{t.syllabus}</p><p><strong>Atenção:</strong> {t.items?t.gap:'Aguardando envio das questões. O estudo permanece reservado no cronograma.'}</p><p>{t.seen} questões tentadas · {t.weak} com erro ou dúvida · {t.due} revisões vencidas{t.attempts?` · ${Math.round(t.correct/t.attempts*100)}% de acerto nas tentativas`:''}</p></article>)}</details>
  <details><summary>Análise de cada questão ({seen.length} no filtro)</summary><label>Buscar no histórico<input value={filter} onChange={e=>setFilter(e.target.value)} placeholder="Assunto ou trecho do enunciado"/></label>{!seen.length&&<p>Seu histórico aparecerá aqui após as primeiras tentativas. Para salvar tempos e consultar em outro dia, entre na sua conta.</p>}<div className="semaTable"><table><thead><tr><th>Questão</th><th>Resultado</th><th>Tempo de resposta</th><th>Tempo de estudo</th><th>Próxima revisão</th></tr></thead><tbody>{seen.map(q=>{const p=progress[q.id],t=timed.get(q.id);return <tr key={q.id}><td><strong>{q.subject}</strong><p>{q.prompt}</p></td><td>{p.correct}/{p.attempts} acertos<br/>{p.lastCorrect?'Última: acertou':'Última: revisar'}<br/>{p.confidence==='sure'?'Consegue justificar':p.confidence==='guess'?'Chute':'Em dúvida'}</td><td>{t?.lastResponseMs?minutes(t.lastResponseMs):'Não medido'}</td><td>{t?.timedAttempts?minutes(t.studyMs):'Não medido'}{t&&t.attempts>t.timedAttempts&&<p>Histórico parcial</p>}</td><td>{new Date(p.dueAt).toLocaleDateString('pt-BR',{timeZone:'America/Cuiaba'})}</td></tr>;})}</tbody></table></div></details>
 </section>;
}
