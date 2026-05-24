# Feature Specification: Personal Chess Trainer

**Feature Branch**: `001-personal-chess-trainer`

**Created**: 2026-05-23

**Status**: Draft

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Iniciar e completar uma sessão de treinamento tático (Priority: P1)

Um jogador abre o aplicativo, seleciona seu perfil e inicia uma sessão de treinamento. O sistema apresenta posições táticas uma a uma. Para cada posição, o jogador faz o lance que considera correto. Se errar, a posição retorna na mesma sessão e o jogador deve tentar novamente. A sessão termina quando a fila de exercícios se esgota. Ao final, o jogador vê um resumo com acertos, erros e progresso conquistado.

**Por que P1**: É o núcleo do produto. Sem este fluxo funcionando, nenhuma outra funcionalidade tem valor.

**Independent Test**: Pode ser testado criando um perfil, selecionando qualquer unidade tática, resolvendo 5 exercícios (acertando e errando) e verificando o resumo final da sessão.

**Acceptance Scenarios**:

1. **Given** um perfil existente com unidade tática iniciada, **When** o usuário inicia uma sessão de treinamento, **Then** o sistema apresenta a primeira posição da fila com o tabuleiro orientado corretamente para o lado que deve jogar.
2. **Given** uma posição exibida, **When** o usuário faz o lance correto, **Then** o sistema exibe a resposta do adversário, registra o acerto e avança para o próximo exercício da fila.
3. **Given** uma posição exibida, **When** o usuário faz um lance incorreto, **Then** o sistema exibe feedback visual discreto, mostra o lance correto brevemente e recoloca o exercício na fila da sessão atual.
4. **Given** um exercício com múltiplos lances, **When** o usuário acerta o primeiro lance, **Then** o sistema aguarda o próximo lance da sequência antes de registrar o acerto completo.
5. **Given** a fila de exercícios esgotada, **When** a sessão termina, **Then** o sistema exibe resumo com total de tentativas, acertos de primeira, erros e pontuação conquistada.

---

### User Story 2 — Criar e selecionar perfil de usuário (Priority: P1)

Na abertura do aplicativo, o usuário vê os perfis existentes. Pode selecionar um existente ou criar um novo informando nome, avatar e nível estimado de jogo. Cada perfil mantém progresso, histórico e preferências visuais completamente isolados.

**Por que P1**: Sem perfil, não há como isolar progresso nem personalizar a experiência. É pré-requisito de todas as demais histórias.

**Independent Test**: Pode ser testado criando dois perfis com nomes distintos, treinando em cada um, e verificando que o progresso de um não aparece no outro.

**Acceptance Scenarios**:

1. **Given** o aplicativo aberto pela primeira vez, **When** nenhum perfil existe, **Then** o sistema direciona o usuário diretamente para a criação de perfil, sem tela de seleção.
2. **Given** a tela de criação de perfil, **When** o usuário informa nome, avatar e nível, **Then** o sistema cria o perfil e sugere por onde começar o treinamento de acordo com o nível informado.
3. **Given** múltiplos perfis existentes, **When** o aplicativo é aberto, **Then** o sistema exibe cards de seleção com nome, avatar, nível atual, streak e data de último acesso de cada perfil.
4. **Given** um perfil selecionado, **When** o usuário navega pela aplicação, **Then** todo o progresso, histórico e configurações visuais refletem exclusivamente aquele perfil.

---

### User Story 3 — Dominar um exercício pelo método de repetição progressiva (Priority: P1)

O sistema rastreia quantas vezes consecutivas o usuário acertou cada exercício. Um exercício só é considerado dominado quando o usuário o acerta N vezes seguidas (padrão: 5, configurável). Exercícios dominados entram em fila de revisão espaçada com intervalos crescentes para reforço de longo prazo.

**Por que P1**: É o mecanismo pedagógico central. Sem ele, o aplicativo seria apenas um conjunto de exercícios sem progressão.

**Independent Test**: Pode ser testado acertando o mesmo exercício 5 vezes seguidas e verificando que ele passa para status "dominado" e some da fila de treinamento ativo.

**Acceptance Scenarios**:

1. **Given** um exercício com N acertos consecutivos necessários configurado como 5, **When** o usuário acerta o exercício pela 5ª vez consecutiva, **Then** o sistema marca o exercício como dominado e agenda a próxima revisão para uma data futura.
2. **Given** um exercício que o usuário estava acertando consecutivamente, **When** o usuário erra, **Then** o contador de acertos consecutivos retorna a zero e o exercício permanece na fila ativa.
3. **Given** um exercício dominado com revisão agendada, **When** a data de revisão chega, **Then** o exercício reaparece na fila de revisão do usuário.
4. **Given** um acerto após uso de dica, **When** o sistema registra o resultado, **Then** o acerto conta com peso reduzido, atrasando a progressão em direção ao status dominado.

