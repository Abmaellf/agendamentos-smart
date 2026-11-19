# weekly-appointments Specification

## Purpose
Descreve a agenda semanal e a criação manual atualmente entregues, incluindo catálogo, validação de formulário, permissões visuais e atualização da consulta.

## Requirements

### Requirement: A agenda consulta e apresenta uma semana útil

A agenda MUST consultar os agendamentos da unidade ativa para o intervalo semanal selecionado e apresentar cinco colunas úteis, de segunda a sexta-feira, em uma matriz horária com régua lateral iniciando às 07:00 e linhas de uma hora até 18:00 na faixa padrão visível. A agenda MUST oferecer estados de carregamento, erro com nova tentativa, vazio e dados.

#### Scenario: Semana sem agendamentos

- **WHEN** a consulta da semana retornar uma lista vazia
- **THEN** a agenda MUST informar que não existem agendamentos na semana selecionada

#### Scenario: Mudança de semana

- **WHEN** a pessoa selecionar outra data ou usar a navegação semanal
- **THEN** a agenda MUST consultar e destacar a semana correspondente

#### Scenario: Grade horária semanal

- **WHEN** a agenda renderizar uma semana com dados
- **THEN** MUST exibir uma régua lateral com `07:00`, `08:00` e cada hora subsequente até `18:00`, e MUST fazer cada linha atravessar visualmente as cinco colunas de segunda a sexta-feira

### Requirement: Cartões preservam o horário local e o estado retornado

Cada agendamento retornado MUST ser apresentado no dia calculado para seu fuso, na posição correspondente ao seu horário local e duração, com paciente, serviço e estado visual correspondente. Cards com intervalos simultâneos MUST compartilhar a mesma faixa temporal e ser distribuídos em linhas ou colunas visíveis, mantendo um card separado por paciente.

#### Scenario: Agendamento retornado no fuso da unidade

- **WHEN** a API retornar um instante e fuso associados ao agendamento
- **THEN** o cartão MUST aparecer na coluna do dia e no horário local calculado para aquele fuso

#### Scenario: Duração ocupa a matriz horária

- **WHEN** a API retornar um agendamento com horário inicial e duração em minutos
- **THEN** o cartão MUST iniciar no horário local correspondente, ocupar visualmente a faixa da duração e permanecer identificável mesmo quando ultrapassar uma linha horária

#### Scenario: Agendamentos simultâneos

- **WHEN** dois ou mais agendamentos do mesmo dia tiverem intervalos de horário sobrepostos
- **THEN** a agenda MUST renderizar um card separado por paciente, preservando a ordem estável dos registros e distribuindo-os sem sobreposição indevida na faixa temporal; quando a largura horizontal da coluna for atingida, os cards excedentes MUST continuar na linha inferior alinhados à esquerda

#### Scenario: Paleta visual definida por estado

- **WHEN** a agenda renderizar um cartão em qualquer um dos seis estados canônicos
- **THEN** `AGENDADO` e `REAGENDADO` MUST usar amarelo com texto preto, `EMATENDIMENTO` e `FINALIZADO` MUST usar verde com texto branco, `CANCELADO` MUST usar grafite com texto branco e `FALTA` MUST usar vermelho com texto branco

#### Scenario: Cartão completo de agendamento

- **WHEN** a agenda renderizar um agendamento retornado pela API
- **THEN** o cartão MUST apresentar de forma legível o primeiro nome do paciente e o nome do serviço dentro da faixa temporal, e MUST manter o horário local, a duração e o estado identificáveis para pessoas que usam tecnologia assistiva

#### Scenario: Contraste e leitura do cartão

- **WHEN** um cartão for exibido em uma coluna diária, em uma faixa estreita de sobreposição ou em uma viewport estreita
- **THEN** suas informações visíveis MUST permanecer legíveis sem barra de rolagem interna; o primeiro nome e o serviço podem ser quebrados ou truncados visualmente para caber no cartão, desde que a identificação completa do paciente, o serviço, o horário e o estado permaneçam disponíveis por nome acessível ou dica contextual

### Requirement: Criação manual carrega catálogos necessários

O diálogo de criação MUST carregar pacientes, unidades e serviços antes do envio e MUST buscar profissionais filtrados pelo serviço selecionado, mantendo o profissional opcional. Os quatro catálogos MUST ser apresentados em campos que permitam localizar e selecionar uma opção por busca textual.

