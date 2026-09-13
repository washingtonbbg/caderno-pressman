import type { MemoryLocus } from '@/lib/memory-palace';

export default function MemoryPalace({memory,loading,error,onRetry}:{memory?:MemoryLocus;loading:boolean;error:string;onRetry:()=>void}) {
  return <aside className="memoryPalace" aria-live="polite">
    <div className="memoryPalaceHeading"><div><span aria-hidden="true">⌂</span><div><small>PALÁCIO DA MEMÓRIA</small><h3>{memory?.locus || 'Preparando o próximo local…'}</h3></div></div>{memory&&<b>Local {memory.position+1}</b>}</div>
    {loading&&<p>Transformando o conceito em uma imagem mental vívida…</p>}
    {!loading&&error&&<div><p>{error}</p><button type="button" onClick={onRetry}>Tentar gerar novamente</button></div>}
    {memory&&!loading&&<>
      <p className="memoryScene">{memory.scene}</p>
      <div className="memoryRecall"><strong>Pare na porta e tente lembrar</strong><p>{memory.recallCue}</p></div>
      <details><summary>Ver o caminho de recuperação</summary><p>{memory.retrieval}</p></details>
    </>}
  </aside>;
}
