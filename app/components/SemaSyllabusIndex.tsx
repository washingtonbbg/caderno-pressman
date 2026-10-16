const sections = [
  {
    number: 'I',
    title: 'Conhecimentos básicos',
    subtitle: 'Todos os cargos e perfis',
    chapters: [
      {
        title: 'Língua Portuguesa',
        items: [
          'Compreensão e interpretação de textos', 'Argumentação e persuasão',
          'Comunicação assertiva: linguagem simples, concisa e objetiva', 'Organização textual',
          'Coesão e coerência', 'Tipologia textual', 'Ortografia oficial', 'Acentuação gráfica',
          'Emprego do sinal indicativo de crase', 'Sintaxe da oração e do período', 'Pontuação',
          'Concordância nominal e verbal', 'Regência nominal e verbal', 'Significação das palavras',
          'Colocação do pronome átono',
          'Redação oficial: escrita de textos formais e Manual de Redação da Presidência da República',
          'Novo Acordo Ortográfico',
        ],
      },
    ],
  },
  {
    number: 'II',
    title: 'Conhecimentos gerais',
    subtitle: 'Todos os cargos e perfis',
    chapters: [
      {
        title: 'Geografia de Mato Grosso',
        items: [
          'Produção do espaço regional mato-grossense',
          'Aspectos naturais: clima, solo, relevo, vegetação, hidrografia e relações com o uso da biodiversidade',
          'Políticas de gestão ambiental', 'Características econômicas do espaço industrial',
          'Geografia da população: dinâmica, estrutura, migrações, renda, qualidade de vida e questões sociais',
          'Processo de urbanização', 'Ocupação do espaço agrário e inserção nacional e internacional',
        ],
      },
      {
        title: 'História de Mato Grosso',
        items: [
          'Expansão e conquista dos sertões da América (séculos XVI a XVIII)',
          'Povos indígenas antes da chegada dos colonizadores portugueses',
          'Missões, catequese e uso de mão de obra indígena no século XVII',
          'Bandeiras, expansão territorial, escravização indígena e ouro no século XVIII',
          'Colonização e povoamento nos séculos XVIII e XIX: Cuiabá e Vila Bela da Santíssima Trindade',
          'Mineração do ouro e mão de obra africana e indígena; ascensão da pecuária no século XIX',
          'Mato Grosso entre Império e República: Rusga e Guerra da Tríplice Aliança',
          'Estado Novo e Marcha para o Oeste',
          'Ditadura civil-militar, desmembramento do estado e surgimento de MS em 1977',
          'Política fundiária e tensões sociais no campo',
        ],
      },
      {
        title: 'Ética e Filosofia',
        items: [
          'Filosofia, busca racional pela verdade e reflexão crítica sobre a realidade',
          'Conhecimento empírico, científico e filosófico',
          'Racionalismo, empirismo e criticismo',
          'Pós-verdade e impacto da inteligência artificial',
          'Assédio moral e sexual: conceitos e medidas de enfrentamento',
          'Atitudes éticas, respeito, valores e virtudes',
        ],
      },
      {
        title: 'Atualidades',
        items: ['Contextos político, econômico, artístico-cultural e socioambiental do Brasil e de Mato Grosso'],
      },
      {
        title: 'Legislação específica',
        items: [
          'Lei Complementar Estadual nº 112/2002 — Código de Ética Funcional do Servidor Público Civil de Mato Grosso',
          'Lei Complementar nº 04/1990 — Estatuto dos Servidores Públicos Estaduais de Mato Grosso',
          'Lei Complementar nº 38/1995 — Código Estadual do Meio Ambiente',
        ],
      },
    ],
  },
  {
    number: 'III',
    title: 'Conhecimentos específicos',
    subtitle: 'Perfil 2 — Analista em Tecnologia da Informação',
    chapters: [
      {
        title: '1. Segurança da Informação e Privacidade',
        items: [
          'Segurança cibernética; LGPD e GDPR; Zero Trust Architecture',
          'Firewall, IDS/IPS e WAF; análise de vulnerabilidades e pentesting',
          'Criptografia simétrica e assimétrica; funções hash; certificados digitais e PKI',
          'Gestão de riscos e continuidade de negócios (BCP/DRP)',
        ],
      },
      {
        title: '2. Desenvolvimento de Software e Metodologias',
        items: [
          'DevOps e DevSecOps: cultura, princípios CAMS e CI/CD',
          'Git, Docker e Kubernetes',
          'Microsserviços versus arquitetura monolítica; SOA',
          'APIs REST e SOAP; padrões de projeto de software',
          'Scrum, Kanban e práticas de eXtreme Programming (XP)',
        ],
      },
      {
        title: '3. Inteligência Artificial e Dados',
        items: [
          'Aprendizado supervisionado, não supervisionado e por reforço',
          'Deep Learning e redes neurais; NLP; visão computacional',
          'Big Data e seus Vs; sistemas NoSQL; Hadoop',
          'Business Intelligence e ETL',
          'Modelagem dimensional, estrela e floco de neve',
        ],
      },
      {
        title: '4. Tecnologias Emergentes e Gestão',
        items: [
          'IoT: sensores, gateway e nuvem; Edge Computing',
          'Blockchain e criptoativos: ledger distribuído e mecanismos de consenso',
          'ITSM e ITIL: incidentes, problemas, mudanças e configurações',
          'Governança de TI e COBIT; alinhamento estratégico de TI com o negócio',
        ],
      },
      {
        title: '5. Fundamentos Essenciais e Lógica',
        items: [
          'Busca e ordenação: Bubble Sort, Quick Sort e análise de complexidade O(n)',
          'Listas, pilhas, filas, árvores AVL e B+, tabelas hash',
          'Sistemas operacionais: processos, memória, escalonamento e sistemas de arquivos',
          'Linux: comandos básicos; Windows Server: Active Directory, DNS e DHCP',
          'POO: encapsulamento, herança e polimorfismo; Python e Java',
          'Sintaxe e estruturas de controle',
          'Banco de dados: MER, normalização, SQL (DDL, DML e DCL), transações e ACID',
          'UX/UI: Design Centrado no Usuário, usabilidade, acessibilidade, prototipação e testes',
        ],
      },
    ],
  },
] as const;