#### Scenario: Serviço selecionado

- **WHEN** a pessoa selecionar um serviço
- **THEN** o formulário MUST preencher duração e preço padrão e consultar os profissionais daquele serviço

#### Scenario: Catálogos carregados antes da interação

- **WHEN** o diálogo for aberto
- **THEN** pacientes, unidades e serviços MUST estar disponíveis para seleção após o carregamento, e profissionais MUST permanecer condicionados ao serviço selecionado

### Requirement: Formulário valida os dados e limita sobrescritas pelo papel

O formulário MUST exigir paciente, unidade, serviço, data, horário, duração inteira entre 1 e 480 minutos e preço decimal com duas casas. `ADMIN` pode editar duração e preço; `BASIC` MUST enviar os valores padrão do serviço.

#### Scenario: Formulário incompleto

- **WHEN** a pessoa tentar criar o agendamento sem campos obrigatórios
- **THEN** a interface MUST apontar os campos inválidos e não enviar a chamada de criação

#### Scenario: Sessão BASIC

- **WHEN** uma pessoa com papel `BASIC` selecionar um serviço
- **THEN** duração e preço MUST permanecer somente leitura e o payload MUST usar seus valores padrão

### Requirement: Criação envia contrato mínimo e atualiza a agenda

A criação MUST enviar paciente, unidade, serviço, profissional opcional, instante ISO, duração e preço, sem `tenantId`, estado, autoria ou data de criação. Após sucesso, MUST fechar o diálogo e invalidar a agenda. A criação MUST rejeitar sobreposição para o mesmo profissional quando o serviço solicitado for `Atendimento individual`. Para qualquer outro serviço, a criação MUST permitir que o mesmo profissional atenda pacientes diferentes no mesmo intervalo, desde que o paciente não tenha conflito, o serviço tenha capacidade disponível, o profissional ofereça o serviço e esteja disponível no dia.

#### Scenario: Criação bem-sucedida

- **WHEN** a API aceitar um agendamento válido
- **THEN** a interface MUST confirmar o sucesso, limpar/fechar o diálogo e refazer a consulta da agenda

#### Scenario: Conflito ou falha de criação

- **WHEN** a API recusar a criação ou ocorrer falha de rede
- **THEN** o diálogo MUST permanecer aberto e apresentar orientação associada ao erro quando disponível

#### Scenario: Profissional atende dois pacientes em serviço coletivo

- **WHEN** dois pacientes distintos forem agendados no mesmo intervalo, para o mesmo serviço coletivo e com o mesmo profissional
- **THEN** a API MUST aceitar o segundo agendamento enquanto a capacidade do serviço não estiver esgotada

#### Scenario: Profissional exclusivo em atendimento individual

- **WHEN** um segundo paciente for agendado no mesmo intervalo para `Atendimento individual` e o mesmo profissional
- **THEN** a API MUST rejeitar a criação com `PROFESSIONAL_APPOINTMENT_CONFLICT`

#### Scenario: Capacidade coletiva esgotada

- **WHEN** um novo paciente for agendado em serviço coletivo e a quantidade de agendamentos sobrepostos atingir a capacidade configurada
- **THEN** a API MUST rejeitar a criação com `SERVICE_CAPACITY_EXCEEDED`, mesmo que o profissional seja o mesmo

#### Scenario: Conflito do próprio paciente permanece bloqueante

- **WHEN** o paciente já possuir outro agendamento sobreposto
- **THEN** a API MUST rejeitar a criação com `PATIENT_APPOINTMENT_CONFLICT`, independentemente do tipo de serviço

### Requirement: O cabeçalho da agenda comunica a identidade e o contexto da tela

A página de agendamentos MUST apresentar um cabeçalho claro com ícone de calendário em bloco verde arredondado, título “Agendamentos” e subtítulo “Visualize e gerencie os atendimentos da semana.”.

#### Scenario: Exibição do cabeçalho conforme a referência

- **WHEN** a pessoa acessar a rota de agendamentos
- **THEN** a interface MUST exibir o ícone de calendário, o título e o subtítulo no cabeçalho da agenda, mantendo o conteúdo semanal abaixo dele

### Requirement: O menu central identifica a visualização semanal ativa

O cabeçalho MUST apresentar um seletor segmentado com ícones e os rótulos “Semana”, “Dia” e “Lista”, destacando “Semana” com o estado ativo e mantendo as demais opções visualmente neutras.

