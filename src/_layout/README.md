# Layouts de rota

## Objetivo do módulo

Fornecer estruturas visuais compartilhadas para rotas de autenticação e para a área interna.

## Responsabilidades e funcionalidades existentes

- `AuthLayout`: divide a tela em apresentação da clínica e conteúdo de login/cadastro;
- `AppLayout`: monta o `AppTopbar`, o menu lateral persistente em telas amplas, o modo recolhido somente por ícones e o painel lateral acionável em telas compactas, delegando a página ao `Outlet`.

## Dependências internas e externas

- internas: `components/AppTopbar`, `components/AppSidebar`, estado de data da casca e páginas montadas pelo Router;
- externas: React e `react-router-dom`;
- módulos relacionados: `src/Router.tsx`, `src/page/auth` e páginas internas.

## Pontos de entrada e fluxos de entrada

`Router.tsx` seleciona um layout sem caminho próprio. O layout renderiza elementos comuns e delega a página filha ao `Outlet`.

## Arquivos críticos

- `auth.tsx`: moldura das rotas `/sign-in` e `/sign-up`;
- `app.tsx`: moldura de `/appointments`, `/paciente`, `/doctor` e `/configuration`;
- `app-shell-context.tsx`: estado local da data usada pelo topbar e pela agenda.

## Regras próprias do módulo

- O layout interno deve funcionar como guarda central: validar sessão, e-mail confirmado e contexto de `tenantId` antes de renderizar páginas privadas.
- Usuário com senha temporária deve ser direcionado ao fluxo obrigatório de troca de senha antes da área interna.
- A unidade padrão deve estar disponível no contexto do layout; a seleção entre várias unidades fica preparada, mas não operacional no primeiro MVP.
- Navegação deve considerar as permissões de `ADMIN` e `BASIC`, sem tratar a ocultação visual como autorização suficiente.
- Logout deve encerrar a sessão e impedir o retorno a conteúdo privado pelo histórico do navegador.

## Observações técnicas e débitos

- `AppLayout` não valida autenticação; todas as rotas filhas são acessíveis diretamente.
- O estado da sidebar e a abertura do painel lateral compacto são locais do layout; o topbar fornece o hamburger, bloqueia a rolagem temporariamente, responde a Escape e restaura o foco ao acionador.
- A data exibida pelo topbar é estado local da casca, não é persistida e é consumida pela agenda quando a rota `/appointments` está ativa.
- O provider de tema Tailwind aparece somente em comentário e não é montado aqui.
