import Link from "next/link";

const books = [
  {href:"/pressman",code:"01",edition:"8ª edição · capítulos 2 e 4",title:"Engenharia de Software",author:"Pressman & Maxim",description:"Processo, métodos, modelos prescritivos e evolucionários em questões comentadas.",stats:["18 questões","32 cards","3 níveis"],tone:"pressman"},
  {href:"/uml",code:"02",edition:"3ª edição · diagramas UML 2",title:"UML 2: Uma abordagem prática",author:"Gilleanes T. A. Guedes",description:"Classificação de diagramas e leitura de interações, com foco em sequência, comunicação e temporização.",stats:["12 questões","16 cards","3 exemplos oficiais"],tone:"uml"},
  {href:"/padroes",code:"03",edition:"GoF · padrões selecionados",title:"Padrões de Projeto",author:"Gamma, Helm, Johnson & Vlissides",description:"Intenção, aplicabilidade e diferenças entre padrões de criação e comportamentais.",stats:["12 questões","18 cards","2 exemplos oficiais"],tone:"patterns"},
  {href:"/recursividade",code:"04",edition:"Java · Fibonacci recursivo",title:"Recursividade em Java",author:"Algoritmos e rastreamento de execução",description:"Casos-base, pilha de chamadas, BigInteger e memorização da sequência de Fibonacci.",stats:["12 questões","18 cards","F(0) a F(12)"],tone:"recursion"},
  {href:"/ordenacao",code:"05",edition:"PHP 8 · sort e flags",title:"Ordenação e Funções Nativas",author:"Arrays, comparação natural e estabilidade",description:"SORT_NATURAL, SORT_FLAG_CASE, desempate alfanumérico e ordenação estável no PHP 8.",stats:["12 questões","18 cards","PHP 8"],tone:"sorting"},
  {href:"/fatorial",code:"06",edition:"Python 3.11 · recursão",title:"Fatorial em Python",author:"Rastreamento, pilha e casos-base",description:"Expansão e retorno de chamadas recursivas, complexidade e tratamento de entradas.",stats:["12 questões","18 cards","0! a 10!"],tone:"factorial"},
  {href:"/migracao-bd",code:"07",edition:"MySQL ↔ MariaDB",title:"Compatibilidade e Migração",author:"Gerenciamento de Banco de Dados",description:"Drop-in replacement, conectores, InnoDB, interoperabilidade e validação segura de migrações.",stats:["12 questões","18 cards","MariaDB Docs"],tone:"database"},
  {href:"/poo-java",code:"08",edition:"Java · POO",title:"Encapsulamento e Herança",author:"Modificadores de acesso",description:"private, protected, getters, setters, construtores e especialização de classes.",stats:["13 questões","18 cards","Java"],tone:"oop"},
  {href:"/arvore-busca-c",code:"09",edition:"Linguagem C · ABB",title:"Árvore Binária de Busca",author:"Estruturas de Dados e Recursão",description:"Inserção, busca, percurso em ordem, ponteiros e comportamento diante de valores duplicados.",stats:["12 questões","18 cards","C"],tone:"tree"},
  {href:"/polimorfismo-java",code:"10",edition:"Deitel · Java 8ª edição",title:"Polimorfismo em Java",author:"Classes abstratas, final e ligação dinâmica",description:"Referências de superclasse, sobrescrita, despacho em tempo de execução e hierarquias abstratas.",stats:["12 questões","18 cards","Capítulo 10"],tone:"polymorphism"},
  {href:"/grafos-cormen",code:"11",edition:"Cormen · 3ª edição",title:"Algoritmos de Grafos",author:"Ordenação, AGM e caminhos mínimos",description:"Ordenação topológica, Kruskal, conjuntos disjuntos e Dijkstra em questões comentadas.",stats:["12 questões","18 cards","Capítulos 22–24"],tone:"graph"},
  {href:"/condicionais-c",code:"12",edition:"Linguagem C · decisões",title:"Condicionais e Refatoração",author:"Equivalência lógica e fluxo de controle",description:"if/else, tabela de decisão, retornos antecipados e otimizações que preservam comportamento.",stats:["12 questões","18 cards","C"],tone:"conditionals"},
  {href:"/operadores-logicos",code:"13",edition:"Puga · capítulo 3",title:"Operadores e Expressões",author:"Lógica de Programação",description:"Atribuição, comparação, operadores lógicos, tabelas-verdade e precedência em Java e pseudocódigo.",stats:["12 questões","18 cards","Java"],tone:"operators"},
];

export default function LibraryHome(){return <main className="libraryPage">
  <header className="libraryHeader"><Link className="brand" href="/"><span>ES</span>Cadernos de Estudo</Link><div>Engenharia de Software · biblioteca de questões</div></header>
  <section className="libraryHero"><div className="eyebrow">Escolha um caderno</div><h1>Do livro à questão.<br/><em>Do erro ao conceito.</em></h1><p>Cada caderno usa um banco próprio, limitado à obra de referência e aos assuntos cobrados nas questões-modelo.</p></section>
  <section className="bookShelf" aria-label="Livros disponíveis">{books.map(book=><Link href={book.href} className={`bookTile ${book.tone}`} key={book.href}>
    <div className="bookTop"><span>{book.code}</span><small>{book.edition}</small></div><div className="bookBody"><p>{book.author}</p><h2>{book.title}</h2><div>{book.description}</div></div><div className="bookFoot"><ul>{book.stats.map(item=><li key={item}>{item}</li>)}</ul><strong>Abrir caderno →</strong></div>
  </Link>)}</section>
  <footer className="libraryFooter"><span>Conteúdo educacional baseado nas referências indicadas.</span><span>Novos livros podem ser adicionados à estante.</span></footer>
</main>}
