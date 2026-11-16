# Proposal

## Why

As telas públicas atuais de login e cadastro apresentam apenas uma estrutura
genérica, enquanto as referências fornecidas definem a identidade visual da
Equilíbrio Fisioterapia & Pilates e uma experiência mais clara para entrada e
criação de conta. A mudança deve alinhar `/sign-in` e `/sign-up` às referências
sem alterar a autenticação existente nem transformar o cadastro visual em um
novo contrato de API.

Nesta change, `Equilíbrio-logoff.png` é interpretada como a referência da tela
de cadastro (`/sign-up`), pois ela contém o título “Faça seu cadastro”, campos
de clínica/e-mail/CPF ou CNPJ e o retorno “Efetuar login”; o repositório não
possui uma rota de logout equivalente à imagem.

## What Changes

- Atualizar a composição visual compartilhada das telas públicas para refletir
  a marca Equilíbrio, incluindo painel institucional, imagem/atmosfera da
  clínica, cores, formas curvas, logotipo, textos institucionais, rodapé e
  tratamento responsivo indicados nas referências.
- Atualizar `/sign-in` para apresentar a ação “Novo Usuário”, a marca no cartão
  de acesso, os textos “Acesse sua conta” e “Acompanhe suas vendas pelo painel
  do parceiro”, campos de e-mail e senha, lembrar dispositivo, recuperação de
  senha e o botão “Acessar painel”, mantendo os estados de foco, envio e erro.
- Atualizar `/sign-up` para apresentar a ação “Efetuar login”, a marca no
  cartão de cadastro, o título e texto de cadastro, campos de nome da clínica,
  e-mail e CPF ou CNPJ, e o botão “Salvar cadastro”, mantendo a navegação
  pública existente.
- Garantir nomes acessíveis, foco visível, leitura adequada e uso sem rolagem
  horizontal em telas compactas, com adaptação do painel institucional e do
  cartão/formulário.
- **Fora de escopo:** criar uma rota de logout, implementar recuperação de
  senha, persistir o cadastro, alterar payloads/endpoints HTTP, mudar regras de
  sessão/permissão, alterar rotas internas ou introduzir um novo fluxo de
  validação de clínica.

## Capabilities

### New Capabilities

- `public-authentication-experience`: composição visual, conteúdo, acessibilidade
  e responsividade das telas públicas de login e cadastro da clínica.

### Modified Capabilities

Nenhuma. Os requisitos existentes de sessão e navegação continuam válidos.

## Impact

- Código potencialmente afetado: `src/_layout/auth.tsx`, `src/page/auth/sign-in.tsx`,
  `src/page/auth/sign-up.tsx`, estilos globais, componentes de formulário e
  eventuais assets de marca; testes das telas públicas e documentação do módulo.
- Rotas: `/sign-in` e `/sign-up` permanecem as entradas públicas; nenhuma rota
  nova é criada.
- Contratos HTTP: nenhum endpoint, payload ou resposta deve mudar. O login
  continua enviando `login` e `password` para `POST /auth/login`; o cadastro
  continua limitado ao comportamento já existente até uma change própria de
  persistência.
- Dados, permissões e dependências: nenhuma migração, mudança de autorização ou
  dependência externa é necessária por esta especificação.
- Verificação: testes de interação/acessibilidade das duas telas, lint e build;
  a validação visual deve comparar a implementação com as duas referências em
  viewport ampla e compacta.
