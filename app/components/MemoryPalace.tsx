import type { MemoryLocus } from '@/lib/memory-palace';

export default function MemoryPalace({memory,loading,error,onRetry,onGenerateImage,imageBusy,imageError}:{memory?:MemoryLocus;loading:boolean;error:string;onRetry:()=>void;onGenerateImage:()=>void;imageBusy:boolean;imageError:string}) {
  return <aside className="memoryPalace" aria-live="polite">
    <div className="memoryPalaceHeading"><div><span aria-hidden="true">⌂</span><div><small>PALÁCIO DA MEMÓRIA</small><h3>{memory?.locus || 'Preparando o próximo local…'}</h3></div></div>{memory&&<b>Local {memory.position+1}</b>}</div>
    <figure className="memoryPalaceIllustration">
      <img src={memory?.imageUrl || "/memory-palace-study-room.png"} alt={memory?.imageUrl ? `Imagem da pista no local ${memory.locus}` : "Portão do Palácio da Memória formado pelas camadas Processo, Métodos e Ferramentas sobre a base Qualidade"} />
      <figcaption>{memory?.imageUrl ? 'Imagem gerada para esta pista.' : 'Imagem de referência do método; gere uma cena específica quando desejar.'}</figcaption>
    </figure>
    {loading&&<p>Transformando o conceito em uma imagem mental vívida…</p>}
    {!loading&&error&&<div><p>{error}</p><button type="button" onClick={onRetry}>Tentar gerar novamente</button></div>}
    {memory&&!loading&&<>
      <p className="memoryScene">{memory.scene}</p>
      {!memory.imageUrl&&<div className="memoryImageAction"><button type="button" onClick={onGenerateImage} disabled={imageBusy}>{imageBusy?'Gerando imagem…':'Gerar imagem desta pista'}</button>{imageError&&<p role="alert">{imageError}</p>}</div>}
      <div className="memoryRecall"><strong>Pare na porta e tente lembrar</strong><p>{memory.recallCue}</p></div>
      <details><summary>Ver o caminho de recuperação</summary><p>{memory.retrieval}</p></details>
    </>}
  </aside>;
}
