# Objetivo do sistema

## Base da análise

Este documento foi derivado dos textos da interface, rotas, componentes e chamadas HTTP do commit `62ac47e`, analisado em 6 de agosto de 2026. Onde o código mostra intenção, mas não entrega um fluxo completo, o item está marcado como **Hipótese** ou **parcial**.

As regras de produto confirmadas posteriormente por entrevista estão em [Requisitos do MVP](Requisitos%20do%20MVP.md). Elas não alteram automaticamente o estado de implementação descrito aqui.

## Propósito principal

O sistema oferece uma interface web para gestão de atendimentos especializados de uma clínica. O contexto atualmente exposto pela interface é “Fisioterapia & Pilates”, e o README original define o produto como “Sistema de gestão de atendimentos especializados”.

O núcleo existente reúne autenticação do operador, identificação da clínica, visualização semanal de atendimentos e gestão inicial de pacientes.

## Problemas que resolve

### Comportamento existente

- autentica um usuário contra uma API externa;
- identifica o perfil e a clínica vinculada ao usuário autenticado;
- apresenta uma visão de cinco dias úteis a partir da semana selecionada;
- lista pacientes retornados pelo backend;
- permite enviar um cadastro mínimo de paciente contendo nome;
- apresenta uma versão móvel do menu principal, embora suas opções ainda não naveguem.

### Problemas ainda não resolvidos integralmente

- a agenda não consulta nem persiste agendamentos: os cartões são dados fixos no componente;
- o cadastro de novo usuário/clínica é somente visual;
- edição, desativação, detalhes e paginação de pacientes são apenas controles sem comportamento;
- filtro de pacientes refaz a listagem, mas não envia o nome informado;
- profissional e configuração não possuem funcionalidades;
- logout e proteção direta das rotas internas não estão implementados.

## Atores envolvidos

| Ator                           | Evidência no sistema                                              | Interações atuais                                 |
| ------------------------------ | ----------------------------------------------------------------- | ------------------------------------------------- |
| Visitante não autenticado      | Tela de login e verificação do cookie `jwt`                       | Acessa login e cadastro visual                    |
| Usuário autenticado da clínica | Login, perfil com `username`, `role` e `clinic`                   | Acessa agenda, pacientes e menu da conta          |
| Clínica                        | Perfil retorna `clinic.id`, `code` e `name`; Header mostra o nome | Contextualiza os dados do usuário                 |
| Paciente                       | Entidade listada e cadastrada                                     | Não há autenticação ou portal próprio de paciente |

**Hipótese:** recepcionistas, administradores ou profissionais podem ser perfis futuros de operador, pois a resposta de perfil contém `role`; o código não define permissões nem comportamentos por papel.

O módulo `Doctor` apenas exibe “Fisioterapeuta”. Portanto, profissional de saúde não pode ser declarado como ator funcional nesta versão.

## Principais fluxos de negócio

### 1. Entrada e redirecionamento

1. O usuário acessa `/`.
2. `FirstScreen` aguarda um segundo.
3. Se o cookie `jwt` estiver ausente, navega para `/sign-in`.
4. Se estiver presente, navega para `/agendamento`.

Esse fluxo verifica presença, não validade ou expiração do cookie. Outras rotas podem ser acessadas diretamente sem essa etapa.

### 2. Autenticação

1. O usuário informa login em um campo HTML do tipo e-mail e senha.
2. React Hook Form entrega os valores a uma mutation do React Query.
3. `signIn` envia `POST /auth/login`.
4. Em sucesso, a página navega para `/agendamento` e apresenta uma notificação.
5. Em falha, apresenta “Credenciais inválidas”.

O cliente Axios usa `withCredentials: true`; o código não persiste o token retornado. **Hipótese:** o backend também grava o cookie esperado, mas isso não pode ser confirmado neste repositório.

### 3. Consulta de perfil

1. O `AppLayout` monta o Header em qualquer rota interna.
2. `AccountMenu` executa a query `profile`.
3. `getProfile` envia `GET auth/me`.
4. Nome da clínica e nome do usuário são exibidos no menu.

O item de logout não executa nenhuma ação.

### 4. Visualização da agenda

1. A página inicia na data atual.
2. O usuário escolhe uma data no calendário.
3. A aplicação calcula segunda a sexta da semana correspondente.
4. A grade cria um `CardDay` para cada dia.
5. Cada `CardDay` filtra dois agendamentos fixos criados com a data do momento da renderização.

