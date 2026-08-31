"use client";

import Link from "next/link";
import {useEffect,useMemo,useState} from "react";

type CatalogQuestion={number:number;tecId:string;source:string;subject:string;prompt:string;options:string[]};

const tidy=(value:string)=>value.replace(/30\/08\/2026, 21:04[^\n]*/g,"").replace(/https:\/\/www\.tecconcursos\.com\.br\/questoes\/cadernos\/[^\s]+/g,"").replace(/\b\d+\/33\b/g,"").replace(/\s+/g," ").trim();

function parseBank(text:string):CatalogQuestion[]{
  const marker=/www\.tecconcursos\.com\.br\/questoes\/(\d+)/g;
  const matches=[...text.matchAll(marker)];
  return matches.map((match,index)=>{
    const start=(match.index??0)+match[0].length;
    const end=index+1<matches.length?(matches[index+1].index??text.length):text.length;
    const raw=text.slice(start,end);
    const lines=raw.split(/\r?\n/).map(item=>item.trim()).filter(Boolean);
    const sourceIndex=lines.findIndex(item=>item.startsWith("COCP IFMT"));
    const source=sourceIndex>=0?lines[sourceIndex]:"COCP IFMT";
    const subject=sourceIndex>=0?lines[sourceIndex+1]??"Assunto não identificado":"Assunto não identificado";
    let body=sourceIndex>=0?lines.slice(sourceIndex+2).join(" "):raw;
    body=body.replace(/\d+\)\s*$/g,"");
    const optionMatches=[...body.matchAll(/(?:^|\s)([a-e])\)\s*/gi)];
    const promptEnd=optionMatches[0]?.index??body.length;
    const prompt=tidy(body.slice(0,promptEnd));
    const options=optionMatches.map((item,itemIndex)=>{
      const optionStart=(item.index??0)+item[0].length;
      const optionEnd=itemIndex+1<optionMatches.length?(optionMatches[itemIndex+1].index??body.length):body.length;
      return tidy(body.slice(optionStart,optionEnd).replace(/\d+\)\s*$/g,""));
    }).filter(Boolean).slice(0,5);
    return {number:index+1,tecId:match[1],source,subject:tidy(subject),prompt,options};
  });
}

function languageSignals(question:CatalogQuestion){
  const text=`${question.prompt} ${question.options.join(" ")}`.toLocaleLowerCase("pt-BR");
  const signals:string[]=[];
  if(/exceto|incorreta|não corresponde|não são/.test(text))signals.push("Comando negativo: procure a única opção que foge da regra.");
  if(/\b(todo|toda|todos|todas|sempre|somente|apenas|nunca|estritamente|exclusivamente)\b/.test(text))signals.push("Há termo absoluto: teste se existe exceção normativa ou conceitual.");
  if(/I\.|II\.|III\.|\(\s*\)/.test(question.prompt))signals.push("Questão combinatória: resolva primeiro a assertiva mais segura e elimine sequências.");
  if(/lei|decreto|art\.|comissão|autoridade|pregoeiro/.test(text))signals.push("Confira agente, competência, prazo e verbo legal; a banca costuma trocar apenas um deles.");
  if(question.options.some(item=>item.includes(" e ")))signals.push("Resposta composta: um único elemento errado invalida toda a alternativa.");
  if(!signals.length)signals.push("Compare o núcleo técnico de cada opção; fluência textual não prova correção conceitual.");
  return signals.slice(0,3);
}

function routeFor(subject:string){
  if(/Ética|Direito Administrativo|AFO|Financeiro|Contabilidade|Licita/.test(subject))return "/administracao-publica";
  if(/Materiais|Logística|Pessoas|Desempenho|Treinamento|Qualidade de Vida/.test(subject))return "/administracao-pessoas-logistica";
  return "/administracao-gestao";
}

