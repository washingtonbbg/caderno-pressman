export type Confidence = 'guess' | 'unsure' | 'sure';
export type StudyCitation = {
  id: string; title: string; kind: string; label: string; locator: string; role: string;
  verified: number; official_url: string; note: string;
};
export type StudyQuestion = {
  id: string; notebook: string; notebookTitle: string; number: number; subject: string;
  label: string; source: string; prompt: string; options: string[]; answer: number;
  explanation: string; languageNote: string; code: string; image: string; imageAlt: string; sourceUrl?:string;
  referenceText?: string; requiresSource?: boolean; examBlock?: 'specific'|'portuguese'|'general'|'technology'|null;
  optionAnalysis?: string[]; bankAnalysis?: string; reviewStatus?: 'reviewed'|'needs_review'; reviewNote?: string;
  suggestedAnswer?: number; citations?: StudyCitation[];
  explanationMethod?: string; reviewedAt?: string; reviewedBy?: string; sourceHighlight?: string; scoring?: string;
  selfExplanation?: string; selfExplanationAnswer?: string;
  graph?: { edges: string[][]; arrows?: boolean };
};
export type StudyProgress = {
  questionId: string; attempts: number; correct: number; lastCorrect: boolean; confidence: Confidence;
  intervalDays: number; dueAt: number; lastAt: number; firstCorrect: boolean; delayedAttempts: number;
  delayedCorrect: number; note: string; errorKind: string; noteRevision: number;
};
export type StudyMode = 'recommended' | 'due' | 'errors' | 'new';
const DAY = 86_400_000;

// Transparent product heuristic, not a validated model of individual memory.
// Repeating on the same day never lengthens a review interval.
export function schedule(previous: StudyProgress | undefined, correct: boolean, confidence: Confidence, at: number) {
  let intervalDays = 1;
  const delayed = !!previous && at - previous.lastAt >= DAY;
  if (correct && confidence === 'sure') {
    intervalDays = previous ? (delayed ? Math.min(60, Math.max(3, previous.intervalDays * 2)) : previous.intervalDays) : 3;
  } else if (correct && confidence === 'unsure') {
    intervalDays = previous && delayed ? Math.min(7, Math.max(1, previous.intervalDays)) : 1;
  }
  const dueAt = previous && !delayed && correct ? Math.min(previous.dueAt,at+intervalDays*DAY) : at+intervalDays*DAY;
  return { intervalDays, dueAt, delayed };
}

export function recordAttempt(questionId: string, previous: StudyProgress | undefined, correct: boolean, confidence: Confidence, at: number): StudyProgress {
  const timing = schedule(previous, correct, confidence, at);
  return {
    questionId, attempts: (previous?.attempts ?? 0)+1, correct: (previous?.correct ?? 0)+Number(correct),
    lastCorrect: correct, confidence, intervalDays: timing.intervalDays, dueAt: timing.dueAt, lastAt: at,
    firstCorrect: previous?.firstCorrect ?? correct,
    delayedAttempts: (previous?.delayedAttempts ?? 0)+Number(timing.delayed),
    delayedCorrect: (previous?.delayedCorrect ?? 0)+Number(timing.delayed && correct),
    note: previous?.note ?? '', errorKind: previous?.errorKind ?? '', noteRevision: previous?.noteRevision ?? 0,
  };
}

export function selectSession(questions: StudyQuestion[], progress: Record<string, StudyProgress>, mode: StudyMode, limit: number, at: number, mixed: boolean) {
  const eligible = questions.filter(q => {
    // Contested classifications remain accessible for discussion, not scoring.
    if (q.scoring === 'discussion') return false;
    const p = progress[q.id];
    if (mode === 'new') return !p;
    if (mode === 'due') return p && p.dueAt <= at;
    if (mode === 'errors') return p && (!p.lastCorrect || p.confidence !== 'sure');
    return !p || p.dueAt <= at;
  });
  const rank = (q: StudyQuestion) => progress[q.id] ? (progress[q.id].lastCorrect ? 1 : 0) : 2;
  eligible.sort((a,b) => rank(a)-rank(b) || (progress[a.id]?.dueAt ?? 0)-(progress[b.id]?.dueAt ?? 0));
  const result: StudyQuestion[] = [];
  while (eligible.length && result.length < limit) {
    // Interleave within the same priority tier so new items never displace overdue reviews.
    const tier = rank(eligible[0]);
    let alternate=0;
    if(mixed&&result.length) {
      const counts=new Map<string,number>();
      result.forEach(q=>counts.set(q.subject,(counts.get(q.subject)??0)+1));
      let fewest=Infinity;
      eligible.forEach((q,i)=>{
        if(rank(q)!==tier||q.subject===result[result.length-1].subject)return;
        const seen=counts.get(q.subject)??0;
        if(seen<fewest){fewest=seen;alternate=i;}
      });
    }
    result.push(eligible.splice(Math.max(0,alternate),1)[0]);
  }
  return result;
}
