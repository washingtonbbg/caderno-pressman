import type { StudyQuestion } from './study-model';

export const RESEARCH_VERSION = 'corpus-descritivo-v1';
const stop = new Set('a o as os de da do das dos em no na nos nas e ou que se um uma para por com ao aos à é são sobre qual quais alternativa assinale questão correto correta incorreta'.split(' '));
export function words(text: string) { return text.toLocaleLowerCase('pt-BR').match(/[\p{L}][\p{L}\p{N}-]*/gu) ?? []; }
export const languageRules = [
  { name:'Negação e exceção', expression:/\b(não|incorreta|incorreto|exceto)\b/giu },
  { name:'Universalização', expression:/\b(sempre|nunca|todos|todas|nenhum|nenhuma)\b/giu },
  { name:'Restrição', expression:/\b(apenas|somente|exclusivamente|necessariamente)\b/giu },
  { name:'Possibilidade', expression:/\b(pode|podem|geralmente|possível)\b/giu },
  { name:'Julgamento de afirmações', expression:/\b(julgue|sentenças|afirmações|verdadeiras|falsas)\b/giu },
];
export function languageSignals(text:string) { return languageRules.map(rule=>({name:rule.name,matches:[...text.matchAll(new RegExp(rule.expression))].map(m=>m[0])})).filter(r=>r.matches.length); }
export function analyzeCorpus(input:StudyQuestion[]) {
  const seen=new Set<string>();
  const questions=input.filter(q=>{const key=JSON.stringify([words(q.prompt),q.options.map(words)]);if(seen.has(key))return false;seen.add(key);return true;});
  const terms=new Map<string,{count:number;ids:string[]}>();
  const subjects=new Map<string,string[]>();
  let tokenCount=0;
  for(const q of questions){
    const tokens=words([q.prompt,...q.options].join(' '));tokenCount+=tokens.length;
    const distinct=new Set<string>();
    for(const term of tokens){if(term.length<3||stop.has(term))continue;const entry=terms.get(term)??{count:0,ids:[]};entry.count++;terms.set(term,entry);distinct.add(term);}
    for(const term of distinct)terms.get(term)!.ids.push(q.id);
    subjects.set(q.subject,[...(subjects.get(q.subject)??[]),q.id]);
  }
  return {questions,duplicates:input.length-questions.length,tokenCount,
    terms:[...terms].map(([term,value])=>({term,...value,perThousand:tokenCount?value.count/tokenCount*1000:0})).sort((a,b)=>b.count-a.count||a.term.localeCompare(b.term)),
    subjects:[...subjects].map(([subject,ids])=>({subject,ids})).sort((a,b)=>b.ids.length-a.ids.length),
    signals:languageRules.map(rule=>({name:rule.name,ids:questions.filter(q=>languageSignals([q.prompt,...q.options].join(' ')).some(s=>s.name===rule.name)).map(q=>q.id)})),
  };
}