O fluxo comprova navegação por semana, mas não uma agenda operacional ligada ao backend.

### 5. Listagem e busca de pacientes

1. Ao montar, a página chama `GET patient/list`.
2. O contexto espera os registros em `response.data.content` e armazena a lista.
3. A tabela renderiza apenas o nome real; código, status e data são valores fixos.
4. Ao filtrar, o formulário valida um nome, mas chama a mesma listagem sem parâmetro.
5. A paginação mostra valores fixos e seus botões não possuem callbacks.

### 6. Criação de paciente

A página contém duas implementações simultâneas:

- `AddPatientModal` envia o nome por `POST /patient/save` usando React Query e mostra notificação;
- `CreatePatientDialog` chama o contexto, que envia `POST patients` e adiciona a resposta ao estado local.

Os diálogos são aninhados na composição atual, os endpoints são diferentes e a primeira mutation não atualiza a lista visível. Esse fluxo deve ser unificado antes de ser considerado estável.

### 7. Cadastro de usuário/clínica

A tela coleta nome da clínica, e-mail e CPF/CNPJ, mas o botão está dentro de um `Link` para `/agendamento`. Nenhum dado é enviado e `registerUser` não é chamado. Trata-se de fluxo visual, não de cadastro funcional.

## Funcionalidades centrais

| Funcionalidade              | Estado                     | Observação                                   |
| --------------------------- | -------------------------- | -------------------------------------------- |
| Login                       | Implementado com ressalvas | API chamada; proteção e logout incompletos   |
| Redirecionamento inicial    | Implementado               | Baseado somente na presença do cookie        |
| Perfil da conta/clínica     | Implementado               | Consulta automática no Header                |
| Agenda semanal              | Parcial                    | Calendário funciona; agendamentos são fixos  |
| Lista de pacientes          | Parcial                    | Backend consultado; várias colunas são fixas |
| Cadastro de paciente        | Parcial e duplicado        | Dois contratos e duas estratégias de estado  |
| Filtro de pacientes         | Parcial                    | Entrada não chega à API                      |
| Paginação                   | Visual                     | Sem navegação ou dados reais de total        |
| Cadastro de usuário/clínica | Visual                     | Não envia formulário                         |
| Profissionais               | Placeholder                | Apenas título de página                      |
| Configurações               | Placeholder                | Página vazia                                 |
| Logout                      | Visual                     | Sem ação                                     |

## Visão de produto

**Hipótese:** os textos “Crie o futuro de sua Clínica”, “Crie sua clínica digital customizada” e “Gestão de agendamento” indicam a intenção de oferecer um painel multi-clínica para organizar pacientes, profissionais, pacotes, valores e atendimentos de fisioterapia/Pilates.

Somente clínica, pacientes, autenticação e parte da agenda possuem evidência estrutural. Pacotes e valores aparecem apenas como itens de menu sem rotas ou regras; não devem ser tratados como funcionalidades existentes.

## Contexto operacional

- execução: navegador moderno, como SPA;
- entrega: bundle estático produzido pelo Vite;
- configuração obrigatória: `VITE_API_URL` no ambiente de build/runtime do Vite;
- integração: API HTTP externa com cookies habilitados;
- idioma e localidade: interface e datas em português do Brasil;
- desenvolvimento local: Vite na porta `3000` e `json-server` opcional na porta `3333`;
- persistência: responsabilidade do backend externo; o cliente possui utilitário órfão de `localStorage`;
- observabilidade: não há serviço de monitoramento, telemetria ou tratamento global de erros identificado;
- qualidade: build de produção válido, lint do código-fonte válido e ausência de testes automatizados.

## Limites do escopo atual

O repositório analisado representa apenas o frontend. Regras clínicas, disponibilidade de profissionais, conflitos de horário, duração, recorrência, pagamento, prontuário, autorização por perfil e conformidade de dados de saúde não aparecem no código. Qualquer documentação dessas áreas seria especulativa e deve aguardar implementação ou contrato externo verificável.

Essas áreas deixaram de ser desconhecidas no nível de produto após a entrevista de 12 de agosto de 2026, mas continuam ausentes do código deste commit. O documento de requisitos define o recorte aprovado sem declará-lo entregue.