#### Scenario: Semana é a opção ativa

- **WHEN** a agenda semanal for renderizada
- **THEN** “Semana” MUST ter indicação visual e programática de opção ativa, enquanto “Dia” e “Lista” MUST permanecer visíveis como opções de visualização ainda não implementadas

#### Scenario: Opções futuras não alteram a agenda entregue

- **WHEN** a pessoa interagir com “Dia” ou “Lista” enquanto os modos correspondentes não estiverem implementados
- **THEN** a interface MUST manter a agenda semanal, a rota atual e os dados consultados, sem iniciar chamada HTTP ou operação de domínio nova

### Requirement: O cabeçalho da agenda permanece utilizável em telas estreitas

O cabeçalho MUST preservar a leitura, a identificação dos controles e a interação sem criar rolagem horizontal nem sobrepor o conteúdo em viewport estreita.

#### Scenario: Cabeçalho em viewport estreita

- **WHEN** a página de agendamentos for exibida em uma tela estreita
- **THEN** o ícone, o título, o subtítulo e o seletor MUST permanecer acessíveis por agrupamento ou reorganização responsiva, sem perda da indicação de “Semana” ativa

### Requirement: O cabeçalho das colunas comunica o dia e a data

Cada coluna da semana MUST exibir no topo o nome do dia da semana em português, a data no formato “24 de Agosto” e um indicador visual de calendário. O dia selecionado MUST ter destaque visual próprio e indicar “Hoje” quando corresponder à data atual.

#### Scenario: Colunas de segunda a sexta

- **WHEN** a agenda semanal for renderizada
- **THEN** MUST exibir as colunas na ordem `Segunda`, `Terça`, `Quarta`, `Quinta` e `Sexta`, cada uma com seu dia e data correspondentes

#### Scenario: Dia atual destacado

- **WHEN** uma das colunas corresponder à data atual
- **THEN** essa coluna MUST apresentar destaque visual e o indicador textual “Hoje” sem alterar os dados consultados

### Requirement: A legenda explica as cores dos estados da agenda

A agenda MUST apresentar uma legenda inferior com quatro grupos de cor, rótulo e descrição: amarelo “Aguardando atendimento” / “Paciente agendado”; verde “Atendida” / “Atendimento realizado”; grafite “Cancelado” / “Agendamento cancelado”; vermelho “Falta” / “Paciente não compareceu”. A informação textual MUST permanecer disponível sem depender somente da cor.

#### Scenario: Legenda da referência visual

- **WHEN** a agenda renderizar a matriz horária
- **THEN** MUST exibir os quatro grupos da legenda com seus rótulos e descrições correspondentes às cores dos cartões

#### Scenario: Acessibilidade da legenda

- **WHEN** uma pessoa navegar pela legenda usando tecnologia assistiva
- **THEN** cada grupo MUST ser anunciado com seu estado e sua descrição, independentemente da percepção da cor

### Requirement: A matriz permanece utilizável em telas estreitas

Em uma viewport estreita, a agenda MUST preservar a régua de horários, a identificação dos dias e a leitura dos cards, podendo permitir rolagem horizontal controlada para as cinco colunas sem sobreposição indevida do cabeçalho ou da legenda.

#### Scenario: Grade em viewport estreita

- **WHEN** a agenda for exibida em uma tela estreita
- **THEN** a régua, os cabeçalhos de dia/data, os cards e a legenda MUST continuar acessíveis e identificáveis, mesmo que a matriz exija rolagem horizontal

### Requirement: A agenda permite consultar os detalhes do agendamento

A agenda MUST abrir um painel modal de detalhes ao selecionar um cartão e MUST apresentar, em modo de consulta, a identificação do paciente, o identificador disponível, o serviço, a data, o horário, a duração, o profissional quando disponível e o status do agendamento.

#### Scenario: Abrir detalhes pelo cartão

- **WHEN** a pessoa selecionar um cartão de paciente na agenda semanal
- **THEN** a interface MUST abrir o modal “Detalhes do agendamento” com os dados do mesmo `appointment`, sem consultar ou exibir dados de outro paciente

#### Scenario: Fechar detalhes sem alteração

- **WHEN** a pessoa fechar o modal por fechar, cancelar ou tecla `Escape` sem confirmar uma transição
- **THEN** a interface MUST retornar à agenda e MUST preservar o agendamento e o status exibidos antes da abertura

