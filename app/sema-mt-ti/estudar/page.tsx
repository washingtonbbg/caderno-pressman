import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import StudyWorkspace from '../../components/StudyWorkspace';

export const metadata: Metadata = {
  title: 'Área de estudo SEMA-MT — Analista em TI',
  description: 'Guia de estudos para o perfil 2 do concurso SEMA-MT 2026, com 842 questões organizadas por eixo.',
};

export default function SemaMtTiPage() {
  return <StudyWorkspace
    questions={catalog.filter(q => q.notebook === '/sema-mt-ti')}
    config={{
      defaultExamFocus: false,
      sema: true,
      introTitle: 'SEMA-MT · Analista em TI',
      introDescription: 'Cronograma para iniciantes, prática orientada e acompanhamento do tempo por questão.',
    }}
  />;
}
