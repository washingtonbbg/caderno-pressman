"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
export default function StudyShortcut() {
  const path=usePathname();
  if (!path || path==='/' || path==='/aluno' || path==='/acervo' || path==='/sema-mt-ti' || path==='/sema-mt-ti/estudar' || path==='/estudar' || path==='/biblioteca' || path==='/reta-final') return null;
  return <Link className="studyShortcut" href={`/estudar?caderno=${encodeURIComponent(path)}`}>Estudar com revisão →</Link>;
}