---

### User Story 4 — Personalizar a aparência do tabuleiro e da interface (Priority: P2)

O usuário acessa as configurações do seu perfil e escolhe o estilo do tabuleiro, o conjunto de peças, o esquema de cores e o tema geral da interface. As preferências são salvas por perfil e aplicadas imediatamente em toda a interface, sem reinicialização.

**Por que P2**: Impacta diretamente o conforto e o prazer de uso diário. Não é funcionalidade de treinamento, mas é fundamental para a experiência.

**Independent Test**: Pode ser testado trocando o tema de interface e o conjunto de peças e verificando que as mudanças persistem após fechar e reabrir o aplicativo com o mesmo perfil.

**Acceptance Scenarios**:

1. **Given** a tela de configurações de aparência, **When** o usuário seleciona um estilo de tabuleiro diferente, **Then** o tabuleiro atualiza imediatamente na pré-visualização e em toda a sessão de treinamento em curso.
2. **Given** dois perfis distintos com aparências diferentes, **When** o usuário alterna entre os perfis, **Then** cada perfil exibe sua própria configuração visual sem interferência.
3. **Given** uma preferência de aparência salva, **When** o aplicativo é fechado e reaberto, **Then** todas as configurações do perfil são restauradas exatamente como foram deixadas.
4. **Given** o modo daltônico ativado, **When** o sistema exibe feedback de acerto ou erro, **Then** as cores usadas garantem distinção sem depender do par verde/vermelho.

---

### User Story 5 — Consultar progresso e estatísticas detalhadas (Priority: P2)

O usuário acessa o painel de estatísticas do seu perfil e vê o histórico completo de atividade: heatmap de dias estudados, taxa de acerto por tema tático, pontos fracos detectados automaticamente, histórico de sessões anteriores e evolução do tempo médio de resposta ao longo do tempo.

**Por que P2**: Permite que o usuário entenda seu progresso e mantenha motivação. Sem isso, o treinamento parece arbitrário.

**Independent Test**: Pode ser testado após 3 sessões de treinamento verificando que o heatmap mostra os dias de atividade e que a taxa de acerto por tema reflete os resultados reais das sessões.

**Acceptance Scenarios**:

1. **Given** um perfil com pelo menos uma sessão concluída, **When** o usuário abre o painel de estatísticas, **Then** o sistema exibe o heatmap de atividade com os dias estudados destacados.
2. **Given** o painel de estatísticas, **When** o usuário visualiza a seção de pontos fracos, **Then** o sistema lista os temas táticos com menor taxa de acerto e oferece atalho direto para praticar cada tema.
3. **Given** o histórico de sessões, **When** o usuário seleciona uma sessão anterior, **Then** o sistema mostra data, duração, quantidade de exercícios, taxa de acerto e pontuação daquela sessão específica.

---

### User Story 6 — Ver informações da partida de origem de um exercício (Priority: P2)

Durante ou após resolver um exercício, o usuário pode expandir um painel informativo que mostra a partida real de onde a posição foi extraída: jogadores, ELO, evento, ano, abertura, código ECO e o número do lance em que a posição ocorreu. O usuário pode visualizar a partida completa e navegar pelos lances.

**Por que P2**: Contextualizar posições com partidas reais de grandes mestres enriquece o aprendizado e aumenta o engajamento. Exercícios deixam de ser abstratos.

**Independent Test**: Pode ser testado abrindo o painel de origem em um exercício com partida vinculada e verificando que os dados dos jogadores, evento e ano são exibidos corretamente.

**Acceptance Scenarios**:

1. **Given** um exercício com partida de origem vinculada, **When** o usuário expande o painel de informações, **Then** o sistema exibe nome dos jogadores, ELO (se disponível), evento, local, ano, código ECO, nome da abertura e número do lance de origem.
2. **Given** o painel de origem expandido, **When** o usuário clica em "Ver partida completa", **Then** o sistema abre um visualizador de lances navegáveis com a partida completa.
3. **Given** um exercício sem partida de origem (exercício composto), **When** o usuário verifica a origem, **Then** o sistema exibe "Exercício personalizado" sem campos vazios ou erros.

---

### User Story 7 — Gerenciar e importar banco de exercícios (Priority: P3)

Um usuário avançado ou professor acessa o editor de banco de exercícios para adicionar novas posições manualmente via FEN, importar exercícios em lote a partir de um arquivo PGN, editar exercícios existentes, adicionar comentários e variantes, e organizar exercícios em módulos e unidades personalizados.

**Por que P3**: Expande o produto para uso profissional e educacional, mas não é necessário para a experiência central de treinamento.

**Independent Test**: Pode ser testado importando um arquivo PGN com 10 partidas, verificando que as posições-chave são extraídas e que os exercícios criados aparecem disponíveis para treinamento.

