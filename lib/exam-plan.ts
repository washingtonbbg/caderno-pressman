import type { StudyMode, StudyProgress, StudyQuestion } from './study-model';
import { selectSession } from './study-model';

export const EXAM_ID='ifmt-administrador-2026';
export const EXAM_AT=Date.parse('2026-09-13T14:00:00-04:00');
export const FINAL_REVIEW_AT=Date.parse('2026-09-12T18:00:00-04:00');
export type ExamBlock='specific'|'portuguese'|'general'|'technology';
export const examBlocks:{id:ExamBlock;title:string;count:number;gap:string}[]=[
  {id:'specific',title:'Administração · específicos',count:20,gap:'Reforçar regulamentos de contratação, obras, riscos, produção/serviços, pesquisa operacional, finanças e projetos. O banco concentra mais itens em orçamento, ética e administração clássica.'},
  {id:'portuguese',title:'Língua Portuguesa',count:10,gap:'Complementar gêneros textuais, variação linguística, pontuação, regência e períodos compostos.'},
  {id:'general',title:'Gerais e transversais',count:10,gap:'Complementar CF 37–41, Lei 8.112, PCCTAE, conduta, assédio, crimes, improbidade, direitos do usuário e relações étnico-raciais. Rever sociedade, natureza e economia de MT.'},
  {id:'technology',title:'Tecnologia aplicada à educação',count:10,gap:'O treino autoral é introdutório. Praticar Office/LibreOffice/Google, Windows/Linux, ferramentas educacionais, segurança e IA; não substituí-los por programação avançada.'},
];

// Editorial alignment to the user-supplied syllabus, not a prediction of exam frequency.
export function examBlock(q:StudyQuestion):ExamBlock|null {
  if(q.examBlock!==undefined)return q.examBlock;
  if(q.notebook==='/lingua-portuguesa')return 'portuguese';
  if(q.notebook==='/tecnologia-educacional')return 'technology';
  if(q.notebook==='/mato-grosso-transversais')return [11,12,13,16].includes(q.number)?null:'general';
  if(q.notebook==='/legislacao-educacional-ebtt')return [3,7,10].includes(q.number)?'general':null;
  if(q.notebook==='/administracao-publica')return [5,6].includes(q.number)?'technology':[2,3,4,7].includes(q.number)?'specific':null;
  if(q.notebook==='/administracao-banco-completo')return q.number===80?null:'specific';
  if(['/administracao-gestao','/administracao-pessoas-logistica'].includes(q.notebook))return 'specific';
  return null;
}

export function examSession(questions:StudyQuestion[],progress:Record<string,StudyProgress>,mode:StudyMode,limit:number,at:number,mixed:boolean) {
  const selected:StudyQuestion[]=[];
  // 5/10/20/50 item sessions mirror question counts (40/20/20/20), not assumed scoring weights.
  for(const block of examBlocks)selected.push(...selectSession(questions.filter(q=>examBlock(q)===block.id),progress,mode,Math.round(limit*block.count/50),at,mixed));
  const ids=new Set(selected.map(q=>q.id));
  if(selected.length<limit)selected.push(...selectSession(questions.filter(q=>!ids.has(q.id)),progress,mode,limit-selected.length,at,mixed));
  return selected;
}

const predictionSignals:Record<ExamBlock,RegExp[]>={
  specific:[/licita|contrata|lei 14\.133|planejamento|orçamento|despesa|receita|pessoas|logística|estoque|risco|projeto|liderança/i,/ética|controle|inovação|financeir|tir|vpl/i],
  portuguese:[/interpreta|sentido|coesão|conector|concordância|regência|crase|pontuação|oração|período/i,/pronome|verbo|semântica|acentuação/i],
  general:[/mato grosso|pantanal|cerrado|amazônia|constitui|servidor|lei 8\.112|rede federal|instituto federal|ética|improbidade|usuário|racial/i,/administração pública|cidadania|diversidade|meio ambiente/i],
  technology:[/inteligência artificial|\bia\b|moodle|ambiente virtual|tecnologia.*educação|planilha|excel|calc|segurança|dados|lgpd/i,/nuvem|drive|acessibilidade|inclusão|phishing|backup/i],
};

