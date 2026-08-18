# Header interno

## Objetivo do módulo

Exibir identidade provisória da clínica, navegação desktop, conta e acionador do menu móvel.

## Responsabilidades e funcionalidades existentes

- apresenta “Logo”, nome fixo e área “Fisioterapia & Pilates”;
- oferece link de agendamentos, menus visuais de pacotes/valores e link de pacientes;
- monta `AccountMenu`;
- abre o menu móvel em viewport reduzida.

## Dependências internas e externas

- internas: UI de dropdown e `account-menu`;
- externas: React Router, Lucide e Tailwind CSS;
- módulos relacionados: `AppLayout`, `MenuMobile`, autenticação/perfil.

## Ponto de entrada e fluxo de entrada

`AppLayout` monta `Header` e fornece `setMenuIsVisible`. O Header navega por links e o menu de conta busca dados por React Query.

## Arquivos críticos

- `index.tsx`: composição, caminhos de navegação, estilos Tailwind e breakpoint de `980px`.

## Regras próprias do módulo

- O cabeçalho interno deve exibir a clínica obtida da sessão e a unidade ativa, sem identidade fixa de demonstração.
- A navegação do MVP deve priorizar agenda, pacientes, profissionais, serviços, usuários e configurações efetivamente disponíveis.
- Itens administrativos devem respeitar o papel; usuário básico não pode acessar promoção de administrador nem configurações restritas.
- A estrutura pode preparar um seletor de unidade, mas múltiplas unidades para CNPJ não serão operacionais no primeiro MVP.
- O menu da conta deve oferecer troca da senha inicial quando exigida e logout funcional.
- Pacotes, valores e financeiro não devem aparecer como funcionalidades disponíveis antes da segunda etapa.

## Observações técnicas e débitos

- Pacote, duração e valores não possuem rotas ou ações.
- A identidade “Equilíbrio” ainda é fixa; os dados da conta são alimentados pelo perfil.