**Acceptance Scenarios**:

1. **Given** o editor de banco de exercícios, **When** o usuário importa um arquivo PGN com múltiplas partidas, **Then** o sistema processa o arquivo e cria exercícios para cada posição-chave identificada, mantendo o vínculo com a partida de origem.
2. **Given** um exercício em edição, **When** o usuário adiciona uma variante com comentário, **Then** o sistema salva a variante e a exibe ao usuário quando ele joga o lance correspondente durante o treinamento.
3. **Given** um exercício do banco padrão, **When** o usuário tenta excluí-lo, **Then** o sistema bloqueia a exclusão e informa que exercícios do banco padrão não podem ser removidos.

---

### Edge Cases

- O que acontece quando o usuário tenta iniciar uma sessão e todos os exercícios da unidade já estão dominados?
- O que acontece quando o arquivo PGN importado está malformado ou contém posições ilegais de xadrez?
- O que acontece quando o dispositivo fica sem espaço em disco durante uma sessão em curso?
- O que acontece quando o usuário troca de perfil no meio de uma sessão de treinamento?
- O que acontece quando um exercício de revisão agendado é de uma área que o usuário desbloqueou mas ainda não estudou a fundo?
- O que acontece com o progresso de um exercício quando o usuário usa o modo Livre (sem efeito nas estatísticas)?

---

## Requirements *(mandatory)*

### Functional Requirements

**Perfis e Usuários**

- **FR-001**: O sistema DEVE suportar múltiplos perfis locais no mesmo dispositivo, com progresso, histórico e configurações completamente isolados entre perfis.
- **FR-002**: O sistema DEVE permitir criar um perfil informando nome, avatar (emoji ou imagem) e nível estimado de jogo.
- **FR-003**: O sistema DEVE sugerir um ponto de início no currículo baseado no nível informado no cadastro, mas o usuário DEVE poder ignorar a sugestão.
- **FR-004**: O sistema DEVE exibir a tela de seleção de perfil ao abrir, quando há mais de um perfil cadastrado.

**Método de Treinamento**

- **FR-005**: O sistema DEVE implementar o método de repetição progressiva: um exercício é considerado dominado somente após o usuário acertá-lo N vezes consecutivas, onde N é configurável entre 3 e 10 (padrão: 5).
- **FR-006**: O sistema DEVE devolver imediatamente à fila da sessão qualquer exercício respondido incorretamente.
- **FR-007**: O sistema DEVE implementar revisão espaçada para exercícios dominados, com intervalos crescentes entre revisões baseados no desempenho histórico do usuário naquele exercício.
- **FR-008**: O sistema DEVE oferecer 5 modos de estudo: Treinamento (com contagem de acertos), Varredura (sem repetição), Revisão (apenas exercícios com revisão pendente), Livre (sem efeito nas estatísticas) e Cronometrado (com limite de tempo por exercício).

**Exercícios e Conteúdo**

- **FR-009**: O sistema DEVE organizar exercícios em uma hierarquia de Área → Módulo → Unidade → Exercício.
- **FR-010**: O sistema DEVE suportar exercícios com sequências de múltiplos lances e árvore de variantes com comentários por lance.
- **FR-011**: O sistema DEVE exibir feedback imediato ao acerto (animação do lance da resposta) e ao erro (indicação visual do lance correto seguida de devolução à fila).
- **FR-012**: O sistema DEVE oferecer sistema de dicas em 3 níveis progressivos, onde cada dica usada penaliza o peso do acerto no algoritmo de revisão espaçada.
- **FR-013**: O sistema DEVE liberar acesso à próxima unidade somente após o usuário dominar um percentual mínimo da unidade atual (padrão: 80%, configurável entre 50% e 100%).

**Partidas de Origem**

- **FR-014**: O sistema DEVE suportar vínculo de cada exercício a uma partida de origem com os seguintes campos: jogador das brancas, jogador das pretas, ELO de cada jogador (opcional), resultado, evento, local (opcional), ano, rodada (opcional), código ECO (opcional), nome da abertura (opcional), PGN completo da partida (opcional), URL de referência (opcional) e número do lance de origem.
- **FR-015**: O sistema DEVE exibir as informações da partida de origem de forma recolhida por padrão, expansível pelo usuário durante ou após o exercício.
- **FR-016**: O sistema DEVE oferecer visualizador de partida completa com navegação por lances quando o PGN estiver disponível.
- **FR-017**: O sistema DEVE permitir filtrar exercícios no banco por jogador, evento, faixa de ano e código ECO.

**Personalização Visual**

