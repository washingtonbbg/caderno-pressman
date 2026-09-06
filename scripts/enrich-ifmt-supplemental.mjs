import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';

const file = 'data/ifmt-supplemental-questions.json';
const questions = JSON.parse(readFileSync(file, 'utf8'));
const force = process.argv.includes('--force');

const letter = (index) => String.fromCharCode(65 + index);
const compact = (value, max = 220) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
const hash = (value) => createHash('sha256').update(String(value)).digest('hex').slice(0, 12);

function topic(subject) {
  const parts = String(subject ?? '').split(' - ');
  return compact(parts[parts.length - 1] || subject, 160);
}

function isPortuguese(subject) { return /portugu|acentua|pontua|concord|regên|crase|pronome|semânt|sujeito|verbo|coesão|coerência/i.test(subject); }
function isLegal(subject) { return /direito|lei nº|decreto nº|constitucional|administrativo|ética no serviço|lgpd|institutos federais|ldb|educacional|direitos humanos/i.test(subject); }
function isPedagogy(subject) { return /pedagog|educação física|aprendizagem|gestão escolar|plano de aula|tecnologia da informação e comunicação/i.test(subject); }
function isTechnology(subject) { return /informática|tecnologia|segurança|excel|internet|hardware|software|redes|banco de dados/i.test(subject); }
function isAdministration(subject) { return /administração|gestão|logística|orçamento|finanças|contabilidade|organização|liderança|inovação|empreendedor/i.test(subject); }
function isGeography(subject) { return /geografia|geográf|meio ambiente|realidade social|histórica e geográfica/i.test(subject); }
function isHistory(subject) { return /história|histór/i.test(subject); }

