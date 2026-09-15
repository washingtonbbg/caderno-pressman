import { getChatGPTUser } from '@/app/chatgpt-auth';

export const dynamic = 'force-dynamic';

const clean = (value: unknown, limit: number) => typeof value === 'string' ? value.trim().slice(0, limit) : '';

export async function POST(request: Request) {
  const user = await getChatGPTUser();
  if (!user) return Response.json({error:'Entre com ChatGPT para gerar a imagem.'},{status:401});
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return Response.json({error:'A geração de imagens ainda não foi configurada no servidor.'},{status:503});
  let body: any;
  try { body = await request.json(); } catch { return Response.json({error:'Pedido inválido.'},{status:400}); }
  const scene = clean(body.scene, 1200);
  const locus = clean(body.locus, 120);
  if (!scene || !locus) return Response.json({error:'Gere a pista textual antes da imagem.'},{status:400});
  const prompt = `Ilustração educacional em português do Brasil para um Palácio da Memória. Local: ${locus}. Cena a representar: ${scene}. Crie uma única cena visual, concreta, exagerada e fácil de lembrar, sem pessoas reais, sem logotipos e sem texto escrito na imagem. Estilo editorial 2D polido, cores acolhedoras, composição clara, adequada para uma página de estudo.`;
  try {
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method:'POST', headers:{authorization:`Bearer ${apiKey}`,'content-type':'application/json'},
      body:JSON.stringify({model:process.env.OPENAI_MEMORY_IMAGE_MODEL || 'gpt-image-1',prompt,size:'1024x1024',quality:'low',output_format:'png'}),
    });
    const payload = await response.json();
    if (!response.ok) { console.error('OpenAI memory-palace image error', response.status, payload?.error?.code); return Response.json({error:'Não foi possível gerar a imagem agora.'},{status:502}); }
    const encoded = payload?.data?.[0]?.b64_json;
    if (typeof encoded !== 'string' || !encoded) return Response.json({error:'A imagem não foi retornada pelo serviço.'},{status:502});
    return Response.json({imageUrl:`data:image/png;base64,${encoded}`});
  } catch (error) { console.error('Memory-palace image generation failed', error); return Response.json({error:'Não foi possível gerar a imagem agora.'},{status:502}); }
}
