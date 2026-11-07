# Design

## Context

O `AccountMenu` já consulta `useGetProfileQuery()` e renderiza o avatar estático `abm_avatar.png`. O item “Perfil” é apenas visual. Já existe um primitive de diálogo baseado em Radix, e o perfil atual contém `username`, `login`, `role` e `clinic`, além de um campo `password` que não deve chegar à apresentação.

## Goals / Non-Goals

**Goals:**

- Abrir os detalhes a partir do item existente do menu da conta, sem navegação.
- Reutilizar o mesmo valor de perfil e a mesma imagem renderizada no topbar.
- Garantir comportamento de foco, Escape, fechamento explícito e responsividade.
- Permitir download local da imagem, sem endpoint novo.

**Non-Goals:**

- Corrigir ou expandir o contrato do backend de perfil.
- Permitir edição, upload, troca da imagem ou alteração de senha.
- Criar uma tela, rota ou estado global de perfil.

## Decisions

### Modal controlado pelo fluxo do menu

O estado de abertura deve ser controlado no fluxo do `AccountMenu`, acionado pela opção “Perfil”. O item do menu deve concluir sua seleção antes de o modal ficar visível, evitando que dropdown e diálogo concorram pelo foco. A alternativa de navegar para uma página foi descartada porque o requisito é contextual e a capability existente não possui rota de perfil.

### Fonte única para dados e imagem

O modal deve consumir o perfil retornado pela consulta já existente e receber/reutilizar a mesma referência de avatar do topbar. Não será criada uma nova consulta nem uma derivação de dados no backend. O campo `password` será explicitamente excluído da projeção apresentada, mesmo que permaneça no tipo legado.

### Download por recurso do navegador

O download será iniciado por uma ação de link/arquivo com nome definido, apontando para a imagem que já está disponível no bundle. Essa escolha evita endpoint, autenticação adicional, CORS e estados de carregamento de uma segunda requisição. Se a origem da imagem mudar no futuro para uma URL remota, essa decisão deverá ser revisitada em uma change própria.

### Semântica e validação pela interface

O diálogo deve possuir título acessível, descrição suficiente, botão de fechamento nomeado e foco gerenciado pelo primitive existente. Os testes devem validar o comportamento observável: abertura, campos seguros, omissão de senha, download, fechamento e foco de retorno.

## Risks / Trade-offs

- [O avatar atual é um asset estático e pode não representar uma foto específica do usuário] → manter o escopo limitado à imagem efetivamente exibida e registrar a troca por foto remota como evolução separada.
- [O contrato atual inclui `password` na resposta tipada] → filtrar o campo na camada de apresentação e cobrir sua omissão em teste; não alterar o contrato HTTP nesta change.
- [Fechamento automático do dropdown pode competir com o foco do diálogo] → usar o evento de seleção do item e verificar no teste que o diálogo permanece aberto e recebe foco.

## Migration Plan

Não há migração de dados, alteração de endpoint ou etapa de rollout. Após a implementação, executar os testes direcionados do menu/topbar, lint e build; em caso de rollback, remover o acionamento do modal e os artefatos associados, preservando o menu existente.
