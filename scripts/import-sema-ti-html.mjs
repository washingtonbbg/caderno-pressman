import fs from 'node:fs';
import path from 'node:path';

const inputDir = process.argv[2];
const output = process.argv[3] || 'data/sema-ti-questions.json';
if (!inputDir) throw new Error('Uso: node scripts/import-sema-ti-html.mjs <pasta> [saida]');

function decode(value) {
  return value.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)))
    .replace(/&nbsp;/gi, ' ').replace(/&amp;/gi, '&').replace(/&quot;/gi, '"').replace(/&lt;/gi, '<').replace(/&gt;/gi, '>').replace(/&apos;/gi, "'");
}
function text(html) {
  return decode(html.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim());
}
function cleanPrompt(raw, number) {
  const value = text(raw).replace(new RegExp(`^${number}\\)\\s*`), '').trim();
  return value;
}

const questions = [];
const files = fs.readdirSync(inputDir).filter(name => name.toLowerCase().endsWith('.html')).sort();
for (const file of files) {
  const before = questions.length;
  const html = fs.readFileSync(path.join(inputDir, file), 'utf8');
  const answerText = html.slice(html.indexOf('id=gabarito'));
  const answers = new Map([...answerText.matchAll(/class=resposta>\s*<strong>(\d+)\)<\/strong>\s*([A-E])/gi)].map(match => [Number(match[1]), match[2].toUpperCase()]));
  for (const chunk of html.split('<div class=questao>').slice(1, 201)) {
    const numberMatch = chunk.match(/<strong[^>]*>\s*(\d+)\)&nbsp;<\/strong>/i);
    const promptMatch = chunk.match(/<div class=enunciado>([\s\S]*?)<div class=alternativas>/i);
    const alternatives = chunk.match(/<div class=alternativas>([\s\S]*)/i)?.[1] || '';
    const options = alternatives.split('<div class=alternativa>').slice(1).map((value, index) => {
      const rawOption = text(value.split('</div>')[0]).replace(/^[a-e]\)\s*/i, '').trim();
      return rawOption || `[Figura da alternativa ${String.fromCharCode(65 + index)}]`;
    }).filter(Boolean);
    const info = chunk.match(/<div class=linkQuestao><a href=([^ >]+)[^>]*>[\s\S]*?<\/a><\/div>\s*<div>([\s\S]*?)<\/div>\s*<div class=classificacao>([\s\S]*?)<\/div>/i);
    if (!numberMatch || !promptMatch || options.length < 2 || !info) {
      console.log('SKIP', numberMatch?.[1] || '?', {prompt:!!promptMatch, options:options.length, info:!!info});
      continue;
    }
    const number = Number(numberMatch[1]);
    const answerLetter = answers.get(number);
    const answer = answerLetter ? answerLetter.charCodeAt(0) - 65 : 0;
    questions.push({
      number,
      prompt: cleanPrompt(promptMatch[1], number),
      options,
      answer,
      subject: text(info[3]),
      source: text(info[2]),
      sourceUrl: info[1],
      level: 'SEMA-MT · Analista em Tecnologia da Informação',
    });
  }
  console.log(file, questions.length - before);
}
if (questions.length !== files.length * 200) throw new Error(`Esperadas ${files.length * 200} questões, encontradas ${questions.length}`);
fs.writeFileSync(output, JSON.stringify(questions, null, 2) + '\n');
console.log(`Importadas ${questions.length} questões de ${files.length} cadernos.`);