#### Scenario: Campo ainda ausente no contrato

- **WHEN** um detalhe visual da referência não estiver disponível no contrato retornado, como telefone, e-mail, nascimento, sala ou observações
- **THEN** a interface MUST manter o espaço identificável como indisponível, desabilitar sua ação e informar `Em breve`, sem fabricar um valor

### Requirement: O modal apresenta o estado inicial e a ação de início

O modal MUST mapear `AGENDADO` para `Aguardando atendimento`, selecionar esse estado por padrão e oferecer a ação `Iniciar agendamento` para solicitar a transição para `ATENDENDO`.

#### Scenario: Agendamento aguardando atendimento

- **WHEN** o modal for aberto para um agendamento com status `AGENDADO`
- **THEN** `Aguardando atendimento` MUST estar ativo, `Iniciar agendamento` MUST estar habilitado e `Cancelar agendamento` MUST estar habilitado

#### Scenario: Iniciar atendimento

- **WHEN** a pessoa acionar `Iniciar agendamento` e a API confirmar a transição
- **THEN** o status MUST ser `ATENDENDO`, a interface MUST comunicar `Atendimento iniciado`, o controle de início MUST permanecer acionado/indisponível para reversão e o cancelamento MUST ficar desabilitado

#### Scenario: Status já iniciado ou finalizado

- **WHEN** o agendamento for aberto com status `ATENDENDO` ou `FINALIZADO`
- **THEN** o modal MUST refletir o status retornado, MUST impedir o início novamente e MUST manter o cancelamento desabilitado

### Requirement: O cancelamento é limitado ao estado aguardando

O modal MUST permitir a transição para `CANCELADO` somente enquanto o agendamento estiver em `AGENDADO` e MUST impedir a ação para qualquer outro status.

#### Scenario: Cancelar agendamento aguardando

- **WHEN** a pessoa acionar `Cancelar agendamento` para um agendamento `AGENDADO` e a API confirmar
- **THEN** o status MUST mudar para `CANCELADO`, o modal MUST comunicar `Cancelado` e nenhuma ação de início ou novo cancelamento MUST permanecer habilitada

#### Scenario: Cancelamento fora da condição permitida

- **WHEN** o status for `ATENDENDO`, `FALTA`, `CANCELADO` ou `FINALIZADO`
- **THEN** `Cancelar agendamento` MUST estar desabilitado e a interface MUST impedir o envio de uma transição de cancelamento

### Requirement: A falta automática respeita o limite de dez minutos

O sistema MUST considerar `FALTA` quando o horário de início do agendamento tiver ultrapassado dez minutos sem confirmação de `ATENDENDO`, usando o instante absoluto persistido pela API e sem substituir um status de atendimento já iniciado.

#### Scenario: Dez minutos após o início sem atendimento iniciado

- **WHEN** o horário atual ultrapassar em pelo menos dez minutos o início local de um agendamento ainda `AGENDADO`
- **THEN** o agendamento MUST ser apresentado como `FALTA`, a ação de início MUST ficar indisponível e o cancelamento MUST permanecer desabilitado

#### Scenario: Atendimento iniciado antes do limite

- **WHEN** a API confirmar `ATENDENDO` antes de completar dez minutos do horário inicial
- **THEN** a regra automática MUST não converter o agendamento para `FALTA`, mesmo após a passagem dos dez minutos

#### Scenario: Reabertura após o limite

- **WHEN** a pessoa abrir ou recarregar a agenda após o limite de dez minutos para um agendamento que permaneceu `AGENDADO`
- **THEN** o resultado MUST continuar sendo `FALTA` sem depender exclusivamente de um timer mantido pelo modal aberto

### Requirement: As transições de status são persistidas e refletem a agenda

As ações de início, cancelamento e falta automática MUST usar a transição autorizada pelo backend, tratar carregamento e erro, e atualizar a agenda somente após confirmação da alteração.

#### Scenario: Transição confirmada

- **WHEN** a API aceitar uma mudança para `ATENDENDO`, `CANCELADO` ou `FALTA`
- **THEN** o modal MUST atualizar o status com a resposta confirmada e a agenda MUST refletir a nova cor, rótulo e habilitação das ações

#### Scenario: Falha na transição

