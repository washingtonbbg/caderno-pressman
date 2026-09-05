import type { Metadata } from 'next';
import catalog from '@/data/study-catalog.json';
import FinalWeekPlan from '../components/FinalWeekPlan';
export const metadata:Metadata={title:'Reta final IFMT — Administrador · 13/09',description:'Plano de estudo de 05 a 12 de setembro para os quatro blocos do edital de Administrador IFMT.'};
export default function FinalWeekPage(){return <FinalWeekPlan questions={catalog}/>;}