export default function SemaSyllabusIndex() {
  return <section className="semaIndex" id="conteudo-programatico" aria-labelledby="sema-index-title">
    <header className="semaIndexHeader">
      <div><p className="learnEyebrow">ÍNDICE DO EDITAL · PERFIL 2</p><h2 id="sema-index-title">Conteúdo programático</h2><p>Use este índice como mapa de leitura. Os tópicos seguem o edital e não representam peso, prioridade ou previsão de cobrança.</p></div>
      <div className="semaIndexActions"><a className="semaIndexPrimary" href="/edital-sema-mt-2026.pdf" target="_blank" rel="noreferrer">Abrir edital em PDF ↗</a><a href="https://concursos.cesgranrio.org.br/portal/avaliacoes/21" target="_blank" rel="noreferrer">Site oficial do concurso ↗</a></div>
    </header>
    <nav className="semaIndexNav" aria-label="Partes do conteúdo programático">{sections.map(section=><a key={section.number} href={`#programa-${section.number.toLowerCase()}`}><span>{section.number}</span>{section.title}</a>)}</nav>
    <div className="semaIndexBook">{sections.map(section=><section className="semaIndexPart" id={`programa-${section.number.toLowerCase()}`} key={section.number}>
      <div className="semaIndexPartHeading"><span>PARTE {section.number}</span><h3>{section.title}</h3><p>{section.subtitle}</p></div>
      <div className="semaIndexChapters">{section.chapters.map((chapter,index)=><details key={chapter.title} open={section.number==='III'}><summary><span>{String(index+1).padStart(2,'0')}</span><strong>{chapter.title}</strong><small>{chapter.items.length} tópicos</small></summary><ol>{chapter.items.map(item=><li key={item}>{item}</li>)}</ol></details>)}</div>
    </section>)}</div>
    <footer className="semaIndexFooter"><p><strong>Documento de referência:</strong> Edital nº 1 — SEMA/MT, de 1º de setembro de 2026, com alterações incorporadas.</p><a href="#cronograma">Ir para o cronograma de estudo ↓</a></footer>
  </section>;
}
