'use client';
import {useState} from 'react';
import type { StudyQuestion } from '@/lib/study-model';
import { isGenericExplanation } from '@/lib/explanation-policy.mjs';

const roleLabels: Record<string,string> = {origin:'Origem da questão', 'answer-key':'Gabarito oficial', concept:'Referência conceitual'};
type Coaching = {decisiveRule:string;steps:string[];contrast:string;microExercise:string;microAnswer:string;nextStep:string;limit:string};

export default function QuestionExplanation({question:q, selected=-1, recall='', expanded=false}:{question:StudyQuestion;selected?:number;recall?:string;expanded?:boolean}) {
  const [signaling,setSignaling]=useState(true);
  const [coaching,setCoaching]=useState<Coaching|null>(null);
  const [coachBusy,setCoachBusy]=useState(false);
  const [coachError,setCoachError]=useState('');
  const usable = q.explanation && !isGenericExplanation(q.explanation);
  async function generateCoaching() {
    if(coachBusy)return;
    setCoachBusy(true);setCoachError('');
    try {
      const response=await fetch('/api/study/coach',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({prompt:q.prompt,subject:q.subject,source:q.source,referenceText:q.referenceText,options:q.options,answer:q.answer,selected,recall,explanation:usable?q.explanation:''})});
      const data=await response.json();
      if(!response.ok)throw Error(data.error||'Não foi possível gerar a orientação agora.');
      setCoaching(data);
    } catch(error) {setCoachError(error instanceof Error?error.message:'Não foi possível gerar a orientação agora.');}
    finally {setCoachBusy(false);}
  }
  return <div className="questionExplanation">
    <h3>Entenda a resposta</h3>
    <label className="feedbackToggle"><input type="checkbox" checked={signaling} onChange={e=>setSignaling(e.target.checked)}/> Sinalização visual nas análises</label>
    {signaling&&<p className="feedbackLegend"><span className="feedbackRule">Regra / explicação</span> <span className="feedbackAttention">Atenção: condição linguística</span> <span className="feedbackError">Erro: somente quando explicitado no comentário</span></p>}
    {q.reviewStatus==='needs_review'&&<p className="learnReviewStatus needs_review" role="note"><strong>{q.explanationMethod?'Ressalva importante':'Explicação conceitual pendente'}:</strong> {q.reviewNote}</p>}
    {usable ? q.explanation.split('\n\n').map((paragraph,i)=><p key={i}>{paragraph}</p>) : <p>Este item mantém o gabarito importado, mas ainda aguarda uma explicação individual que ensine o conceito e justifique as alternativas. A fonte da questão não substitui essa revisão.</p>}
    <section className="studyCoach" aria-live="polite"><div><h4>Transformar correção em progresso</h4><p>Gere uma orientação específica para esta questão e para a sua resposta. O resultado não altera o gabarito nem substitui a fonte.</p></div><button type="button" onClick={generateCoaching} disabled={coachBusy}>{coachBusy?'Gerando orientação…':coaching?'Gerar outra orientação':'Gerar orientação de estudo'}</button>
      {coachError&&<p className="studyCoachError" role="alert">{coachError}</p>}
      {coaching&&<div className="studyCoachResult"><h5>Regra decisiva</h5><p>{coaching.decisiveRule}</p><h5>Como chegar à resposta</h5><ol>{coaching.steps.map((step,i)=><li key={i}>{step}</li>)}</ol><h5>Contraste com sua tentativa</h5><p>{coaching.contrast}</p><h5>Teste rápido</h5><p>{coaching.microExercise}</p><details><summary>Conferir resposta do teste</summary><p>{coaching.microAnswer}</p></details><h5>Próximo passo · até 10 minutos</h5><p>{coaching.nextStep}</p>{coaching.limit&&<p className="studyCoachLimit"><strong>Limite da orientação:</strong> {coaching.limit}</p>}</div>}
    </section>
    {q.sourceUrl&&<a href={q.sourceUrl} target="_blank" rel="noreferrer">Consultar a questão original ↗</a>}
    {usable&&q.optionAnalysis?.length===5&&!q.optionAnalysis.some(isGenericExplanation)&&<details className="learnAnalysisDetails" open={expanded}><summary>Alternativa por alternativa — conceito e aplicação</summary><ol className="learnOptionAnalysis">{q.optionAnalysis.map((analysis,i)=><li key={i}><strong>{String.fromCharCode(65+i)} · {q.options[i]}</strong>{analysis.split('\n').filter(Boolean).map((text,j)=>{const error=/^(erro|incorreta|incorreto)\s*:/i.test(text.trim());return <p key={j} className={signaling?(error?'feedbackError':'feedbackRule'):undefined}>{signaling&&<span className="feedbackLabel">{error?'Erro descrito':'Explicação'}: </span>}{text}</p>;})}{signaling&&/\b(sempre|nunca|apenas|somente|exclusivamente|exceto)\b/i.test(q.options[i])&&<p className="feedbackAttention"><strong>Atenção à condição linguística.</strong> Confira se a regra admite restrições ou exceções. A palavra isolada não determina o gabarito.</p>}</li>)}</ol><p>Agora, sem olhar: qual conceito ou condição decide esta alternativa?</p></details>}
    {q.selfExplanation&&<aside className="learnRecall"><h4>Agora explique sem olhar</h4><p>{q.selfExplanation}</p><p>Responda em voz alta ou escreva sua regra antes de abrir a comparação.</p><details><summary>Comparar com uma resposta possível</summary><p>{q.selfExplanationAnswer}</p></details></aside>}
    {q.bankAnalysis&&!isGenericExplanation(q.bankAnalysis)&&<details className="learnAnalysisDetails"><summary>O que observar na construção deste item</summary><p>{q.bankAnalysis}</p><small>Observação editorial deste item; não é uma conclusão estatística sobre toda a banca.</small></details>}
    {!!q.citations?.length&&<details className="learnAnalysisDetails"><summary>Fontes: questão, gabarito e conceitos</summary><ul className="learnCitationList">{q.citations.map(c=><li key={c.id}><strong>{roleLabels[c.role]||'Referência'} · {c.title}</strong><span>{c.locator} · {c.label}</span><a href={c.official_url} target="_blank" rel="noreferrer">Consultar referência ↗</a><small>{c.verified?'Trecho consultado para a afirmação descrita abaixo.':'Referência importada; conferência independente pendente.'} {c.note}</small></li>)}</ul></details>}
    {q.reviewedAt&&<p className="learnSource">Comentário revisto em {q.reviewedAt.split('-').reverse().join('/')}{q.reviewedBy&&<> por {q.reviewedBy}</>} com consulta às referências. Não é uma justificativa oficial da banca.</p>}
  </div>;
}
