import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import StudyWorkspace from '../components/StudyWorkspace';

export const metadata: Metadata = {
  title: 'SEMA-MT — Analista em Tecnologia da Informação',
  description: 'Guia de estudos para o perfil 2 do concurso SEMA-MT 2026, com 800 questões organizadas por eixo.',
};

export default function SemaMtTiPage() {
  return <StudyWorkspace
    questions={catalog.filter(q => q.notebook === '/sema-mt-ti')}
    config={{
      defaultExamFocus: false,
      introTitle: 'SEMA-MT · Analista em TI',
      introDescription: <>Segurança, desenvolvimento, dados, governança e fundamentos essenciais.<br/>Pratique por eixo e retome seus pontos frágeis.</>,
    }}
  />;
}
