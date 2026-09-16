import type {StudyQuestion,StudyProgress} from './study-model';

export const SEMA_DATE='2026-12-13';
export type SemaTopic='fundamentals'|'development'|'security'|'data'|'management'|'portuguese'|'mt'|'ethics';
export type SemaSettings={minutes:number;days:number[]};
export type SemaTiming={questionId:string;attempts:number;responseMs:number;studyMs:number;timedAttempts:number;lastResponseMs:number;lastAt:number};
export const defaultSemaSettings:SemaSettings={minutes:30,days:[1,2,3,4,5,6]};
export const semaTopics:{id:SemaTopic;title:string;weight:number;lesson:string;example:string;check:string;syllabus:string;gap:string}[]=[
 {id:'fundamentals',title:'Fundamentos de TI',weight:20,lesson:'Um algoritmo é uma sequência de passos para resolver um problema. Uma variável guarda um valor; uma condição escolhe um caminho; um laço repete passos. Em banco de dados, tabelas organizam registros e SQL permite consultar e alterar esses registros.',example:'Se idade >= 18, exibir “maior de idade”; caso contrário, “menor de idade”. Para consultar uma tabela: SELECT nome FROM pessoas WHERE idade >= 18. O filtro escolhe linhas; SELECT escolhe as colunas.',check:'Explique a diferença entre repetir uma ação e escolher entre dois caminhos. Depois diga o que o WHERE faz.',syllabus:'Algoritmos, busca, ordenação, listas, pilhas, filas, árvores AVL/B+, hash, complexidade; processos, memória, escalonamento, Linux, AD/DNS/DHCP e arquivos; POO, Python, Java; MER, normalização, SQL, ACID; UX, acessibilidade e prototipação.',gap:'Verificar cobertura de sistemas operacionais, comandos Linux, Windows Server, árvores e complexidade.'},
 {id:'development',title:'Desenvolvimento de software',weight:15,lesson:'Desenvolver software envolve planejar, construir, testar e entregar. Git registra versões. Integração contínua executa verificações a cada mudança. Uma API define como sistemas conversam. Métodos ágeis organizam entregas pequenas com feedback.',example:'Um portal recebe um pedido pela API, valida os dados e grava no banco. Testes automáticos verificam a mudança antes da entrega. Um contêiner empacota a aplicação e suas dependências; não é o mesmo que uma máquina virtual.',check:'Descreva o caminho de uma alteração: versão, teste e entrega. Qual papel a API desempenha?',syllabus:'DevOps/DevSecOps, CAMS, CI/CD, Git, Docker, Kubernetes; monólitos, microsserviços, SOA, REST, SOAP, padrões; Scrum, Kanban e XP.',gap:'Complementar Docker, Kubernetes e DevSecOps; quantidade de questões não comprova cobertura.'},
 {id:'security',title:'Segurança e privacidade',weight:15,lesson:'Segurança busca preservar confidencialidade (quem acessa), integridade (ausência de alteração indevida) e disponibilidade (acesso quando necessário). Privacidade trata do uso de dados pessoais. Criptografia, controle de acesso e cópias de segurança resolvem problemas diferentes.',example:'No cadastro de um cidadão, limitar acesso ajuda na confidencialidade. Detectar alterações ajuda na integridade. Recuperar o serviço após uma falha ajuda na disponibilidade. Um backup não substitui o controle de acesso.',check:'Dê um exemplo de falha de confidencialidade, outro de integridade e outro de disponibilidade.',syllabus:'LGPD/GDPR, Zero Trust, firewall, IDS/IPS, WAF, vulnerabilidades e pentest; criptografia simétrica/assimétrica, hash, certificados e PKI; riscos e BCP/DRP.',gap:'O banco original concentra segurança em LGPD. Estudar também criptografia, redes de proteção, riscos e continuidade.'},
 {id:'data',title:'Inteligência artificial e dados',weight:10,lesson:'Dados podem ser preparados para análise por extração, transformação e carga (ETL). Um modelo de aprendizado supervisionado aprende com exemplos que têm uma resposta conhecida. No aprendizado não supervisionado, procura padrões sem esse rótulo.',example:'Prever um valor usando exemplos com valores conhecidos é aprendizado supervisionado. Agrupar registros semelhantes sem grupos previamente informados é um caso de aprendizado não supervisionado.',check:'Explique com suas palavras a diferença entre prever uma classe conhecida e descobrir grupos.',syllabus:'Aprendizado supervisionado, não supervisionado e por reforço; redes neurais, NLP, visão; Big Data, NoSQL, Hadoop; BI, ETL, estrela e floco de neve.',gap:'Revisar visão computacional e aprendizado por reforço, além dos tópicos mais frequentes no banco.'},
 {id:'management',title:'Gestão e tecnologias emergentes',weight:10,lesson:'Gerenciar serviços de TI envolve manter o serviço funcionando e organizar mudanças. Um incidente interrompe ou reduz a qualidade do serviço. Investigar o problema busca sua causa. Governança orienta decisões e alinhamento com os objetivos da organização.',example:'O portal caiu: restaurar seu funcionamento é tratar o incidente. Investigar por que ele cai repetidamente é gerenciar o problema. Planejar e avaliar uma atualização é gerenciar mudança.',check:'Por que restaurar um serviço e descobrir a causa da falha são atividades diferentes?',syllabus:'IoT, sensores, gateway, nuvem, Edge Computing; blockchain, ledger distribuído e consenso; ITIL, incidentes, problemas, mudanças e configurações; COBIT e alinhamento estratégico.',gap:'Complementar COBIT, IoT e Edge Computing. O banco tem itens de ITIL e blockchain, mas não cobre necessariamente todo o eixo.'},
 {id:'portuguese',title:'Língua Portuguesa',weight:15,lesson:'Comece identificando o assunto, a ideia central e o que o comando pede. Diferencie informação expressa de inferência. Conectivos indicam relações: oposição, causa, consequência ou conclusão. A gramática deve ser lida dentro da frase.',example:'“Estudou, mas não revisou.” O “mas” estabelece oposição; não indica causa. Trocar um conectivo pode mudar a relação entre as ideias mesmo quando as duas orações permanecem iguais.',check:'Resuma um parágrafo em uma frase e indique qual trecho sustenta sua interpretação.',syllabus:'Interpretação, argumentação, comunicação, organização, coesão, coerência, tipologia; ortografia, acentuação, crase, sintaxe, pontuação, concordância, regência, semântica, colocação pronominal e redação oficial.',gap:'Os itens reaproveitados são treino parcial; verificar cada tópico do edital e o Manual de Redação.'},
 {id:'mt',title:'Geografia e História de MT',weight:10,lesson:'Estude relacionando lugar, período histórico e atividade econômica. Organize a história em uma linha do tempo e a geografia em mapas. Evite decorar números sem saber o ano e a fonte: indicadores econômicos e populacionais mudam.',example:'Para mineração e povoamento, conecte a atividade econômica à formação dos núcleos urbanos e às relações de trabalho. Para migração, relacione infraestrutura, ocupação territorial e transformações econômicas.',check:'Monte uma linha do tempo: ocupação indígena, colonização, mineração, Império, República e divisão do estado.',syllabus:'Espaço regional, natureza, gestão ambiental, indústria, população, urbanização e espaço agrário; povos indígenas, missões, bandeiras, Cuiabá, Vila Bela, mineração, pecuária, Rusga, Guerra da Tríplice Aliança, Marcha para o Oeste, ditadura e divisão de MT.',gap:'O banco reaproveitado é sobretudo geográfico; História de MT exige material complementar.'},
 {id:'ethics',title:'Ética, atualidades e legislação',weight:5,lesson:'Separe quatro frentes: filosofia e conhecimento; conduta e enfrentamento ao assédio; atualidades; legislação estadual. Nas leis, estude o texto atualizado e organize regras por assunto. Não substitua as normas estaduais por estatutos federais de outro concurso.',example:'Monte três fichas: LC 112/2002 — ética funcional; LC 04/1990 — estatuto dos servidores; LC 38/1995 — Código Estadual do Meio Ambiente. Registre a regra e um caso de aplicação após ler o dispositivo.',check:'Explique o que cada uma das três leis regula e registre dúvidas para conferir no texto oficial.',syllabus:'Conhecimento empírico, científico e filosófico, racionalismo, empirismo, criticismo, pós-verdade e IA; assédio e valores; atualidades do Brasil/MT; LC 112/2002, LC 04/1990 e LC 38/1995.',gap:'Sem banco específico validado para este bloco. O cronograma reserva estudo, sem inventar questões ou medir domínio inexistente.'},
];
export function semaTopic(q:StudyQuestion):SemaTopic|null {
 if(q.notebook==='/lingua-portuguesa')return 'portuguese';
 if(q.notebook==='/mato-grosso-transversais')return [11,12,13,16].includes(q.number)?null:'mt';
 if(q.notebook!=='/sema-mt-ti')return null;
 const s=q.subject;
 if(/Direito Digital|Segurança|Criptograf/i.test(s))return 'security';
 if(/Blockchain|Governança|ITIL|COBIT|IoT/i.test(s))return 'management';
 if(/Python|Java|Algoritm|Estruturas de Controle|Variáveis|Lista, Fila|Árvores|Ordenação|Métodos de Busca|Orienta|Prototip|Usabilidade|User Experience|Acessibilidade/i.test(s))return 'fundamentals';
 if(/Ciência de Dados|NoSQL/i.test(s))return 'data';
 if(/Banco de Dados/i.test(s))return 'fundamentals';
 return 'development';
}
export function semaDay(at:number) {return new Date(at-4*3600000).toISOString().slice(0,10);}
export function validSemaSettings(value:unknown):value is SemaSettings {
 const v=value as SemaSettings;
 return !!v&&Number.isInteger(v.minutes)&&v.minutes>=15&&v.minutes<=180&&Array.isArray(v.days)&&v.days.length>=1&&v.days.length<=7&&new Set(v.days).size===v.days.length&&v.days.every(d=>Number.isInteger(d)&&d>=0&&d<=6);
}
export function semaAnalysis(questions:StudyQuestion[],progress:Record<string,StudyProgress>,timing:SemaTiming[],at:number) {
 const byId=new Map(timing.map(t=>[t.questionId,t]));
 return semaTopics.map(topic=>{
  const items=questions.filter(q=>semaTopic(q)===topic.id&&q.scoring!=='discussion');
  const seen=items.flatMap(q=>progress[q.id]?[progress[q.id]]:[]);
  const measured=items.flatMap(q=>byId.has(q.id)?[byId.get(q.id)!]:[]);
  const attempts=seen.reduce((s,p)=>s+p.attempts,0),correct=seen.reduce((s,p)=>s+p.correct,0);
  const weak=seen.filter(p=>!p.lastCorrect||p.confidence!=='sure').length;
  const due=seen.filter(p=>p.dueAt<=at).length;
  const studied=measured.reduce((s,t)=>s+t.studyMs,0);
  const timed=measured.reduce((s,t)=>s+t.timedAttempts,0);
  const avgMs=timed?studied/timed:240000;
  return {...topic,items:items.length,seen:seen.length,attempts,correct,weak,due,studied,avgMs,measured:timed,
   priority:topic.weight*(1+(seen.length?weak/seen.length:.5))+(due?Math.min(due,10):0)};
 });
}
// A bounded allocation with weekly coverage; speed determines volume, never mastery.
export function semaWeek(questions:StudyQuestion[],progress:Record<string,StudyProgress>,timing:SemaTiming[],settings:SemaSettings,at:number) {
 const stats=semaAnalysis(questions,progress,timing,at);
 const allocations=Object.fromEntries(stats.map(s=>[s.id,0])) as Record<SemaTopic,number>;
 const today=semaDay(at);
 const offset=(new Date(`${today}T12:00:00Z`).getUTCDay()+6)%7;
 const start=Date.parse(`${today}T12:00:00-04:00`)-offset*86400000;
 return Array.from({length:offset+7},(_,i)=>{
  if(i>0&&i%7===0)for(const t of stats)allocations[t.id]=0;
  const when=start+i*86400000,day=semaDay(when),weekday=new Date(`${day}T12:00:00Z`).getUTCDay();
  if(day>=SEMA_DATE||!settings.days.includes(weekday))return {day,rest:true,blocks:[]};
  const ranked=[...stats].sort((a,b)=>Number(allocations[a.id]>0)-Number(allocations[b.id]>0)||b.priority/(1+allocations[b.id])-a.priority/(1+allocations[a.id]));
  const selected=ranked.slice(0,2);
  const blocks=selected.map((s,j)=>{allocations[s.id]++;const minutes=j===0?Math.ceil(settings.minutes*.6):Math.floor(settings.minutes*.4);return {topic:s.id,minutes,count:s.items?Math.min(10,Math.max(1,Math.floor(minutes*60000/Math.max(120000,s.avgMs)))):0};});
  return {day,rest:false,blocks};
 }).slice(offset);
}
export function semaSession(questions:StudyQuestion[],progress:Record<string,StudyProgress>,topic:SemaTopic,count:number,at:number) {
 const rank=(q:StudyQuestion)=>{const p=progress[q.id];return p?(p.dueAt<=at?0:!p.lastCorrect||p.confidence!=='sure'?1:3):2;};
 return questions.filter(q=>semaTopic(q)===topic&&q.scoring!=='discussion'&&(!progress[q.id]||progress[q.id].dueAt<=at||!progress[q.id].lastCorrect||progress[q.id].confidence!=='sure'))
 .sort((a,b)=>rank(a)-rank(b)||(progress[a.id]?.dueAt??0)-(progress[b.id]?.dueAt??0)||a.number-b.number).slice(0,count);
}
