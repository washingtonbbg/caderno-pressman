import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import StudyWorkspace from '../components/StudyWorkspace';

export const metadata:Metadata={title:'Banco complementar IFMT — 570 questões'};

export default function IfmtSupplementalBankPage(){
  return <StudyWorkspace questions={catalog.filter(q=>q.notebook==='/ifmt-banco-complementar')}/>;
}
