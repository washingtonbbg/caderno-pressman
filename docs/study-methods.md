# Estudo orientado por evidências

`/estudar` reúne 970 questões de 25 cadernos, incluindo 12 exercícios autorais introdutórios de tecnologia educacional e 570 itens dos cadernos complementares enviados. O catálogo é gerado por `scripts/build-study-catalog.mjs` antes de iniciar ou compilar o site. O gerador lê literais TypeScript sem executar páginas, preserva enunciados, textos de referência, alternativas, gabaritos, código compartilhado e figuras. IDs incorporam o conteúdo avaliável para evitar que uma questão alterada herde automaticamente um histórico incompatível.

O recorte padrão é IFMT Administrador, com prova em 13/09/2026. `/reta-final` oferece o plano ajustável de 05 a 12/09. A classificação por questão está em `lib/exam-plan.ts`; ela exclui assuntos de programação/engenharia de software, conteúdos docentes sem correspondência e itens históricos de transição selecionados. A biblioteca inteira continua acessível. O ensaio de 50 itens distribui 20/10/10/10 e mostra correção somente após a conclusão. Ele usa itens existentes, não promete ineditismo nem pontuação oficial. No recorte do concurso, o agendamento limita revisões longas a 12/09 às 18h, antes da prova. As lacunas de cobertura estão visíveis no plano.

## Fluxo pedagógico

1. Tentar recuperar a regra antes de ver alternativas; escrita opcional.
2. Registrar resposta e confiança antes do feedback, incluindo a opção “Não sei ainda”.
3. Ler a explicação existente e a referência; ausência de explicação é declarada.
4. Escrever uma autoexplicação e identificar o tipo de dificuldade, se útil.
5. Retomar a questão em outra sessão. Revisões vencidas têm prioridade sobre novas questões.

O agendamento é uma heurística transparente: erro/chute voltam em um dia; primeiro acerto seguro, em três; acertos seguros após 24 horas ampliam o intervalo até 60 dias. Repetições imediatas não ampliam nem adiam a revisão existente. Não é FSRS nem uma estimativa probabilística de memória individual. Acerto inicial e acerto após pelo menos 24 horas são indicadores distintos; nenhum significa domínio ou transferência para questões inéditas.

A alternância usa os assuntos já catalogados, com rodízio dentro da mesma prioridade. O controle fica desabilitado quando há apenas um assunto no recorte. A taxonomia existente não distingue todos os subconceitos de todos os cadernos.

## Dados e implantação

O histórico da nova área e as anotações são salvos em D1, separados pelo identificador autenticado fornecido pelo Sites. As páginas antigas continuam disponíveis para consulta; suas interações anteriores não constituem tentativas registradas nesta área. Visitantes sem autenticação podem praticar temporariamente, com aviso explícito de que nada é salvo. Não há fonte de verdade em localStorage.

Aplicar as migrações novas 0002 e 0003 antes de disponibilizar a versão. Nenhum histórico anterior é apagado. Tentativas têm chave idempotente e sequência exclusiva por usuário/questão; anotações usam controle de versão para detectar conflitos entre abas. A fila atualiza ao recuperar foco e a cada minuto, sem alterar uma sessão em andamento.

Validação: `npm run test:study` cobre agendamento, seleção, integridade de catálogo, migrações em D1 local, isolamento entre usuários, duplicação e conflitos. `npm run build` valida o pacote completo. A suíte antiga `tests/rendered-html.test.mjs` ainda descreve o skeleton do starter e não representa esta interface.

## Evidências e limites

- Carpenter, Pan & Butler (2022), *The science of effective learning with spacing and retrieval practice*: https://doi.org/10.1038/s44159-022-00089-1
- Firth, Rivers & Boyle (2021), revisão de intercalação: https://doi.org/10.1002/rev3.3266
- Bisra et al. (2018), meta-análise de autoexplicação: https://doi.org/10.1007/s10648-018-9434-x
- Murray, Horner & Göbel (2025), meta-análise de espaçamento e recuperação em matemática: https://doi.org/10.1007/s10648-025-10035-1

As decisões de interface são aplicações dessas evidências, não intervenções diretamente validadas por esses artigos. A revisão de 2025 encontra benefício de espaçamento em matemática e evidência inconclusiva para recuperação versus reestudo naquele domínio. Exemplos resolvidos e consulta ao caderno continuam importantes, especialmente para temas novos.
