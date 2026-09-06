import Link from 'next/link';
import catalog from '@/data/study-catalog.json';
import QuestionExplanation from '../components/QuestionExplanation';
import FeedbackEvidence from '../components/FeedbackEvidence';

export const metadata={title:'Formação de palavras — revisão conceitual IFMT'};
export default function PortugueseReviewPage() {
  const questions=catalog.filter(q=>q.notebook==='/ifmt-banco-complementar'&&q.explanationMethod);
  return <main className="learnWorkspace"><div className="learnContainer">
    <header className="learnTop"><Link href="/ifmt-banco-complementar">← Banco complementar IFMT</Link><a href="#evidencias">Evidências do método</a></header>
    <div className="learnIntro"><div><p className="learnEyebrow">PORTUGUÊS · REVISÃO CONCEITUAL</p><h1>Entender, não decorar a letra.</h1></div></div>
    <p>Quatro questões de formação de palavras, com definições, aplicação a cada alternativa e uma pergunta para explicar com suas palavras. O caso de “revolução” preserva o gabarito oficial, mas está separado do treino pontuado por sua ressalva conceitual.</p>
    <nav aria-label="Questões comentadas"><ul>{questions.map(q=><li key={q.id}><a href={`#q${q.sourceUrl.split('/').pop()}`}>{q.label.split(' · ')[0]} — {q.sourceHighlight||q.options[q.answer]}</a></li>)}</ul></nav>
    {questions.map(q=><article className="learnQuestion" id={`q${q.sourceUrl.split('/').pop()}`} key={q.id}>
      <p className="learnSource">{q.label} · {q.source}</p>
      {q.referenceText&&<details className="learnReferenceText"><summary>Texto de referência completo</summary><p>{q.referenceText}</p></details>}
      <h2>{q.prompt}</h2>
      {q.sourceHighlight&&<p><strong>Palavra destacada no original: <mark>{q.sourceHighlight}</mark>.</strong></p>}
      {q.requiresSource&&<p><a href={q.sourceUrl} target="_blank" rel="noreferrer">Consultar também a imagem na fonte original ↗</a></p>}
      <p><strong>{q.scoring==='discussion'?'Gabarito oficial confirmado':'Gabarito do caderno'}: {String.fromCharCode(65+q.answer)} — {q.options[q.answer]}</strong>{q.scoring==='discussion'&&' · Discussão sem pontuação.'}</p>
      <QuestionExplanation question={q} expanded/>
    </article>)}
    <div className="learnMethods" id="evidencias"><h2>Como esta revisão se apoia em evidências</h2><FeedbackEvidence/></div>
  </div></main>;
}
