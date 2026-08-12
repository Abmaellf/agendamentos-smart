# Documentação técnica

Este diretório concentra os documentos transversais do sistema. Os detalhes locais ficam nos arquivos `README.md` de cada módulo relevante.

## Documentos oficiais

- [Arquitetura do Sistema](Arquitetura%20do%20Sistema.md): estrutura técnica, dependências, regras, riscos e diretrizes.
- [Objetivo do sistema](Objetivo%20do%20sistema.md): propósito, atores, funcionalidades e fluxos de negócio comprovados pelo código.
- [Requisitos do MVP](Requisitos%20do%20MVP.md): decisões confirmadas de produto, permissões, cadastros, agenda, modelo multi-tenant e corte das etapas.

## Regra de interpretação

`Objetivo do sistema.md` e `Arquitetura do Sistema.md` registram o código executável do commit-base. `Requisitos do MVP.md` registra o comportamento aprovado para implementação. Os READMEs dos módulos relacionam ambos e não devem apresentar uma intenção futura como funcionalidade pronta.

## Critério de atualização

Esta documentação foi produzida a partir do commit `62ac47e`, analisado em 6 de agosto de 2026. A fonte de verdade continua sendo o código executável, seus imports, rotas, chamadas HTTP e configurações.

Ao alterar o sistema:

1. atualize o README da pasta cuja responsabilidade mudou;
2. atualize o mapa de módulos e as dependências em `Arquitetura do Sistema.md` se a mudança atravessar fronteiras;
3. atualize `Objetivo do sistema.md` somente quando um fluxo de negócio mudar de fato;
4. classifique claramente itens parciais, órfãos e hipóteses;
5. mantenha as regras próprias do módulo alinhadas a `Requisitos do MVP.md`;
6. execute `npm run build` e `npx eslint src vite.config.ts`;
7. revise rotas, chamadas HTTP e imports com `rg` antes de declarar um comportamento implementado.

## Padrão mínimo dos READMEs de módulo

Cada documento local deve manter: objetivo, responsabilidades, funcionalidades existentes, dependências internas e externas, módulos relacionados, pontos de entrada, fluxos de entrada, arquivos críticos, regras próprias confirmadas e débitos técnicos.
