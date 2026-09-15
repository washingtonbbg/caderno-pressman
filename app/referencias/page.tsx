import Link from 'next/link';
import catalog from '@/data/study-catalog.json';
import {methodReferences} from '@/lib/method-references';
export const metadata={title:'Referências e limites — Cadernos de Estudo'};
export default function Page(){
 const citations=[...new Map(catalog.flatMap(q=>q.citations??[]).map(c=>[JSON.stringify([c.title,c.official_url,c.locator,c.verified,c.note]),c])).values()];
 return <main className="libraryPage"><Link href="/">← Estante</Link><h1>Referências e limites</h1><p>Registro metodológico atualizado em 15/09/2026. Estas pesquisas orientam decisões de produto; não validam a sequência completa deste aplicativo nem garantem aprovação.</p>{[...new Set(methodReferences.map(r=>r[0]))].map(group=><section key={group}><h2>{group}</h2><ul>{methodReferences.filter(r=>r[0]===group).map(r=><li key={r[2]}><a href={r[2]} target="_blank" rel="noreferrer">{r[1]}</a><p>{r[3]}</p></li>)}</ul></section>)}<h2>Livros, questões e gabaritos do catálogo</h2><p>Inventário automático das citações existentes. Não substitui verificação bibliográfica, de edição ou página; fontes ausentes não são inventadas. Questões cadastradas posteriormente mantêm suas referências na Biblioteca e na explicação individual.</p><details><summary>Consultar {citations.length} referências registradas</summary><ul>{citations.map((c,i)=><li key={i}><a href={c.official_url} target="_blank" rel="noreferrer">{c.title}</a> · {c.locator}<p>{c.verified?'Marcada como verificada no cadastro':'Conferência pendente'} · {c.note}</p></li>)}</ul></details></main>;
}
