import { getChatGPTUser } from '@/app/chatgpt-auth';
import { locusFor } from '@/lib/memory-palace';

export const dynamic = 'force-dynamic';

const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

function outputText(payload: any): string {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  for (const item of payload?.output ?? []) for (const part of item?.content ?? []) {
    if (part?.type === 'output_text' && typeof part.text === 'string') return part.text;
  }
  return '';
}

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Entre com ChatGPT para gerar seu Palácio da Memória.'},{status:401});

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({error:'A geração ainda não foi configurada no servidor.'},{status:503});

  let body: any;
  try { body = await request.json(); } catch { return Response.json({error:'Pedido inválido.'},{status:400}); }
  const position = Number(body.position);
  const prompt = clean(body.prompt, 1800);
  const correctAnswer = clean(body.correctAnswer, 1000);
  const explanation = clean(body.explanation, 2400);
  if (!Number.isInteger(position) || position < 0 || position > 99 || !prompt || !correctAnswer) {
    return Response.json({error:'Dados insuficientes para criar a cena.'},{status:400});
  }

  const locus = locusFor(position);
  const previous = Array.isArray(body.previous)
    ? body.previous.slice(-3).map((item: any) => `${clean(item?.locus,80)}: ${clean(item?.scene,240)}`).filter(Boolean).join('\n')
    : '';
  const input = `Local atual: ${locus}\nQuestão: ${prompt}\nResposta correta: ${correctAnswer}\nExplicação: ${explanation || 'não cadastrada'}\nCenas anteriores próximas:\n${previous || 'nenhuma'}`;

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method:'POST',
      headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_MEMORY_MODEL || 'gpt-5.6-luna',
        store:false,
        max_output_tokens:450,
        instructions:'Você cria cenas para estudo usando o método de loci. Responda em português do Brasil. Associe somente a regra que determina a resposta correta ao local fornecido. Use uma imagem concreta, visual, exagerada e fácil de reconstruir; não invente fatos. Diferencie explicitamente o conceito correto do erro mais provável. A cena deve ser respeitosa e ter no máximo 90 palavras. A pista deve ser uma pergunta curta, sem entregar literalmente a resposta. A recuperação deve resumir em uma frase o caminho local → imagem → regra.',
        input,
        text:{format:{type:'json_schema',name:'memory_locus',strict:true,schema:{type:'object',additionalProperties:false,properties:{scene:{type:'string'},recallCue:{type:'string'},retrieval:{type:'string'}},required:['scene','recallCue','retrieval']}}},
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      console.error('OpenAI memory-palace error', response.status, payload?.error?.code);
      return Response.json({error:'Não foi possível gerar a cena agora.'},{status:502});
    }
    const generated = JSON.parse(outputText(payload));
    return Response.json({questionId:clean(body.questionId,160),position,locus,scene:clean(generated.scene,1200),recallCue:clean(generated.recallCue,400),retrieval:clean(generated.retrieval,500)});
  } catch (error) {
    console.error('Memory-palace generation failed', error);
    return Response.json({error:'Não foi possível gerar a cena agora.'},{status:502});
  }
}
