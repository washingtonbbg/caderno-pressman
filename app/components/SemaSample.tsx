'use client';
import { useState } from 'react';
import type { StudyQuestion } from '@/lib/study-model';

export default function SemaSample({ questions }: { questions: StudyQuestion[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const q = questions[index];
  if (!q) return <p>A amostra está indisponível. Consulte a área de estudo.</p>;
  return <div className="semaSampleCard"><div className="semaSampleMeta"><span>AMOSTRA DO BANCO</span><span>{index + 1} / {questions.length}</span></div><h3>{q.prompt}</h3><div className="semaSampleOptions" role="group" aria-label="Alternativas da questão">{q.options.map((option, i) => <button key={i} disabled={selected !== null} onClick={() => setSelected(i)} className={selected === null ? '' : i === q.answer ? 'sampleCorrect' : i === selected ? 'sampleWrong' : ''}><b>{String.fromCharCode(65 + i)}</b><span>{option}{selected !== null && i === q.answer && <strong> — Gabarito</strong>}{selected === i && i !== q.answer && <strong> — Sua resposta</strong>}</span></button>)}</div>{selected !== null && <div className="semaSampleResult" role="status"><strong>{selected === q.answer ? 'Você acertou.' : 'Este item merece outra revisão.'} Gabarito: {String.fromCharCode(65 + q.answer)}.</strong><p>{q.explanation || 'Este item tem gabarito, mas ainda não tem comentário específico cadastrado.'}</p></div>}<div className="semaSampleBottom"><p>Esta amostra não salva seu histórico.</p><button onClick={() => { setIndex((index + 1) % questions.length); setSelected(null); }}>Outra questão →</button></div><p className="semaSampleSource">Fonte: {q.source}{q.sourceUrl && <> · <a href={q.sourceUrl} target="_blank" rel="noreferrer">Consultar original ↗</a></>}</p></div>;
}
