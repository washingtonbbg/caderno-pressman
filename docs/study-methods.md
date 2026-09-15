# Estudo orientado por evidências

`/estudar` reúne 970 questões de 25 cadernos, incluindo 12 exercícios autorais introdutórios de tecnologia educacional e 570 itens dos cadernos complementares enviados. O catálogo é gerado por `scripts/build-study-catalog.mjs` antes de iniciar ou compilar o site. O gerador lê literais TypeScript sem executar páginas, preserva enunciados, textos de referência, alternativas, gabaritos, código compartilhado e figuras. IDs incorporam o conteúdo avaliável para evitar que uma questão alterada herde automaticamente um histórico incompatível. Os 570 itens IFMT também guardam `explanation` (Entenda a resposta), cinco análises de alternativa, `bankAnalysis`, status de revisão e uma citação com a fonte HTTPS; o enriquecimento reprodutível está em `scripts/enrich-ifmt-supplemental.mjs` (`npm run enrich:ifmt`).

O recorte padrão é IFMT Administrador, com prova em 13/09/2026. `/reta-final` oferece o plano ajustável de 05 a 12/09. A classificação por questão está em `lib/exam-plan.ts`; ela exclui assuntos de programação/engenharia de software, conteúdos docentes sem correspondência e itens históricos de transição selecionados. A biblioteca inteira continua acessível. O ensaio de 50 itens distribui 20/10/10/10 e mostra correção somente após a conclusão. Ele usa itens existentes, não promete ineditismo nem pontuação oficial. No recorte do concurso, o agendamento limita revisões longas a 12/09 às 18h, antes da prova. As lacunas de cobertura estão visíveis no plano.

## Fluxo pedagógico

1. Tentar recuperar a regra antes de ver alternativas; escrita opcional.
2. Registrar resposta e confiança antes do feedback, incluindo a opção “Não sei ainda”.
3. Ler a explicação existente e a referência; a área “Entenda a resposta” separa justificativa conceitual, análise das cinco alternativas, padrão da banca e fonte registrada.
4. Escrever uma autoexplicação e identificar o tipo de dificuldade, se útil.
5. Retomar a questão em outra sessão. Revisões vencidas têm prioridade sobre novas questões.

O agendamento usa FSRS 6 via `ts-fsrs@5.4.2`, com retenção-alvo de 0,9, intervalo máximo de 365 dias e fuzz e short-term desativados. A avaliação pós-correção distingue Esqueci, Difícil, Bom e Fácil; ensaios usam avaliação inferida, identificada como tal. Os parâmetros não foram calibrados individualmente nem validados como intervenção neste projeto. Acerto inicial e acerto após pelo menos 24 horas são indicadores distintos; nenhum significa domínio ou transferência para questões inéditas.

A alternância usa os assuntos já catalogados, com rodízio dentro da mesma prioridade. O controle fica desabilitado quando há apenas um assunto no recorte. A taxonomia existente não distingue todos os subconceitos de todos os cadernos.

## Dados e implantação

O histórico da nova área e as anotações são salvos em D1, separados pelo identificador autenticado fornecido pelo Sites. As páginas antigas continuam disponíveis para consulta; suas interações anteriores não constituem tentativas registradas nesta área. Visitantes sem autenticação podem praticar temporariamente, com aviso explícito de que nada é salvo. Não há fonte de verdade em localStorage.

Aplicar as migrações novas 0002, 0003 e 0004 antes de disponibilizar a versão. A 0004 acrescenta URL, texto de referência, análise da banca, status de revisão e gabarito sugerido ao cadastro persistido. Nenhum histórico anterior é apagado. O cadastro futuro em `/api/bank/questions` exige fonte HTTPS, justificativa conceitual, cinco análises e uma análise do padrão da banca; a tela Biblioteca oferece o mesmo contrato. Tentativas têm chave idempotente e sequência exclusiva por usuário/questão; anotações usam controle de versão para detectar conflitos entre abas. A fila atualiza ao recuperar foco e a cada minuto, sem alterar uma sessão em andamento.

Validação: `npm run test:study` cobre agendamento, seleção, integridade de catálogo, migrações em D1 local, isolamento entre usuários, duplicação e conflitos. `npm run build` valida o pacote completo. A suíte antiga `tests/rendered-html.test.mjs` ainda descreve o skeleton do starter e não representa esta interface.

## Evidências e limites

### Sinalização visual e referências consolidadas (15/09/2026)

`QuestionExplanation` sinaliza somente o feedback, nunca as opções durante a tentativa. Há controle para desligar cores, rótulos redundantes, fonte legível e texto original preservado. Azul organiza explicações; vermelho é usado apenas para comentários com prefixo explícito “Erro:”, “Incorreta:” ou “Incorreto:”, não inferido a partir da letra do gabarito (importante em perguntas negativas). Âmbar indica condição linguística, sem afirmar falsidade. O aluno é convidado a recuperar a distinção sem olhar. Não há teste A/B nem comprovação de ganho individual implementados.

