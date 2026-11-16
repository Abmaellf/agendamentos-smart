# Spec Delta

## Purpose

Define a experiência pública de autenticação da Equilíbrio Fisioterapia &
Pilates, alinhando login e cadastro à identidade visual fornecida sem ampliar
os contratos de sessão ou de cadastro existentes.

## ADDED Requirements

### Requirement: As telas públicas apresentam a identidade visual da clínica

As rotas públicas de autenticação MUST apresentar a marca Equilíbrio em uma
composição visual coerente com as referências fornecidas.

#### Scenario: Exibir a composição pública em viewport ampla

- **WHEN** `/sign-in` ou `/sign-up` for renderizada em uma viewport ampla
- **THEN** a interface MUST apresentar um painel institucional escuro com
  imagem/atmosfera de clínica, formas curvas em tons de verde, logotipo,
  mensagem de posicionamento, cartões de benefícios e rodapé da Equilíbrio;
  ao lado, MUST apresentar um fundo claro com o controle de alternância no
  topo e um cartão claro para o formulário da rota atual

#### Scenario: Exibir a marca dentro do formulário

- **WHEN** o cartão de login ou cadastro estiver visível
- **THEN** o cartão MUST apresentar o logotipo/nome “Equilíbrio” e o subtítulo
  “Fisioterapia & Pilates” antes do título principal da tela

### Requirement: A tela de login comunica e preserva a entrada existente

A rota `/sign-in` MUST exibir o conteúdo e as ações de login definidos na
referência, preservando o envio das credenciais e seus estados atuais.

#### Scenario: Exibir o formulário de login

- **WHEN** uma pessoa acessar `/sign-in`
- **THEN** a interface MUST exibir “Acesse sua conta”, o texto “Acompanhe suas
  vendas pelo painel do parceiro”, campos identificáveis para e-mail e senha,
  a opção “Lembrar-me neste dispositivo”, a ação “Esqueceu sua senha?” e o
  botão “Acessar painel”

#### Scenario: Ir do login para o cadastro

- **WHEN** uma pessoa ativar “Novo Usuário” na tela de login
- **THEN** a aplicação MUST navegar para `/sign-up` sem enviar uma requisição
  de autenticação

#### Scenario: Enviar login com credenciais

- **WHEN** uma pessoa preencher e enviar o formulário de login
- **THEN** a aplicação MUST conservar o contrato existente de autenticação,
  enviando `login` e `password` para `POST /auth/login`, mantendo o indicador
  de envio e apresentando o resultado de sucesso ou erro já definido

### Requirement: A tela de cadastro comunica o cadastro da clínica

A rota `/sign-up` MUST exibir o conteúdo e as ações de cadastro definidos na
referência, sem criar nesta capability um novo contrato de persistência.

#### Scenario: Exibir o formulário de cadastro

- **WHEN** uma pessoa acessar `/sign-up`
- **THEN** a interface MUST exibir “Faça seu cadastro”, o texto “Crie sua
  clínica digital personalizada e comece a gerenciar seus atendimentos agora
  mesmo!”, campos identificáveis para “Nome da clínica”, “Seu e-mail” e “CPF ou
  CNPJ”, e o botão “Salvar cadastro”

#### Scenario: Ir do cadastro para o login

- **WHEN** uma pessoa ativar “Efetuar login” na tela de cadastro
- **THEN** a aplicação MUST navegar para `/sign-in` sem descartar a pessoa em
  uma rota interna ou iniciar uma chamada HTTP de cadastro

### Requirement: A composição pública é utilizável em telas compactas

As telas públicas MUST adaptar sua composição sem exigir rolagem horizontal e
MUST permanecer operáveis por teclado e tecnologia assistiva.

#### Scenario: Adaptar a tela em viewport compacta

- **WHEN** `/sign-in` ou `/sign-up` for exibida em uma viewport compacta
- **THEN** o painel institucional e o cartão do formulário MUST reorganizar ou
  reduzir seu conteúdo para manter os campos, ações, mensagens e foco visíveis
  sem sobreposição nem rolagem horizontal

#### Scenario: Navegar pelos controles públicos

- **WHEN** uma pessoa navegar pela tela usando teclado ou leitor de tela
- **THEN** os campos MUST possuir nomes acessíveis, os botões e links MUST
  comunicar sua finalidade, o foco MUST permanecer visível e a ordem de foco
  MUST seguir a leitura visual do formulário
