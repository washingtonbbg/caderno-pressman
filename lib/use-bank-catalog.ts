'use client';
import {useEffect,useState} from 'react';
import type {StudyQuestion} from './study-model';
export function useBankCatalog(initial:StudyQuestion[]){
 const [questions,setQuestions]=useState(initial);
 useEffect(()=>{let live=true;async function refresh(){try{const r=await fetch('/api/bank/questions');if(!r.ok)return;const data=await r.json();const added:StudyQuestion[]=data.questions.filter((q:StudyQuestion)=>q.options?.length&&q.answer>=0).map((q:StudyQuestion)=>({...q,notebook:'/biblioteca',notebookTitle:'Questões cadastradas',number:q.number??0,label:`Questão cadastrada · ${q.subject}`,languageNote:'',code:'',image:'',imageAlt:''}));if(live)setQuestions([...initial,...added.filter(q=>!initial.some(item=>item.id===q.id))]);}catch{/* Keep the last usable catalog on temporary failure. */}}void refresh();window.addEventListener('focus',refresh);return()=>{live=false;window.removeEventListener('focus',refresh);};},[initial]);return questions;
}