Referências metodológicas foram consolidadas em `lib/method-references.ts` e `/referencias`, com função e limites de cada fonte. A página inventaria citações existentes do catálogo sem alterar sua verificação ou inventar páginas. Novos fundamentos: Schneider et al. (2018), https://doi.org/10.1016/j.edurev.2017.11.001; Dunlosky et al. (2013), https://doi.org/10.1177/1529100612453266; Wetzler et al. (2021), https://doi.org/10.1177/21582440211056624. Não existe paleta comprovadamente ótima; sinalização não equivale a grifar indiscriminadamente nem substitui recuperação e espaçamento.

### Pesquisa de conceitos, vocabulário e banca

`/pesquisa-banca` implementa o protocolo descritivo `corpus-descritivo-v1`: filtros pelos metadados existentes de fonte e assunto; remoção de duplicatas com enunciado e alternativas iguais após normalização lexical; frequências absolutas, presença por item e ocorrências por mil palavras; sinais linguísticos definidos por expressões regulares. Enunciado e alternativas entram nas contagens; explicações não entram, evitando confundir linguagem editorial do apoio com a questão. Não há lematização, teste de keyness contra corpus externo ou detecção de duplicatas semânticas. Uma palavra restritiva não determina a falsidade da alternativa.

As fichas manuais registram conceito-alvo, definição, confusões nos distratores, conhecimento/evidência/tarefa do ECD, referências e hipóteses. São salvas por usuário e questão em D1 por “Salvar ficha”, com revisão otimista para impedir sobrescrita entre abas. Falhas preservam os rascunhos; exportação/importação JSON continua disponível, mas importações precisam ser salvas por ficha. A API exige identidade autenticada e origem válida nas escritas e não aceita IDs de usuário enviados pelo cliente.

A pesquisa consulta o histórico real do SRS ao entrar, recuperar foco e a cada 30 segundos. Cruza sinais linguísticos com número de itens praticados e erro/dúvida na última tentativa, incluindo tentativas, acertos e anotação da questão selecionada. Não é inferência causal nem estimativa de dificuldade populacional. Tentativas são salvas automaticamente pelo fluxo existente de estudo; fichas conceituais continuam manuais. O catálogo de pesquisa e estudo inclui questões cadastradas na API do banco ao entrar/recuperar foco, mantendo a última cópia utilizável em falhas temporárias. Novos itens também podem registrar tentativas no SRS. A migração 0006 acrescenta somente a tabela de fichas e seu índice exclusivo; não altera históricos antigos.

Autoria é desconhecida por padrão. Humana, IA ou híbrida são declarações documentais pendentes de revisão, não resultados de um detector. Autor/instituição, modelo/versão e evidência são campos separados. Prova oficial, ano ou estilo não demonstram autoria humana ou identificam o modelo. Sem documento/log não é possível atribuir origem com segurança.

Protocolo de evolução: delimitar banca/cargo/tempo; criar manual de códigos; revisar amostra independentemente e registrar divergências; reservar provas posteriores antes de ajustar hipóteses, removendo duplicatas entre conjuntos; revisar itens experimentais pelo ECD; medir dificuldade e distratores com respostas reais apropriadas. Repetições do mesmo estudante no SRS não devem ser tratadas como participantes independentes. A versão atual não executa estas etapas de validação, psicometria, geração ou busca bibliográfica automaticamente.

Bases: análise de conteúdo (https://doi.org/10.1111/nhs.12048); ECD (https://www.ets.org/Media/Research/pdf/session1-cameto-cheng-haertel-paper-tea2012.pdf); linguística de corpus (https://www.lancaster.ac.uk/fss/courses/ling/corpus/blue/l03_2.htm); limites de detecção de texto gerado (https://aclanthology.org/2024.acl-long.160/). Estas bases orientam o desenho; não validam diretamente nossa ferramenta.

- Carpenter, Pan & Butler (2022), *The science of effective learning with spacing and retrieval practice*: https://doi.org/10.1038/s44159-022-00089-1
- Firth, Rivers & Boyle (2021), revisão de intercalação: https://doi.org/10.1002/rev3.3266
- Bisra et al. (2018), meta-análise de autoexplicação: https://doi.org/10.1007/s10648-018-9434-x
- Murray, Horner & Göbel (2025), meta-análise de espaçamento e recuperação em matemática: https://doi.org/10.1007/s10648-025-10035-1

As decisões de interface são aplicações dessas evidências, não intervenções diretamente validadas por esses artigos. A revisão de 2025 encontra benefício de espaçamento em matemática e evidência inconclusiva para recuperação versus reestudo naquele domínio. Exemplos resolvidos e consulta ao caderno continuam importantes, especialmente para temas novos.
