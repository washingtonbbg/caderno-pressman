import { createEmptyCard, fsrs, State, type Card, type Grade } from 'ts-fsrs';

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
  stability: number; difficulty: number; lapses: number;
  fsrsState: number; fsrsReps: number; learningSteps: number;
};
export type StudyMode = 'recommended' | 'due' | 'errors' | 'new';
const DAY = 86_400_000;
export type MemoryGrade = 1|2|3|4;
export const FSRS_VERSION = 'ts-fsrs@5.4.2/fsrs6';
const scheduler=fsrs({request_retention:.9,maximum_interval:365,enable_fuzz:false,enable_short_term:false,learning_steps:[],relearning_steps:[]});

// The answer and the confidence declared before correction become a four-level
// memory grade. A lucky hit remains "hard" instead of pretending mastery.
export function memoryGrade(correct:boolean,confidence:Confidence):MemoryGrade {
  if(!correct)return 1;
  if(confidence==='guess')return 2;
  if(confidence==='unsure')return 3;
  return 4;
}

function progressCard(previous:StudyProgress|undefined,at:number):Card {
  if(!previous)return createEmptyCard(new Date(at));
  return {
    due:new Date(previous.dueAt),stability:previous.stability||Math.max(.2,previous.intervalDays),difficulty:previous.difficulty||5,
    elapsed_days:Math.max(0,Math.round((at-previous.lastAt)/DAY)),scheduled_days:previous.intervalDays,
    learning_steps:previous.learningSteps||0,reps:previous.fsrsReps||previous.attempts,lapses:previous.lapses||0,
    state:(previous.fsrsState??State.Review) as State,last_review:new Date(previous.lastAt),
  };
}

export function retrievability(progress:StudyProgress,at:number) {
  return scheduler.get_retrievability(progressCard(progress,at),new Date(at),false);
}

export function schedule(previous: StudyProgress | undefined, correct: boolean, confidence: Confidence, at: number, rating:MemoryGrade=memoryGrade(correct,confidence)) {
  const result=scheduler.next(progressCard(previous,at),new Date(at),rating as Grade);
  const delayed = !!previous && at - previous.lastAt >= DAY;
  return {intervalDays:Math.max(1,result.card.scheduled_days),dueAt:result.card.due.getTime(),delayed,
    stability:result.card.stability,difficulty:result.card.difficulty,grade:rating,lapses:result.card.lapses,
    fsrsState:result.card.state,fsrsReps:result.card.reps,learningSteps:result.card.learning_steps};
}

export function recordAttempt(questionId: string, previous: StudyProgress | undefined, correct: boolean, confidence: Confidence, at: number, rating?:MemoryGrade): StudyProgress {
  const timing = schedule(previous, correct, confidence, at,rating);
  return {
    questionId, attempts: (previous?.attempts ?? 0)+1, correct: (previous?.correct ?? 0)+Number(correct),
    lastCorrect: correct, confidence, intervalDays: timing.intervalDays, dueAt: timing.dueAt, lastAt: at,
    firstCorrect: previous?.firstCorrect ?? correct,
    delayedAttempts: (previous?.delayedAttempts ?? 0)+Number(timing.delayed),
    delayedCorrect: (previous?.delayedCorrect ?? 0)+Number(timing.delayed && correct),
    note: previous?.note ?? '', errorKind: previous?.errorKind ?? '', noteRevision: previous?.noteRevision ?? 0,
    stability: timing.stability, difficulty: timing.difficulty,
    lapses: timing.lapses,fsrsState:timing.fsrsState,fsrsReps:timing.fsrsReps,learningSteps:timing.learningSteps,
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
  eligible.sort((a,b) => rank(a)-rank(b)
    || (progress[a.id]&&progress[b.id]?retrievability(progress[a.id],at)-retrievability(progress[b.id],at):0)
    || (progress[a.id]?.dueAt ?? 0)-(progress[b.id]?.dueAt ?? 0));
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
