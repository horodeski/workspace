# Requirements Document

## Introduction

O Work Journal é uma ferramenta pessoal para desenvolvedores registrarem tudo o que fizeram durante o dia e gerarem relatórios profissionais automaticamente. Diferente de ferramentas de gestão de equipe (como Jira), o Work Journal foca exclusivamente no trabalho individual. O MVP é uma aplicação frontend moderna, minimalista, rápida e agradável, construída com React + TypeScript + Vite, sem backend, utilizando dados mockados localmente e preparada para integrações futuras com APIs de IA, Jira, GitHub, GitLab e Microsoft Teams.

## Glossary

- **App**: A aplicação Work Journal como um todo
- **Sidebar**: Barra lateral fixa à esquerda contendo a navegação principal
- **Rotina**: Atividade recorrente registrada pelo usuário com título e frequência
- **Inbox**: Tela de captura rápida de tarefas avulsas
- **Tarefa_Inbox**: Item individual criado na tela Inbox
- **Journal**: Tela principal onde o usuário registra em texto livre o que fez no dia
- **Entrada_Journal**: Registro individual salvo no Journal contendo texto original e texto formatado
- **Formatador_Journal**: Função responsável por transformar texto livre em texto profissional formatado
- **Relatório**: Documento gerado a partir das entradas registradas, agrupado por período
- **Visualizador_Relatório**: Componente que exibe relatórios formatados
- **Store**: Camada de gerenciamento de estado da aplicação (Zustand)
- **Frequência**: Periodicidade de uma rotina (diária, semanal ou sprint)
- **Tema_Escuro**: Tema visual padrão da aplicação com fundo escuro
- **Layout_Principal**: Estrutura visual com sidebar fixa à esquerda, conteúdo à direita e header no topo

## Requirements

### Requisito 1: Navegação e Layout Principal

**User Story:** Como desenvolvedor, quero uma interface com navegação clara e layout consistente, para que eu possa acessar rapidamente todas as funcionalidades do Work Journal.

#### Critérios de Aceitação

1. THE App SHALL exibir o Layout_Principal com Sidebar fixa à esquerda, área de conteúdo à direita e header no topo
2. THE Sidebar SHALL exibir os itens na seguinte ordem de cima para baixo: Dashboard, Minha Rotina, Inbox, Journal, Relatórios e Configurações, cada um com um ícone correspondente
3. WHEN o usuário clicar em um item da Sidebar, THE App SHALL navegar para a rota correspondente sem recarregar a página e destacar visualmente o item ativo com estilo diferenciado dos demais itens
4. THE App SHALL aplicar o Tema_Escuro como padrão visual
5. THE App SHALL renderizar sem overflow horizontal e com todos os elementos visíveis e interativos em telas de desktop e notebooks com largura mínima de 1024px
6. THE Layout_Principal SHALL utilizar estilo minimalista com espaçamento mínimo de 16px entre seções, border-radius mínimo de 4px nos containers e tipografia sem serifa

### Requisito 2: Minha Rotina

**User Story:** Como desenvolvedor, quero registrar atividades recorrentes e marcá-las como concluídas, para que eu acompanhe minha rotina de trabalho diária.

#### Critérios de Aceitação

1. THE App SHALL permitir o cadastro de uma Rotina com título (texto obrigatório, máximo de 100 caracteres) e Frequência (diária, semanal ou sprint)
2. IF o usuário tentar criar uma Rotina com título vazio ou composto apenas por espaços em branco, THEN THE App SHALL exibir mensagem de validação indicando que o título é obrigatório, sem salvar o registro
3. THE App SHALL exibir a lista de Rotinas cadastradas utilizando o componente RoutineCard, apresentando o título e a Frequência de cada Rotina
4. WHEN o usuário marcar uma Rotina como concluída, THE App SHALL atualizar o estado da Rotina para concluída e aplicar indicação visual de conclusão (checkbox marcado, estilo riscado ou opacidade reduzida) em até 200ms
5. WHEN o usuário desmarcar uma Rotina concluída, THE App SHALL reverter o estado da Rotina para pendente e remover a indicação visual de conclusão
6. THE Store SHALL persistir o estado das Rotinas localmente durante a sessão da aplicação
7. WHEN não houver Rotinas cadastradas, THE App SHALL exibir o componente EmptyState com mensagem orientando o usuário a criar sua primeira Rotina

