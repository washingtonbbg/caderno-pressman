"use client";

import Link from "next/link";
import type {ReactNode} from "react";
import {useMemo,useState} from "react";

export type ExamQuestion={
  examId:string;
  source:string;
  prompt:string;
  options:string[];
  answer:number;
  explanation:string;
  xray:string;
  languageNote:string;
  subject?:string;
  image?:string;
  imageAlt?:string;
  caption?:string;
};

export type ExamCard={front:string;back:string;tag:string};

export type NotebookConfig={
  code:string;
  eyebrow:string;
  title:string;
  titleAccent:string;
  description:string;
  tone:string;
  scope:string;
  references:string[];
  bankProfile?:string[];
  statementMode?:string;
};

const letters=["A","B","C","D","E"];

export default function ExamNotebook({config,questions,cards,supplement}:{config:NotebookConfig;questions:ExamQuestion[];cards:ExamCard[];supplement?:ReactNode}){
  const[active,setActive]=useState(0);
  const[selected,setSelected]=useState<number|null>(null);
  const[revealed,setRevealed]=useState(false);
  const[flipped,setFlipped]=useState<number[]>([]);
  const progress=useMemo(()=>Math.round(((active+1)/questions.length)*100),[active,questions.length]);
  const q=questions[active];
  const open=(index:number)=>{setActive(index);setSelected(null);setRevealed(false)};
  const next=()=>open((active+1)%questions.length);
  const random=()=>{let index=Math.floor(Math.random()*questions.length);if(index===active)index=(index+1)%questions.length;open(index);document.getElementById("questoes")?.scrollIntoView({behavior:"smooth"})};
  const flip=(index:number)=>setFlipped(value=>value.includes(index)?value.filter(item=>item!==index):[...value,index]);

  return <main className={`examNotebook ${config.tone}`}>
    <header className="topbar"><Link className="brand" href="/"><span>{config.code}</span>Cadernos de Estudo</Link><nav><Link href="/">Livros</Link><a href="#questoes">Questões</a><a href="#cards-exam">Cards</a><button className="navButton" onClick={random}>Sortear questão</button></nav></header>
    <section className="examHero"><div><div className="eyebrow">{config.eyebrow}</div><h1>{config.title}<br/><em>{config.titleAccent}</em></h1><p>{config.description}</p><div className="heroActions"><a className="primary" href="#questoes">Começar estudo</a><a className="secondary" href="#referencias">Ver referências →</a></div></div><div className="examManifest"><small>RECORTE DO EDITAL</small><p>{config.scope}</p><div><b>{questions.length}</b><span>questões oficiais</span></div><div><b>{cards.length}</b><span>cards conceituais</span></div></div></section>
    <section className="examStrip"><strong>Questões oficiais</strong><span>{config.statementMode??"Enunciados e alternativas preservados do caderno anexado."}</span><strong>RAIO-X duplo</strong><span>Leitura conceitual e análise linguística para prever distratores.</span></section>
    {config.bankProfile&&<section className="bankProfile"><div><span>VOCABULÁRIO DA BANCA</span><h2>Palavras que mudam<br/><em>o valor da alternativa.</em></h2></div><ul>{config.bankProfile.map(item=><li key={item}>{item}</li>)}</ul></section>}
    <section className="study examStudy" id="questoes"><aside className="sectionIntro"><span>ESTUDO GUIADO</span><h2>Leia.<br/>Julgue.<br/>Justifique.</h2><p>A análise separa o conteúdo técnico das pistas linguísticas usadas pela banca.</p><div className="progress"><span style={{width:`${progress}%`}}/><small>{active+1} de {questions.length} · {progress}%</small></div><div className="questionNav">{questions.map((_,index)=><button key={index} aria-label={`Abrir questão ${index+1}`} className={active===index?"active":""} onClick={()=>open(index)}>{index+1}</button>)}</div><button className="examRandom" onClick={random}>↻ Sortear deste caderno</button></aside>
      <article className="questionCard examQuestion"><div className="questionMeta"><span>QUESTÃO OFICIAL · {q.examId}</span><span>{q.subject&&<>ASSUNTO · {q.subject}<br/></>}{q.source}</span></div><div className="questionNumber">QUESTÃO {String(active+1).padStart(2,"0")}</div><h3>{q.prompt}</h3>{q.image&&<figure className="examFigure"><img src={q.image} alt={q.imageAlt??"Figura da questão"}/><figcaption>{q.caption}</figcaption></figure>}<div className="alternatives">{q.options.map((item,index)=><button key={item} onClick={()=>!revealed&&setSelected(index)} className={`${selected===index?"selected":""} ${revealed?(index===q.answer?"correct":selected===index?"wrong":"muted"):""}`}><b>{letters[index]}</b><span>{item}</span></button>)}</div><div className="questionActions"><button className="reveal" disabled={selected===null} onClick={()=>setRevealed(!revealed)}>{revealed?"Ocultar análise":"Corrigir e ver RAIO-X"}</button><button className="next" onClick={next}>Próxima questão →</button></div>{revealed&&<div className="examAnalysis"><strong>Gabarito: {letters[q.answer]}</strong><div><h4>Conceitual</h4><p>{q.explanation}</p></div><div><h4>Linguístico + predição</h4><p>{q.languageNote}</p></div><small>RAIO-X · {q.xray}</small></div>}</article>
    </section>
    <section className="examCards" id="cards-exam"><div className="examCardsHeader"><div><span>MEMORIZAÇÃO ATIVA</span><h2>Conceito curto.<br/><em>Distinção precisa.</em></h2></div><p>Os cards condensam as relações necessárias para resolver as questões sem decorar apenas o gabarito.</p></div><div className="examCardsGrid">{cards.map((card,index)=><button key={card.front} className={`examCard ${flipped.includes(index)?"flipped":""}`} onClick={()=>flip(index)} aria-pressed={flipped.includes(index)}><small>{card.tag} · {String(index+1).padStart(2,"0")}</small><strong>{flipped.includes(index)?card.back:card.front}</strong><span>{flipped.includes(index)?"↶ ver pergunta":"virar card ↗"}</span></button>)}</div></section>
    {supplement}
    <section className="examReferences" id="referencias"><div><span>FONTES MAPEADAS</span><h2>Referência declarada.<br/>Limite explícito.</h2><p>As obras abaixo foram citadas pelas próprias questões. Onde o livro integral ainda não foi fornecido, a análise fica restrita ao enunciado, ao gabarito e ao conceito consolidado.</p></div><ul>{config.references.map(reference=><li key={reference}>{reference}</li>)}</ul></section>
    <footer><div><b>{config.title} {config.titleAccent}</b><span>Questões oficiais · análise gramatical e conceitual</span></div><p>Fonte das questões: caderno específico anexado pelo usuário.</p><Link href="/">← Escolher outro livro</Link></footer>
  </main>
}
