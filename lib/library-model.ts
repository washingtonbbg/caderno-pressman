import { isGenericExplanation } from './explanation-policy.mjs';

export type BankQuestion={id:string;number:number;tecId:string;source:string;sourceUrl?:string;referenceText?:string;subject:string;prompt:string;options:string[];answer:number;explanation?:string;reviewNote?:string;optionAnalysis?:string[];analyses?:string[];bankAnalysis?:string;reviewStatus?:'reviewed'|'needs_review';suggestedAnswer?:number;citations?:Citation[];conceptSource?:string;conceptSourceUrl?:string;conceptLocator?:string;explanationMethod?:string;reviewedAt?:string;reviewedBy?:string};
export type Citation={id:string;title:string;kind:string;label:string;locator:string;role:string;verified:number;official_url:string;note:string};
export class HttpError extends Error { constructor(public status:number,message:string){super(message);} }
export function field(value:unknown,name:string,max=1000,required=false){if(typeof value!=='string'){if(required)throw new HttpError(400,`${name}: obrigatório.`);return '';}const s=value.trim();if(s.length>max||required&&!s)throw new HttpError(400,`${name}: tamanho inválido.`);return s;}
export function choice(value:unknown,values:string[],name:string){if(typeof value!=='string'||!values.includes(value))throw new HttpError(400,`${name}: valor inválido.`);return value;}
export function date(value:unknown){const s=field(value,'Data',10);if(s&&(!/^\d{4}-\d{2}-\d{2}$/.test(s)||!Number.isFinite(Date.parse(s))))throw new HttpError(400,'Data inválida.');return s;}
export function safeUrl(value:unknown){const s=field(value,'Endereço',2000);if(!s)return '';try{const u=new URL(s);if(u.protocol!=='https:'||u.username||u.password)throw Error();return u.href;}catch{throw new HttpError(400,'Informe um endereço HTTPS válido.');}}
export function adminIdentity(request:Request,adminEmails:string|undefined){const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();const id=request.headers.get('oai-authenticated-user-id');const allow=(adminEmails??'').split(',').map(s=>s.trim().toLowerCase()).filter(Boolean);return id&&email&&allow.includes(email)?{id,email}:null;}
export function checkWriteOrigin(request:Request){if(request.headers.get('origin')!==new URL(request.url).origin)throw new HttpError(403,'Origem da solicitação não autorizada.');}
export function draftFromPassage(text:string,term:string){if(term.length<2||term.length>120||!text.includes(term))throw new HttpError(400,'Selecione um termo que exista no trecho.');const sentence=text.split(/(?<=[.!?])\s+/).find(s=>s.includes(term))??text;return {prompt:`Complete a lacuna de acordo com a fonte indicada:\n${sentence.replace(term,'__________')}`,correct:term,explanation:`O trecho da fonte registra: ${sentence}`};}
export function normalizeDraft(p:Record<string,unknown>){
  const prompt=field(p.prompt,'Enunciado',12000,true),subject=field(p.subject,'Assunto',300,true),source=field(p.source,'Fonte',1000,true),sourceUrl=safeUrl(p.sourceUrl),explanation=field(p.explanation,'Justificativa',8000,true),bankAnalysis=field(p.bankAnalysis,'Análise da banca',8000,true),reviewNote=field(p.reviewNote,'Nota de revisão',3000);
  if(!sourceUrl)throw new HttpError(400,'Informe o endereço HTTPS da fonte.');
  if(!Array.isArray(p.options)||p.options.length!==5)throw new HttpError(400,'Informe cinco alternativas.');
  const options=p.options.map(v=>field(v,'Alternativa',3000,true));
  if(new Set(options.map(s=>s.toLowerCase())).size!==5)throw new HttpError(400,'As alternativas precisam ser diferentes.');
  if(!Array.isArray(p.optionAnalysis)||p.optionAnalysis.length!==5)throw new HttpError(400,'Explique as cinco alternativas.');
  const optionAnalysis=p.optionAnalysis.map(v=>field(v,'Análise da alternativa',4000,true));
  const answer=Number(p.answer);if(!Number.isInteger(answer)||answer<0||answer>4)throw new HttpError(400,'Selecione o gabarito.');
  const referenceText=field(p.referenceText,'Texto de referência',20000);
  const reviewStatus=choice(p.reviewStatus??'needs_review',['reviewed','needs_review'],'Status de revisão') as 'reviewed'|'needs_review';
  const conceptSource=field(p.conceptSource,'Título da referência conceitual',1000);
  const conceptSourceUrl=safeUrl(p.conceptSourceUrl);
  const conceptLocator=field(p.conceptLocator,'Localizador conceitual',300);
  const explanationMethod=field(p.explanationMethod,'Método da explicação',500);
  const reviewedAt=date(p.reviewedAt);
  const reviewedBy=field(p.reviewedBy,'Revisor',300);
  if (reviewStatus==='reviewed' && (!conceptSource || !conceptSourceUrl || !explanationMethod || !reviewedAt || !reviewedBy)) throw new HttpError(400,'Uma questão marcada como revisada precisa de referência conceitual, método, data e revisor.');
  if ([explanation, bankAnalysis, ...optionAnalysis].some(isGenericExplanation)) throw new HttpError(400,'A justificativa automática foi rejeitada. Explique o conceito e a aplicação específica de cada alternativa.');
  const suggestedAnswer=p.suggestedAnswer===undefined||p.suggestedAnswer===null||p.suggestedAnswer===''?undefined:Number(p.suggestedAnswer);
  if(suggestedAnswer!==undefined&&(!Number.isInteger(suggestedAnswer)||suggestedAnswer<0||suggestedAnswer>4))throw new HttpError(400,'Gabarito sugerido inválido.');
  return {prompt,subject,source,sourceUrl,referenceText,explanation,bankAnalysis,reviewNote,optionAnalysis,options,answer,reviewStatus,suggestedAnswer,conceptSource,conceptSourceUrl,conceptLocator,explanationMethod,reviewedAt,reviewedBy};
}
export function searchExpression(query:string){return (query.match(/[\p{L}\p{N}]+/gu)??[]).slice(0,12).map(s=>`"${s}"`).join(' AND ');}
