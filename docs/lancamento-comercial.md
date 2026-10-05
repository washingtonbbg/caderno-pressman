# Lançamento comercial — 5 de outubro de 2026

## Estrutura preparada

- `/`: apresentação do produto, demonstração, cobertura, método e perguntas frequentes.
- `/aluno`: entrada para treino, histórico e acervo; usa a autenticação existente com ChatGPT.
- `/acervo`: biblioteca anterior preservada, sem chamada para prova encerrada ou revisão de código.
- `lib/commercial-offer.ts`: centraliza nome, resumo, checkout HTTPS próprio, preço, suporte e descrição de entrega. O botão de compra só aparece com URL válida e descrição de entrega preenchida.

## Decisões necessárias antes de cobrar

1. Definir plataforma de pagamento, produto vendido, preço e duração de acesso. O endereço enviado como referência é de outro vendedor e não deve receber compras deste produto.
2. Configurar o produto na plataforma e fornecer seu checkout próprio e contato de suporte.
3. Definir a entrega: acesso por lista de compradores, integração automática ou material entregue na área de membros da plataforma.
4. Implementar e testar autorização de compradores no servidor antes de vender acesso exclusivo. O site atual é público. Login com ChatGPT identifica uma pessoa, mas não comprova compra. Acrescentar um botão de pagamento não protege as páginas, APIs ou arquivos existentes.
5. Na integração automática, validar assinatura do evento, registrar identificador único para evitar duplicação e aplicar concessão/revogação em pagamentos, reembolsos e cancelamentos. Nunca aceitar parâmetro de URL, retorno de checkout ou armazenamento do navegador como prova de pagamento.
6. Revisar o acervo incluído na oferta. Questões importadas, figuras e trechos de obras precisam de autorização adequada para redistribuição comercial; atribuição de referência por si só não comprova licença. Separar itens liberados dos pendentes, inclusive nas APIs de catálogo.
7. Informar identidade do vendedor, suporte, condições de acesso, privacidade e cancelamento de acordo com a oferta e a plataforma escolhidas. Não publicar textos com dados fictícios.

## Descrição-base para cadastrar o produto

**Cadernos de Estudo** é uma biblioteca digital de cadernos interativos para prática de questões e revisão. Reúne conteúdos de computação, IFMT, Administração e uma trilha de Tecnologia da Informação para SEMA-MT. Inclui explicações e cards em parte do acervo. A cobertura varia por caderno e algumas questões exigem consulta à fonte original. O formato atual não inclui aulas em vídeo. O uso ocorre pelo navegador com conexão à internet; o histórico persistente usa conta ChatGPT. Não há promessa de aprovação ou cobertura integral de editais.

Não anunciar todas as questões como comentadas. Os números da página comercial são calculados a partir do catálogo, não de valores publicitários fixos.

## Validação da venda

Antes de divulgar: efetuar uma compra de teste na plataforma escolhida, confirmar acesso somente ao conteúdo comprado, testar usuário sem compra, expiração, reembolso e suporte. Conferir celular e computador. Somente depois ativar a oferta e divulgar o checkout.