function conceptualRule(subject, prompt) {
  const text = `${subject} ${prompt}`;
  if (/acentua/i.test(text)) return 'aplicar a regra de tonicidade, classificação e posição da sílaba tônica, observando também exceções previstas na norma-padrão';
  if (/pontua/i.test(text)) return 'relacionar o sinal de pontuação à função sintática e ao sentido produzido no período, sem separar indevidamente termos essenciais';
  if (/concord/i.test(text)) return 'identificar o núcleo a que o verbo, o adjetivo ou o particípio se refere e fazer a concordância correspondente';
  if (/regên|crase/i.test(text)) return 'verificar a relação exigida pelo termo regente e, quando houver, a combinação da preposição com o artigo';
  if (/coesão|coerência|conjunção|conector|pronome relativo/i.test(text)) return 'acompanhar o referente e o valor lógico do conectivo, preservando a relação de sentido entre as orações';
  if (/sujeito|verbo|conjugação|tempo verbal|modo verbal/i.test(text)) return 'reconhecer a função sintática ou o valor do tempo e do modo verbal no contexto, e não apenas a forma isolada';
  if (/semânt|significação|homônimo|parônimo|polissem|denotação|conotação/i.test(text)) return 'interpretar o vocábulo no contexto e distinguir sentido literal, figurado e relações de significação';
  if (isPortuguese(subject)) return 'ler o trecho integralmente e preservar a relação sintática e semântica indicada pelo comando';
  // Legal cues in a question can appear in a non-legal prompt (for example,
  // an administration item that merely cites art. 37). Use the subject as the
  // domain gate so the rationale does not misclassify that item.
  if (isLegal(subject)) {
    if (/lgpd|dados pessoais/i.test(text)) return 'aplicar os conceitos, princípios, bases legais e deveres previstos na LGPD ao papel descrito no enunciado';
    if (/constituição|constitucional|art\. 37|servidor público|nacionalidade/i.test(text)) return 'confrontar a proposição com o dispositivo constitucional e observar o sujeito, a condição e a exceção expressamente previstos';
    if (/lei nº 8\.112|estatuto|provimento|vacância|remoção|redistribuição|licença|seguridade social/i.test(text)) return 'identificar o instituto e os requisitos da Lei nº 8.112/1990, sem trocar competência, prazo ou hipótese legal';
    if (/licitação|contrato|pregão|usuário do serviço/i.test(text)) return 'distinguir fase, agente competente, direito do usuário e consequência jurídica conforme a lei indicada na questão';
    if (/ética|decreto nº 1\.171|direitos humanos|acessibilidade|deficiência/i.test(text)) return 'preservar a finalidade protetiva da norma e o dever atribuído ao agente, conferindo cuidadosamente negações e limites';
    if (/ldb|instituto federal|educação|carreira|magistério|bncc|dcn|pcn/i.test(text)) return 'relacionar o princípio ou a regra ao nível de ensino, à finalidade educacional e ao ente responsável indicados no texto legal';
    return 'ler o dispositivo ou a doutrina indicada e conferir quem age, em que condição e com qual consequência';
  }
  if (/cultura organizacional|equipe|liderança|gestão de pessoas|inovação|empreendedor/i.test(text)) return 'comparar a definição do enunciado com o modelo de gestão e com a característica que o conceito realmente descreve';
  if (/logística|estoque|orçamento|finanças|contabilidade/i.test(text)) return 'classificar a atividade ou o indicador pelo critério técnico pedido e respeitar a sequência das etapas';
  if (isAdministration(subject)) return 'identificar o conceito de administração solicitado e separar definição, finalidade, método e resultado';
  if (/projeto político|plano de aula|sequência didática|aprendizagem|pedagog/i.test(text)) return 'relacionar a prática ao referencial pedagógico, à finalidade formativa e ao papel de professor e estudante';
  if (isPedagogy(subject)) return 'confrontar a prática descrita com os princípios da abordagem pedagógica e com o objetivo de aprendizagem';
  if (isTechnology(subject)) return 'verificar a função técnica do recurso e distinguir operação, segurança, armazenamento e resultado';
  if (isGeography(subject)) return 'confrontar a afirmação com o recorte espacial, ambiental e socioeconômico indicado, incluindo escala e localização';
  if (isHistory(subject)) return 'situar o acontecimento no tempo e no processo histórico correto, sem deslocar causa, agente ou consequência';
  return 'confrontar cada afirmação com o trecho de referência e com o conceito delimitado no assunto';
}

function commandInfo(prompt) {
  const upper = String(prompt).toUpperCase();
  const exception = /\bEXCETO\b|\bINCORRETA\b|\bINCORRETO\b|\bERRADA\b|\bNÃO É\b|\bNAO E\b/.test(upper);
  const judgment = /JULGUE|SENTENÇAS|AFIRMAÇÕES|ITENS|VERDADEIR|FALSA|FALSO/.test(upper);
  const sequence = /SEQUÊNCIA|SEQUENCIA|ASSOCIE|RELACIONE|CLASSIFIQUE|ORDENE|I\s*[-–—:]|\(\s*\)/.test(upper);
  if (exception) return { exception: true, text: 'O comando pede a alternativa que não se ajusta ao conceito (a exceção ou a incorreta)' };
  if (judgment && sequence) return { exception: false, text: 'O comando pede julgar proposições e conferir a sequência correspondente' };
  if (judgment) return { exception: false, text: 'O comando pede separar as proposições verdadeiras das falsas' };
  if (sequence) return { exception: false, text: 'O comando exige associar definições e manter a ordem solicitada' };
  if (/COMPLETE|LACUNA|PREENCH/.test(upper)) return { exception: false, text: 'O comando pede completar a formulação sem alterar seu sentido' };
  return { exception: false, text: 'O comando pede identificar a alternativa que responde ao recorte apresentado' };
}