### Requisito 3: Inbox

**User Story:** Como desenvolvedor, quero capturar rapidamente tarefas avulsas que surgem durante o dia, para que eu não perca informações importantes.

#### Critérios de Aceitação

1. THE App SHALL exibir um campo de texto com placeholder "O que surgiu?" na tela Inbox, com limite máximo de 200 caracteres
2. WHEN o usuário digitar texto no campo e pressionar Enter, THE App SHALL criar uma nova Tarefa_Inbox com o texto informado, limpar o campo e inserir a nova tarefa no topo da lista
3. IF o texto do campo estiver vazio ou contiver apenas espaços em branco, THEN THE App SHALL ignorar a ação sem criar registro
4. THE App SHALL exibir a lista de Tarefas_Inbox utilizando o componente InboxItem, ordenada da mais recente para a mais antiga
5. WHEN o usuário marcar uma Tarefa_Inbox como concluída, THE App SHALL aplicar estilo de texto riscado (line-through) e opacidade reduzida na Tarefa_Inbox correspondente
6. WHEN o usuário editar uma Tarefa_Inbox, THE App SHALL salvar o texto atualizado no Store, respeitando o mesmo limite de 200 caracteres e a validação de texto não vazio
7. WHEN o usuário excluir uma Tarefa_Inbox, THE App SHALL remover a Tarefa_Inbox da lista e do Store imediatamente sem solicitar confirmação
8. THE Store SHALL persistir o estado das Tarefas_Inbox localmente durante a sessão da aplicação

### Requisito 4: Journal

**User Story:** Como desenvolvedor, quero registrar em texto livre o que fiz durante o dia e obter uma versão formatada profissionalmente, para que eu possa gerar relatórios sem esforço adicional.

#### Critérios de Aceitação

1. THE App SHALL exibir um campo de texto grande (mínimo de 200px de altura) com placeholder "O que você fez hoje?" na tela Journal
2. THE App SHALL exibir um botão "Salvar" abaixo do campo de texto que aciona o salvamento da Entrada_Journal
3. IF o texto do campo estiver vazio ou contiver apenas espaços em branco, THEN THE App SHALL desabilitar o botão "Salvar" e não permitir a criação de Entrada_Journal
4. WHEN o usuário clicar no botão "Salvar" com texto válido, THE App SHALL armazenar o texto original como uma nova Entrada_Journal no Store e limpar o campo de texto
5. WHEN o usuário salvar o texto do Journal, THE Formatador_Journal SHALL gerar uma versão formatada profissionalmente a partir do texto original e armazená-la junto à Entrada_Journal
6. THE Formatador_Journal SHALL ser implementado como função mock (formatJournalEntry) que simula formatação por IA, retornando texto em linguagem profissional
7. FOR ALL Entrada_Journal válidas, formatar e depois exibir SHALL preservar o texto original inalterado junto ao texto formatado (propriedade round-trip)
8. THE App SHALL exibir as Entradas_Journal salvas utilizando o componente JournalCard, ordenadas da mais recente para a mais antiga, mostrando texto original e texto formatado
9. WHEN não houver Entradas_Journal registradas, THE App SHALL exibir o componente EmptyState

### Requisito 5: Relatórios

**User Story:** Como desenvolvedor, quero gerar relatórios profissionais agrupados por período, para que eu possa compartilhar meu progresso com gestores e equipes.

#### Critérios de Aceitação

