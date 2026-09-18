import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';
const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';
function outputText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const item of payload?.output ?? []) for (const part of item?.content ?? []) if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
  return '';
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Entre com ChatGPT para gerar uma orientação personalizada.'},{status:401});
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({error:'A orientação sob demanda ainda não foi configurada no servidor.'},{status:503});
  let body: any;
  try { body = await request.json(); } catch { return Response.json({error:'Pedido inválido.'},{status:400}); }
  const prompt=clean(body.prompt,3000),subject=clean(body.subject,400),source=clean(body.source,1200),referenceText=clean(body.referenceText,5000),explanation=clean(body.explanation,3000),recall=clean(body.recall,1200);
  const options=Array.isArray(body.options)?body.options.slice(0,5).map((item:unknown)=>clean(item,1600)):[];
  const answer=Number(body.answer),selected=Number(body.selected);
  if(!prompt||options.length<2||!Number.isInteger(answer)||answer<0||answer>=options.length||!Number.isInteger(selected)||selected< -1||selected>=options.length)return Response.json({error:'Dados insuficientes para gerar a orientação.'},{status:400});
  const alternatives=options.map((option:string,index:number)=>`${String.fromCharCode(65+index)}) ${option}`).join('\n');
  const input=`Assunto: ${subject||'não informado'}\nFonte declarada: ${source||'não informada'}\nTexto de referência: ${referenceText||'não fornecido'}\nEnunciado: ${prompt}\nAlternativas:\n${alternatives}\nGabarito importado: ${String.fromCharCode(65+answer)}\nResposta do estudante: ${selected<0?'não soube responder':String.fromCharCode(65+selected)}\nRecuperação escrita antes da resposta: ${recall||'não registrada'}\nExplicação editorial disponível: ${explanation||'não disponível'}`;
  try {
    const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},body:JSON.stringify({
      model:process.env.OPENAI_STUDY_MODEL||process.env.OPENAI_MEMORY_MODEL||'gpt-5.6-luna',store:false,max_output_tokens:900,
      instructions:'Você é um tutor de concursos em português do Brasil. Produza feedback formativo específico para a questão e para a tentativa do estudante. Ensine a regra que decide o item, aplique-a em passos curtos e contraste o gabarito com a resposta escolhida. Não elogie genericamente, não invente lei, dado, fonte, fato histórico ou justificativa ausente. Quando a evidência fornecida não bastar para confirmar o conteúdo, declare essa limitação no campo limite e recomende conferir a fonte original. O microexercício deve testar o mesmo conceito em uma situação nova e trazer uma resposta curta separada. O próximo passo deve ser uma ação executável em até 10 minutos.',input,
      text:{format:{type:'json_schema',name:'study_coaching',strict:true,schema:{type:'object',additionalProperties:false,properties:{decisiveRule:{type:'string'},steps:{type:'array',items:{type:'string'},minItems:2,maxItems:4},contrast:{type:'string'},microExercise:{type:'string'},microAnswer:{type:'string'},nextStep:{type:'string'},limit:{type:'string'}},required:['decisiveRule','steps','contrast','microExercise','microAnswer','nextStep','limit']}}},
    })});
    const payload=await response.json();
    if(!response.ok){console.error('OpenAI study coach error',response.status,payload?.error?.code);return Response.json({error:'Não foi possível gerar a orientação agora.'},{status:502});}
    const generated=JSON.parse(outputText(payload));
    return Response.json({decisiveRule:clean(generated.decisiveRule,1600),steps:Array.isArray(generated.steps)?generated.steps.map((item:unknown)=>clean(item,900)).filter(Boolean).slice(0,4):[],contrast:clean(generated.contrast,1600),microExercise:clean(generated.microExercise,1200),microAnswer:clean(generated.microAnswer,900),nextStep:clean(generated.nextStep,900),limit:clean(generated.limit,900)});
  } catch(error){console.error('Study coach generation failed',error);return Response.json({error:'Não foi possível gerar a orientação agora.'},{status:502});}
}