export default function CompleteAdminBank(){
  const[questions,setQuestions]=useState<CatalogQuestion[]>([]);
  const[query,setQuery]=useState("");
  const[subject,setSubject]=useState("Todos os assuntos");
  const[page,setPage]=useState(1);
  const[error,setError]=useState("");
  useEffect(()=>{fetch("/data/administrador-ifmt-107.txt").then(response=>{if(!response.ok)throw new Error();return response.text()}).then(text=>setQuestions(parseBank(text))).catch(()=>setError("Não foi possível carregar o banco integral."))},[]);
  const subjects=useMemo(()=>["Todos os assuntos",...Array.from(new Set(questions.map(q=>q.subject))).sort((a,b)=>a.localeCompare(b,"pt-BR"))],[questions]);
  const filtered=useMemo(()=>questions.filter(q=>(subject==="Todos os assuntos"||q.subject===subject)&&`${q.prompt} ${q.subject} ${q.source}`.toLocaleLowerCase("pt-BR").includes(query.toLocaleLowerCase("pt-BR"))),[questions,query,subject]);
  const pageSize=10;
  const pageCount=Math.max(1,Math.ceil(filtered.length/pageSize));
  const visible=filtered.slice((page-1)*pageSize,page*pageSize);
  const updateQuery=(value:string)=>{setQuery(value);setPage(1)};
  const updateSubject=(value:string)=>{setSubject(value);setPage(1)};
  return <main className="completeBank">
    <header className="completeTop"><Link href="/" className="brand"><span>20D</span>Cadernos de Estudo</Link><nav><Link href="/administracao-gestao">Comentadas</Link><a href="#banco">Banco integral</a></nav></header>
    <section className="catalogHero"><div><span>BANCO INTEGRAL · IFMT</span><h1>107 questões.<br/><em>46 assuntos.</em></h1><p>Todas as questões do arquivo anexado, organizadas pelo campo “assunto” e acompanhadas de pistas para avaliar linguisticamente as alternativas.</p></div><div className="catalogStats"><div><b>{questions.length||"…"}</b><small>questões catalogadas</small></div><div><b>{Math.max(0,subjects.length-1)||"…"}</b><small>assuntos distintos</small></div><div><b>18</b><small>questões com RAIO-X validado</small></div></div></section>
    <section className="catalogControls" id="banco"><label><span>BUSCAR</span><input value={query} onChange={event=>updateQuery(event.target.value)} placeholder="Conceito, lei, palavra ou órgão…"/></label><label><span>FILTRAR POR ASSUNTO</span><select value={subject} onChange={event=>updateSubject(event.target.value)}>{subjects.map(item=><option key={item}>{item}</option>)}</select></label><div><b>{filtered.length}</b><span>resultados</span></div></section>
    {error&&<p className="catalogError">{error}</p>}
    {!error&&!questions.length&&<p className="catalogLoading">Organizando as questões por assunto…</p>}
    <section className="catalogList">{visible.map(question=><article className="catalogQuestion" key={question.tecId}><div className="catalogMeta"><span>QUESTÃO {String(question.number).padStart(3,"0")}</span><a href={`https://www.tecconcursos.com.br/questoes/${question.tecId}`} target="_blank" rel="noreferrer">TEC {question.tecId} ↗</a></div><p className="catalogSubject">ASSUNTO · {question.subject}</p><small>{question.source}</small><h2>{question.prompt}</h2>{question.options.length>0?<ol type="A">{question.options.map(option=><li key={option}>{option}</li>)}</ol>:<p className="catalogWarning">Alternativas não puderam ser separadas automaticamente; consulte a questão original.</p>}<div className="languagePredictor"><strong>PREDITOR LINGUÍSTICO</strong><ul>{languageSignals(question).map(signal=><li key={signal}>{signal}</li>)}</ul><Link href={routeFor(question.subject)}>Estudar este assunto no caderno comentado →</Link></div></article>)}</section>
    {questions.length>0&&<div className="catalogPagination"><button disabled={page===1} onClick={()=>setPage(value=>value-1)}>← Anterior</button><span>Página {page} de {pageCount}</span><button disabled={page===pageCount} onClick={()=>setPage(value=>value+1)}>Próxima →</button></div>}
  </main>
}