- **WHEN** a API rejeitar a transição ou ocorrer falha de rede
- **THEN** o modal MUST permanecer aberto, informar que não foi possível atualizar o status, reabilitar a ação aplicável e MUST manter o status anterior confirmado

#### Scenario: Contrato de atualização

- **WHEN** uma transição manual for solicitada
- **THEN** o frontend MUST enviar o identificador do agendamento e o status pretendido ao contrato de atualização de status da API e MUST invalidar/refazer a consulta da agenda após sucesso

### Requirement: Recursos fora do primeiro incremento são visíveis e desabilitados

O modal MUST mostrar os recursos previstos na referência que não pertencem a esta change como controles desabilitados, acompanhados da mensagem `Em breve`, sem executar operação de domínio ao serem selecionados.

#### Scenario: Interação com recurso futuro

- **WHEN** a pessoa tentar selecionar `Atendida`, editar agendamento, ver cadastro completo, editar observações ou outro recurso fora do escopo
- **THEN** o controle MUST permanecer desabilitado, MUST exibir `Em breve` e MUST não iniciar chamada HTTP nem alterar o agendamento

### Requirement: O cartão exibe apenas o primeiro nome do paciente

O conteúdo textual visível do cartão MUST exibir somente o primeiro nome do paciente, derivado do primeiro termo do nome completo após a remoção de espaços nas extremidades.

#### Scenario: Nome completo com vários termos

- **WHEN** o agendamento tiver um paciente chamado `Ana Carolina Oliveira`
- **THEN** o texto visível do paciente no cartão MUST ser `Ana`, enquanto o nome completo MUST permanecer disponível em uma descrição acessível ou dica contextual

#### Scenario: Nome com um único termo

- **WHEN** o agendamento tiver um paciente cujo nome contenha apenas um termo
- **THEN** o cartão MUST exibir esse termo sem alteração como nome visível

### Requirement: O cartão não cria rolagem interna

O cartão MUST ocultar ou acomodar qualquer conteúdo excedente sem apresentar barra de rolagem horizontal ou vertical própria.

#### Scenario: Conteúdo excede a largura do cartão

- **WHEN** o primeiro nome ou o serviço não couber na largura disponível
- **THEN** o texto MUST ser quebrado ou truncado dentro dos limites do cartão, sem criar rolagem interna e sem deslocar os demais cartões da coluna

### Requirement: Cartões simultâneos quebram para a esquerda quando a largura termina

Os cartões que ocuparem o mesmo intervalo visual MUST ser organizados da esquerda para a direita e, ao atingir a largura útil da coluna do dia, o próximo cartão MUST iniciar na linha imediatamente inferior, alinhado à esquerda.

#### Scenario: Mais cartões simultâneos que a primeira linha comporta

- **WHEN** quatro agendamentos simultâneos excederem a largura disponível para três cartões
- **THEN** os três primeiros MUST permanecer na primeira linha, o quarto MUST aparecer na linha seguinte iniciando no limite esquerdo da coluna e nenhum cartão MUST ser cortado por rolagem horizontal

#### Scenario: Quebra exige altura adicional

- **WHEN** a distribuição de cartões simultâneos gerar uma ou mais linhas adicionais
- **THEN** a área da agenda MUST crescer o suficiente para exibir todas as linhas, preservando o início e a duração de cada agendamento e evitando sobreposição com outra faixa temporal

### Requirement: A linha horária responde ao hover

Cada linha horária da matriz MUST oferecer um estado visual de hover que atravesse a régua de horários e as cinco colunas do dia, sem alterar os dados nem iniciar uma operação de domínio.

#### Scenario: Pessoa posiciona o cursor sobre uma linha

- **WHEN** a pessoa posicionar o cursor sobre qualquer célula da linha `07:00`
- **THEN** toda a linha `07:00`, incluindo seu rótulo na régua e a faixa correspondente nas cinco colunas, MUST receber o destaque visual definido pela agenda

#### Scenario: Pessoa deixa a linha horária

- **WHEN** o cursor sair da linha horária destacada
- **THEN** o destaque MUST ser removido sem fazer chamada HTTP, mudar o horário selecionado ou alterar a posição dos cartões

### Requirement: O catálogo de pacientes respeita a unidade selecionada

O catálogo do campo Paciente MUST conter somente pacientes vinculados à unidade atualmente selecionada, e a API MUST aplicar essa restrição por clínica, unidade e identidade autenticada.

