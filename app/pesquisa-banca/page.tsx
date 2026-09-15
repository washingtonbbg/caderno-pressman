import catalog from '@/data/study-catalog.json';
import ResearchWorkspace from './workspace';
export const metadata={title:'Pesquisa da banca — Cadernos de Estudo'};
export default function Page(){return <ResearchWorkspace questions={catalog}/>;}
