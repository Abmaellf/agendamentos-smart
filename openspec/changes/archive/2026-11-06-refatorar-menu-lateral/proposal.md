# Proposal

## Why

A navegação interna atual está dividida entre cabeçalho horizontal e menu móvel em tela cheia, o que dificulta a descoberta das áreas disponíveis e não acompanha a referência visual aprovada. A casca autenticada precisa concentrar a navegação em um menu lateral responsivo, preservando as rotas já entregues.

## What Changes

- Substituir a navegação interna atual por um menu lateral alinhado ao design de referência, com marca da clínica, ícones, estado visual da rota ativa e card informativo no rodapé.
- Exibir navegação persistente ao lado do conteúdo em telas amplas e disponibilizá-la como painel lateral aberto por controle explícito em telas compactas.
- Manter navegáveis as entradas correspondentes às rotas existentes: Início, Agenda, Pacientes, Profissionais e Configurações.
- Exibir Serviços, Relatórios e Financeiro como itens indisponíveis, identificados como “Em breve”, sem destino navegável.
- Garantir interação por teclado, nomes acessíveis, fechamento do painel compacto e não bloquear o conteúdo quando o painel estiver fechado.

Fora de escopo: criar rotas, telas, permissões, dados, endpoints ou fluxos de negócio para Serviços, Relatórios e Financeiro; alterar a API; ou transformar o card informativo em campanha ou link externo.

## Capabilities

### New Capabilities

Nenhuma.

### Modified Capabilities

- `application-shell-baseline`: a casca compartilhada das rotas internas passa a fornecer navegação lateral responsiva e estados explícitos para destinos ainda indisponíveis.

## Impact

- Código afetado: `src/_layout/app.tsx`, `src/components/Header/index.tsx`, `src/components/MenuMobile/index.tsx`, tipos associados e estilos/componentes de navegação compartilhada.
- Rotas existentes permanecem inalteradas; a entrada Início deve usar a rota pública já existente sem criar nova rota interna.
- Não há alterações previstas em contratos HTTP, dados, permissões, dependências ou sistemas externos.