#### Scenario: ADMIN abre o diálogo sem unidade selecionada

- **WHEN** uma pessoa `ADMIN` abrir o diálogo de novo agendamento
- **THEN** o campo Unidade MUST estar disponível antes do campo Paciente, o campo Paciente MUST estar desabilitado e o sistema MUST não consultar o catálogo de pacientes sem uma unidade válida

#### Scenario: ADMIN seleciona uma unidade

- **WHEN** uma pessoa `ADMIN` selecionar uma unidade autorizada
- **THEN** o sistema MUST consultar o catálogo informando a unidade selecionada e o campo Paciente MUST apresentar somente pacientes vinculados a essa unidade

#### Scenario: Paciente recém-cadastrado na unidade selecionada

- **WHEN** um paciente for criado com a unidade selecionada entre seus `unitIds` e o catálogo de pacientes for consultado novamente
- **THEN** o paciente MUST estar disponível no campo Paciente para o agendamento naquela unidade

#### Scenario: Paciente cadastrado em outra unidade

- **WHEN** um paciente não possuir vínculo com a unidade selecionada
- **THEN** o paciente MUST não ser apresentado nem poder ser escolhido para o agendamento

#### Scenario: ADMIN troca a unidade

- **WHEN** uma pessoa `ADMIN` trocar a unidade depois de carregar ou selecionar um paciente
- **THEN** o formulário MUST limpar o paciente selecionado, invalidar o catálogo anterior e consultar somente os pacientes vinculados à nova unidade

### Requirement: A seleção de paciente permanece consistente com a unidade

O formulário MUST impedir o envio enquanto a unidade estiver ausente, o paciente estiver indisponível para ela ou o catálogo dependente estiver carregando ou em erro; a validação definitiva MUST permanecer no servidor.

#### Scenario: Unidade alterada após paciente selecionado

- **WHEN** a unidade for alterada após a seleção de um paciente
- **THEN** o botão de criação MUST permanecer indisponível até que um paciente válido da nova unidade seja selecionado

#### Scenario: Catálogo dependente vazio ou indisponível

- **WHEN** a consulta de pacientes da unidade selecionada retornar vazio ou falhar
- **THEN** o diálogo MUST informar o estado correspondente, MUST não oferecer paciente de outra unidade e MUST impedir a criação até que exista uma opção válida ou uma nova tentativa bem-sucedida

#### Scenario: Sessão BASIC

- **WHEN** uma pessoa `BASIC` abrir o diálogo com `activeUnitId` válido
- **THEN** o sistema MUST usar essa unidade como contexto do catálogo de pacientes, manter o campo Unidade sem edição e apresentar somente pacientes daquela unidade

#### Scenario: API rejeita combinação inconsistente

- **WHEN** a API rejeitar a criação porque o paciente não pertence à unidade enviada
- **THEN** o diálogo MUST permanecer aberto, apresentar a mensagem de erro disponível e não confirmar o agendamento

### Requirement: A unidade do BASIC é pré-selecionada e não editável

No diálogo de criação, uma sessão `BASIC` MUST usar a unidade `activeUnitId` da sessão como valor do campo Unidade e MUST impedir sua alteração. `ADMIN` MUST poder selecionar outra unidade retornada pela API da própria clínica.

#### Scenario: BASIC abre novo agendamento

- **WHEN** uma pessoa com sessão `BASIC` abrir o diálogo e o catálogo incluir sua unidade ativa
- **THEN** o campo Unidade MUST mostrar essa unidade já selecionada, permanecer desabilitado e o payload MUST usar o respectivo identificador

#### Scenario: ADMIN seleciona outra unidade

- **WHEN** uma pessoa com sessão `ADMIN` abrir o diálogo e selecionar outra unidade disponível
- **THEN** o campo Unidade MUST aceitar a seleção e a criação MUST enviar o identificador selecionado

#### Scenario: Unidade do BASIC não está disponível

- **WHEN** a sessão `BASIC` informar `activeUnitId` ausente no catálogo recebido ou o catálogo não retornar uma unidade autorizada
- **THEN** a interface MUST comunicar o problema, MUST impedir a criação e MUST não selecionar silenciosamente outra unidade

### Requirement: Catálogos respeitam o escopo retornado pela sessão

