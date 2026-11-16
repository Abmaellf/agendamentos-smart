# Design

## Context

Consulte `proposal.md` para a motivação e `specs/public-authentication-experience/spec.md`
para o contrato observável. Hoje `/sign-in` e `/sign-up` usam `AuthLayout`, mas
essa casca é uma grade genérica: não há painel institucional, marca no cartão
ou composição responsiva equivalente às referências. `SignIn` mantém o fluxo
real de `POST /auth/login`; `SignUp` é um formulário visual sem persistência.

As imagens anexadas têm 1706 × 922 pixels e representam telas completas. Elas
serão usadas como referência de composição e direção visual; a implementação
deverá usar elementos e assets próprios do aplicativo, sem depender de um
arquivo de screenshot externo ao bundle.

## Goals / Non-Goals

**Goals:**

- estabelecer uma única casca pública responsiva para login e cadastro;
- separar o painel institucional do conteúdo específico de cada formulário;
- preservar o hook de autenticação, os nomes do payload, mensagens, navegação e
  estados de envio do login;
- tornar a estrutura testável por roles, labels e links sem depender de pixels;
- permitir comparação visual nas dimensões das referências e em uma viewport
  compacta.

**Non-Goals:**

- criar autenticação, recuperação de senha ou persistência do cadastro;
- criar logout ou mudar o roteamento público;
- tornar a marca configurável por tenant nesta etapa;
- adicionar uma biblioteca de ícones, uma dependência de imagens ou um serviço
  externo de assets somente para reproduzir a referência.

## Decisions

### 1. Manter `AuthLayout` como dono da composição compartilhada

O layout continuará envolvendo as duas rotas e passará a organizar o painel
institucional, o fundo claro, a ação superior de alternância e o espaço do
cartão. `SignIn` e `SignUp` serão responsáveis somente por seu conteúdo e
interações de formulário.

Essa escolha evita duplicar a imagem, o rodapé, os benefícios e os breakpoints
em duas páginas. Duplicar o layout por rota foi considerado, mas aumentaria o
risco de divergência entre as referências e dificultaria a manutenção visual.

### 2. Usar composição nativa para o formulário e assets locais documentados

O cartão, campos, gradientes, bordas, sombras, ondas curvas e cartões de
benefício serão construídos com o sistema visual já carregado pelo aplicativo.
Quando uma imagem for necessária para o painel, será reutilizado um asset local
adequado ou será adicionado um asset app-local com origem/licença e consumidor
registrados no README de assets. As imagens completas anexadas não serão
renderizadas como fundo, pois isso faria o texto deixar de ser semântico,
responsivo e operável.

### 3. Preservar o contrato de interação existente

O formulário de login manterá `react-hook-form`, o mutation hook existente, o
foco inicial no e-mail, o indicador durante o envio, o toast de sucesso/erro e
o redirecionamento para `/appointments`. O link “Novo Usuário” continuará
usando a navegação para `/sign-up`.

O formulário de cadastro manterá campos controláveis visualmente e o link
“Efetuar login” para `/sign-in`. O botão “Salvar cadastro” será visualmente
equivalente à referência, mas não ganhará persistência ou uma requisição nova
nesta change.

### 4. Aplicar uma estratégia explícita de responsividade e acessibilidade

Em telas amplas, o painel institucional ocupará a primeira área e o cartão
ficará na segunda, com o controle de alternância no topo. Em telas compactas,
o painel será reduzido ou reorganizado antes do cartão, sem largura fixa que
provoque rolagem horizontal. Labels semânticos, foco visível, contraste e
nomes acessíveis serão mantidos mesmo quando o tratamento visual usar ícones ou
placeholders.

Uma implementação que apenas reproduza a largura fixa da referência foi
considerada, mas é incompatível com o requisito de viewport compacta e com o
uso por teclado.

## Risks / Trade-offs

- **[Risco]** A imagem de clínica ou o logotipo pode não existir em formato
  separado no repositório. → **Mitigação:** reutilizar apenas assets locais com
  origem conhecida ou registrar explicitamente o novo asset antes de usá-lo;
  manter o conteúdo e a marca em elementos semânticos.
- **[Risco]** A aproximação visual pode divergir em cores, proporções ou
  tipografia da referência. → **Mitigação:** validar screenshots nas dimensões
  1706 × 922 e em viewport compacta, comparando painel, cartão, espaçamentos,
  textos e estados de foco.
- **[Risco]** A remodelação do formulário pode quebrar o teste de login ou o
  payload esperado. → **Mitigação:** manter os nomes de campo e cobrir o envio
  com MSW, verificando `{ login, password }`, sucesso, erro e navegação.
- **[Trade-off]** O texto “Esqueceu sua senha?” será apresentado para alinhar a
  referência, mas continuará sem fluxo de recuperação até uma change própria.
  → **Mitigação:** mantê-lo explicitamente fora do contrato funcional desta
  change e não iniciar requisição ao ativá-lo.

## Migration Plan

Não há migração de dados, alteração de endpoint ou mudança de deploy. A
implementação substituirá progressivamente a composição de `AuthLayout` e o
markup visual das duas páginas; em caso de regressão, o rollback consiste em
reverter os arquivos da change, preservando o contrato de login já existente.

## Open Questions

Nenhuma questão em aberto altera o escopo ou a abordagem. A origem/licença de
qualquer novo asset deve ser confirmada durante a implementação antes de ele
ser incorporado ao bundle.