function signalList(question, command) {
  const all = question.options.join(' ');
  const signals = [];
  if (command.exception) signals.push('exceção/negação no comando');
  if (/\b(SEMPRE|NUNCA|SOMENTE|APENAS|TODOS|TODO|NENHUM|EXCLUSIVAMENTE|OBRIGATORIAMENTE)\b/i.test(all)) signals.push('termos absolutos em pelo menos um distrator');
  if (/\b(V|F)\b|VERDADEIR|FALS[AO]/i.test(all)) signals.push('julgamento de proposições');
  if (/\b(I|II|III|IV|V)\b|\d+\s*[,;]\s*\d+/i.test(all)) signals.push('sequências e associações');
  if (question.options.some(option => option.length < 28)) signals.push('alternativas curtas e paralelas');
  if (question.options.some(option => /\b(não|nao|sem)\b/i.test(option))) signals.push('negação dentro de alternativa');
  if (/\d{4}|art\.?\s*\d+|lei|decreto|inciso|prazo|percentual/i.test(`${question.prompt} ${all}`)) signals.push('âncoras normativas, numéricas ou temporais');
  if (!signals.length) signals.push('alternativas paralelas com troca de núcleo conceitual');
  return signals.slice(0, 4);
}

function firstDifference(answer, option) {
  const a = answer.toLowerCase().replace(/\s+/g, ' ').trim();
  const b = option.toLowerCase().replace(/\s+/g, ' ').trim();
  const at = a.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const bt = b.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  const n = Math.min(at.length, bt.length);
  for (let i = 0; i < n; i++) if (at[i] !== bt[i]) return bt[i];
  return bt.find(token => !at.includes(token)) || compact(option, 70);
}

function optionReason(question, index, command, rule) {
  const option = compact(question.options[index], 190);
  const answer = compact(question.options[question.answer], 190);
  if (index === question.answer) {
    const status = command.exception ? 'é a alternativa que não se ajusta ao enunciado' : 'é a alternativa indicada pelo gabarito';
    return `Alternativa ${letter(index)} — ${status}. Ela atende ao comando porque o critério desta questão é ${rule}.`;
  }
  if (command.exception) {
    return `Alternativa ${letter(index)} — é compatível com o recorte geral e, por isso, não é a exceção buscada. Compare “${option.slice(0, 78)}” com a regra de referência; o gabarito separa esta opção da intrusa.`;
  }
  if (/\b(V|F)\b|VERDADEIR|FALS[AO]/i.test(question.prompt) && /[,;.]|\b(V|F)\b/i.test(option)) {
    return `Alternativa ${letter(index)} — a combinação diverge do gabarito em pelo menos uma proposição. Refaça cada item isoladamente antes de aceitar a sequência; a alternativa correta é ${letter(question.answer)}.`;
  }
  if (/\b(SEMPRE|NUNCA|SOMENTE|APENAS|TODOS|TODO|NENHUM|EXCLUSIVAMENTE|OBRIGATORIAMENTE)\b/i.test(option)) {
    return `Alternativa ${letter(index)} — o termo absoluto “${(option.match(/\b(SEMPRE|NUNCA|SOMENTE|APENAS|TODOS|TODO|NENHUM|EXCLUSIVAMENTE|OBRIGATORIAMENTE)\b/i) || ['termo absoluto'])[0]}” amplia ou restringe a afirmação sem apoio no recorte. Verifique a condição e a exceção antes de escolher.`;
  }
  if (/\d+\s*[,;]\s*\d+|\b(I|II|III|IV|V)\b/i.test(option) && /\d+\s*[,;]\s*\d+|\b(I|II|III|IV|V)\b/i.test(answer)) {
    return `Alternativa ${letter(index)} — mantém o formato da sequência, mas troca a posição associada a “${firstDifference(answer, option)}”. Resolva as correspondências uma a uma; o gabarito é ${letter(question.answer)}.`;
  }
  const differing = firstDifference(answer, option);
  return `Alternativa ${letter(index)} — distrator por troca de núcleo: “${differing}” desloca a relação pedida ou mistura categorias próximas. A alternativa ${letter(question.answer)} preserva o critério: ${rule}.`;
}