function predictionScore(question:StudyQuestion,block:ExamBlock) {
  const text=`${question.subject} ${question.prompt}`;
  let score=predictionSignals[block].reduce((total,signal,index)=>total+(signal.test(text)?8-index*3:0),0);
  if(question.reviewStatus==='reviewed')score+=3;
  if(question.explanation)score+=2;
  if(question.source.toLowerCase().includes('ifmt'))score+=2;
  if(question.scoring==='discussion')score-=100;
  return score;
}

// Curadoria heurística baseada no edital e na cobertura do banco. Não estima a
// probabilidade real de uma questão nem usa informação privilegiada da prova.
export function predictedExamSession(questions:StudyQuestion[]) {
  const quotas:Record<ExamBlock,number>={specific:8,portuguese:4,general:4,technology:4};
  const selected:StudyQuestion[]=[];
  for(const block of examBlocks.map(item=>item.id)) {
    const candidates=questions.filter(q=>examBlock(q)===block).sort((a,b)=>predictionScore(b,block)-predictionScore(a,block)||a.id.localeCompare(b.id));
    const chosen:StudyQuestion[]=[];
    const subjects=new Set<string>();
    for(const question of candidates)if(!subjects.has(question.subject)){chosen.push(question);subjects.add(question.subject);if(chosen.length===quotas[block])break;}
    for(const question of candidates)if(chosen.length<quotas[block]&&!chosen.includes(question))chosen.push(question);
    selected.push(...chosen);
  }
  return selected;
}

export function capExamReview(progress:StudyProgress,at:number):StudyProgress {
  if(at>=FINAL_REVIEW_AT||progress.dueAt<=FINAL_REVIEW_AT)return progress;
  return {...progress,dueAt:FINAL_REVIEW_AT,intervalDays:Math.ceil((FINAL_REVIEW_AT-at)/86400000)};
}

