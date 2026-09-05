import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import StudyWorkspace from '../components/StudyWorkspace';
export const metadata: Metadata = {title:'Estudar hoje — Cadernos de Estudo', description:'Pratique recuperação ativa, revise seus erros e distribua suas revisões ao longo do tempo.'};
export default function StudyPage() { return <StudyWorkspace questions={catalog}/>; }
