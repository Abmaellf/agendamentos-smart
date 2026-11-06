# Layouts de rota

## Objetivo do módulo

Fornecer estruturas visuais compartilhadas para rotas de autenticação e para a área interna.

## Responsabilidades e funcionalidades existentes

- `AuthLayout`: divide a tela em apresentação da clínica e conteúdo de login/cadastro;
- `AppLayout`: monta menu lateral persistente em telas amplas, com modo recolhido somente por ícones, e painel lateral acionável em telas compactas, delegando a página ao `Outlet`.

## Dependências internas e externas

- internas: `components/AppSidebar` e páginas montadas pelo Router;
- externas: React e `react-router-dom`;
- módulos relacionados: `src/Router.tsx`, `src/page/auth` e páginas internas.

## Pontos de entrada e fluxos de entrada

`Router.tsx` seleciona um layout sem caminho próprio. O layout renderiza elementos comuns e delega a página filha ao `Outlet`.

## Arquivos críticos

- `auth.tsx`: moldura das rotas `/sign-in` e `/sign-up`;
- `app.tsx`: moldura de `/appointments`, `/paciente`, `/doctor` e `/configuration`.

## Regras próprias do módulo

- O layout interno deve funcionar como guarda central: validar sessão, e-mail confirmado e contexto de `tenantId` antes de renderizar páginas privadas.
- Usuário com senha temporária deve ser direcionado ao fluxo obrigatório de troca de senha antes da área interna.
- A unidade padrão deve estar disponível no contexto do layout; a seleção entre várias unidades fica preparada, mas não operacional no primeiro MVP.
- Navegação deve considerar as permissões de `ADMIN` e `BASIC`, sem tratar a ocultação visual como autorização suficiente.
- Logout deve encerrar a sessão e impedir o retorno a conteúdo privado pelo histórico do navegador.

## Observações técnicas e débitos

- `AppLayout` não valida autenticação; todas as rotas filhas são acessíveis diretamente.
- A abertura do painel lateral compacto é estado local do layout, que também bloqueia a rolagem temporariamente, responde a Escape e restaura o foco ao acionador.
- O provider de tema Tailwind aparece somente em comentário e não é montado aqui.
