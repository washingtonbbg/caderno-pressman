// Read literal learning content without executing page modules or duplicating their text.
import ts from 'typescript';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { isGenericExplanation } from '../lib/explanation-policy.mjs';

function literals(path) {
  const file = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const declarations = new Map(file.statements.filter(ts.isVariableStatement).flatMap(s => s.declarationList.declarations).map(d => [d.name.getText(file), d.initializer]));
  function value(node) {
    if (!node) throw Error(`Missing literal in ${path}`);
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
    if (ts.isNumericLiteral(node)) return Number(node.text);
    if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
    if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
    if (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node)) return value(node.expression);
    if (ts.isIdentifier(node)) return value(declarations.get(node.text));
    if (ts.isArrayLiteralExpression(node)) return node.elements.flatMap(n => ts.isSpreadElement(n) ? value(n.expression) : [value(n)]);
    if (ts.isObjectLiteralExpression(node)) return Object.fromEntries(node.properties.map(p => {
      if (ts.isShorthandPropertyAssignment(p)) return [p.name.text, value(declarations.get(p.name.text))];
      if (ts.isPropertyAssignment(p)) return [p.name.text ?? p.name.getText(file), value(p.initializer)];
      throw Error(`Unsupported property in ${path}: ${p.getText(file)}`);
    }));
    throw Error(`Non-literal content in ${path}: ${node.getText(file).slice(0, 100)}`);
  }
  return name => declarations.has(name) ? value(declarations.get(name)) : undefined;
}

const books = literals('app/page.tsx')('books');
const catalog = [];
function append(book, question, index, graph) {
  if (!question.prompt || !Array.isArray(question.options) || !Number.isInteger(question.answer) || question.answer < 0 || question.answer >= question.options.length) throw Error(`Invalid question ${book.href} #${index + 1}`);
  const supplemental = book.href === '/ifmt-banco-complementar';
  if (supplemental) {
    if ([question.explanation, question.bankAnalysis, ...(question.optionAnalysis || [])].some(isGenericExplanation)) throw Error(`Unreviewed template in ${book.href} #${index + 1}`);
    if (question.reviewStatus === 'reviewed' || question.explanationMethod) {
      if (!question.explanation?.trim() || question.optionAnalysis?.length !== 5 || question.optionAnalysis.some(item => !item.trim())) throw Error(`Incomplete editorial review #${index + 1}`);
      if (!question.explanationMethod || !question.reviewedAt || !question.citations?.some(c => c.role === 'concept' && c.verified === 1)) throw Error(`Missing conceptual evidence #${index + 1}`);
      const reviewedHash = createHash('sha256').update(JSON.stringify([question.referenceText || '', question.prompt, question.options, question.answer])).digest('hex');
      if (question.contentHash !== reviewedHash) throw Error(`Stale editorial review #${index + 1}`);
    }
    if (typeof question.sourceUrl !== 'string' || !question.sourceUrl.startsWith('https://')) throw Error(`Missing HTTPS source in ${book.href} #${index + 1}`);
    if (!Array.isArray(question.citations) || !question.citations.length) throw Error(`Missing citation in ${book.href} #${index + 1}`);
  }
  // Explanations, alternative analyses and citations are metadata. Keep them out
  // of the identity so enriching a question never discards the learner's history.
  const fingerprint = JSON.stringify([question.referenceText || '', question.prompt, question.options, question.answer, question.code || '', question.image || '', question.figure || '']);
  catalog.push({
    id: `${book.href.slice(1)}:${createHash('sha256').update(fingerprint).digest('hex').slice(0, 20)}`,
    notebook: book.href, notebookTitle: book.title, number: index + 1,
    subject: question.subject || book.title, label: question.level || question.tag || (question.examId ? `Questão ${question.examId}` : 'Banco de Administração'),
    source: question.source || book.author, sourceUrl:question.sourceUrl || '', referenceText:question.referenceText || '', requiresSource:!!question.requiresSource,
    examBlock:Object.prototype.hasOwnProperty.call(question,'examBlock')?question.examBlock:undefined,
    prompt: question.prompt, options: question.options, answer: question.answer,
    explanation: question.explanation || question.why || '', languageNote: question.languageNote || question.xray || question.trap || '',
    optionAnalysis: question.optionAnalysis || [], bankAnalysis: question.bankAnalysis || '', reviewStatus: question.reviewStatus || undefined,
    reviewNote: question.reviewNote || '', suggestedAnswer: Number.isInteger(question.suggestedAnswer) ? question.suggestedAnswer : undefined,
    citations: question.citations || [],
    explanationMethod: question.explanationMethod || '', reviewedAt: question.reviewedAt || '', reviewedBy: question.reviewedBy || '',
    sourceHighlight: question.sourceHighlight || '', scoring: question.scoring || 'standard',
    selfExplanation: question.selfExplanation || '', selfExplanationAnswer: question.selfExplanationAnswer || '',
    code: question.code || '', image: question.image || '', imageAlt: question.imageAlt || question.caption || 'Figura da questão',
    graph: question.figure ? graph?.[question.figure] : undefined,
  });
  if (question.figure && !graph?.[question.figure]) throw Error(`Missing figure in ${book.href}`);
}
for (const book of books) {
  const path = `app${book.href}/page.tsx`;
  if (!existsSync(path)) throw Error(`Missing notebook ${path}`);
  const get = literals(path);
  const questions = book.href==='/tecnologia-educacional'
    ? JSON.parse(readFileSync('data/technology-practice.json','utf8'))
    : book.href==='/sema-mt-ti'
      ? [
          ...JSON.parse(readFileSync('data/sema-ti-questions.json','utf8')),
          ...JSON.parse(readFileSync('data/sema-general-cesgranrio.json','utf8')),
        ]
    : book.href==='/ifmt-banco-complementar'
      ? JSON.parse(readFileSync('data/ifmt-supplemental-questions.json','utf8'))
      : get('questions') || get('qs');
  const sharedCodeNames = {'/arvore-busca-c':'source','/condicionais-c':'original','/fatorial':'pythonCode','/ordenacao':'phpCode','/poo-java':'code','/recursividade':'javaCode'};
  const sharedCode = sharedCodeNames[book.href] ? get(sharedCodeNames[book.href]) : '';
  if (questions) questions.forEach((q, i) => append(book, {...q,code:q.code || sharedCode}, i, get('graphData')));
}
const admin = literals('app/administracao-data.ts')('questions');
const adminIds = {
  '/administracao-gestao': ['41','42','43','44','45','51'],
  '/administracao-pessoas-logistica': ['46','47','48','49','50'],
  '/administracao-publica': ['52','53','54','55','58','59','60'],
};
for (const [href, ids] of Object.entries(adminIds)) {
  const book = books.find(b => b.href === href);
  admin.filter(q => ids.includes(q.examId)).forEach((q,i) => append(book,q,i));
}
const bank = JSON.parse(readFileSync('data/admin-bank.json', 'utf8'));
bank.questions.forEach((q,i) => append(books.find(b=>b.href==='/administracao-banco-completo'),q,i));
if (new Set(catalog.map(q=>q.id)).size !== catalog.length) throw Error('Duplicate study IDs');
const covered = new Set(catalog.map(q=>q.notebook));
if (books.some(b=>!covered.has(b.href))) throw Error('A notebook has no study questions');
writeFileSync('data/study-catalog.json', JSON.stringify(catalog, null, 2) + '\n');
console.log(`Study catalog: ${catalog.length} questions, ${covered.size} notebooks.`);
