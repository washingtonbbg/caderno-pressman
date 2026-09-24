import fs from 'node:fs';
import path from 'node:path';

const inputDir = process.argv[2];
const output = process.argv[3] || 'data/sema-general-cesgranrio.json';
if (!inputDir) throw new Error('Uso: node scripts/import-sema-general-html.mjs <pasta> [saida]');

function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&apos;/gi, "'");
}

function text(html) {
  return decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}

function media(rawHtml, sourceUrl) {
  const src = rawHtml.match(/<img\b[^>]*\bsrc=(?:["']([^"']+)["']|([^\s>]+))/i)?.slice(1).find(Boolean);
  if (!src) return {};
  try {
    const image = new URL(decode(src), sourceUrl).href;
    if (!image.startsWith('https://')) return {};
    const imageAlt = text(rawHtml.match(/<img\b[^>]*\balt=(?:["']([^"']*)["']|([^\s>]+))/i)?.slice(1).find(Boolean) || '') || 'Figura da questão';
    return { image, imageAlt };
  } catch { return {}; }
}

const needsVisual = value => /\b(gráfico|figura|imagem|mapa|diagrama|quadro|tabela|tirinha|charge)\b/i.test(value);

const questions = [];
const seen = new Set();
const files = fs.readdirSync(inputDir).filter(name => name.toLowerCase().endsWith('.html')).sort();
for (const file of files) {
  const before = questions.length;
  const html = fs.readFileSync(path.join(inputDir, file), 'utf8');
  const answerText = html.slice(html.indexOf('id=gabarito'));
  const answers = new Map([...answerText.matchAll(/class=resposta>\s*<strong>(\d+)\)<\/strong>\s*([A-E])/gi)].map(match => [Number(match[1]), match[2].toUpperCase()]));

  for (const chunk of html.split('<div class=questao>').slice(1)) {
    const numberMatch = chunk.match(/<strong[^>]*>\s*(\d+)\)&nbsp;<\/strong>/i);
    const promptMatch = chunk.match(/<div class=enunciado>([\s\S]*?)<div class=alternativas>/i);
    const alternatives = chunk.match(/<div class=alternativas>([\s\S]*)/i)?.[1] || '';
    const options = alternatives.split('<div class=alternativa>').slice(1).map((value, index) => {
      const option = text(value.split('</div>')[0]).replace(/^[a-e]\)\s*/i, '').trim();
      return option || `[Figura da alternativa ${String.fromCharCode(65 + index)}]`;
    }).filter(Boolean);
    const info = chunk.match(/<div class=linkQuestao><a href=([^ >]+)[^>]*>[\s\S]*?<\/a><\/div>\s*<div>([\s\S]*?)<\/div>\s*<div class=classificacao>([\s\S]*?)<\/div>/i);
    if (!numberMatch || !promptMatch || options.length < 2 || !info) continue;

    const number = Number(numberMatch[1]);
    const source = text(info[2]);
    const sourceUrl = decode(info[1]);
    const answerLetter = answers.get(number);
    if (!/^CESGRANRIO\b/i.test(source) || !answerLetter || seen.has(sourceUrl)) continue;
    const answer = answerLetter.charCodeAt(0) - 65;
    if (answer >= options.length) throw new Error(`Gabarito fora das alternativas: ${file}, questão ${number}`);
    seen.add(sourceUrl);
    const prompt = text(promptMatch[1]).replace(new RegExp(`^${number}\\)\\s*`), '').trim();
    const visual = media(promptMatch[1], sourceUrl);
    questions.push({
      prompt,
      options,
      answer,
      subject: text(info[3]),
      source,
      sourceUrl,
      ...visual,
      requiresSource: needsVisual(prompt) && !visual.image,
      level: 'SEMA-MT · Conhecimentos Gerais · Cesgranrio',
    });
  }
  console.log(`${file}: ${questions.length - before} questões Cesgranrio`);
}

if (!questions.length) throw new Error('Nenhuma questão Cesgranrio encontrada.');
fs.writeFileSync(output, JSON.stringify(questions, null, 2) + '\n');
console.log(`Importadas ${questions.length} questões Cesgranrio de ${files.length} cadernos.`);
