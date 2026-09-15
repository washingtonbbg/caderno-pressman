"use client";
import Link from "next/link";
import {useState} from "react";

const modes = [
  ["branch", "Comparar com uma branch", "Revisão no estilo PR, usando uma branch base como referência.", "⇄"],
  ["working", "Alterações não confirmadas", "Encontrar problemas no estado atual antes do commit.", "◌"],
  ["commit", "Revisar um commit", "Conferir um commit específico e seus impactos.", "#"],
  ["custom", "Instruções personalizadas", "Aplicar um checklist próprio da equipe.", "✦"],
] as const;

export default function ReviewPage(){
  const [mode,setMode]=useState("branch");
  const [base,setBase]=useState("main");
  const [commit,setCommit]=useState("");
  const [instructions,setInstructions]=useState("");
  const [started,setStarted]=useState(false);
  const label=modes.find(item=>item[0]===mode)?.[1]||"Revisão";
  return <main className="reviewPage">
    <header className="reviewTop"><Link href="/" className="brand"><span>CR</span>Cadernos de Estudo</Link><Link href="/">← Voltar à estante</Link></header>
    <section className="reviewHero"><span>WORKSPACE DE QUALIDADE</span><h1>Revisar antes<br/><em>de aceitar.</em></h1><p>Escolha o recorte da revisão, defina o que deve ser observado e registre o resultado antes de publicar uma alteração.</p></section>
    <section className="reviewWorkspace">
      <div className="reviewModes"><div className="reviewSectionLabel">TIPO DE REVISÃO</div>{modes.map(([id,title,description,icon])=><button key={id} className={mode===id?"active":""} onClick={()=>{setMode(id);setStarted(false)}}><b>{icon}</b><span><strong>{title}</strong><small>{description}</small></span><i>→</i></button>)}</div>
      <div className="reviewPanel"><div className="reviewPanelHead"><div><span>CONFIGURAÇÃO</span><h2>{label}</h2></div><span className="reviewStatus">{started?"PRONTO PARA REVISAR":"NÃO INICIADA"}</span></div>
        {mode==="branch"&&<div className="reviewFields"><label>Branch base<input value={base} onChange={e=>setBase(e.target.value)} placeholder="main"/></label><p>O diff será lido como uma revisão de pull request: correção, regressões, testes e riscos.</p></div>}
        {mode==="working"&&<div className="reviewNotice"><strong>Estado local</strong><p>Use este modo antes do commit para conferir arquivos modificados, testes ausentes, erros de tipagem e mudanças acidentais.</p></div>}
        {mode==="commit"&&<div className="reviewFields"><label>SHA ou referência do commit<input value={commit} onChange={e=>setCommit(e.target.value)} placeholder="ex.: fb32b54"/></label><p>Informe o commit que deve ser analisado isoladamente, incluindo seu contexto e possíveis efeitos colaterais.</p></div>}
        {mode==="custom"&&<div className="reviewFields"><label>Instruções da equipe<textarea value={instructions} onChange={e=>setInstructions(e.target.value)} placeholder="Ex.: priorize segurança, acessibilidade, migrações e cobertura de testes." rows={6}/></label><p>Estas instruções podem corresponder ao conteúdo de um <code>code_review.md</code> referenciado pelo <code>AGENTS.md</code>.</p></div>}
        <div className="reviewChecks"><h3>O que será verificado</h3><label><input type="checkbox" defaultChecked/> Bugs e regressões funcionais</label><label><input type="checkbox" defaultChecked/> Testes e casos de borda</label><label><input type="checkbox" defaultChecked/> Segurança, acessibilidade e manutenção</label><label><input type="checkbox" defaultChecked/> Clareza do diff e risco da mudança</label></div>
        <button className="reviewStart" onClick={()=>setStarted(true)}>Preparar revisão →</button>{started&&<div className="reviewResult"><strong>Revisão preparada</strong><p>Recorte: {label}. Execute os testes relevantes, confira o diff e registre achados com prioridade antes de aprovar.</p></div>}
      </div>
    </section>
    <section className="reviewMethod"><div><span>MÉTODO DE ACEITE</span><h2>Resultado verificável.<br/><em>Decisão consciente.</em></h2></div><div className="reviewSteps"><article><b>01</b><strong>Entender</strong><p>Leia o objetivo e o contexto da alteração.</p></article><article><b>02</b><strong>Verificar</strong><p>Rode testes, build, lint e confira o comportamento final.</p></article><article><b>03</b><strong>Revisar</strong><p>Procure regressões no diff e classifique os achados.</p></article><article><b>04</b><strong>Aceitar</strong><p>Só conclua quando não houver risco bloqueador conhecido.</p></article></div></section>
  </main>;
}
