// Import editorial reviews, never manufacture a rationale from the answer key.
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { isGenericExplanation } from '../lib/explanation-policy.mjs';

if (process.argv.includes('--force')) throw Error('--force was retired: it could overwrite individually reviewed explanations.');
const file = 'data/ifmt-supplemental-questions.json';
const questions = JSON.parse(readFileSync(file, 'utf8'));
const reviews = JSON.parse(readFileSync('data/ifmt-editorial-reviews.json', 'utf8'));
const seen = new Set();
const enriched = questions.map(question => {
  const review = reviews[question.sourceUrl];
  if (review) {
    const fingerprint = createHash('sha256').update(JSON.stringify([question.referenceText || '', question.prompt, question.options, question.answer])).digest('hex');
    if (fingerprint !== review.contentHash) throw Error(`Stale editorial review: ${question.sourceUrl}. Recheck the changed question before applying it.`);
    seen.add(question.sourceUrl);
    return {...question, ...review, citations: [...question.citations.filter(c => c.role === 'origin' && c.kind === 'question-bank'), ...review.citations]};
  }
  const generic = [question.explanation, question.bankAnalysis, ...(question.optionAnalysis || [])].some(isGenericExplanation);
  if (!generic) return question;
  return {...question, explanation: '', optionAnalysis: [], bankAnalysis: '', reviewStatus: 'needs_review',
    reviewNote: 'Justificativa automática retirada: não explicava os conceitos nem demonstrava os erros das alternativas. Aguarda revisão individual; a fonte e o gabarito importados foram preservados.'};
});
if (seen.size !== Object.keys(reviews).length) throw Error('Editorial review refers to an unknown question.');
writeFileSync(file, JSON.stringify(enriched, null, 2) + '\n');
console.log(`IFMT: ${seen.size} individual editorial commentaries; ${enriched.length - seen.size} awaiting individual review. Original sources and answer keys retained.`);
