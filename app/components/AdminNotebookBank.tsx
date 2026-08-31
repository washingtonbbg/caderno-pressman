"use client";

import {useEffect,useMemo,useState} from "react";
import {AdminBankQuestion,parseAdminQuestions,PromptBlocks,route,signals} from "./CompleteAdminBank";

const letter=(index:number)=>String.fromCharCode(65+index);

export default function AdminNotebookBank({notebook}:{notebook:string}){
  const[all,setAll]=useState<AdminBankQuestion[]>([]);
  const[active,setActive]=useState(0);
  const[selected,setSelected]=useState<number|null>(null);
  const[revealed,setRevealed]=useState(false);
  const[error,setError]=useState("");
  const questions=useMemo(()=>all.filter(question=>route(question.subject)===notebook),[all,notebook]);
  const question=questions[active];

  useEffect(()=>{
    fetch("/data/administrador-ifmt-107.txt")
      .then(response=>{if(!response.ok)throw new Error();return response.text()})
      .then(text=>{const parsed=parseAdminQuestions(text);const requested=Number(new URLSearchParams(window.location.search).get("questao"));const scoped=parsed.filter(question=>route(question.subject)===notebook);const index=scoped.findIndex(item=>item.number===requested);setAll(parsed);if(index>=0)setActive(index)})
      .catch(()=>setError("Não foi possível carregar as questões deste caderno."));
  },[notebook]);

  const open=(index:number)=>{setActive(index);setSelected(null);setRevealed(false)};
  if(error)return <section className="notebookBankError" id="banco-do-caderno">{error}</section>;
  if(!question)return <section className="notebookBankLoading" id="banco-do-caderno">Organizando as questões do caderno…</section>;

  return <section className="notebookBank" id="banco-do-caderno">
    <header><span>QUESTÕES TRANSFERIDAS DO BANCO</span><h2>Pratique no caderno.<br/><em>Analise cada alternativa.</em></h2><p>{questions.length} questões do arquivo foram classificadas neste caderno. O gabarito foi validado na página final do PDF anexado.</p></header>
    <div className="notebookBankLayout">
      <aside><strong>IR PARA A QUESTÃO</strong><div className="notebookBankNav">{questions.map((item,index)=><button key={item.tecId} className={active===index?"active":""} onClick={()=>open(index)} aria-label={`Abrir questão ${item.number}`}>{item.number}</button>)}</div></aside>
      <article className="guidedQuestion">
        <div className="catalogMeta"><span>QUESTÃO {String(question.number).padStart(3,"0")}</span><a href={`https://www.tecconcursos.com.br/questoes/${question.tecId}`} target="_blank" rel="noreferrer">FONTE ORIGINAL ↗</a></div>
        <p className="catalogSubject">ASSUNTO · {question.subject}</p><small>{question.source}</small>
        <PromptBlocks text={question.prompt}/>
        <div className="guidedOptions">{question.options.map((option,index)=><button key={option} className={`${selected===index?"selected":""} ${revealed&&question.answer===index?"correct":revealed&&selected===index?"wrong":""}`} onClick={()=>!revealed&&setSelected(index)}><b>{letter(index)}</b><span>{option}</span></button>)}</div>
        <div className="guidedActions"><button disabled={selected===null} onClick={()=>setRevealed(value=>!value)}>{revealed?"Ocultar análise":"Corrigir e analisar"}</button><button onClick={()=>open((active+1)%questions.length)}>Próxima questão →</button></div>
        {revealed&&<div className="guidedAnalysis"><strong>GABARITO OFICIAL: {letter(question.answer)}</strong><p className={selected===question.answer?"answerHit":"answerMiss"}>{selected===question.answer?"Você acertou.":`Sua resposta: ${letter(selected??0)}. A alternativa correta é ${letter(question.answer)}.`}</p><div><h4>ANÁLISE DAS ALTERNATIVAS</h4><ul className="optionReview">{question.options.map((option,index)=><li key={option} className={index===question.answer?"isAnswer":""}><b>{letter(index)} — {index===question.answer?"CORRETA":"DISTRATOR"}:</b> {index===question.answer?"é a opção indicada pelo gabarito oficial do caderno anexado.":"não corresponde ao gabarito; confronte seu núcleo conceitual, o agente, a finalidade, o prazo ou o alcance com a alternativa correta."}</li>)}</ul></div><div><h4>LINGUÍSTICO + PREDIÇÃO</h4><ul>{signals(question).map(item=><li key={item}>{item}</li>)}</ul></div></div>}
      </article>
    </div>
  </section>
}
