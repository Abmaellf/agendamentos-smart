# Spec Delta

## Purpose

Permite que administradores mantenham pacotes de sessões flexíveis por unidade,
reutilizando serviços existentes e preservando a definição após seu primeiro uso.

## ADDED Requirements

### Requirement: Administradores administram pacotes na unidade autorizada
O sistema MUST permitir somente a administradores autorizados criar, consultar, alterar, ativar e desativar pacotes da unidade selecionada, verificando no servidor que a unidade pertence à clínica da sessão. Usuários sem essa permissão MUST não obter nem modificar pacotes fora do seu escopo.

#### Scenario: Administrador cadastra pacote da unidade autorizada
- **WHEN** um administrador enviar uma definição válida para uma unidade de sua clínica
- **THEN** o sistema MUST criar o pacote nessa unidade e registrar autoria e datas de criação e atualização

#### Scenario: Tentativa fora do escopo autorizado
- **WHEN** uma pessoa sem permissão administrativa ou com unidade de outra clínica tentar consultar ou modificar um pacote
- **THEN** o sistema MUST recusar a operação sem expor dados do pacote não autorizado

### Requirement: Pacote define serviço, sessões, dias e preço configuráveis
Cada pacote MUST possuir identificador gerado pelo sistema, unidade, serviço existente da clínica autorizada, nome, total inteiro positivo de sessões, preço total não negativo em precisão decimal, situação ativa ou inativa e um conjunto único de um a sete dias da semana. Descrição é opcional e profissional, horário e disponibilidade não fazem parte da definição nesta capability.

#### Scenario: Cadastro com combinação livre de dias
- **WHEN** um administrador cadastrar um pacote de dez sessões com segunda e quarta-feira e preço total de R$ 400,00
- **THEN** o pacote MUST conservar o serviço, a unidade, o total de sessões, os dois dias e o preço total informados

#### Scenario: Fim de semana configurado
- **WHEN** um administrador selecionar sábado ou domingo junto de qualquer outra combinação válida
- **THEN** o sistema MUST aceitar esses dias sem restringir a seleção a segunda-feira até sexta-feira

### Requirement: Frequência semanal é derivada dos dias configurados
O sistema MUST calcular e apresentar a frequência semanal como a quantidade de dias distintos configurados no pacote. Essa frequência MUST não ser recebida nem persistida como valor independente que possa divergir dos dias.

#### Scenario: Três dias selecionados
- **WHEN** um pacote tiver segunda, terça e quarta-feira configuradas
- **THEN** sua frequência semanal MUST ser apresentada como três atendimentos por semana

#### Scenario: Alteração dos dias antes de qualquer agendamento
- **WHEN** um administrador alterar os dias de um pacote que ainda não tenha agendamentos de pacote vinculados
- **THEN** a frequência semanal apresentada MUST refletir somente o novo conjunto de dias

### Requirement: Entradas inválidas são rejeitadas sem criar ou alterar pacote
O sistema MUST rejeitar nome ausente, serviço inexistente ou fora da clínica autorizada, total de sessões menor que um, preço negativo, conjunto de dias vazio, dia inválido ou repetido e unidade fora do escopo autorizado. A resposta MUST identificar a falha de forma compatível com o padrão de erros da API.

#### Scenario: Tentativa sem dias configurados
- **WHEN** um administrador enviar um pacote sem nenhum dia da semana
- **THEN** o sistema MUST rejeitar a solicitação e informar que ao menos um dia é obrigatório

#### Scenario: Tentativa com quantidade de sessões inválida
- **WHEN** um administrador enviar total de sessões zero ou negativo
- **THEN** o sistema MUST rejeitar a solicitação sem persistir alteração parcial

### Requirement: Administradores consultam pacotes por critérios administrativos
O sistema MUST permitir listar e detalhar pacotes do escopo autorizado, com filtros por unidade, serviço, situação, total de sessões e nome. Cada resultado MUST comunicar nome, serviço, unidade, total de sessões, dias, frequência semanal derivada, preço total e situação.

#### Scenario: Filtro por serviço e situação
- **WHEN** um administrador consultar pacotes ativos de um serviço na unidade autorizada
- **THEN** o sistema MUST retornar somente os pacotes que atendam simultaneamente aos filtros e ao escopo

#### Scenario: Consulta de pacote inativo no histórico administrativo
- **WHEN** um administrador solicitar os detalhes de um pacote inativo de sua unidade
- **THEN** o sistema MUST apresentar a definição histórica e sua situação inativa

### Requirement: Pacotes sem agendamento vinculado podem ser atualizados
Um administrador MUST poder alterar nome, descrição, serviço, total de sessões, preço total, dias e situação de um pacote sem agendamentos de pacote vinculados. A atualização MUST recalcular a frequência a partir dos dias e preservar os dados de auditoria.

#### Scenario: Atualização antes do primeiro uso
- **WHEN** um administrador alterar o preço e os dias de um pacote ainda sem agendamento de pacote vinculado
- **THEN** o sistema MUST persistir os novos valores e apresentar a frequência correspondente aos novos dias

### Requirement: Pacote com agendamento vinculado é imutável
Depois que existir ao menos um agendamento de pacote vinculado, o sistema MUST rejeitar qualquer alteração de sua definição e situação. Essa regra MUST preservar as condições usadas pelos agendamentos já existentes.

#### Scenario: Tentativa de edição após uso
- **WHEN** um administrador tentar editar ou desativar um pacote que já possua agendamento de pacote vinculado
- **THEN** o sistema MUST rejeitar a alteração e informar que a definição está imutável por possuir agendamentos

### Requirement: Pacotes inativos não são elegíveis para novos agendamentos de pacote
Um pacote sem agendamentos vinculados MUST poder ser ativado ou desativado sem exclusão física. Pacotes inativos MUST permanecer consultáveis no histórico administrativo e MUST não ser retornados como elegíveis para uma nova contratação ou agendamento de pacote.

#### Scenario: Desativação antes do uso
- **WHEN** um administrador desativar um pacote sem agendamentos vinculados
- **THEN** o pacote MUST continuar consultável administrativamente e deixar de ser elegível para um novo agendamento de pacote

#### Scenario: Solicitação de exclusão física
- **WHEN** um administrador tentar excluir fisicamente um pacote
- **THEN** o sistema MUST não remover o registro e MUST orientar a usar a situação inativa quando a alteração for permitida

### Requirement: A definição de pacote não agenda atendimentos nesta etapa
O cadastro de pacote MUST armazenar somente suas regras comerciais semanais e MUST não criar atendimentos, exigir data inicial, selecionar profissional, reservar horários nem validar calendário de funcionamento, feriados ou bloqueios. Essas responsabilidades pertencem a capabilities futuras de agenda e calendário.

#### Scenario: Criação de definição sem agendamentos automáticos
- **WHEN** um administrador salvar um pacote válido
- **THEN** o sistema MUST concluir somente o cadastro do pacote, sem criar registros de agendamento