export const finalWeek=[
  {date:'2026-09-05',label:'05/09 · sábado',title:'Diagnóstico e fundamentos',specific:'Faça uma amostra de Administração. Classifique os erros; reveja teorias, níveis de planejamento, liderança e decisão.',portuguese:'Interpretação, intenção do texto, coesão e conectores. Justifique por que o distrator está errado.',general:'CF 37–41 e visão geral da Lei 8.112: agrupe ingresso, direitos, deveres, proibições e responsabilidades.',technology:'Diagnóstico; arquivos/pastas, Windows e Linux básicos, navegação e segurança.',deliverable:'Mapa dos três pontos mais fracos por bloco. Acerto com chute entra como dúvida.',kind:'diagnostic'},
  {date:'2026-09-06',label:'06/09 · domingo',title:'Planejamento e contratações',specific:'Lei 14.133: princípios, fases, modalidades e critérios. Mapeie PCA/PGC, ETP, TR, preços, PNCP e agentes aos regulamentos citados no edital.',portuguese:'Concordância, regência e crase: resolva e explique a regra de cada erro.',general:'Leis 11.892 e 11.091: Rede Federal e carreira TAE. Compare com a Lei 8.112.',technology:'Word/Writer/Documentos; Excel/Calc/Planilhas: referências relativas/absolutas, funções, filtros e classificação.',deliverable:'Uma página de distinções entre instrumentos de contratação + exemplos de fórmulas.',kind:'study'},
  {date:'2026-09-07',label:'07/09 · segunda',title:'Execução, controle e ética',specific:'Contratação direta, SRP, credenciamento, habilitação/recursos, gestor/fiscal, sanções e integridade. Obras: medições, aditivos, reajuste/revisão e SINAPI/SICRO.',portuguese:'Colocação pronominal, flexão e classes de palavras; revisão dos erros do dia 05.',general:'Decretos 1.171 e 6.029, Resolução IFMT 91/2014, Lei 8.027 e Portaria MGI 6.719: leia os recortes do edital em fontes oficiais.',technology:'Internet, e-mail, Drive, permissões, cópias de segurança, autenticação e phishing.',deliverable:'Quadro agente × ação × instrumento; lista das confusões que ainda persistem.',kind:'study'},
  {date:'2026-09-08',label:'08/09 · terça',title:'Orçamento e direitos',specific:'Receita e despesa: conceitos, classificações, estágios e princípios. LRF: pessoal, controle e transparência. Resolver questões e conferir a norma.',portuguese:'Pontuação, coordenação e subordinação; efeitos de sentido ao trocar conectores.',general:'Crimes contra a Administração, improbidade e Lei 13.460. Direitos étnico-raciais: Leis 7.716 e 12.288.',technology:'Apresentações, formulários, coleta de dados, gráficos e recursos audiovisuais.',deliverable:'Recuperar de memória as etapas de receita/despesa e explicar cinco erros recorrentes.',kind:'study'},
  {date:'2026-09-09',label:'09/09 · quarta',title:'Pessoas, operações e educação digital',specific:'Pessoas: seleção, cargos, desempenho, incentivos, benefícios, treinamento e qualidade de vida. Logística, estoques, patrimônio, produção/serviços e pesquisa operacional.',portuguese:'Gêneros, sequências textuais, variação, funções da linguagem e linguagem verbal/não verbal.',general:'Comunicação, conflitos, diversidade, ethos público, cidadania e resolução de problemas com dados.',technology:'Moodle, Classroom e Meet; EaD/híbrido, comunicação síncrona/assíncrona, curadoria e desenho instrucional.',deliverable:'Comparar pares de conceitos sem olhar: recrutamento/seleção, treinamento/desenvolvimento, síncrono/assíncrono.',kind:'study'},
  {date:'2026-09-10',label:'10/09 · quinta',title:'Finanças, projetos, riscos e Mato Grosso',specific:'Demonstrações, valor do dinheiro no tempo, risco/retorno, VPL/TIR e custo/estrutura de capital. Projetos, riscos públicos, inovação e empreendedorismo.',portuguese:'Semântica, figuras, ortografia e acentuação; voltar aos erros de 06 e 07.',general:'MT: sociedade, migrações, cultura, biomas, relevo, hidrografia, clima, economia e logística. Atualidades em fontes oficiais, com data.',technology:'IA educacional: usos, limites, revisão humana, privacidade, acesso equitativo, acessibilidade e construção de prompts.',deliverable:'Lista curta do que ainda exige consulta. Fechar conteúdos novos amplos hoje.',kind:'study'},
  {date:'2026-09-11',label:'11/09 · sexta',title:'Ensaio completo e correção',specific:'Faça o treino de 50 itens, com 20 específicos e 10 de cada bloco básico. Confira respostas somente ao terminar.',portuguese:'Incluído no ensaio: registre onde releitura e interpretação consumiram tempo.',general:'Incluído no ensaio: marque lacunas de norma, conteúdo e atualidade.',technology:'Incluído no ensaio: distinguir erro de conceito, prática e leitura.',deliverable:'Corrigir TODOS os erros e chutes. Priorizar os dois assuntos recuperáveis com maior perda de acertos. Se a disponibilidade for curta, separe execução e correção em turnos.',kind:'simulation'},
  {date:'2026-09-12',label:'12/09 · sábado',title:'Revisão leve e preparação',specific:'Somente caderno de erros, distinções decisivas e fórmulas que você já estudou. Sem abrir curso ou livro novo.',portuguese:'Rever regras que você errou; responder uma pequena amostra sem consulta.',general:'Revisar seus quadros de normas e MT; verificar comunicados e cartão de confirmação.',technology:'Refazer mentalmente operações e escolhas de ferramenta que ainda confundem.',deliverable:'Separar documento e materiais permitidos, conferir endereço/horário e trajeto. Encerrar cedo e preservar seu horário habitual de sono.',kind:'light'},
] as const;