1. THE App SHALL exibir botões para selecionar período do Relatório: Hoje (dia atual), Semana (últimos 7 dias a partir da data atual) e Sprint (últimos 14 dias a partir da data atual)
2. WHEN o usuário acessar a tela de Relatórios, THE App SHALL apresentar o período "Hoje" selecionado por padrão
3. WHEN o usuário selecionar um período, THE Visualizador_Relatório SHALL exibir um Relatório contendo o texto formatado de cada Entrada_Journal do período selecionado, ordenado cronologicamente da entrada mais recente para a mais antiga
4. THE Visualizador_Relatório SHALL apresentar o Relatório com título do período, seções agrupadas por data e o texto formatado de cada Entrada_Journal dentro da respectiva seção de data
5. IF não houver Entradas_Journal no período selecionado, THEN THE App SHALL exibir o componente EmptyState indicando ausência de registros para o período
6. THE App SHALL gerar Relatórios utilizando dados mockados localmente

### Requisito 6: Componentes Reutilizáveis

**User Story:** Como desenvolvedor, quero um conjunto de componentes reutilizáveis e bem tipados, para que a aplicação seja consistente e escalável.

#### Critérios de Aceitação

1. THE App SHALL implementar os seguintes componentes compartilhados em src/components/: AppSidebar, PageHeader, EmptyState, Loading, Button, Modal, Input, Textarea e Badge
2. THE App SHALL implementar os seguintes componentes específicos de feature dentro do diretório components/ de cada respectiva feature: RoutineCard, InboxItem, JournalEditor, JournalCard, ReportViewer e StatCard
3. THE App SHALL definir interfaces TypeScript explícitas para as props de cada componente reutilizável, sem utilizar o tipo "any", garantindo que todas as props obrigatórias e opcionais estejam declaradas na interface
4. THE App SHALL organizar o código em arquitetura feature-first, onde cada feature contém os subdiretórios: components, pages, hooks, services, types e tests
5. THE App SHALL limitar cada componente a no máximo 150 linhas de código e a uma única responsabilidade de apresentação, sem conter lógica de negócio diretamente no corpo do componente

### Requisito 7: Qualidade de Código e Testes

**User Story:** Como desenvolvedor, quero que o código siga boas práticas e tenha cobertura de testes, para que o projeto seja confiável e fácil de manter.

#### Critérios de Aceitação

1. THE App SHALL configurar Jest com React Testing Library como framework de testes, incluindo suporte a módulos TypeScript via ts-jest ou @swc/jest
2. THE App SHALL incluir testes unitários para: RoutineCard, InboxItem, formatJournalEntry, Dashboard e Sidebar, cada um com pelo menos 2 cenários de teste (caso de sucesso e caso de borda)
3. THE App SHALL configurar ESLint com plugin @typescript-eslint e Prettier com arquivo de configuração (.prettierrc) versionado no repositório
4. THE App SHALL utilizar TypeScript com "strict": true no tsconfig.json, sem uso do tipo "any" em todo o código-fonte
5. THE Formatador_Journal SHALL ser implementado como função pura síncrona que aceita uma string não vazia como parâmetro e retorna uma string formatada, sem efeitos colaterais e sem dependências externas

### Requisito 8: Preparação para Integrações Futuras

**User Story:** Como desenvolvedor, quero que a arquitetura do projeto esteja preparada para integrações externas, para que eu possa conectar APIs de IA, Jira, GitHub, GitLab e Microsoft Teams no futuro sem refatoração significativa.

#### Critérios de Aceitação

1. THE App SHALL organizar serviços em camada separada (pasta services) com uma interface TypeScript exportada para cada integração futura planejada (OpenAI, Jira, GitHub, GitLab e Microsoft Teams), definindo os tipos de entrada e saída de cada operação
2. THE App SHALL implementar o Formatador_Journal com interface assíncrona (retornando Promise) que permita substituição da função mock por chamada a API externa (OpenAI) sem alteração de nenhum arquivo de componente consumidor
3. THE App SHALL utilizar Zustand como gerenciador de estado com stores modulares separadas por feature (Rotinas, Inbox, Journal, Relatórios), onde cada store expõe suas actions de forma independente e pode ser estendida com middleware sem afetar as demais stores
4. WHEN uma implementação de serviço for substituída por outra que respeite a mesma interface TypeScript, THEN THE App SHALL compilar sem erros e manter o comportamento dos componentes consumidores inalterado