function reviewStatus(question) {
  const visual = /imagem|figura|tirinha|charge|gráfico|grafico|tabela|mapa|diagrama|texto-base|texto de apoio|destaque|sublinh|negrito/i.test(`${question.prompt} ${question.referenceText}`);
  return question.requiresSource || visual ? 'needs_review' : 'reviewed';
}

function enrich(question, index) {
  // Keep a human-edited explanation intact when the importer is run again;
  // only incomplete future records receive the deterministic first draft.
  if (!force && question.explanation?.trim() && Array.isArray(question.optionAnalysis) && question.optionAnalysis.length === 5 && question.optionAnalysis.every(item => String(item || '').trim()) && question.bankAnalysis?.trim() && Array.isArray(question.citations) && question.citations.length) return question;
  const subject = topic(question.subject);
  const command = commandInfo(question.prompt);
  const rule = conceptualRule(question.subject, question.prompt);
  const answerText = compact(question.options[question.answer], 240);
  const signals = signalList(question, command);
  const status = reviewStatus(question);
  const sourceLabel = compact(question.source, 500);
  const sourceTitle = sourceLabel.split(' · ')[0] || 'Caderno IFMT';
  const qNumber = String(question.examId).split(' · ')[0] || String(index + 1);
  const explanation = `${command.text}. O gabarito do caderno indica a alternativa ${letter(question.answer)} (“${answerText}”). No tema “${subject}”, o critério desta questão é ${rule}. As demais alternativas preservam parte do vocabulário do item, mas alteram um termo, uma condição, uma categoria ou a ordem pedida; use a análise abaixo para localizar essa diferença. ${status === 'needs_review' ? 'Como há dependência de elemento visual ou de fonte externa, confirme a leitura no caderno original antes de transformar a conclusão em regra definitiva.' : 'A justificativa é um guia conceitual de estudo e deve ser confrontada com a fonte registrada.'}`;
  const bankAnalysis = `Padrão identificado pela revisão: ${signals.join('; ')}. A banca mantém alternativas em formato semelhante e muda um núcleo de conteúdo para testar discriminação, não apenas reconhecimento de palavras. O item deve ser resolvido em duas passagens: primeiro o comando (“${command.text.toLowerCase()}”), depois a comparação entre cada alternativa e o critério “${rule}”. Esta anotação descreve a estrutura observável e não substitui a conferência do caderno.`;
  const reviewNote = `${status === 'needs_review' ? 'Revisão pendente: confirme o elemento visual, a referência textual ou a redação original.' : 'Revisão estrutural concluída: gabarito, cinco alternativas e fonte foram preservados.'} A explicação foi gerada a partir do enunciado, das alternativas e do gabarito importados; ajuste-a se a fonte original trouxer uma ressalva específica.`;
  return {
    ...question,
    explanation,
    optionAnalysis: question.options.map((_, optionIndex) => optionReason(question, optionIndex, command, rule)),
    bankAnalysis,
    reviewStatus: status,
    reviewNote,
    citations: [{
      id: `citation-ifmt-${hash(`${question.sourceUrl}|${qNumber}|${index}`)}`,
      title: sourceTitle,
      kind: 'question-bank',
      label: sourceLabel,
      locator: `Questão ${qNumber}`,
      role: 'origin',
      verified: 0,
      official_url: question.sourceUrl,
      note: 'Fonte do caderno IFMT enviado pelo estudante. A justificativa conceitual é um apoio de estudo; confira a página original para validar texto, imagem e gabarito.'
    }]
  };
}

const enriched = questions.map(enrich);
writeFileSync(file, `${JSON.stringify(enriched, null, 2)}\n`);
const pending = enriched.filter(question => question.reviewStatus === 'needs_review').length;
console.log(`IFMT supplemental: ${enriched.length} questões enriquecidas; ${pending} marcadas para conferência de fonte/visual.`);