As telas MUST consumir os catálogos fornecidos pela API como fonte de dados autorizados. A interface MUST não ampliar, combinar ou substituir a lista de unidades, pacientes, profissionais ou usuários para contornar o papel da sessão.

#### Scenario: Catálogo BASIC já vem limitado

- **WHEN** uma sessão `BASIC` consultar os catálogos do agendamento
- **THEN** a interface MUST renderizar somente as opções recebidas e não MUST realizar chamada adicional por digitação ou por tentativa de selecionar outra unidade

#### Scenario: Catálogo ADMIN contém várias unidades

- **WHEN** uma sessão `ADMIN` receber mais de uma unidade da própria clínica
- **THEN** a interface MUST manter a seleção pesquisável e editável para essas opções

### Requirement: Campos de catálogo permitem busca textual no dropdown

Paciente, unidade, serviço e profissional MUST permitir busca parcial pelo nome exibido, com filtro local e sem nova chamada HTTP a cada caractere digitado.

#### Scenario: Abrir um campo pesquisável

- **WHEN** a pessoa abrir um dos quatro campos de catálogo
- **THEN** o dropdown MUST exibir uma área de busca com uma lupa visível, as opções disponíveis e o valor atualmente selecionado, quando houver

#### Scenario: Filtrar por trecho do nome

- **WHEN** a pessoa digitar um trecho no campo de busca
- **THEN** o dropdown MUST exibir somente as opções cujo nome contenha o trecho, ignorando diferenças de maiúsculas, minúsculas e acentuação, sem alterar os demais catálogos

#### Scenario: Busca sem correspondência

- **WHEN** o texto digitado não corresponder ao nome de nenhuma opção
- **THEN** o dropdown MUST informar que nenhuma opção foi encontrada e MUST impedir a seleção de uma opção inexistente

#### Scenario: Limpar a busca

- **WHEN** a pessoa apagar todo o texto de busca
- **THEN** o dropdown MUST restaurar todas as opções disponíveis do catálogo, preservando o valor já selecionado

#### Scenario: Selecionar uma opção filtrada

- **WHEN** a pessoa escolher uma opção exibida pelo filtro
- **THEN** o campo MUST mostrar o nome selecionado, armazenar o identificador correspondente no formulário e fechar o dropdown

#### Scenario: Profissional depende do serviço

- **WHEN** nenhum serviço estiver selecionado
- **THEN** o campo de profissional MUST permanecer desabilitado e informar a ausência de opções até que um serviço seja selecionado

- **WHEN** a pessoa trocar o serviço
- **THEN** o campo de profissional MUST limpar a seleção anterior, carregar somente os profissionais do novo serviço e manter a opção “Sem profissional”

### Requirement: Campos pesquisáveis preservam o contrato do FormField

Cada campo pesquisável MUST continuar associado ao rótulo e ao erro do `FormField`, MUST expor um nome acessível correspondente ao rótulo e MUST manter o foco e a navegação por teclado utilizáveis.

#### Scenario: Campo sem seleção

- **WHEN** o formulário for exibido sem um paciente, unidade ou serviço selecionado
- **THEN** o controle MUST anunciar o rótulo do `FormField`, exibir o placeholder “Selecione” e indicar programaticamente que o dropdown está fechado

#### Scenario: Campo opcional sem profissional

- **WHEN** o campo de profissional estiver habilitado e sem seleção
- **THEN** o controle MUST exibir e anunciar “Sem profissional” como opção válida, sem apresentar erro de obrigatoriedade

#### Scenario: Validação de campo obrigatório

- **WHEN** a pessoa enviar o formulário sem paciente, unidade ou serviço
- **THEN** o erro correspondente MUST permanecer associado ao controle pelo `aria-describedby`, o diálogo MUST permanecer aberto e o foco MUST ir para o primeiro campo inválido

#### Scenario: Navegação por teclado

- **WHEN** a pessoa operar um campo pesquisável somente pelo teclado
- **THEN** MUST ser possível abrir o dropdown, digitar a busca, percorrer as opções, selecionar uma opção e fechá-lo sem perder o nome acessível, usando Enter, Espaço, setas, Escape e Tab conforme o estado do controle

#### Scenario: Fechar sem confirmar nova opção

- **WHEN** a pessoa fechar o dropdown por Escape ou clicar fora sem escolher uma nova opção
- **THEN** o campo MUST conservar a seleção anterior e o formulário MUST conservar o identificador anteriormente armazenado