- **FR-018**: O sistema DEVE oferecer ao menos 7 estilos de tabuleiro, 6 conjuntos de peças e 5 temas de interface, todos configuráveis por perfil.
- **FR-019**: O sistema DEVE aplicar mudanças de aparência imediatamente, sem reinicialização do aplicativo.
- **FR-020**: O sistema DEVE incluir modo de acessibilidade para daltonismo que substitui sinalizações dependentes de cor verde/vermelho.

**Histórico e Estatísticas**

- **FR-021**: O sistema DEVE registrar permanentemente cada tentativa de exercício com: timestamp, tempo de resposta, quantidade de dicas usadas, modo de estudo, acertos consecutivos resultantes e resultado (acerto/erro).
- **FR-022**: O sistema DEVE exibir painel de estatísticas com: heatmap de atividade (12 meses), taxa de acerto por tema, relatório automático de pontos fracos, histórico de sessões e evolução do tempo médio de resposta.
- **FR-023**: O sistema DEVE calcular e exibir streak (sequência de dias com ao menos uma sessão concluída).

**Banco de Exercícios**

- **FR-024**: O sistema DEVE suportar importação de exercícios via arquivo PGN com extração automática de posições-chave e manutenção do vínculo com a partida de origem.
- **FR-025**: O sistema DEVE manter o banco padrão e bancos customizados separadamente, impedindo edição ou exclusão do banco padrão.

**Dados e Privacidade**

- **FR-026**: O sistema DEVE armazenar todos os dados exclusivamente no dispositivo local, sem telemetria ou chamadas de rede não solicitadas pelo usuário.
- **FR-027**: O sistema DEVE oferecer exportação dos dados do perfil em formato aberto nas configurações.

### Key Entities

- **Perfil**: Representa um usuário do dispositivo. Possui nome, avatar, nível, configurações visuais e é a raiz de todo progresso e histórico.
- **Exercício**: Uma posição de xadrez com sequência correta de lances, variantes, temas e nível de dificuldade. Pode estar vinculado a uma Partida de Origem.
- **Partida de Origem**: A partida real de onde um exercício foi extraído. Contém metadados completos dos jogadores, evento, abertura e opcionalmente o PGN completo.
- **Progresso do Exercício**: O estado de um exercício para um perfil específico: número de acertos consecutivos, status (não iniciado / em progresso / dominado), data da próxima revisão e fator de facilidade do algoritmo de revisão.
- **Tentativa**: Um registro imutável de uma tentativa de exercício por um perfil em um momento específico, com resultado, tempo e modo de estudo.
- **Sessão**: Uma sequência de tentativas iniciada e concluída pelo usuário, com métricas agregadas.
- **Unidade**: Um agrupamento de exercícios dentro de um módulo. O progresso na unidade determina o desbloqueio da próxima.
- **Módulo**: Um agrupamento de unidades dentro de uma Área temática (Tática, Finais, Estratégia).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um novo usuário consegue criar um perfil, iniciar e completar sua primeira sessão de treinamento em menos de 3 minutos, sem necessidade de tutorial ou ajuda externa.
- **SC-002**: O tabuleiro responde ao lance do usuário em menos de 100ms em 99% das interações, garantindo sensação de fluidez imediata.
- **SC-003**: O aplicativo abre e está pronto para uso em menos de 2 segundos em qualquer dispositivo suportado.
- **SC-004**: Usuários que treinam diariamente com o método de repetição progressiva dominam ao menos 80% dos exercícios de uma unidade completa em até 30 dias de uso regular.
- **SC-005**: 95% das tentativas de exercício são gravadas com sucesso no histórico, mesmo em condições de uso prolongado (banco com mais de 50.000 registros).
- **SC-006**: O sistema suporta um banco com ao menos 10.000 exercícios e histórico com ao menos 500.000 tentativas sem degradação perceptível de desempenho.
- **SC-007**: A troca de perfil ou de tema visual é refletida em toda a interface em menos de 500ms.
- **SC-008**: 90% dos usuários conseguem localizar e usar a funcionalidade de estatísticas sem assistência após a primeira semana de uso.

---

## Assumptions

- O aplicativo é destinado a uso pessoal em computador desktop ou laptop — não há suporte a dispositivos móveis na v1.
- O usuário possui conhecimento básico das regras do xadrez e da notação algébrica — o aplicativo não ensina as regras do jogo.
- Conectividade de internet não é necessária para nenhuma funcionalidade principal — o app funciona completamente offline.
- O banco de exercícios padrão será populado previamente antes do lançamento — o aplicativo não busca exercícios de serviços externos.
- A análise com motor de xadrez é funcionalidade auxiliar, disponível apenas após a conclusão de um exercício — nunca durante o treinamento ativo, para preservar a integridade do método pedagógico.
- Exercícios de abertura (repertório) estão fora do escopo da v1.
- Sincronização de dados entre dispositivos está fora do escopo da v1.
- Rankings e comparação entre usuários estão fora do escopo da v1.
