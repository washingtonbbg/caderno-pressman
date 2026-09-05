import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import StudyWorkspace from '../components/StudyWorkspace';
export const metadata:Metadata={title:'Tecnologia aplicada à educação — Treino autoral IFMT'};
export default function TechnologyPage(){return <StudyWorkspace questions={catalog.filter(q=>q.notebook==='/tecnologia-educacional')}/>;}
