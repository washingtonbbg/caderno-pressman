"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Source = { id: string; kind: string; title: string; authors: string; official_url: string; version_count: number };
type Result = { id: string; content: string; page: number; locator: string; source_title: string; label: string; version_id: string };

export default function LibraryClient() {
  const [sources, setSources] = useState<Source[]>([]);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [term, setTerm] = useState("");
  const [draft, setDraft] = useState<{ prompt: string; correct: string; explanation: string; source: string; page: string } | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceId, setSourceId] = useState("");

  useEffect(() => { fetch("/api/library/sources").then((r) => r.json()).then((data) => setSources(data.sources ?? [])).catch(() => setMessage("Não foi possível carregar a biblioteca.")); }, []);

  async function search() {
    setBusy(true); setMessage("");
    const response = await fetch(`/api/library/search?q=${encodeURIComponent(query)}`);
    const data = await response.json();
    setResults(data.results ?? []); setMessage(data.error ?? ""); setBusy(false);
  }

  async function bootstrap() {
    setBusy(true); setMessage("");
    const response = await fetch("/api/library/bootstrap", { method: "POST" });
    const data = await response.json();
    setMessage(data.error ?? `Banco conferido: ${data.importedQuestions ?? 0} questões e ${data.declaredSources ?? 0} fontes.`);
    if (!data.error) { const refreshed = await fetch("/api/library/sources").then((r) => r.json()); setSources(refreshed.sources ?? []); }
    setBusy(false);
  }

  async function upload() {
    if (!file || !sourceId) { setMessage("Escolha uma fonte e um arquivo."); return; }
    setBusy(true); setMessage("");
    try {
      const form = new FormData(); form.set("file", file); form.set("sourceId", sourceId); form.set("label", file.name);
      const response = await fetch("/api/library/upload", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok || data.error) throw new Error(data.error ?? "Não foi possível enviar o arquivo.");
      setMessage(`Arquivo privado armazenado: ${data.filename}. Extraindo páginas…`);
      if (file.type === "application/pdf") await extractPdf(file, data.versionId);
      else setMessage(`Arquivo privado armazenado: ${data.filename}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível processar o arquivo.");
    } finally {
      setBusy(false);
    }
  }

  async function extractPdf(pdfFile: File, versionId: string) {
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/legacy/build/pdf.worker.min.mjs", import.meta.url).toString();
    const pdf = await pdfjs.getDocument({ data: await pdfFile.arrayBuffer() }).promise;
    let indexed = 0;
    let ocrWorker: Awaited<ReturnType<(typeof import("tesseract.js"))["createWorker"]>> | null = null;
    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
        const page = await pdf.getPage(pageNumber);
        const textContent = await page.getTextContent();
        let text = textContent.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
        let method = "pdf-text";
        if (!text) {
          const viewport = page.getViewport({ scale: 1.5 });
          const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
          await page.render({ canvasContext: canvas.getContext("2d")!, viewport }).promise;
          if (!ocrWorker) {
            const tesseract = await import("tesseract.js");
            ocrWorker = await tesseract.createWorker("por");
          }
          const ocr = await ocrWorker.recognize(canvas);
          text = ocr.data.text.replace(/\s+/g, " ").trim(); method = "ocr-tesseract";
        }
        if (!text) continue;
        const response = await fetch("/api/library/passages", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ versionId, page: pageNumber, content: text, method, locator: `p. ${pageNumber}` }) });
        if (!response.ok) {
          const data = await response.json().catch(() => ({})) as { error?: string };
          throw new Error(data.error ?? `Falha ao indexar a página ${pageNumber}.`);
        }
        indexed++;
      }
    } finally {
      await ocrWorker?.terminate();
    }
    setMessage(`Arquivo armazenado e ${indexed} página(s) indexada(s) para busca.`);
  }

  async function makeDraft(result: Result) {
    setBusy(true); setMessage("");
    const response = await fetch("/api/bank/draft", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text: result.content, term, source: result.source_title, page: result.locator || `p. ${result.page}` }) });
    const data = await response.json();
    setDraft(data.draft ?? null); setMessage(data.error ?? (data.reviewRequired ? "Rascunho gerado. Revise antes de publicar." : "")); setBusy(false);
  }

  return <main className="libraryWorkspace">
    <header className="libraryWorkspaceHeader"><Link href="/">Cadernos de Estudo</Link><span>Biblioteca de fontes</span><Link href="/administracao-banco-completo">Banco de Administração →</Link></header>
    <section className="libraryWorkspaceIntro"><p className="eyebrow">FONTES · VERSÕES · TRECHOS</p><h1>Da fonte <em>à questão.</em></h1><p>Arquive obras e documentos, encontre trechos por palavra ou artigo e transforme um excerto em rascunho revisável.</p></section>
    <section className="libraryWorkspaceGrid">
      <div className="libraryPanel"><div className="panelTitle"><span>Catálogo e arquivos privados</span><button onClick={bootstrap} disabled={busy}>Conferir 107 questões</button></div>{message && <p className="libraryMessage">{message}</p>}<div className="uploadBox"><select value={sourceId} onChange={(e) => setSourceId(e.target.value)}><option value="">Fonte do arquivo…</option>{sources.map((source) => <option key={source.id} value={source.id}>{source.title}</option>)}</select><input type="file" accept="application/pdf,.doc,.docx,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)}/><button onClick={upload} disabled={busy}>Enviar arquivo privado</button></div><div className="sourceList">{sources.map((source) => <article key={source.id}><small>{source.kind}</small><h2>{source.title}</h2><p>{source.authors}</p><span>{source.version_count ?? 0} versão(ões) · {source.official_url ? <a href={source.official_url} target="_blank" rel="noreferrer">fonte oficial</a> : "referência declarada"}</span></article>)}{!sources.length && <p>Use “Conferir 107 questões” para criar o catálogo inicial.</p>}</div></div>
      <div className="libraryPanel"><div className="panelTitle"><span>Busca por trecho, página ou artigo</span></div><div className="librarySearch"><input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && search()} placeholder="Ex.: cadeia de suprimentos, art. 37"/><button onClick={search} disabled={busy}>Buscar</button></div><div className="resultList">{results.map((result) => <article key={result.id}><small>{result.source_title} · {result.locator || `p. ${result.page}`}</small><p>{result.content}</p><button onClick={() => makeDraft(result)}>Gerar rascunho deste trecho</button></article>)}</div><label className="termField">Termo-chave para a lacuna<input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="palavra que deve ser destacada"/></label>{draft && <aside className="draftCard"><small>RASCUNHO · REVISÃO OBRIGATÓRIA</small><h2>{draft.prompt}</h2><p><strong>Resposta:</strong> {draft.correct}</p><p>{draft.explanation}</p><span>{draft.source} · {draft.page}</span></aside>}</div>
    </section>
  </main>;
}
